import type { AttackEvent, DetectionEvent, EmulationTool, ExecutionStatus, ResponsePhase, SiemVendor } from "@/lib/domain/types";
import { primaryTactic, techniqueName as lookupTechniqueName } from "@/lib/domain/mitre";
import type { AttackRow, DetectionRow, IrRow } from "@/lib/import/schema";

export interface ParseResult<T> {
  data: T | null;
  errors: string[];
}

const TECHNIQUE_ID_RE = /^T\d{4}(\.\d{3})?$/;

function toIso(label: string, value: string, errors: string[]): string | undefined {
  if (!value.trim()) return undefined;
  const t = Date.parse(value);
  if (Number.isNaN(t)) {
    errors.push(`"${label}" is not a valid date/time: "${value}"`);
    return undefined;
  }
  return new Date(t).toISOString();
}

function normalizeTool(value: string): EmulationTool {
  const v = value.trim().toLowerCase();
  if (v.includes("atomic")) return "atomic-red-team";
  if (v.includes("caldera")) return "caldera";
  return "custom-emulation";
}

function normalizeSiem(value: string): SiemVendor {
  const v = value.trim().toLowerCase();
  if (v.includes("elastic")) return "elastic";
  if (v.includes("splunk")) return "splunk";
  if (v.includes("sentinel")) return "sentinel";
  return "custom-siem";
}

function normalizeExecutionStatus(value: string): ExecutionStatus {
  const v = value.trim().toLowerCase();
  if (v === "failed" || v === "fail") return "failed";
  if (v === "partial") return "partial";
  if (v === "blocked") return "blocked";
  return "success";
}

function normalizePhase(value: string): ResponsePhase {
  const v = value.trim().toLowerCase().replace(/\s+/g, "-");
  const allowed: ResponsePhase[] = ["detection-triage", "containment", "eradication", "recovery"];
  return (allowed.find((p) => p === v) as ResponsePhase) ?? "containment";
}

function normalizeActionStatus(value: string): "success" | "failed" | "pending" {
  const v = value.trim().toLowerCase();
  if (v === "failed" || v === "fail") return "failed";
  if (v === "pending" || v === "in-progress" || v === "in progress") return "pending";
  return "success";
}

/* ------------------------------------------------------------- attack -- */

export function mapAttackRow(
  row: Partial<AttackRow>,
): ParseResult<Omit<AttackEvent, "id" | "runId" | "raw">> {
  const errors: string[] = [];
  const techniqueId = (row["Technique ID"] ?? "").trim().toUpperCase();
  const host = (row["Host"] ?? "").trim();

  if (!techniqueId) errors.push('"Technique ID" is required.');
  else if (!TECHNIQUE_ID_RE.test(techniqueId)) errors.push(`"Technique ID" "${techniqueId}" doesn't look like a MITRE ID (e.g. T1059.001).`);
  if (!host) errors.push('"Host" is required.');

  const executedAt = toIso("Execution Time", row["Execution Time"] ?? "", errors);
  if (!executedAt) errors.push('"Execution Time" is required and must be a valid date/time.');

  if (errors.length || !executedAt) return { data: null, errors };

  const techniqueNameValue = (row["Technique Name"] ?? "").trim() || lookupTechniqueName(techniqueId);
  const operation = (row["Operation"] ?? "manual").trim() || "manual";

  return {
    data: {
      source: normalizeTool(row["Tool"] ?? ""),
      operationId: operation,
      abilityId: `manual-${techniqueId}`,
      techniqueId,
      techniqueName: techniqueNameValue,
      tactic: primaryTactic(techniqueId),
      hostname: host,
      user: "imported",
      process: "unknown",
      command: `${operation} — manual entry, no command captured`,
      executedAt,
      durationMs: 1500,
      status: normalizeExecutionStatus(row["Status"] ?? "success"),
    },
    errors: [],
  };
}

/* ---------------------------------------------------------- detection -- */

export function mapDetectionRow(
  row: Partial<DetectionRow>,
): ParseResult<Omit<DetectionEvent, "id" | "runId" | "raw">> {
  const errors: string[] = [];
  const techniqueId = (row["Technique ID"] ?? "").trim().toUpperCase();
  const host = (row["Host"] ?? "").trim();
  const alertId = (row["Alert ID"] ?? "").trim();
  const rule = (row["Rule"] ?? "").trim();

  if (!alertId) errors.push('"Alert ID" is required.');
  if (!techniqueId) errors.push('"Technique ID" is required.');
  else if (!TECHNIQUE_ID_RE.test(techniqueId)) errors.push(`"Technique ID" "${techniqueId}" doesn't look like a MITRE ID.`);
  if (!host) errors.push('"Host" is required.');

  const alertedAt = toIso("Alert Time", row["Alert Time"] ?? "", errors);
  if (!alertedAt) errors.push('"Alert Time" is required and must be a valid date/time.');

  if (errors.length || !alertedAt) return { data: null, errors };

  const statusValue = (row["Status"] ?? "").trim().toLowerCase();
  const isTruePositive = statusValue !== "false positive" && statusValue !== "false-positive" && statusValue !== "missed";
  const ruleName = rule || `Imported detection for ${techniqueId}`;

  return {
    data: {
      source: normalizeSiem(row["SIEM"] ?? ""),
      alertId,
      ruleId: alertId,
      ruleName,
      techniqueId,
      hostname: host,
      severity: "medium",
      confidence: "medium",
      alertedAt,
      isTruePositive,
    },
    errors: [],
  };
}

/* ---------------------------------------------------------- IR action -- */

export interface IrActionImport {
  incidentLabel: string;
  action: string;
  host: string;
  phase: ResponsePhase;
  timestamp: string;
  status: "success" | "failed" | "pending";
}

/**
 * One IR action per row (Incident / Action / Host / Phase / Timestamp /
 * Status — §16). Multiple rows sharing the same "Incident" label accumulate
 * onto the same incident record, in whatever order they're imported.
 */
export function mapIrActionRow(row: Partial<IrRow>): ParseResult<IrActionImport> {
  const errors: string[] = [];
  const incidentLabel = (row["Incident"] ?? "").trim();
  const action = (row["Action"] ?? "").trim();
  const host = (row["Host"] ?? "").trim();

  if (!incidentLabel) errors.push('"Incident" is required.');
  if (!action) errors.push('"Action" is required.');
  if (!host) errors.push('"Host" is required.');

  const timestamp = toIso("Timestamp", row["Timestamp"] ?? "", errors);
  if (!timestamp) errors.push('"Timestamp" is required and must be a valid date/time.');

  if (errors.length || !timestamp) return { data: null, errors };

  return {
    data: {
      incidentLabel,
      action,
      host,
      phase: normalizePhase(row["Phase"] ?? "containment"),
      timestamp,
      status: normalizeActionStatus(row["Status"] ?? "success"),
    },
    errors: [],
  };
}

/* ------------------------------------------------------------ CSV/JSON -- */

/** A small, dependency-free CSV parser: comma-separated, double-quote escaping. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      pushField();
    } else if (c === "\n") {
      pushRow();
    } else if (c === "\r") {
      // skip
    } else {
      field += c;
    }
  }
  if (field.length || row.length) pushRow();

  const [header, ...body] = rows.filter((r) => r.some((c) => c.trim().length));
  if (!header) return [];
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

export function parseJsonRows(text: string): { rows: Record<string, string>[]; error: string | null } {
  try {
    const parsed = JSON.parse(text);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    return {
      rows: arr.map((obj) =>
        Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === null || v === undefined ? "" : String(v)])),
      ),
      error: null,
    };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "Invalid JSON." };
  }
}
