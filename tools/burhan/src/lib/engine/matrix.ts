import { MITRE_TECHNIQUES, MITRE_TACTICS } from "@/lib/domain/mitre";
import type { TechniqueStat } from "@/lib/engine/metrics";

export type MatrixState = "detected" | "partial" | "missed" | "not-tested";

export interface MatrixCell {
  techniqueId: string;
  techniqueName: string;
  tactic: string;
  state: MatrixState;
  stat?: TechniqueStat;
}

export const MATRIX_STATE_LABEL: Record<MatrixState, string> = {
  detected: "Tested & Detected",
  partial: "Partially Detected",
  missed: "Tested & Missed",
  "not-tested": "Not Tested",
};

/**
 * The full ATT&CK subset Burhan tracks, joined against this scope's technique
 * stats — including techniques that have never been exercised, so the matrix
 * shows the whole attack surface, not just what happened to run.
 */
export function buildMatrix(techniqueStats: TechniqueStat[]): Record<string, MatrixCell[]> {
  const byId = new Map(techniqueStats.map((s) => [s.techniqueId, s]));
  const byTactic: Record<string, MatrixCell[]> = {};

  for (const tactic of MITRE_TACTICS) {
    byTactic[tactic.id] = [];
  }

  for (const technique of MITRE_TECHNIQUES) {
    const stat = byId.get(technique.id);
    const state: MatrixState = !stat
      ? "not-tested"
      : stat.state === "detected"
        ? "detected"
        : stat.state === "partial"
          ? "partial"
          : "missed";

    for (const tacticId of technique.tactics) {
      byTactic[tacticId]?.push({
        techniqueId: technique.id,
        techniqueName: technique.name,
        tactic: tacticId,
        state,
        stat,
      });
    }
  }

  return byTactic;
}
