/**
 * Burhan normalized domain model.
 *
 * Every external system (CALDERA, Atomic Red Team, Elastic, Splunk, Sentinel,
 * SOAR/EDR) maps into these shapes through an adapter. Nothing downstream of
 * the normalization layer knows which vendor produced a record, which is what
 * makes the correlation engine vendor-agnostic.
 *
 *   attack + telemetry + detection + response  ->  correlation  ->  ValidationResult
 *   ValidationResult[]                         ->  metrics + scoring + recommendations
 */

/** ISO-8601 timestamp, always UTC. */
export type ISODateTime = string;

/* ========================================================================== */
/* MITRE ATT&CK                                                               */
/* ========================================================================== */

export type TacticId =
  | "initial-access"
  | "execution"
  | "persistence"
  | "privilege-escalation"
  | "defense-evasion"
  | "credential-access"
  | "discovery"
  | "lateral-movement"
  | "collection"
  | "command-and-control"
  | "exfiltration"
  | "impact";

export interface MitreTactic {
  id: TacticId;
  /** MITRE tactic code, e.g. TA0002. */
  code: string;
  name: string;
  order: number;
}

export interface MitreTechnique {
  /** e.g. "T1059.001" */
  id: string;
  name: string;
  /** A technique can belong to several tactics; the first is its primary column. */
  tactics: TacticId[];
  parentId?: string;
  description: string;
  platforms: string[];
  /** Telemetry needed to see this technique at all. */
  dataSources: string[];
}

/* ========================================================================== */
/* Organization & environment                                                 */
/* ========================================================================== */

export type HostRole =
  | "domain-controller"
  | "workstation"
  | "server"
  | "emulation-server";

export type Criticality = "critical" | "high" | "medium" | "low";

export interface Host {
  id: string;
  hostname: string;
  ip: string;
  os: string;
  role: HostRole;
  criticality: Criticality;
  owner: string;
}

/** Operational targets the SOC is measured against. */
export interface SlaTargets {
  mttdSeconds: number;
  mttaSeconds: number;
  mttrSeconds: number;
  mttcSeconds: number;
  detectionRatePct: number;
  responseRatePct: number;
}

export interface Organization {
  id: string;
  name: string;
  industry: string;
  timezone: string;
  hosts: Host[];
  targets: SlaTargets;
}

export type UserRole = "admin" | "ciso" | "soc-manager" | "analyst" | "engineer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  initials: string;
  organizationId: string;
}

/* ========================================================================== */
/* Attack / adversary emulation side                                          */
/* ========================================================================== */

export type EmulationTool = "caldera" | "atomic-red-team" | "custom-emulation";

export type ExecutionStatus = "success" | "failed" | "partial" | "blocked";

export interface AttackEvent {
  id: string;
  runId: string;
  source: EmulationTool;
  /** CALDERA operation id / Atomic run id. A correlation key. */
  operationId: string;
  /** CALDERA ability id, or the atomic test GUID. */
  abilityId: string;
  techniqueId: string;
  techniqueName: string;
  tactic: TacticId;
  hostname: string;
  user: string;
  process: string;
  command: string;
  executedAt: ISODateTime;
  /** Wall-clock duration of the emulated action. */
  durationMs: number;
  status: ExecutionStatus;
  /** Verbatim adapter payload, preserved as evidence. */
  raw: Record<string, unknown>;
}

/* ========================================================================== */
/* Detection side                                                             */
/* ========================================================================== */

export type SiemVendor = "elastic" | "splunk" | "sentinel" | "custom-siem";

export type Severity = "critical" | "high" | "medium" | "low" | "informational";

export type Confidence = "high" | "medium" | "low";

/**
 * Raw endpoint/network telemetry reaching the SIEM. Kept separate from alerts
 * so Burhan can tell "we never saw it" apart from "we saw it and said nothing" —
 * a telemetry gap and a rule gap need completely different remediation.
 */
export interface TelemetryEvent {
  id: string;
  runId: string;
  source: SiemVendor;
  techniqueId: string;
  hostname: string;
  /** e.g. "Process Creation", "PowerShell Script Block Logging". */
  dataSource: string;
  eventCode: string;
  receivedAt: ISODateTime;
  raw: Record<string, unknown>;
}

