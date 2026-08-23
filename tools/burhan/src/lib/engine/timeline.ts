import type { BurhanDataset, ValidationResult } from "@/lib/domain/types";
import { deltaMs, formatDuration } from "@/lib/utils";

/**
 * A single chronological entry in a run's operational timeline — the view
 * that makes Burhan's core claim visible: that a specific attack action led
 * to a specific, timestamped defensive action (§8).
 */
export interface TimelineEvent {
  id: string;
  timestamp: string;
  kind: "attack" | "telemetry" | "detection" | "incident" | "acknowledge" | "triage" | "escalate" | "response" | "contain" | "resolve";
  title: string;
  description: string;
  techniqueId?: string;
  hostname?: string;
  /** Time since the previous entry in this run's timeline. */
  sinceLastMs?: number;
  resultId?: string;
}

export function buildRunTimeline(dataset: BurhanDataset, runId: string): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const a of dataset.attackEvents.filter((e) => e.runId === runId)) {
    events.push({
      id: `tl-a-${a.id}`,
      timestamp: a.executedAt,
      kind: "attack",
      title: `${a.source === "caldera" ? "CALDERA" : a.source === "atomic-red-team" ? "Atomic Red Team" : "Emulation"} executed ${a.techniqueId}`,
      description: `${a.techniqueName} on ${a.hostname} via ${a.process}`,
      techniqueId: a.techniqueId,
      hostname: a.hostname,
      resultId: `VR-${a.id}`,
    });
  }

  for (const t of dataset.telemetryEvents.filter((e) => e.runId === runId)) {
    events.push({
      id: `tl-t-${t.id}`,
      timestamp: t.receivedAt,
      kind: "telemetry",
      title: `${t.source === "elastic" ? "Elastic Security" : t.source} received telemetry`,
      description: `${t.dataSource} event ingested from ${t.hostname}`,
      techniqueId: t.techniqueId,
      hostname: t.hostname,
    });
  }

  for (const d of dataset.detectionEvents.filter((e) => e.runId === runId && e.isTruePositive)) {
    events.push({
      id: `tl-d-${d.id}`,
      timestamp: d.alertedAt,
      kind: "detection",
      title: `Detection rule triggered — ${d.ruleName}`,
      description: `Alert ${d.alertId} raised at ${d.severity} severity (${d.confidence} confidence)`,
      techniqueId: d.techniqueId,
      hostname: d.hostname,
    });
  }

  for (const i of dataset.incidents.filter((e) => e.runId === runId)) {
    events.push({
      id: `tl-i-${i.id}`,
      timestamp: i.createdAt,
      kind: "incident",
      title: `SOC incident created — ${i.id}`,
      description: `${i.title}, assigned to ${i.assignee} (${i.team})`,
      hostname: i.hostname,
    });
    if (i.acknowledgedAt) {
      events.push({
        id: `tl-ack-${i.id}`,
        timestamp: i.acknowledgedAt,
        kind: "acknowledge",
        title: `Analyst acknowledged ${i.id}`,
        description: `${i.assignee} acknowledged the incident`,
        hostname: i.hostname,
      });
    }
    if (i.triagedAt) {
      events.push({
        id: `tl-triage-${i.id}`,
        timestamp: i.triagedAt,
        kind: "triage",
        title: `Incident triaged`,
        description: `${i.assignee} completed triage on ${i.id}`,
        hostname: i.hostname,
      });
    }
    if (i.escalatedAt) {
      events.push({
        id: `tl-esc-${i.id}`,
        timestamp: i.escalatedAt,
        kind: "escalate",
        title: `Incident escalated`,
        description: `${i.id} escalated to ${i.team}`,
        hostname: i.hostname,
      });
    }
    if (i.containedAt) {
      events.push({
        id: `tl-contain-${i.id}`,
        timestamp: i.containedAt,
        kind: "contain",
        title: `Threat contained`,
        description: `Containment confirmed for ${i.id}`,
        hostname: i.hostname,
      });
    }
    if (i.resolvedAt) {
      events.push({
        id: `tl-resolve-${i.id}`,
        timestamp: i.resolvedAt,
        kind: "resolve",
        title: `Incident resolved`,
        description: `${i.id} closed by ${i.team}`,
        hostname: i.hostname,
      });
    }
  }

  const PHASE_LABEL: Record<string, string> = {
    "detection-triage": "Detection & Triage",
    containment: "Containment",
    eradication: "Eradication",
    recovery: "Recovery",
  };

  for (const a of dataset.responseActions.filter((e) => e.runId === runId)) {
    events.push({
      id: `tl-r-${a.id}`,
      timestamp: a.startedAt,
      kind: "response",
      title: a.phase
        ? `${PHASE_LABEL[a.phase]} — ${a.type.replace(/-/g, " ")}`
        : `${a.mode === "automated" ? "Automated" : "Manual"} response — ${a.type.replace(/-/g, " ")}`,
      description: `${a.description} (${a.actor}, ${a.system})`,
    });
  }

  const sorted = events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return sorted.map((e, i) => ({
    ...e,
    sinceLastMs: i === 0 ? undefined : (deltaMs(sorted[i - 1].timestamp, e.timestamp) ?? undefined),
  }));
}

export function summarizeLatencies(results: ValidationResult[]) {
  const withDetection = results.filter((r) => typeof r.detectionLatencyMs === "number");
  const withContainment = results.filter((r) => typeof r.containmentLatencyMs === "number");
  return {
    detectionLabel: withDetection.length
      ? formatDuration(
          withDetection.reduce((s, r) => s + (r.detectionLatencyMs ?? 0), 0) / withDetection.length,
        )
      : "—",
    containmentLabel: withContainment.length
      ? formatDuration(
          withContainment.reduce((s, r) => s + (r.containmentLatencyMs ?? 0), 0) / withContainment.length,
        )
      : "—",
  };
}
