import type {
  DetectionEvent,
  DetectionMetrics,
  Incident,
  ResponseAction,
  ResponseMetrics,
  TimeMetrics,
  ValidationResult,
} from "@/lib/domain/types";
import { mean, pct, unique } from "@/lib/utils";

/**
 * Every metric on every page comes from this module, and every one of them is
 * derived from correlated validation results — never stored, never hardcoded.
 */

const isDetected = (r: ValidationResult) => r.outcome === "detected" || r.outcome === "blocked";

export function computeDetectionMetrics(
  results: ValidationResult[],
  detectionEvents: DetectionEvent[] = [],
  falsePositiveCount = 0,
): DetectionMetrics {
  const total = results.length;

  const executionsDetected = results.filter((r) => r.outcome === "detected").length;
  const executionsPartial = results.filter((r) => r.outcome === "partially-detected").length;
  const executionsMissed = results.filter((r) => r.outcome === "missed").length;
  const executionsBlocked = results.filter((r) => r.outcome === "blocked").length;

  // Technique-level roll-up: a technique counts as detected if any execution of
  // it was cleanly detected, missed only if every execution was missed.
  const techniqueIds = unique(results.map((r) => r.techniqueId));
  let techniquesDetected = 0;
  let techniquesPartial = 0;
  let techniquesMissed = 0;

  for (const id of techniqueIds) {
    const forTechnique = results.filter((r) => r.techniqueId === id);
    if (forTechnique.some(isDetected)) techniquesDetected += 1;
    else if (forTechnique.some((r) => r.outcome === "partially-detected")) techniquesPartial += 1;
    else techniquesMissed += 1;
  }

  const alerted = results.filter((r) => r.alertGenerated).length;
  const withTelemetry = results.filter((r) => r.telemetryReceived).length;

  const truePositives = detectionEvents.filter((d) => d.isTruePositive).length;
  const totalAlerts = truePositives + falsePositiveCount;

  const highConfidence = results.filter((r) => r.detectionConfidence === "high").length;
  const lowConfidence = results.filter(
    (r) => r.detectionConfidence === "low" || r.detectionConfidence === "medium",
  ).length;

  return {
    techniquesTested: techniqueIds.length,
    techniquesDetected,
    techniquesPartial,
    techniquesMissed,
    executionsTested: total,
    executionsDetected,
    executionsPartial,
    executionsMissed,
    executionsBlocked,
    detectionRate: pct(alerted, total),
    missedDetectionRate: pct(executionsMissed, total),
    truePositiveRate: pct(truePositives, totalAlerts),
    falsePositiveRate: pct(falsePositiveCount, totalAlerts),
    alertGenerationRate: pct(alerted, total),
    telemetryCoverageRate: pct(withTelemetry, total),
    techniqueCoverageRate: pct(techniquesDetected + techniquesPartial, techniqueIds.length),
    highConfidenceDetections: highConfidence,
    lowConfidenceDetections: lowConfidence,
  };
}

/**
 * MTTD is a detection-per-technique measure, so it averages validation results.
 * Everything after the alert is an incident-level measure — a SOC acknowledges,
 * triages and contains an incident, not each alert inside it — so those average
 * over incidents. Mixing the two granularities is the classic way to report a
 * flattering MTTR.
 */
export function computeTimeMetrics(
  results: ValidationResult[],
  incidents: Incident[] = [],
  actions: ResponseAction[] = [],
): TimeMetrics {
  const detectionLatencies = results
    .map((r) => r.detectionLatencyMs)
    .filter((v): v is number => typeof v === "number");

  const span = (from?: string, to?: string) => {
    if (!from || !to) return null;
    const d = Date.parse(to) - Date.parse(from);
    return Number.isNaN(d) || d < 0 ? null : d;
  };

  const collect = (fn: (i: Incident) => number | null) =>
    mean(incidents.map(fn).filter((v): v is number => v !== null));

  const firstActionAt = (incidentId: string) =>
    actions
      .filter((a) => a.incidentId === incidentId)
      .map((a) => a.startedAt)
      .sort()[0];

  return {
    mttdMs: mean(detectionLatencies),
    mttaMs: collect((i) => span(i.createdAt, i.acknowledgedAt)),
    mttTriageMs: collect((i) => span(i.acknowledgedAt, i.triagedAt)),
    mttEscalateMs: collect((i) => span(i.triagedAt, i.escalatedAt)),
    mttrMs: collect((i) => span(i.createdAt, firstActionAt(i.id))),
    mttcMs: collect((i) => span(i.createdAt, i.containedAt)),
  };
}

