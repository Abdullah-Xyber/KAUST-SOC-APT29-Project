import type { ValidationRun } from "@/lib/domain/types";

/**
 * How a displayed number came to exist:
 *  - "measured"  — directly derived from timestamped evidence (SIEM alert
 *    times, CALDERA execution times) in the original KAUST project.
 *  - "estimated" — the original project only had a procedure-based estimate
 *    for this metric (no automated instrumentation captured it).
 *  - "simulated" — the run is a synthetic Burhan demo exercise; nothing on
 *    it claims to be real project evidence.
 *
 * This exists so Burhan never overstates the rigor of a number — the
 * distinction the KAUST write-up itself draws between measured and
 * estimated metrics.
 */
export type EvidenceQuality = "measured" | "estimated" | "simulated";

export const EVIDENCE_QUALITY_LABEL: Record<EvidenceQuality, string> = {
  measured: "Measured",
  estimated: "Estimated",
  simulated: "Simulated",
};

export const EVIDENCE_QUALITY_HINT: Record<EvidenceQuality, string> = {
  measured: "Directly measured from timestamped attack and detection evidence.",
  estimated: "A procedure-based estimate from the original project — not captured by automated instrumentation.",
  simulated: "Simulated demo data, generated to exercise Burhan's validation workflow.",
};

/** Metrics the KAUST project only had a procedure-based estimate for. */
const HISTORICAL_ESTIMATED_METRICS = new Set(["mttc", "mttr", "fpr"]);

export type QualityScopedMetric = "detectionRate" | "mttd" | "techniqueCoverage" | "mttc" | "mttr" | "fpr";

export function metricQuality(
  run: Pick<ValidationRun, "evidenceBasis">,
  metric: QualityScopedMetric,
): EvidenceQuality {
  if (run.evidenceBasis === "demo") return "simulated";
  return HISTORICAL_ESTIMATED_METRICS.has(metric) ? "estimated" : "measured";
}
