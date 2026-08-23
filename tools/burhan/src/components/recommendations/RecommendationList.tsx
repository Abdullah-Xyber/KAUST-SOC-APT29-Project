"use client";

import type { Recommendation } from "@/lib/domain/types";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { CheckCircle2, Lightbulb } from "lucide-react";

const SEVERITY_TONE = {
  critical: "critical",
  high: "serious",
  medium: "warning",
  low: "neutral",
} as const;

export function RecommendationList({ recommendations }: { recommendations: Recommendation[] }) {
  if (!recommendations.length) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="h-5 w-5" />}
        title="No open recommendations"
        description="Burhan didn't find a rule-based finding to raise for this scope."
      />
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((r) => (
        <div key={r.id} className="rounded-lg border border-[color:var(--border)] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={SEVERITY_TONE[r.severity]}>{r.severity}</Badge>
            <span className="text-xs font-semibold text-[color:var(--ink)]">{r.title}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[color:var(--ink-secondary)]">
            <span className="font-semibold text-[color:var(--ink)]">Finding: </span>
            {r.finding}
          </p>
          <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-[color:var(--ink-secondary)]">
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--primary)]" />
            <span>
              <span className="font-semibold text-[color:var(--ink)]">Recommended action: </span>
              {r.action}
            </span>
          </p>
          {r.techniqueIds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {r.techniqueIds.map((t) => (
                <span key={t} className="rounded bg-[color:var(--surface-sunken)] px-1.5 py-0.5 font-mono text-[10px] text-[color:var(--ink-muted)]">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
