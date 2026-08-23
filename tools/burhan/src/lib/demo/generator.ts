import type {
  AttackEvent,
  BurhanDataset,
  DetectionEvent,
  Evidence,
  Incident,
  Integration,
  ResponseAction,
  TelemetryEvent,
  ValidationRun,
} from "@/lib/domain/types";
import { TECHNIQUE_BY_ID, primaryTactic, techniqueName } from "@/lib/domain/mitre";
import {
  DEMO_USER,
  DETECTION_RULES,
  INTEGRATIONS,
  ORGANIZATION,
} from "@/lib/demo/environment";
import {
  ALL_SCENARIOS,
  LIVE_RUN_ID,
  type ScenarioScript,
  type StepScript,
} from "@/lib/demo/scenarios";
import { formatFullTimestamp } from "@/lib/utils";

/* ----------------------------------------------------------------- utils -- */

function addSeconds(iso: string, seconds: number): string {
  return new Date(Date.parse(iso) + seconds * 1000).toISOString();
}

/** Minutes-ago offset per integration id, so "Last sync" reads as believably staggered. */
const LAST_SYNC_MINUTES_AGO: Record<string, number> = {
  "int-caldera": 2,
  "int-elastic": 1,
};

function withLastSync(integrations: Integration[]): Integration[] {
  const now = Date.now();
  return integrations.map((i) => {
    const minutesAgo = LAST_SYNC_MINUTES_AGO[i.id];
    if (minutesAgo === undefined) return i;
    return { ...i, lastSyncAt: new Date(now - minutesAgo * 60_000).toISOString() };
  });
}