export function computeResponseMetrics(
  results: ValidationResult[],
  incidents: Incident[],
  actions: ResponseAction[],
): ResponseMetrics {
  const alerted = results.filter((r) => r.alertGenerated);
  const incidentsCreated = results.filter((r) => r.incidentCreated).length;
  const incidentsResponded = results.filter((r) => r.responded).length;
  const incidentsContained = results.filter((r) => r.contained).length;

  const automated = actions.filter((a) => a.mode === "automated");
  const manual = actions.filter((a) => a.mode === "manual");

  const withPlaybook = incidents.filter((i) => !!i.playbookId);
  const playbookSucceeded = withPlaybook.filter((i) => !!i.containedAt || !!i.resolvedAt);

  return {
    incidentsCreated,
    incidentsResponded,
    incidentsContained,
    // Measured against what the SOC could act on: an alert it never got cannot
    // be counted against the response team.
    responseSuccessRate: pct(incidentsResponded, alerted.length),
    containmentSuccessRate: pct(incidentsContained, alerted.length),
    playbookSuccessRate: pct(playbookSucceeded.length, withPlaybook.length),
    automatedActions: automated.length,
    manualActions: manual.length,
    automatedSuccessRate: pct(
      automated.filter((a) => a.status === "success").length,
      automated.length,
    ),
    manualSuccessRate: pct(manual.filter((a) => a.status === "success").length, manual.length),
  };
}

/* ------------------------------------------------------ derived views -- */

export interface TechniqueStat {
  techniqueId: string;
  techniqueName: string;
  tactic: string;
  tests: number;
  detected: number;
  partial: number;
  missed: number;
  detectionRate: number;
  avgDetectionTimeMs: number | null;
  rules: string[];
  runIds: string[];
  state: "detected" | "partial" | "missed";
}

export function computeTechniqueStats(results: ValidationResult[]): TechniqueStat[] {
  const ids = unique(results.map((r) => r.techniqueId));
  return ids
    .map((id) => {
      const list = results.filter((r) => r.techniqueId === id);
      const detected = list.filter(isDetected).length;
      const partial = list.filter((r) => r.outcome === "partially-detected").length;
      const missed = list.filter((r) => r.outcome === "missed").length;
      const latencies = list
        .map((r) => r.detectionLatencyMs)
        .filter((v): v is number => typeof v === "number");
      return {
        techniqueId: id,
        techniqueName: list[0].techniqueName,
        tactic: list[0].tactic,
        tests: list.length,
        detected,
        partial,
        missed,
        detectionRate: pct(detected + partial, list.length),
        avgDetectionTimeMs: mean(latencies),
        rules: unique(list.map((r) => r.ruleName).filter((v): v is string => !!v)),
        runIds: unique(list.map((r) => r.runId)),
        state: detected > 0 ? "detected" : partial > 0 ? "partial" : "missed",
      } satisfies TechniqueStat;
    })
    .sort((a, b) => a.techniqueId.localeCompare(b.techniqueId));
}

export interface RuleStat {
  ruleId: string;
  ruleName: string;
  fired: number;
  techniqueIds: string[];
  avgDetectionTimeMs: number | null;
  effectiveness: number;
}

export function computeRuleStats(results: ValidationResult[]): RuleStat[] {
  const withRule = results.filter((r) => !!r.ruleId);
  const ids = unique(withRule.map((r) => r.ruleId!));
  return ids
    .map((id) => {
      const list = withRule.filter((r) => r.ruleId === id);
      const clean = list.filter((r) => r.outcome === "detected").length;
      return {
        ruleId: id,
        ruleName: list[0].ruleName ?? id,
        fired: list.length,
        techniqueIds: unique(list.map((r) => r.techniqueId)),
        avgDetectionTimeMs: mean(
          list.map((r) => r.detectionLatencyMs).filter((v): v is number => typeof v === "number"),
        ),
        effectiveness: pct(clean, list.length),
      } satisfies RuleStat;
    })
    .sort((a, b) => b.fired - a.fired);
}

export interface DataSourceCoverage {
  dataSource: string;
  expected: number;
  received: number;
  coverage: number;
}

export function computeDataSourceCoverage(
  results: ValidationResult[],
  techniqueDataSources: (techniqueId: string) => string[],
): DataSourceCoverage[] {
  const map = new Map<string, { expected: number; received: number }>();
  for (const r of results) {
    for (const source of techniqueDataSources(r.techniqueId)) {
      const entry = map.get(source) ?? { expected: 0, received: 0 };
      entry.expected += 1;
      if (r.telemetryReceived) entry.received += 1;
      map.set(source, entry);
    }
  }
  return Array.from(map.entries())
    .map(([dataSource, v]) => ({
      dataSource,
      expected: v.expected,
      received: v.received,
      coverage: pct(v.received, v.expected),
    }))
    .sort((a, b) => b.expected - a.expected);
}
