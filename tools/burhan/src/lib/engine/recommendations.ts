import type {
  DetectionMetrics,
  Recommendation,
  ResponseMetrics,
  SlaTargets,
  TimeMetrics,
  ValidationResult,
} from "@/lib/domain/types";
import { TACTIC_BY_ID, TECHNIQUE_BY_ID } from "@/lib/domain/mitre";
import { formatDuration, formatPercent, unique } from "@/lib/utils";

/**
 * Deterministic, rule-based recommendations.
 *
 * Every recommendation is produced by a named rule (`ruleKey`) firing on a
 * measured condition, so the same data always yields the same advice and any
 * recommendation can be traced back to the finding that triggered it. No model
 * is involved and none is claimed.
 */

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const;

export function generateRecommendations(
  results: ValidationResult[],
  metrics: { detection: DetectionMetrics; time: TimeMetrics; response: ResponseMetrics },
  targets: SlaTargets,
): Recommendation[] {
  const out: Recommendation[] = [];
  const runIds = unique(results.map((r) => r.runId));

  /* -- R1: techniques that executed with no alert at all ------------------ */
  const withMisses = unique(
    results.filter((r) => r.outcome === "missed").map((r) => r.techniqueId),
  );

  for (const techniqueId of withMisses) {
    const allForTechnique = results.filter((r) => r.techniqueId === techniqueId);
    const forTechnique = allForTechnique.filter((r) => r.outcome === "missed");
    const technique = TECHNIQUE_BY_ID[techniqueId];
    const hosts = unique(forTechnique.map((r) => r.hostname));

    // A technique detected in one run but missed in another is a reliability
    // problem, not an absent capability — it needs different advice.
    const everDetected = allForTechnique.some((r) => r.alertGenerated);
    if (everDetected) {
      out.push({
        id: `REC-${techniqueId}-inconsistent`,
        severity: "high",
        category: "detection-coverage",
        title: `Inconsistent detection of ${techniqueId} ${technique?.name ?? ""}`.trim(),
        finding: `${techniqueId} was detected in some validations but missed ${forTechnique.length} time${
          forTechnique.length === 1 ? "" : "s"
        } on ${hosts.join(", ")}.`,
        action: `Review detection rule coverage for ${techniqueId} and confirm the required audit telemetry (${(technique?.dataSources ?? ["endpoint telemetry"]).join(", ")}) is consistently enabled across all in-scope hosts — coverage that depends on host or execution variant is coverage an adversary can sidestep.`,
        techniqueIds: [techniqueId],
        runIds: unique(forTechnique.map((r) => r.runId)),
        ruleKey: "R1-inconsistent-detection",
      });
      continue;
    }

    const telemetryMissing = forTechnique.every((r) => !r.telemetryReceived);

    out.push({
      id: `REC-${techniqueId}-missed`,
      severity: "critical",
      category: telemetryMissing ? "telemetry" : "detection-coverage",
      title: `No detection for ${techniqueId} ${technique?.name ?? ""}`.trim(),
      finding: `${techniqueId} executed successfully ${forTechnique.length} time${
        forTechnique.length === 1 ? "" : "s"
      } on ${hosts.join(", ")} and produced no SIEM alert.`,
      action: telemetryMissing
        ? `No telemetry reached the SIEM. Validate collection of ${(technique?.dataSources ?? ["endpoint telemetry"]).join(", ")} on ${hosts.join(", ")} before writing a detection rule — a rule cannot fire on data you are not collecting.`
        : `Telemetry was present but nothing alerted. Author a detection rule for ${techniqueId} against ${(technique?.dataSources ?? []).join(", ")}, then re-run this validation to confirm it fires.`,
      techniqueIds: [techniqueId],
      runIds: unique(forTechnique.map((r) => r.runId)),
      ruleKey: telemetryMissing ? "R1-telemetry-gap" : "R1-detection-gap",
    });
  }

  /* -- R2: rules that exist but are switched off -------------------------- */
  const disabled = results.filter((r) => r.gaps.some((g) => g.type === "rule-disabled"));
  if (disabled.length) {
    out.push({
      id: "REC-rules-disabled",
      severity: "critical",
      category: "rule-tuning",
      title: "Detection rules are disabled in production",
      finding: `${disabled.length} attack action${disabled.length === 1 ? "" : "s"} went undetected because the covering detection rule is disabled.`,
      action:
        "Review the disabled-rule inventory with the detection engineering team. If a rule was disabled for noise, tune it rather than leaving the coverage gap open.",
      techniqueIds: unique(disabled.map((r) => r.techniqueId)),
      runIds: unique(disabled.map((r) => r.runId)),
      ruleKey: "R2-disabled-rule",
    });
  }

  /* -- R3: detection slower than target ----------------------------------- */
  if (metrics.time.mttdMs !== null && metrics.time.mttdMs > targets.mttdSeconds * 1000) {
    const slow = results.filter(
      (r) =>
        typeof r.detectionLatencyMs === "number" &&
        r.detectionLatencyMs > targets.mttdSeconds * 1000,
    );
    out.push({
      id: "REC-mttd",
      severity: "high",
      category: "detection-speed",
      title: "Mean time to detect exceeded the configured target",
      finding: `MTTD is ${formatDuration(metrics.time.mttdMs)} against a target of ${formatDuration(targets.mttdSeconds * 1000)}. ${slow.length} detection${slow.length === 1 ? "" : "s"} landed beyond target.`,
      action:
        "Profile ingest-to-alert latency for the slowest data sources and move the affected rules from scheduled to streaming evaluation where the SIEM supports it.",
      techniqueIds: unique(slow.map((r) => r.techniqueId)),
      runIds,
      ruleKey: "R3-slow-detection",
    });
  }

  /* -- R4: containment slower than target --------------------------------- */
  if (metrics.time.mttcMs !== null && metrics.time.mttcMs > targets.mttcSeconds * 1000) {
    out.push({
      id: "REC-mttc",
      severity: "high",
      category: "containment",
      title: "Average containment time exceeded the configured target",
      finding: `Mean time to contain is ${formatDuration(metrics.time.mttcMs)} against a target of ${formatDuration(targets.mttcSeconds * 1000)}.`,
      action:
        "Review containment playbooks and evaluate automated host isolation for high-severity detections on tier-0 and tier-1 assets.",
      techniqueIds: [],
      runIds,
      ruleKey: "R4-slow-containment",
    });
  }

  /* -- R5: alerts that never became incidents ----------------------------- */
  const orphanAlerts = results.filter((r) => r.alertGenerated && !r.incidentCreated);
  if (orphanAlerts.length) {
    out.push({
      id: "REC-orphan-alerts",
      severity: "high",
      category: "response-process",
      title: "Alerts were raised but never worked",
      finding: `${orphanAlerts.length} alert${orphanAlerts.length === 1 ? "" : "s"} fired without an incident being created, so no analyst ever looked at ${orphanAlerts.length === 1 ? "it" : "them"}.`,
      action:
        "Audit alert routing between the SIEM and the case management system, and add a monitor for alerts that age past the acknowledgement target with no owner.",
      techniqueIds: unique(orphanAlerts.map((r) => r.techniqueId)),
      runIds: unique(orphanAlerts.map((r) => r.runId)),
      ruleKey: "R5-orphan-alert",
    });
  }

  /* -- R6: detected but never contained ----------------------------------- */
  const uncontained = results.filter((r) => r.incidentCreated && !r.contained);
  if (uncontained.length) {
    out.push({
      id: "REC-uncontained",
      severity: "high",
      category: "containment",
      title: "Incidents closed without a containment action",
      finding: `${uncontained.length} incident${uncontained.length === 1 ? "" : "s"} recorded no successful containment action despite a confirmed attack action.`,
      action:
        "Confirm containment steps are mandatory in the playbook and that analysts hold the authorisation to trigger EDR isolation without waiting for approval.",
      techniqueIds: unique(uncontained.map((r) => r.techniqueId)),
      runIds: unique(uncontained.map((r) => r.runId)),
      ruleKey: "R6-no-containment",
    });
  }

  /* -- R7: uneven coverage across the kill chain -------------------------- */
  const tactics = unique(results.map((r) => r.tactic));
  for (const tactic of tactics) {
    const forTactic = results.filter((r) => r.tactic === tactic);
    const detected = forTactic.filter((r) => r.alertGenerated).length;
    if (detected === 0 && forTactic.length > 0) {
      out.push({
        id: `REC-tactic-${tactic}`,
        severity: "critical",
        category: "mitre-coverage",
        title: `Zero coverage across ${TACTIC_BY_ID[tactic]?.name ?? tactic}`,
        finding: `All ${forTactic.length} technique execution${forTactic.length === 1 ? "" : "s"} in the ${TACTIC_BY_ID[tactic]?.name ?? tactic} tactic went undetected.`,
        action: `Treat ${TACTIC_BY_ID[tactic]?.name ?? tactic} as a detection engineering priority — an adversary can operate freely in this phase of the kill chain today.`,
        techniqueIds: unique(forTactic.map((r) => r.techniqueId)),
        runIds: unique(forTactic.map((r) => r.runId)),
        ruleKey: "R7-tactic-blindspot",
      });
    }
  }

  /* -- R8: low-confidence detections -------------------------------------- */
  const lowConfidence = results.filter((r) => r.detectionConfidence === "low");
  if (lowConfidence.length >= 2) {
    out.push({
      id: "REC-low-confidence",
      severity: "medium",
      category: "rule-tuning",
      title: "Detections are firing at low confidence",
      finding: `${lowConfidence.length} detections were produced by low-confidence rules, which analysts are likely to deprioritise.`,
      action:
        "Add enrichment (asset criticality, parent process lineage, user risk) so these rules can raise their confidence and drive triage reliably.",
      techniqueIds: unique(lowConfidence.map((r) => r.techniqueId)),
      runIds: unique(lowConfidence.map((r) => r.runId)),
      ruleKey: "R8-low-confidence",
    });
  }

  /* -- R9: false positive pressure ---------------------------------------- */
  if (metrics.detection.falsePositiveRate > 20) {
    out.push({
      id: "REC-false-positives",
      severity: "medium",
      category: "rule-tuning",
      title: "False positive rate is consuming analyst capacity",
      finding: `${formatPercent(metrics.detection.falsePositiveRate, 1)} of alerts in this period were false positives.`,
      action:
        "Rank rules by false positive volume and tune or suppress the top offenders. Analyst time lost to noise is time not spent on the gaps above.",
      techniqueIds: [],
      runIds,
      ruleKey: "R9-false-positives",
    });
  }

  /* -- R10: response is mostly manual ------------------------------------- */
  const totalActions = metrics.response.automatedActions + metrics.response.manualActions;
  if (totalActions > 0 && metrics.response.automatedActions / totalActions < 0.35) {
    out.push({
      id: "REC-automation",
      severity: "low",
      category: "response-process",
      title: "Response depends heavily on manual action",
      finding: `Only ${metrics.response.automatedActions} of ${totalActions} response actions were automated.`,
      action:
        "Identify the two highest-volume containment actions and move them behind a SOAR playbook with analyst approval, to cut containment time without removing human oversight.",
      techniqueIds: [],
      runIds,
      ruleKey: "R10-manual-response",
    });
  }

  return out.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

/** The highest-impact findings, for the dashboard's Critical Findings panel. */
export function criticalFindings(results: ValidationResult[]) {
  return results
    .filter((r) => r.outcome === "missed" || r.gaps.some((g) => g.severity === "critical"))
    .sort((a, b) => (a.outcome === "missed" ? -1 : 1) - (b.outcome === "missed" ? -1 : 1))
    .slice(0, 6);
}
