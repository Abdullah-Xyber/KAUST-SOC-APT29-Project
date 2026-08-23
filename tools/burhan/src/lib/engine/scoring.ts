import type {
  DetectionMetrics,
  ResponseMetrics,
  ScoreBand,
  ScoreBreakdown,
  ScoreComponent,
  ScoreWeights,
  SlaTargets,
  TimeMetrics,
  ValidationResult,
} from "@/lib/domain/types";
import { DEFAULT_SCORE_WEIGHTS } from "@/lib/domain/types";
import { clamp, formatDuration, formatPercent, round } from "@/lib/utils";

/**
 * The Burhan Score.
 *
 * Deliberately transparent: three sub-scores on a 0-100 scale, combined with
 * published weights. Nothing here is random, and every component carries the
 * inputs that produced it so the UI can show the arithmetic to the user.
 * MITRE technique coverage is reported separately, on the MITRE Coverage
 * page — it describes breadth of testing, not detection quality, so it does
 * not get its own scoring weight here.
 *
 *   Burhan Score = 50% Detection Effectiveness
 *                + 30% Response Effectiveness
 *                + 20% Detection Speed
 */

/** Credit given per outcome when grading detection effectiveness. */
const OUTCOME_CREDIT: Record<string, number> = {
  detected: 1,
  blocked: 1, // prevented outright — the best possible result
  "partially-detected": 0.5,
  missed: 0,
};

export function scoreDetectionEffectiveness(results: ValidationResult[]): {
  score: number;
  inputs: { label: string; value: string }[];
  explanation: string;
} {
  if (!results.length) {
    return { score: 0, inputs: [], explanation: "No validation results in scope." };
  }
  const credit = results.reduce((sum, r) => sum + (OUTCOME_CREDIT[r.outcome] ?? 0), 0);
  const score = round(clamp((credit / results.length) * 100), 1);

  const detected = results.filter((r) => r.outcome === "detected").length;
  const partial = results.filter((r) => r.outcome === "partially-detected").length;
  const blocked = results.filter((r) => r.outcome === "blocked").length;
  const missed = results.filter((r) => r.outcome === "missed").length;

  return {
    score,
    inputs: [
      { label: "Detected (full credit)", value: `${detected}` },
      { label: "Blocked by prevention (full credit)", value: `${blocked}` },
      { label: "Partially detected (half credit)", value: `${partial}` },
      { label: "Missed (no credit)", value: `${missed}` },
      { label: "Credit earned", value: `${round(credit, 1)} / ${results.length}` },
    ],
    explanation:
      "Each executed attack action earns full credit when it was cleanly detected or prevented, half credit when the alert was late, low-confidence, or never worked, and nothing when it was missed.",
  };
}

export function scoreResponseEffectiveness(
  results: ValidationResult[],
  response: ResponseMetrics,
): { score: number; inputs: { label: string; value: string }[]; explanation: string } {
  const actionable = results.filter((r) => r.alertGenerated);
  if (!actionable.length) {
    return {
      score: 0,
      inputs: [],
      explanation: "No alerts were raised, so the response team had nothing to act on.",
    };
  }

  const incidentRate = (results.filter((r) => r.incidentCreated).length / actionable.length) * 100;
  const respondRate = (results.filter((r) => r.responded).length / actionable.length) * 100;
  const containRate = (results.filter((r) => r.contained).length / actionable.length) * 100;

  // Containment is weighted heaviest: opening a ticket is not a response.
  const score = round(clamp(incidentRate * 0.25 + respondRate * 0.3 + containRate * 0.45), 1);

  return {
    score,
    inputs: [
      { label: "Alerts available to act on", value: `${actionable.length}` },
      { label: "Incident created (25%)", value: formatPercent(round(incidentRate, 1), 1) },
      { label: "Response action taken (30%)", value: formatPercent(round(respondRate, 1), 1) },
      { label: "Successfully contained (45%)", value: formatPercent(round(containRate, 1), 1) },
      { label: "Playbook success", value: formatPercent(response.playbookSuccessRate, 1) },
    ],
    explanation:
      "Measured only against alerts the SOC actually received. Containment carries the most weight, because opening an incident without containing the threat is not a successful response.",
  };
}