/** Deterministic PRNG so a reset always reproduces the identical dataset. */
function seeded(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Benign activity that trips a rule — the noise every real SOC works through. */
const FALSE_POSITIVE_TEMPLATES = [
  { rule: "ELA-R-0138", name: "Scheduled Task Creation by Non-Admin Process", technique: "T1053.005", process: "schtasks.exe", why: "Patch management tool registering a reboot task." },
  { rule: "ELA-R-0133", name: "Registry Run Key Persistence", technique: "T1547.001", process: "reg.exe", why: "Vendor updater writing its own autorun entry." },
  { rule: "ELA-R-0174", name: "Domain Account Enumeration", technique: "T1087.002", process: "net.exe", why: "Helpdesk script checking group membership for a ticket." },
];

/* ------------------------------------------------------------ raw payloads -- */

function calderaRaw(script: ScenarioScript, step: StepScript, executedAt: string) {
  return {
    operation: script.operationId,
    operation_name: script.scenario,
    ability_id: step.ability,
    paw: `paw-${step.host.toLowerCase()}`,
    host: step.host,
    platform: "windows",
    executor: step.process.endsWith(".exe") ? "psh" : "cmd",
    technique_id: step.t,
    technique_name: techniqueName(step.t),
    tactic: primaryTactic(step.t),
    command: step.command,
    status: step.exec === "failed" ? -1 : 0,
    finish: executedAt,
    agent_reported_time: executedAt,
  };
}

function elasticTelemetryRaw(step: StepScript, receivedAt: string, dataSource: string) {
  return {
    "@timestamp": receivedAt,
    "event.kind": "event",
    "event.category": dataSource.toLowerCase().includes("network") ? "network" : "process",
    "event.dataset": "endpoint.events",
    "host.name": step.host,
    "user.name": step.user,
    "process.name": step.process,
    "process.command_line": step.command,
    "data_stream.dataset": "endpoint.events.process",
    "burhan.data_source": dataSource,
  };
}

function elasticAlertRaw(
  step: StepScript,
  alertId: string,
  ruleId: string,
  ruleName: string,
  alertedAt: string,
  severity: string,
) {
  return {
    "@timestamp": alertedAt,
    "event.kind": "signal",
    "kibana.alert.uuid": alertId,
    "kibana.alert.rule.rule_id": ruleId,
    "kibana.alert.rule.name": ruleName,
    "kibana.alert.severity": severity,
    "kibana.alert.status": "active",
    "host.name": step.host,
    "user.name": step.user,
    "process.name": step.process,
    "threat.technique.id": step.t,
    "threat.technique.name": techniqueName(step.t),
    "threat.tactic.name": primaryTactic(step.t),
  };
}

/* ------------------------------------------------------------- generation -- */

export interface GeneratorOptions {
  /**
   * How many steps of the live run have executed so far. The Live Validation
   * view advances this, which is why the whole platform reacts to the demo.
   */
  liveStepCount?: number;
}

interface Materialized {
  run: ValidationRun;
  attackEvents: AttackEvent[];
  telemetryEvents: TelemetryEvent[];
  detectionEvents: DetectionEvent[];
  incidents: Incident[];
  responseActions: ResponseAction[];
}

function materialize(script: ScenarioScript, stepLimit: number): Materialized {
  const steps = script.steps.slice(0, stepLimit);

  const attackEvents: AttackEvent[] = [];
  const telemetryEvents: TelemetryEvent[] = [];
  const detectionEvents: DetectionEvent[] = [];
  /** step index -> alert id, so incidents can claim the right alerts. */
  const alertByStep = new Map<number, string>();
  /** step index -> alert timestamp, for incident creation times. */
  const alertTimeByStep = new Map<number, string>();

  steps.forEach((step, index) => {
    const executedAt = addSeconds(script.startedAt, step.at);
    const attackId = `AE-${script.runId}-${String(index + 1).padStart(2, "0")}`;

    attackEvents.push({
      id: attackId,
      runId: script.runId,
      source: script.emulationTool,
      operationId: script.operationId,
      abilityId: step.ability,
      techniqueId: step.t,
      techniqueName: techniqueName(step.t),
      tactic: primaryTactic(step.t),
      hostname: step.host,
      user: step.user,
      process: step.process,
      command: step.command,
      executedAt,
      durationMs: 1200 + ((index * 337) % 2600),
      status: step.exec ?? "success",
      raw: calderaRaw(script, step, executedAt),
    });

    if (step.exec === "failed") return;

    if (step.tel !== null && step.tel !== undefined) {
      const receivedAt = addSeconds(executedAt, step.tel);
      const dataSource = TECHNIQUE_BY_ID[step.t]?.dataSources[0] ?? "Process Creation";
      telemetryEvents.push({
        id: `TE-${script.runId}-${String(index + 1).padStart(2, "0")}`,
        runId: script.runId,
        source: script.siem,
        techniqueId: step.t,
        hostname: step.host,
        dataSource,
        eventCode: dataSource.includes("Registry") ? "13" : dataSource.includes("Network") ? "3" : "1",
        receivedAt,
        raw: elasticTelemetryRaw(step, receivedAt, dataSource),
      });
    }

    if (step.det) {
      const alertedAt = addSeconds(executedAt, step.det.d);
      const alertId = `ALT-${script.runId.slice(-4)}-${String(index + 1).padStart(2, "0")}`;
      const rule = DETECTION_RULES.find((r) => r.id === step.det!.rule);
      const ruleName = rule?.name ?? step.det.rule;

      detectionEvents.push({
        id: `DE-${script.runId}-${String(index + 1).padStart(2, "0")}`,
        runId: script.runId,
        source: rule?.siem ?? script.siem,
        alertId,
        ruleId: step.det.rule,
        ruleName,
        techniqueId: step.t,
        hostname: step.host,
        user: step.user,
        process: step.process,
        severity: step.det.sev,
        confidence: step.det.conf,
        alertedAt,
        isTruePositive: true,
        raw: elasticAlertRaw(step, alertId, step.det.rule, ruleName, alertedAt, step.det.sev),
      });

      alertByStep.set(index, alertId);
      alertTimeByStep.set(index, alertedAt);
    }
  });

  /* ------------------------------------------------- false positive noise -- */
  const rand = seeded(script.runId);
  const fpCount = detectionEvents.length ? 1 + Math.floor(rand() * 3) : 0;
  for (let i = 0; i < fpCount; i += 1) {
    const template = FALSE_POSITIVE_TEMPLATES[Math.floor(rand() * FALSE_POSITIVE_TEMPLATES.length)];
    const offset = Math.floor(rand() * 1500);
    const alertedAt = addSeconds(script.startedAt, offset);
    const host = ["WS01", "WS02", "DC01"][Math.floor(rand() * 3)];
    const alertId = `ALT-${script.runId.slice(-4)}-FP${i + 1}`;
    detectionEvents.push({
      id: `DE-${script.runId}-FP${i + 1}`,
      runId: script.runId,
      source: script.siem,
      alertId,
      ruleId: template.rule,
      ruleName: template.name,
      techniqueId: template.technique,
      hostname: host,
      user: "svc_inventory",
      process: template.process,
      severity: "low",
      confidence: "low",
      alertedAt,
      isTruePositive: false,
      raw: {
        ...elasticAlertRaw(
          {
            t: template.technique,
            host,
            user: "svc_inventory",
            process: template.process,
            command: template.process,
            ability: "-",
            at: offset,
          },
          alertId,
          template.rule,
          template.name,
          alertedAt,
          "low",
        ),
        "kibana.alert.workflow_status": "closed",
        "burhan.disposition": "false-positive",
        "burhan.disposition_reason": template.why,
      },
    });
  }

  /* ---------------------------------------------------------- incidents -- */
  const incidents: Incident[] = [];
  const responseActions: ResponseAction[] = [];

  for (const inc of script.incidents) {
    const memberSteps = steps
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.inc === inc.key)
      .filter(({ i }) => alertByStep.has(i));

    // An incident only exists once one of its alerts has actually fired —
    // this is what makes the live run build up incident by incident.
    if (!memberSteps.length) continue;

    const alertIds = memberSteps.map(({ i }) => alertByStep.get(i)!);
    const createdAt = memberSteps
      .map(({ i }) => alertTimeByStep.get(i)!)
      .sort()[0];

    const acknowledgedAt = addSeconds(createdAt, inc.ack);
    const triagedAt = addSeconds(acknowledgedAt, inc.triage);
    const escalatedAt = inc.escalate !== undefined ? addSeconds(triagedAt, inc.escalate) : undefined;
    const containedAt = inc.contain !== undefined ? addSeconds(createdAt, inc.contain) : undefined;
    const resolvedAt = inc.resolve !== undefined ? addSeconds(createdAt, inc.resolve) : undefined;

    incidents.push({
      id: inc.id,
      runId: script.runId,
      alertIds,
      title: inc.title,
      severity: inc.severity,
      status: inc.status,
      hostname: memberSteps[0].s.host,
      assignee: inc.assignee,
      team: inc.team,
      playbookId: inc.playbook,
      createdAt,
      acknowledgedAt,
      triagedAt,
      escalatedAt,
      containedAt,
      resolvedAt,
      raw: {
        case_id: inc.id,
        source: "Demo SOAR",
        queue: inc.team,
        owner: inc.assignee,
        playbook: inc.playbook ?? null,
        linked_alerts: alertIds,
        state: inc.status,
        sla_target_minutes: 15,
        created: createdAt,
      },
    });

    inc.actions.forEach((action, ai) => {
      const startedAt = addSeconds(createdAt, action.start);
      responseActions.push({
        id: `RA-${inc.id}-${ai + 1}`,
        runId: script.runId,
        incidentId: inc.id,
        type: action.type,
        mode: action.mode,
        system: action.system,
        actor: action.actor,
        description: action.description,
        startedAt,
        completedAt: action.status === "pending" ? undefined : addSeconds(startedAt, action.dur),
        status: action.status,
        isContainment: !!action.contain,
        phase: action.phase,
        raw: {
          action_id: `RA-${inc.id}-${ai + 1}`,
          incident: inc.id,
          connector: action.system,
          action: action.type,
          triggered_by: action.mode === "automated" ? "playbook" : "analyst",
          actor: action.actor,
          started: startedAt,
          duration_seconds: action.dur,
          result: action.status,
        },
      });
    });
  }

  const executed = steps.length;
  const run: ValidationRun = {
    id: script.runId,
    scenario: script.scenario,
    scenarioId: script.scenarioId,
    threatProfile: script.threatProfile,
    emulationTool: script.emulationTool,
    siem: script.siem,
    status: script.status,
    startedAt: script.startedAt,
    completedAt:
      script.status === "running"
        ? undefined
        : script.steps.length
          ? addSeconds(script.startedAt, script.steps[script.steps.length - 1].at + 240)
          : addSeconds(script.startedAt, 60),
    operator: script.operator,
    description: script.description,
    targets: Array.from(new Set(script.steps.map((s) => s.host))),
    techniqueIds: Array.from(new Set(steps.slice(0, executed).map((s) => s.t))),
    evidenceBasis: script.evidenceBasis,
    baselineFacts: script.baselineFacts,
  };

  return { run, attackEvents, telemetryEvents, detectionEvents, incidents, responseActions };
}