export interface DetectionRule {
  id: string;
  name: string;
  siem: SiemVendor;
  techniqueIds: string[];
  severity: Severity;
  confidence: Confidence;
  enabled: boolean;
  dataSources: string[];
  /** Populated by the metrics engine from validation results. */
  description: string;
}

export interface DetectionEvent {
  id: string;
  runId: string;
  source: SiemVendor;
  alertId: string;
  ruleId: string;
  ruleName: string;
  techniqueId: string;
  hostname: string;
  user?: string;
  process?: string;
  severity: Severity;
  confidence: Confidence;
  alertedAt: ISODateTime;
  /** False positives are counted by the SOC metrics engine but never correlate. */
  isTruePositive: boolean;
  raw: Record<string, unknown>;
}

/* ========================================================================== */
/* Response side                                                              */
/* ========================================================================== */

export type IncidentStatus =
  | "open"
  | "triaged"
  | "investigating"
  | "escalated"
  | "contained"
  | "resolved"
  | "closed";

export interface Incident {
  id: string;
  runId: string;
  /**
   * Every DetectionEvent.alertId rolled into this incident. A real SOC opens
   * one incident for an intrusion, not one per alert, so this is a list.
   */
  alertIds: string[];
  title: string;
  severity: Severity;
  status: IncidentStatus;
  hostname: string;
  assignee: string;
  team: string;
  playbookId?: string;
  createdAt: ISODateTime;
  acknowledgedAt?: ISODateTime;
  triagedAt?: ISODateTime;
  escalatedAt?: ISODateTime;
  containedAt?: ISODateTime;
  resolvedAt?: ISODateTime;
  raw: Record<string, unknown>;
}

export type ResponseActionType =
  | "isolate-host"
  | "kill-process"
  | "disable-account"
  | "block-hash"
  | "block-ip"
  | "reset-credentials"
  | "quarantine-file"
  | "notify-stakeholders"
  | "review-alerts"
  | "reconstruct-timeline"
  | "stop-agent"
  | "remove-persistence"
  | "remove-malware"
  | "enable-account"
  | "restore-network"
  | "verify-visibility";

export type ResponseMode = "automated" | "manual";

export type ResponseSystem = "edr" | "soar" | "analyst" | "firewall" | "identity";

/** NIST-aligned IR phase this action belongs to. */
export type ResponsePhase = "detection-triage" | "containment" | "eradication" | "recovery";

export interface ResponseAction {
  id: string;
  runId: string;
  incidentId: string;
  type: ResponseActionType;
  mode: ResponseMode;
  system: ResponseSystem;
  actor: string;
  description: string;
  startedAt: ISODateTime;
  completedAt?: ISODateTime;
  status: "success" | "failed" | "pending";
  /** True when this action is what actually contained the threat. */
  isContainment: boolean;
  /** Optional — populated for runs with full NIST-phase IR evidence. */
  phase?: ResponsePhase;
  raw: Record<string, unknown>;
}

/* ========================================================================== */
/* Validation runs                                                            */
/* ========================================================================== */

export type RunStatus = "completed" | "running" | "failed" | "partial" | "scheduled";

export interface ThreatProfile {
  id: string;
  name: string;
  aliases: string[];
  description: string;
}

/**
 * Facts reported directly from the original KAUST APT29 LOTL project, shown
 * verbatim rather than re-derived — some (MTTD, technique coverage) were
 * directly measured by the project; others (MTTC, MTTR, FPR) were only
 * procedure-based estimates. Burhan never blurs that distinction.
 */
export interface ProjectBaselineFacts {
  alertsGenerated: number;
  estimatedMttcMinutes: number;
  estimatedMttrMinutes: number;
  estimatedFprPct: number;
}

export interface ValidationRun {
  id: string;
  scenario: string;
  scenarioId: string;
  threatProfile: string;
  emulationTool: EmulationTool;
  siem: SiemVendor;
  status: RunStatus;
  startedAt: ISODateTime;
  completedAt?: ISODateTime;
  operator: string;
  description: string;
  targets: string[];
  techniqueIds: string[];
  /**
   * "historical" = real evidence imported from the original KAUST APT29 LOTL
   * project. "demo" = a synthetic exercise built to demonstrate Burhan's
   * validation workflow. Every page that shows a run must badge this.
   */
  evidenceBasis: "historical" | "demo";
  /** Only present on the historical baseline run. */
  baselineFacts?: ProjectBaselineFacts;
}

