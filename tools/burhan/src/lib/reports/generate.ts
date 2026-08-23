import type { RunAnalysis } from "@/lib/engine/analytics";
import type { BurhanDataset } from "@/lib/domain/types";
import { formatDateTime, formatDuration } from "@/lib/utils";

/**
 * "Export Summary" (§9) — a short, one-run report. Reporting is deliberately
 * not a major feature here: this is the whole surface, generated from the
 * same `RunAnalysis` the page itself renders from.
 */
export function buildRunSummary(runAnalysis: RunAnalysis, dataset: BurhanDataset): string {
  const { run, score, detection, time, response, results, gaps, recommendations } = runAnalysis;
  const lines: string[] = [];

  lines.push(`# ${run.scenario} — Validation Summary`);
  lines.push(`${dataset.organization.name} · ${run.id} · ${formatDateTime(run.startedAt)}`);
  lines.push("");
  lines.push(`Threat profile: ${run.threatProfile} · Emulation: ${run.emulationTool} · SIEM: ${run.siem}`);
  lines.push("");

  lines.push(`## Burhan Score: ${score.overall} / 100`);
  for (const c of score.components) {
    lines.push(`- ${c.label} (${Math.round(c.weight * 100)}%): ${c.score}`);
  }
  lines.push("");

  lines.push(`## Key Metrics`);
  lines.push(`- Detection Rate: ${detection.detectionRate}%`);
  lines.push(`- Response Success Rate: ${response.responseSuccessRate}%`);
  lines.push(`- Mean Time to Detect: ${formatDuration(time.mttdMs)}`);
  lines.push(`- Mean Time to Respond: ${formatDuration(time.mttrMs)}`);
  lines.push(`- Mean Time to Contain: ${formatDuration(time.mttcMs)}`);
  lines.push(`- Techniques: ${detection.executionsDetected} detected, ${detection.executionsPartial} partial, ${detection.executionsMissed} missed`);
  lines.push("");

  lines.push(`## Technique Results`);
  for (const r of results) {
    lines.push(`- ${r.techniqueId} (${r.techniqueName}) on ${r.hostname}: ${r.outcome}${r.detectionLatencyMs ? `, detected in ${formatDuration(r.detectionLatencyMs)}` : ""}`);
  }
  lines.push("");

  if (gaps.length) {
    lines.push(`## Detection Gaps`);
    for (const g of gaps) {
      lines.push(`- [${g.severity.toUpperCase()}] ${g.title} (${g.techniqueId}): ${g.description}`);
    }
    lines.push("");
  }

  if (recommendations.length) {
    lines.push(`## Recommendations`);
    for (const r of recommendations) {
      lines.push(`- [${r.severity.toUpperCase()}] ${r.finding} → ${r.action}`);
    }
  }

  return lines.join("\n");
}