/**
 * Speed is graded on a ratio to the organization's own MTTD target:
 * at or below half the target scores 100, at 2x the target scores 0, and
 * hitting the target exactly lands at ~87 — a pass, not a perfect score.
 */
export function scoreDetectionSpeed(
  time: TimeMetrics,
  targets: SlaTargets,
): { score: number; inputs: { label: string; value: string }[]; explanation: string } {
  if (time.mttdMs === null) {
    return {
      score: 0,
      inputs: [{ label: "MTTD", value: "no detections" }],
      explanation: "Nothing was detected, so there is no detection time to grade.",
    };
  }
  const targetMs = targets.mttdSeconds * 1000;
  const ratio = time.mttdMs / targetMs;
  const score = round(clamp(ratio <= 0.5 ? 100 : ((2 - ratio) / 1.5) * 100), 1);

  return {
    score,
    inputs: [
      { label: "Mean time to detect", value: formatDuration(time.mttdMs) },
      { label: "Organization target", value: formatDuration(targetMs) },
      { label: "Ratio to target", value: `${round(ratio, 2)}x` },
    ],
    explanation:
      "Detection speed is scored against your own MTTD target. Half the target or faster scores 100; twice the target scores 0; meeting the target exactly scores in the high 80s.",
  };
}

export function bandFor(score: number): ScoreBand {
  if (score >= 90) return "excellent";
  if (score >= 80) return "strong";
  if (score >= 65) return "moderate";
  if (score >= 50) return "weak";
  return "critical";
}

export const BAND_LABEL: Record<ScoreBand, string> = {
  excellent: "Excellent",
  strong: "Strong",
  moderate: "Moderate",
  weak: "Needs Work",
  critical: "Critical",
};

export function computeScore(
  results: ValidationResult[],
  metrics: { detection: DetectionMetrics; time: TimeMetrics; response: ResponseMetrics },
  targets: SlaTargets,
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS,
): ScoreBreakdown {
  const detection = scoreDetectionEffectiveness(results);
  const response = scoreResponseEffectiveness(results, metrics.response);
  const speed = scoreDetectionSpeed(metrics.time, targets);

  const components: ScoreComponent[] = [
    {
      key: "detectionEffectiveness",
      label: "Detection Effectiveness",
      score: detection.score,
      weight: weights.detectionEffectiveness,
      points: round(detection.score * weights.detectionEffectiveness, 1),
      explanation: detection.explanation,
      inputs: detection.inputs,
    },
    {
      key: "responseEffectiveness",
      label: "Response Effectiveness",
      score: response.score,
      weight: weights.responseEffectiveness,
      points: round(response.score * weights.responseEffectiveness, 1),
      explanation: response.explanation,
      inputs: response.inputs,
    },
    {
      key: "detectionSpeed",
      label: "Detection Speed",
      score: speed.score,
      weight: weights.detectionSpeed,
      points: round(speed.score * weights.detectionSpeed, 1),
      explanation: speed.explanation,
      inputs: speed.inputs,
    },
  ];

  const overall = Math.round(components.reduce((sum, c) => sum + c.score * c.weight, 0));

  return { overall, band: bandFor(overall), components, weights };
}

/** Normalize user-entered weights so they always sum to 1. */
export function normalizeWeights(weights: ScoreWeights): ScoreWeights {
  const total = weights.detectionEffectiveness + weights.responseEffectiveness + weights.detectionSpeed;
  if (total <= 0) return DEFAULT_SCORE_WEIGHTS;
  return {
    detectionEffectiveness: weights.detectionEffectiveness / total,
    responseEffectiveness: weights.responseEffectiveness / total,
    detectionSpeed: weights.detectionSpeed / total,
  };
}