/* ========================================================================== */
/* Evidence                                                                   */
/* ========================================================================== */

export type EvidenceKind =
  | "attack"
  | "telemetry"
  | "detection"
  | "incident"
  | "response";

export interface EvidenceField {
  label: string;
  value: string;
  mono?: boolean;
}

/**
 * The proof behind a validation result. Burhan never asserts a detection
 * happened without carrying the record that shows it.
 */
export interface Evidence {
  id: string;
  runId: string;
  kind: EvidenceKind;
  title: string;
  /** Human-readable producer, e.g. "MITRE CALDERA", "Elastic Security". */
  source: string;
  timestamp: ISODateTime;
  summary: string;
  fields: EvidenceField[];
  raw: Record<string, unknown>;
  techniqueId?: string;
  hostname?: string;
}

/* ========================================================================== */
/* Correlation output                                                         */
/* ========================================================================== */

export type ValidationOutcome =
  | "detected"
  | "partially-detected"
  | "missed"
  | "blocked";

export type CoverageGapType =
  | "missing-detection-rule"
  | "telemetry-unavailable"
  | "rule-disabled"
  | "late-detection"
  | "incorrect-severity"
  | "no-incident-created"
  | "no-escalation"
  | "no-containment"
  | "slow-containment";

export interface CoverageGap {
  type: CoverageGapType;
  severity: Criticality;
  techniqueId: string;
  hostname: string;
  title: string;
  description: string;
  recommendation: string;
}

/**
 * One emulated attack action, judged against what the defense actually did.
 * Every latency here is derived from timestamps — never stored, never invented.
 */
export interface ValidationResult {
  id: string;
  runId: string;
  attackEventId: string;

  techniqueId: string;
  techniqueName: string;
  tactic: TacticId;
  hostname: string;
  executedAt: ISODateTime;
  executionStatus: ExecutionStatus;

  telemetryReceived: boolean;
  telemetryAt?: ISODateTime;
  telemetrySource?: string;

  alertGenerated: boolean;
  alertAt?: ISODateTime;
  detectionEventId?: string;
  ruleId?: string;
  ruleName?: string;
  alertSeverity?: Severity;
  detectionConfidence?: Confidence;

  incidentCreated: boolean;
  incidentId?: string;

  responded: boolean;
  contained: boolean;
  responseMode?: ResponseMode;

  /** All derived from timestamp deltas by the correlation engine. */
  telemetryLatencyMs?: number;
  detectionLatencyMs?: number;
  acknowledgeLatencyMs?: number;
  triageLatencyMs?: number;
  escalationLatencyMs?: number;
  /** Alert -> first response action. This is what MTTR averages. */
  responseLatencyMs?: number;
  containmentLatencyMs?: number;
  totalResponseTimeMs?: number;

  outcome: ValidationOutcome;
  gaps: CoverageGap[];
  evidenceIds: string[];
  /** Why the engine reached this verdict — shown in the UI, not just logged. */
  correlationNotes: string[];
}

/* ========================================================================== */
/* Scoring                                                                    */
/* ========================================================================== */

export interface ScoreWeights {
  detectionEffectiveness: number;
  responseEffectiveness: number;
  detectionSpeed: number;
}

export type ScoreBand = "critical" | "weak" | "moderate" | "strong" | "excellent";

export interface ScoreComponent {
  key: keyof ScoreWeights;
  label: string;
  score: number;
  weight: number;
  points: number;
  /** Plain-language explanation of how the sub-score was produced. */
  explanation: string;
  inputs: { label: string; value: string }[];
}

export interface ScoreBreakdown {
  overall: number;
  band: ScoreBand;
  components: ScoreComponent[];
  weights: ScoreWeights;
}

/* ========================================================================== */
/* Metrics                                                                    */
/* ========================================================================== */

