import type { AttackEvent, DetectionEvent, Evidence, Incident, ResponseAction } from "@/lib/domain/types";
import { formatFullTimestamp } from "@/lib/utils";

/**
 * Mirrors `buildEvidence` in the demo generator, but for records a user typed
 * or pasted in on the Data Import page. Manually imported evidence must be
 * inspectable in the Evidence Drawer exactly like generated evidence — proof
 * doesn't get to be second-class just because it arrived as a CSV row.
 */
export function buildEvidenceForImport(imported: {
  attackEvents: AttackEvent[];
  detectionEvents: DetectionEvent[];
  incidents: Incident[];
  responseActions: ResponseAction[];
}): Evidence[] {
  const evidence: Evidence[] = [];

  for (const a of imported.attackEvents) {
    evidence.push({
      id: `EV-A-${a.id}`,
      runId: a.runId,
      kind: "attack",
      title: `${a.techniqueId} executed on ${a.hostname} (imported)`,
      source: "Manual Import",
      timestamp: a.executedAt,
      summary: `${a.techniqueName} executed as ${a.user} via ${a.process}.`,
      fields: [
        { label: "Technique", value: `${a.techniqueId} — ${a.techniqueName}` },
        { label: "Host", value: a.hostname },
        { label: "User", value: a.user, mono: true },
        { label: "Command", value: a.command, mono: true },
        { label: "Executed", value: formatFullTimestamp(a.executedAt) },
      ],
      raw: a.raw,
      techniqueId: a.techniqueId,
      hostname: a.hostname,
    });
  }

  for (const e of imported.detectionEvents) {
    evidence.push({
      id: `EV-D-${e.id}`,
      runId: e.runId,
      kind: "detection",
      title: `${e.ruleName} — ${e.alertId} (imported)`,
      source: "Manual Import",
      timestamp: e.alertedAt,
      summary: `Detection recorded for ${e.techniqueId} at ${e.severity} severity.`,
      fields: [
        { label: "Alert ID", value: e.alertId, mono: true },
        { label: "Rule", value: e.ruleName },
        { label: "Technique", value: e.techniqueId },
        { label: "Host", value: e.hostname },
        { label: "Severity", value: e.severity },
        { label: "Alerted", value: formatFullTimestamp(e.alertedAt) },
      ],
      raw: e.raw,
      techniqueId: e.techniqueId,
      hostname: e.hostname,
    });
  }

  for (const i of imported.incidents) {
    evidence.push({
      id: `EV-I-${i.id}`,
      runId: i.runId,
      kind: "incident",
      title: `${i.id} — ${i.title} (imported)`,
      source: "Manual Import",
      timestamp: i.createdAt,
      summary: `${i.severity} severity incident owned by ${i.assignee}.`,
      fields: [
        { label: "Owner", value: `${i.assignee} — ${i.team}` },
        { label: "Created", value: formatFullTimestamp(i.createdAt) },
        { label: "Status", value: i.status },
      ],
      raw: i.raw,
      hostname: i.hostname,
    });
  }

  const incidentById = new Map(imported.incidents.map((i) => [i.id, i]));
  const PHASE_LABEL: Record<string, string> = {
    "detection-triage": "Detection & Triage",
    containment: "Containment",
    eradication: "Eradication",
    recovery: "Recovery",
  };

  for (const a of imported.responseActions) {
    const incident = incidentById.get(a.incidentId);
    evidence.push({
      id: `EV-R-${a.id}`,
      runId: a.runId,
      kind: "response",
      title: `${a.description} (imported)`,
      source: "Manual Import",
      timestamp: a.startedAt,
      summary: a.description,
      fields: [
        { label: "Action", value: a.description },
        { label: "Host", value: incident?.hostname ?? "—" },
        { label: "Timestamp", value: formatFullTimestamp(a.startedAt) },
        { label: "Phase", value: a.phase ? PHASE_LABEL[a.phase] : "—" },
        { label: "Status", value: a.status },
      ],
      raw: a.raw,
      hostname: incident?.hostname,
    });
  }

  return evidence;
}
