import type {
  AttackEvent,
  CorrelationConfig,
  CoverageGap,
  DetectionEvent,
  DetectionRule,
  Incident,
  ResponseAction,
  TelemetryEvent,
  ValidationOutcome,
  ValidationResult,
} from "@/lib/domain/types";
import { DEFAULT_CORRELATION_CONFIG } from "@/lib/domain/types";
import { TECHNIQUE_BY_ID } from "@/lib/domain/mitre";
import { deltaMs, formatDuration, ms } from "@/lib/utils";

/**
 * The Burhan correlation engine.
 *
 * It answers exactly one question, per emulated attack action:
 *
 *   "Did the defense see this, and did anyone do anything about it?"
 *
 * It is deterministic and side-effect free — the same events always produce the
 * same verdicts — and it records *why* it reached each verdict in
 * `correlationNotes`, so a validation result can be defended in a review.
 */

export interface CorrelationInput {
  attackEvents: AttackEvent[];
  telemetryEvents: TelemetryEvent[];
  detectionEvents: DetectionEvent[];
  incidents: Incident[];
  responseActions: ResponseAction[];
  detectionRules: DetectionRule[];
  config?: Partial<CorrelationConfig>;
}

const eq = (a?: string, b?: string) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/** Is `candidate` inside [anchor, anchor + windowSeconds]? */
function withinWindow(anchor: string, candidate: string, windowSeconds: number): boolean {
  const a = ms(anchor);
  const c = ms(candidate);
  if (a === null || c === null) return false;
  const diff = c - a;
  return diff >= 0 && diff <= windowSeconds * 1000;
}