/* --------------------------------------------------------------- evidence -- */

function buildEvidence(d: Omit<BurhanDataset, "evidence">): Evidence[] {
  const evidence: Evidence[] = [];

  for (const a of d.attackEvents) {
    evidence.push({
      id: `EV-A-${a.id}`,
      runId: a.runId,
      kind: "attack",
      title: `${a.techniqueId} executed on ${a.hostname}`,
      source: a.source === "caldera" ? "MITRE CALDERA" : a.source === "atomic-red-team" ? "Atomic Red Team" : "Custom Emulation",
      timestamp: a.executedAt,
      summary: `${a.techniqueName} executed as ${a.user} via ${a.process}.`,
      fields: [
        { label: "CALDERA operation", value: a.operationId, mono: true },
        { label: "Ability name", value: a.abilityId, mono: true },
        { label: "MITRE ID", value: a.techniqueId, mono: true },
        { label: "Technique", value: a.techniqueName },
        { label: "Host", value: a.hostname },
        { label: "Agent", value: `paw-${a.hostname.toLowerCase()}`, mono: true },
        { label: "User", value: a.user, mono: true },
        { label: "Process", value: a.process, mono: true },
        { label: "Command", value: a.command, mono: true },
        { label: "Execution time", value: formatFullTimestamp(a.executedAt) },
        { label: "Status", value: a.status },
      ],
      raw: a.raw,
      techniqueId: a.techniqueId,
      hostname: a.hostname,
    });
  }

  for (const t of d.telemetryEvents) {
    evidence.push({
      id: `EV-T-${t.id}`,
      runId: t.runId,
      kind: "telemetry",
      title: `${t.dataSource} telemetry received`,
      source: `${t.source === "elastic" ? "Elastic Security" : t.source}`,
      timestamp: t.receivedAt,
      summary: `${t.dataSource} event ${t.eventCode} ingested from ${t.hostname}.`,
      fields: [
        { label: "Telemetry source", value: t.dataSource },
        { label: "Event ID", value: t.eventCode, mono: true },
        { label: "Host", value: t.hostname },
        { label: "Received", value: formatFullTimestamp(t.receivedAt) },
      ],
      raw: t.raw,
      techniqueId: t.techniqueId,
      hostname: t.hostname,
    });
  }

  for (const e of d.detectionEvents) {
    // The paired telemetry record, so detection evidence can cite the
    // telemetry source and event ID that fed the rule, per the real
    // project's evidence model (§8) rather than just the alert itself.
    const telemetry = d.telemetryEvents.find(
      (t) => t.runId === e.runId && t.techniqueId === e.techniqueId && t.hostname === e.hostname,
    );

    evidence.push({
      id: `EV-D-${e.id}`,
      runId: e.runId,
      kind: "detection",
      title: `${e.ruleName} — ${e.alertId}`,
      source:
        e.source === "elastic"
          ? "Elastic Security"
          : e.source === "splunk"
            ? "Splunk Enterprise Security"
            : e.source === "sentinel"
              ? "Microsoft Sentinel"
              : "Custom SIEM",
      timestamp: e.alertedAt,
      summary: e.isTruePositive
        ? `Detection rule ${e.ruleId} produced alert ${e.alertId} at ${e.severity} severity.`
        : `Alert ${e.alertId} was dispositioned as a false positive.`,
      fields: [
        { label: "Elastic detection rule", value: `${e.ruleId} — ${e.ruleName}` },
        { label: "Alert timestamp", value: formatFullTimestamp(e.alertedAt) },
        { label: "Severity", value: e.severity },
        { label: "Host", value: e.hostname },
        { label: "Telemetry source", value: telemetry?.dataSource ?? "—" },
        { label: "Event ID", value: telemetry?.eventCode ?? "—", mono: true },
        { label: "Alert ID", value: e.alertId, mono: true },
        { label: "Technique", value: e.techniqueId, mono: true },
        { label: "Confidence", value: e.confidence },
        { label: "Disposition", value: e.isTruePositive ? "True positive" : "False positive" },
      ],
      raw: e.raw,
      techniqueId: e.techniqueId,
      hostname: e.hostname,
    });
  }

  for (const i of d.incidents) {
    evidence.push({
      id: `EV-I-${i.id}`,
      runId: i.runId,
      kind: "incident",
      title: `${i.id} — ${i.title}`,
      source: "Demo SOAR",
      timestamp: i.createdAt,
      summary: `${i.severity} severity incident owned by ${i.assignee} (${i.team}).`,
      fields: [
        { label: "Incident", value: i.id, mono: true },
        { label: "Linked alerts", value: i.alertIds.join(", "), mono: true },
        { label: "Owner", value: `${i.assignee} — ${i.team}` },
        { label: "Playbook", value: i.playbookId ?? "none" },
        { label: "Created", value: formatFullTimestamp(i.createdAt) },
        { label: "Acknowledged", value: formatFullTimestamp(i.acknowledgedAt) },
        { label: "Triaged", value: formatFullTimestamp(i.triagedAt) },
        { label: "Escalated", value: formatFullTimestamp(i.escalatedAt) },
        { label: "Contained", value: formatFullTimestamp(i.containedAt) },
        { label: "Resolved", value: formatFullTimestamp(i.resolvedAt) },
        { label: "Status", value: i.status },
      ],
      raw: i.raw,
      hostname: i.hostname,
    });
  }

  const incidentById = new Map(d.incidents.map((i) => [i.id, i]));

  const PHASE_LABEL: Record<string, string> = {
    "detection-triage": "Detection & Triage",
    containment: "Containment",
    eradication: "Eradication",
    recovery: "Recovery",
  };

  for (const a of d.responseActions) {
    const incident = incidentById.get(a.incidentId);
    evidence.push({
      id: `EV-R-${a.id}`,
      runId: a.runId,
      kind: "response",
      title: `${a.type.replace(/-/g, " ")} — ${a.status}`,
      source: a.system === "edr" ? "Demo EDR" : a.system === "soar" ? "SOAR Platform" : a.system === "firewall" ? "Perimeter Firewall" : a.system === "identity" ? "Identity Provider" : "SOC Analyst",
      timestamp: a.startedAt,
      summary: a.description,
      fields: [
        { label: "Action", value: a.description },
        { label: "Host", value: incident?.hostname ?? "—" },
        { label: "Timestamp", value: formatFullTimestamp(a.startedAt) },
        { label: "Phase", value: a.phase ? PHASE_LABEL[a.phase] : a.isContainment ? "Containment" : "—" },
        { label: "Status", value: a.status },
        { label: "Mode", value: a.mode },
        { label: "Actor", value: a.actor },
        { label: "Incident", value: a.incidentId, mono: true },
      ],
      raw: a.raw,
      hostname: incident?.hostname,
    });
  }

  return evidence.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/* ------------------------------------------------------------------ entry -- */

export function generateDataset(options: GeneratorOptions = {}): BurhanDataset {
  const liveStepCount = options.liveStepCount ?? 0;

  const runs: ValidationRun[] = [];
  const attackEvents: AttackEvent[] = [];
  const telemetryEvents: TelemetryEvent[] = [];
  const detectionEvents: DetectionEvent[] = [];
  const incidents: Incident[] = [];
  const responseActions: ResponseAction[] = [];

  for (const script of ALL_SCENARIOS) {
    const limit = script.runId === LIVE_RUN_ID ? liveStepCount : script.steps.length;
    const m = materialize(script, limit);
    runs.push(m.run);
    attackEvents.push(...m.attackEvents);
    telemetryEvents.push(...m.telemetryEvents);
    detectionEvents.push(...m.detectionEvents);
    incidents.push(...m.incidents);
    responseActions.push(...m.responseActions);
  }

  const base = {
    organization: ORGANIZATION,
    user: DEMO_USER,
    runs,
    attackEvents,
    telemetryEvents,
    detectionEvents,
    incidents,
    responseActions,
    detectionRules: DETECTION_RULES,
    integrations: withLastSync(INTEGRATIONS),
    falsePositiveCount: detectionEvents.filter((d) => !d.isTruePositive).length,
  };

  return { ...base, evidence: buildEvidence(base) };
}

/** Total steps in the live scenario — the denominator on the live view. */
export const LIVE_STEP_TOTAL = ALL_SCENARIOS.find((s) => s.runId === LIVE_RUN_ID)!.steps.length;