export interface DetectionMetrics {
  /** Distinct ATT&CK techniques exercised. */
  techniquesTested: number;
  techniquesDetected: number;
  techniquesPartial: number;
  techniquesMissed: number;
  /** Individual attack actions executed (a technique can run more than once). */
  executionsTested: number;
  executionsDetected: number;
  executionsPartial: number;
  executionsMissed: number;
  executionsBlocked: number;
  detectionRate: number;
  missedDetectionRate: number;
  truePositiveRate: number;
  falsePositiveRate: number;
  alertGenerationRate: number;
  telemetryCoverageRate: number;
  techniqueCoverageRate: number;
  highConfidenceDetections: number;
  lowConfidenceDetections: number;
}

export interface TimeMetrics {
  /** Milliseconds; null when there is nothing to average. */
  mttdMs: number | null;
  mttaMs: number | null;
  mttTriageMs: number | null;
  mttEscalateMs: number | null;
  mttrMs: number | null;
  mttcMs: number | null;
}

export interface ResponseMetrics {
  incidentsCreated: number;
  incidentsResponded: number;
  incidentsContained: number;
  responseSuccessRate: number;
  containmentSuccessRate: number;
  playbookSuccessRate: number;
  automatedActions: number;
  manualActions: number;
  automatedSuccessRate: number;
  manualSuccessRate: number;
}

export interface RunMetrics {
  runId: string;
  detection: DetectionMetrics;
  time: TimeMetrics;
  response: ResponseMetrics;
  score: ScoreBreakdown;
}

/* ========================================================================== */
/* Recommendations                                                            */
/* ========================================================================== */

export type RecommendationCategory =
  | "detection-coverage"
  | "telemetry"
  | "detection-speed"
  | "response-process"
  | "containment"
  | "rule-tuning"
  | "mitre-coverage";

export interface Recommendation {
  id: string;
  severity: Criticality;
  category: RecommendationCategory;
  title: string;
  /** What Burhan observed, stated as evidence. */
  finding: string;
  /** What to do about it. */
  action: string;
  techniqueIds: string[];
  runIds: string[];
  /** Which rule produced this recommendation — keeps the engine auditable. */
  ruleKey: string;
}

/* ========================================================================== */
/* Integrations                                                               */
/* ========================================================================== */

export type IntegrationCategory = "emulation" | "siem" | "response";

export type IntegrationStatus = "connected" | "disconnected" | "error";

export type ApiStatus = "healthy" | "degraded" | "unreachable" | "unknown";

export interface Integration {
  id: string;
  name: string;
  vendor: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  apiStatus: ApiStatus;
  endpoint: string;
  version: string;
  description: string;
  lastSyncAt?: ISODateTime;
  latencyMs?: number;
  /** Which adapter implementation backs this integration. */
  adapterId: string;
  /** Fields the configure dialog renders. */
  configFields: { key: string; label: string; placeholder: string; secret?: boolean }[];
}

/* ========================================================================== */
/* Correlation configuration                                                  */
/* ========================================================================== */

export interface CorrelationConfig {
  /** How long after execution a detection may still count. */
  windowSeconds: number;
  /** Detection is graded "late" beyond this, but still counts. */
  lateDetectionSeconds: number;
  matchOnHost: boolean;
  matchOnUser: boolean;
  matchOnProcess: boolean;
  matchOnOperationId: boolean;
  /** Low-confidence alerts downgrade the outcome to partially-detected. */
  requireHighConfidenceForFullCredit: boolean;
}

export const DEFAULT_CORRELATION_CONFIG: CorrelationConfig = {
  windowSeconds: 300,
  lateDetectionSeconds: 120,
  matchOnHost: true,
  matchOnUser: false,
  matchOnProcess: false,
  matchOnOperationId: true,
  requireHighConfidenceForFullCredit: true,
};

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  detectionEffectiveness: 0.5,
  responseEffectiveness: 0.3,
  detectionSpeed: 0.2,
};

/* ========================================================================== */
/* The complete normalized dataset the whole app reads from                   */
/* ========================================================================== */

export interface BurhanDataset {
  organization: Organization;
  user: User;
  runs: ValidationRun[];
  attackEvents: AttackEvent[];
  telemetryEvents: TelemetryEvent[];
  detectionEvents: DetectionEvent[];
  incidents: Incident[];
  responseActions: ResponseAction[];
  detectionRules: DetectionRule[];
  evidence: Evidence[];
  integrations: Integration[];
  /** False-positive alerts not tied to any emulated attack. */
  falsePositiveCount: number;
}