export function correlate(input: CorrelationInput): ValidationResult[] {
  const config: CorrelationConfig = { ...DEFAULT_CORRELATION_CONFIG, ...input.config };
  const results: ValidationResult[] = [];

  // Alerts already consumed by an earlier attack action must not be re-used —
  // otherwise one noisy alert would "detect" every technique in the run.
  const claimedDetectionIds = new Set<string>();

  const orderedAttacks = [...input.attackEvents].sort(
    (a, b) => (ms(a.executedAt) ?? 0) - (ms(b.executedAt) ?? 0),
  );

  for (const attack of orderedAttacks) {
    // An ability that never ran is an emulation failure, not a defensive one.
    // Grading it as "missed" would punish the SOC for the red team's tooling.
    if (attack.status === "failed") continue;

    const notes: string[] = [];
    const gaps: CoverageGap[] = [];
    const evidenceIds: string[] = [`EV-A-${attack.id}`];

    notes.push(
      `Attack executed at ${attack.executedAt} on ${attack.hostname} — ${attack.techniqueId} (${attack.source}, operation ${attack.operationId}).`,
    );

    /* ---------------------------------------------------- 1. telemetry -- */
    const telemetry = input.telemetryEvents
      .filter(
        (t) =>
          t.techniqueId === attack.techniqueId &&
          (!config.matchOnHost || eq(t.hostname, attack.hostname)) &&
          withinWindow(attack.executedAt, t.receivedAt, config.windowSeconds),
      )
      .sort((a, b) => (ms(a.receivedAt) ?? 0) - (ms(b.receivedAt) ?? 0))[0];

    const telemetryLatencyMs = telemetry
      ? deltaMs(attack.executedAt, telemetry.receivedAt)
      : null;

    if (telemetry) {
      evidenceIds.push(`EV-T-${telemetry.id}`);
      notes.push(
        `Telemetry received from ${telemetry.source} after ${formatDuration(telemetryLatencyMs)} (${telemetry.dataSource}).`,
      );
    } else {
      notes.push("No matching telemetry reached the SIEM inside the correlation window.");
    }

    /* ---------------------------------------------------- 2. detection -- */
    const detection = input.detectionEvents
      .filter((d) => {
        if (claimedDetectionIds.has(d.id)) return false;
        if (!d.isTruePositive) return false;
        if (d.techniqueId !== attack.techniqueId) return false;
        if (config.matchOnHost && !eq(d.hostname, attack.hostname)) return false;
        if (config.matchOnUser && d.user && !eq(d.user, attack.user)) return false;
        if (config.matchOnProcess && d.process && !eq(d.process, attack.process)) return false;
        return withinWindow(attack.executedAt, d.alertedAt, config.windowSeconds);
      })
      .sort((a, b) => (ms(a.alertedAt) ?? 0) - (ms(b.alertedAt) ?? 0))[0] as
      | DetectionEvent
      | undefined;

    if (detection) claimedDetectionIds.add(detection.id);

    const detectionLatencyMs = detection
      ? deltaMs(attack.executedAt, detection.alertedAt)
      : null;

    if (detection) {
      evidenceIds.push(`EV-D-${detection.id}`);
      notes.push(
        `Rule "${detection.ruleName}" raised alert ${detection.alertId} after ${formatDuration(detectionLatencyMs)} (severity ${detection.severity}, ${detection.confidence} confidence).`,
      );
    }

    /* ----------------------------------------------------- 3. incident -- */
    const incident = detection
      ? input.incidents.find((i) => i.alertIds.includes(detection.alertId))
      : undefined;

    if (incident) {
      evidenceIds.push(`EV-I-${incident.id}`);
      notes.push(`Incident ${incident.id} opened and assigned to ${incident.assignee}.`);
    } else if (detection) {
      notes.push("Alert was raised but no incident was created from it.");
    }

    const actions = incident
      ? input.responseActions
          .filter((a) => a.incidentId === incident.id)
          .sort((a, b) => (ms(a.startedAt) ?? 0) - (ms(b.startedAt) ?? 0))
      : [];

    for (const a of actions) evidenceIds.push(`EV-R-${a.id}`);

    const firstAction = actions[0];
    const containment = actions.find((a) => a.isContainment && a.status === "success");

    /* ------------------------------------------- 4. derived latencies -- */
    const alertAt = detection?.alertedAt;
    const acknowledgeLatencyMs = deltaMs(alertAt, incident?.acknowledgedAt);
    const triageLatencyMs = deltaMs(incident?.acknowledgedAt, incident?.triagedAt);
    const escalationLatencyMs = deltaMs(incident?.triagedAt, incident?.escalatedAt);
    const containmentLatencyMs = deltaMs(alertAt, containment?.completedAt ?? incident?.containedAt);
    const responseLatencyMs = deltaMs(alertAt, firstAction?.startedAt);
    const totalResponseTimeMs = deltaMs(
      attack.executedAt,
      containment?.completedAt ?? incident?.containedAt ?? incident?.resolvedAt,
    );

    if (containment) {
      notes.push(
        `Containment "${containment.type}" completed by ${containment.system} (${containment.mode}) ${formatDuration(containmentLatencyMs)} after the alert.`,
      );
    }

    /* -------------------------------------------- 5. verdict and gaps -- */
    let outcome: ValidationOutcome;

    if (attack.status === "blocked") {
      outcome = "blocked";
      notes.push("Execution was blocked by a preventive control before completing.");
    } else if (!detection) {
      outcome = "missed";
      if (!telemetry) {
        gaps.push({
          type: "telemetry-unavailable",
          severity: "critical",
          techniqueId: attack.techniqueId,
          hostname: attack.hostname,
          title: "Telemetry unavailable",
          description: `No ${TECHNIQUE_BY_ID[attack.techniqueId]?.dataSources[0] ?? "endpoint"} telemetry for ${attack.techniqueId} reached the SIEM from ${attack.hostname}.`,
          recommendation: `Verify log shipping and data source coverage on ${attack.hostname} for: ${(TECHNIQUE_BY_ID[attack.techniqueId]?.dataSources ?? []).join(", ")}.`,
        });
      } else {
        const rule = input.detectionRules.find((r) =>
          r.techniqueIds.includes(attack.techniqueId),
        );
        if (rule && !rule.enabled) {
          gaps.push({
            type: "rule-disabled",
            severity: "critical",
            techniqueId: attack.techniqueId,
            hostname: attack.hostname,
            title: "Detection rule disabled",
            description: `Telemetry arrived but rule "${rule.name}" covering ${attack.techniqueId} is disabled, so no alert was produced.`,
            recommendation: `Re-enable "${rule.name}" and re-run the validation to confirm the alert fires.`,
          });
          notes.push(`Rule "${rule.name}" covers this technique but is currently disabled.`);
        } else {
          gaps.push({
            type: "missing-detection-rule",
            severity: "critical",
            techniqueId: attack.techniqueId,
            hostname: attack.hostname,
            title: "No detection rule matched",
            description: `Telemetry for ${attack.techniqueId} reached the SIEM but no rule produced an alert.`,
            recommendation: `Author and tune a detection rule for ${attack.techniqueId} (${TECHNIQUE_BY_ID[attack.techniqueId]?.name ?? ""}), then re-validate.`,
          });
          notes.push("Telemetry was present but no detection rule matched it.");
        }
      }
    } else {
      const late =
        detectionLatencyMs !== null &&
        detectionLatencyMs > config.lateDetectionSeconds * 1000;
      const lowConfidence =
        config.requireHighConfidenceForFullCredit && detection.confidence === "low";

      if (late) {
        gaps.push({
          type: "late-detection",
          severity: "high",
          techniqueId: attack.techniqueId,
          hostname: attack.hostname,
          title: "Detection exceeded target",
          description: `Alert fired ${formatDuration(detectionLatencyMs)} after execution, beyond the ${config.lateDetectionSeconds}s target.`,
          recommendation:
            "Review rule scheduling and ingest pipeline latency for this data source.",
        });
      }
      if (lowConfidence) {
        gaps.push({
          type: "incorrect-severity",
          severity: "medium",
          techniqueId: attack.techniqueId,
          hostname: attack.hostname,
          title: "Low-confidence detection",
          description: `Rule "${detection.ruleName}" alerted with low confidence, which will not reliably drive triage.`,
          recommendation: "Tune the rule logic to raise confidence, or add enrichment.",
        });
      }
      if (!incident) {
        gaps.push({
          type: "no-incident-created",
          severity: "high",
          techniqueId: attack.techniqueId,
          hostname: attack.hostname,
          title: "Alert did not become an incident",
          description: `Alert ${detection.alertId} was raised but never escalated into an incident.`,
          recommendation:
            "Check alert routing and the incident-creation rules in the SOAR/ticketing pipeline.",
        });
      } else if (!containment) {
        gaps.push({
          type: "no-containment",
          severity: "high",
          techniqueId: attack.techniqueId,
          hostname: attack.hostname,
          title: "No containment action",
          description: `Incident ${incident.id} was worked but no successful containment action was recorded.`,
          recommendation:
            "Confirm the containment playbook is mapped to this incident type and that the EDR isolation action is authorised.",
        });
      }

      const hostCritical = attack.hostname.toUpperCase().startsWith("DC");
      if (hostCritical && (detection.severity === "low" || detection.severity === "informational")) {
        gaps.push({
          type: "incorrect-severity",
          severity: "high",
          techniqueId: attack.techniqueId,
          hostname: attack.hostname,
          title: "Severity too low for a critical asset",
          description: `Activity on ${attack.hostname} alerted at "${detection.severity}" severity.`,
          recommendation: "Add asset-criticality enrichment so alerts on tier-0 assets escalate.",
        });
      }

      // Containment is deliberately NOT part of this test. A missing
      // containment action is a response failure and is scored by the response
      // component; folding it in here would penalise the same shortfall twice
      // and would misreport the SOC's actual detection capability.
      const degraded = late || lowConfidence || !incident;
      outcome = degraded ? "partially-detected" : "detected";
    }

    if (outcome === "detected") {
      notes.push("Verdict: detected and responded to within target.");
    } else if (outcome === "partially-detected") {
      notes.push("Verdict: partially detected — see the gaps recorded for this result.");
    } else if (outcome === "missed") {
      notes.push("Verdict: MISSED — the attack executed with no corresponding alert.");
    }

    results.push({
      id: `VR-${attack.id}`,
      runId: attack.runId,
      attackEventId: attack.id,
      techniqueId: attack.techniqueId,
      techniqueName: attack.techniqueName,
      tactic: attack.tactic,
      hostname: attack.hostname,
      executedAt: attack.executedAt,
      executionStatus: attack.status,

      telemetryReceived: !!telemetry,
      telemetryAt: telemetry?.receivedAt,
      telemetrySource: telemetry?.dataSource,

      alertGenerated: !!detection,
      alertAt: detection?.alertedAt,
      detectionEventId: detection?.id,
      ruleId: detection?.ruleId,
      ruleName: detection?.ruleName,
      alertSeverity: detection?.severity,
      detectionConfidence: detection?.confidence,

      incidentCreated: !!incident,
      incidentId: incident?.id,

      responded: !!firstAction,
      contained: !!containment,
      responseMode: firstAction?.mode,

      telemetryLatencyMs: telemetryLatencyMs ?? undefined,
      detectionLatencyMs: detectionLatencyMs ?? undefined,
      acknowledgeLatencyMs: acknowledgeLatencyMs ?? undefined,
      triageLatencyMs: triageLatencyMs ?? undefined,
      escalationLatencyMs: escalationLatencyMs ?? undefined,
      responseLatencyMs: responseLatencyMs ?? undefined,
      containmentLatencyMs: containmentLatencyMs ?? undefined,
      totalResponseTimeMs: totalResponseTimeMs ?? undefined,

      outcome,
      gaps,
      evidenceIds,
      correlationNotes: notes,
    });
  }

  return results;
}
