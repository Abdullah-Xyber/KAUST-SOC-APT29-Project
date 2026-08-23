import type {
  BurhanDataset,
  CorrelationConfig,
  CoverageGap,
  DetectionMetrics,
  Recommendation,
  ResponseMetrics,
  ScoreBreakdown,
  ScoreWeights,
  TimeMetrics,
  ValidationResult,
  ValidationRun,
} from "@/lib/domain/types";
import { DEFAULT_CORRELATION_CONFIG, DEFAULT_SCORE_WEIGHTS } from "@/lib/domain/types";
import { correlate } from "@/lib/engine/correlation";
import {
  computeDetectionMetrics,
  computeResponseMetrics,
  computeTechniqueStats,
  computeTimeMetrics,
  type TechniqueStat,
} from "@/lib/engine/metrics";
import { computeScore } from "@/lib/engine/scoring";
import { generateRecommendations } from "@/lib/engine/recommendations";

/**
 * The single analysis pass the entire application reads from.
 *
 * Pages never compute their own numbers — they select from this. That is what
 * keeps the dashboard, the run detail page and the report telling the same
 * story from the same evidence.
 */

export interface MetricBundle {
  detection: DetectionMetrics;
  time: TimeMetrics;
  response: ResponseMetrics;
  score: ScoreBreakdown;
}

export interface RunAnalysis extends MetricBundle {
  run: ValidationRun;
  results: ValidationResult[];
  gaps: CoverageGap[];
  recommendations: Recommendation[];
  /** Score of the chronologically previous scored run, for deltas. */
  previousScore: number | null;
}

export interface TrendPoint {
  runId: string;
  label: string;
  date: string;
  score: number;
  detectionRate: number;
  responseRate: number;
  mttdSeconds: number | null;
  mttrSeconds: number | null;
  mttcSeconds: number | null;
  detected: number;
  partial: number;
  missed: number;
}

export interface Analysis extends MetricBundle {
  dataset: BurhanDataset;
  results: ValidationResult[];
  runAnalyses: RunAnalysis[];
  byRun: Record<string, RunAnalysis>;
  trend: TrendPoint[];
  recommendations: Recommendation[];
  techniqueStats: TechniqueStat[];
  gaps: CoverageGap[];
  latest: RunAnalysis | null;
  previous: RunAnalysis | null;
  /** Latest score minus the previous scored run. */
  scoreDelta: number | null;
  correlationConfig: CorrelationConfig;
  weights: ScoreWeights;
}

export interface AnalyzeOptions {
  correlationConfig?: Partial<CorrelationConfig>;
  weights?: ScoreWeights;
}

function bundle(
  results: ValidationResult[],
  dataset: BurhanDataset,
  scopeRunIds: string[] | null,
  weights: ScoreWeights,
): MetricBundle {
  const inScope = <T extends { runId: string }>(items: T[]) =>
    scopeRunIds ? items.filter((i) => scopeRunIds.includes(i.runId)) : items;

  const incidents = inScope(dataset.incidents);
  const actions = inScope(dataset.responseActions);
  const detections = inScope(dataset.detectionEvents);
  const falsePositives = detections.filter((d) => !d.isTruePositive).length;

  const detection = computeDetectionMetrics(results, detections, falsePositives);
  const time = computeTimeMetrics(results, incidents, actions);
  const response = computeResponseMetrics(results, incidents, actions);
  const score = computeScore(results, { detection, time, response }, dataset.organization.targets, weights);

  return { detection, time, response, score };
}

export function analyze(dataset: BurhanDataset, options: AnalyzeOptions = {}): Analysis {
  const correlationConfig: CorrelationConfig = {
    ...DEFAULT_CORRELATION_CONFIG,
    ...options.correlationConfig,
  };
  const weights = options.weights ?? DEFAULT_SCORE_WEIGHTS;

  const results = correlate({
    attackEvents: dataset.attackEvents,
    telemetryEvents: dataset.telemetryEvents,
    detectionEvents: dataset.detectionEvents,
    incidents: dataset.incidents,
    responseActions: dataset.responseActions,
    detectionRules: dataset.detectionRules,
    config: correlationConfig,
  });

  // Only runs that actually produced results can be scored; a run whose
  // emulation aborted has nothing to say about the SOC.
  const scoredRuns = dataset.runs
    .filter((r) => results.some((res) => res.runId === r.id))
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));

  const runAnalyses: RunAnalysis[] = [];

  scoredRuns.forEach((run, index) => {
    const runResults = results.filter((r) => r.runId === run.id);
    const metrics = bundle(runResults, dataset, [run.id], weights);
    const recommendations = generateRecommendations(
      runResults,
      metrics,
      dataset.organization.targets,
    );
    runAnalyses.push({
      run,
      results: runResults,
      ...metrics,
      gaps: runResults.flatMap((r) => r.gaps),
      recommendations,
      previousScore: index > 0 ? runAnalyses[index - 1].score.overall : null,
    });
  });

  const byRun: Record<string, RunAnalysis> = {};
  for (const ra of runAnalyses) byRun[ra.run.id] = ra;

  const overall = bundle(results, dataset, null, weights);
  const recommendations = generateRecommendations(results, overall, dataset.organization.targets);

  const trend: TrendPoint[] = runAnalyses.map((ra) => ({
    runId: ra.run.id,
    label: ra.run.scenario,
    date: ra.run.startedAt,
    score: ra.score.overall,
    detectionRate: ra.detection.detectionRate,
    responseRate: ra.response.responseSuccessRate,
    mttdSeconds: ra.time.mttdMs === null ? null : Math.round(ra.time.mttdMs / 1000),
    mttrSeconds: ra.time.mttrMs === null ? null : Math.round(ra.time.mttrMs / 1000),
    mttcSeconds: ra.time.mttcMs === null ? null : Math.round(ra.time.mttcMs / 1000),
    detected: ra.detection.executionsDetected + ra.detection.executionsBlocked,
    partial: ra.detection.executionsPartial,
    missed: ra.detection.executionsMissed,
  }));

  const latest = runAnalyses.length ? runAnalyses[runAnalyses.length - 1] : null;
  const previous = runAnalyses.length > 1 ? runAnalyses[runAnalyses.length - 2] : null;

  return {
    dataset,
    results,
    runAnalyses,
    byRun,
    trend,
    recommendations,
    techniqueStats: computeTechniqueStats(results),
    gaps: results.flatMap((r) => r.gaps),
    latest,
    previous,
    scoreDelta: latest && previous ? latest.score.overall - previous.score.overall : null,
    correlationConfig,
    weights,
    ...overall,
  };
}
