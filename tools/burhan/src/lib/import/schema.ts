/**
 * Manual Data Import (§16).
 *
 * Field names here mirror the spec exactly — they are what a user sees on
 * the form, in a CSV header row, or as JSON object keys. `mapAttackRow` /
 * `mapDetectionRow` / `mapIrActionRow` translate them into the normalized
 * domain model and report validation errors per row, per field.
 *
 * IR evidence is imported one action at a time (Incident / Action / Host /
 * Phase / Timestamp / Status) rather than one row per incident lifecycle —
 * that mirrors how the real KAUST project's IR log actually reads, and how
 * Burhan's own NIST-phase evidence model (§8) is structured.
 */

export const ATTACK_FIELDS = ["Tool", "Operation", "Technique ID", "Technique Name", "Host", "Execution Time", "Status"] as const;

export const DETECTION_FIELDS = ["SIEM", "Alert ID", "Rule", "Technique ID", "Host", "Alert Time", "Status"] as const;

export const IR_FIELDS = ["Incident", "Action", "Host", "Phase", "Timestamp", "Status"] as const;

export type AttackRow = Record<(typeof ATTACK_FIELDS)[number], string>;
export type DetectionRow = Record<(typeof DETECTION_FIELDS)[number], string>;
export type IrRow = Record<(typeof IR_FIELDS)[number], string>;

export const EMPTY_ATTACK_ROW: AttackRow = Object.fromEntries(ATTACK_FIELDS.map((f) => [f, ""])) as AttackRow;
export const EMPTY_DETECTION_ROW: DetectionRow = Object.fromEntries(
  DETECTION_FIELDS.map((f) => [f, ""]),
) as DetectionRow;
export const EMPTY_IR_ROW: IrRow = Object.fromEntries(IR_FIELDS.map((f) => [f, ""])) as IrRow;

export const ATTACK_EXAMPLE: AttackRow = {
  Tool: "CALDERA",
  Operation: "op-manual-01",
  "Technique ID": "T1059.001",
  "Technique Name": "PowerShell",
  Host: "WS02",
  "Execution Time": "2026-08-21T09:15:00Z",
  Status: "success",
};

export const DETECTION_EXAMPLE: DetectionRow = {
  SIEM: "Elastic",
  "Alert ID": "ALT-MANUAL-01",
  Rule: "Encoded PowerShell Command Execution",
  "Technique ID": "T1059.001",
  Host: "WS02",
  "Alert Time": "2026-08-21T09:15:52Z",
  Status: "detected",
};

export const IR_EXAMPLE: IrRow = {
  Incident: "INC-MANUAL-01",
  Action: "Isolated WS02 from the network",
  Host: "WS02",
  Phase: "containment",
  Timestamp: "2026-08-21T09:19:10Z",
  Status: "success",
};
