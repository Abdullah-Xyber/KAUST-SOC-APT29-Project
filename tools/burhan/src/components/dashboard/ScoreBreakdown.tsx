"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ScoreBreakdown as ScoreBreakdownType } from "@/lib/domain/types";
import { Progress } from "@/components/ui/primitives";
import { formatPercent } from "@/lib/utils";

/**
 * The transparent arithmetic behind the Burhan Score (§16) — every component,
 * its weight, its 0-100 sub-score and the inputs that produced it, so a CISO
 * can see exactly why the number is what it is rather than trusting a black box.
 */
export function ScoreBreakdown({ breakdown }: { breakdown: ScoreBreakdownType }) {
  return (
    <div className="space-y-3">
      {breakdown.components.map((c) => (
        <ScoreRow key={c.key} label={c.label} score={c.score} weight={c.weight} explanation={c.explanation} inputs={c.inputs} />
      ))}
      <div className="flex items-center justify-between border-t border-[color:var(--border)] pt-3 text-sm font-semibold text-[color:var(--ink)]">
        <span>Burhan Score</span>
        <span className="tabular">{breakdown.overall} / 100</span>
      </div>
    </div>
  );
}

function ScoreRow({
  label,
  score,
  weight,
  explanation,
  inputs,
}: {
  label: string;
  score: number;
  weight: number;
  explanation: string;
  inputs: { label: string; value: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-lg border border-[color:var(--border)] p-3">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 text-left">
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[color:var(--ink-muted)]" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[color:var(--ink-muted)]" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[color:var(--ink)]">
              {label} <span className="text-[color:var(--ink-muted)]">· {formatPercent(weight * 100, 0)} weight</span>
            </span>
            <span className="font-semibold tabular text-[color:var(--ink)]">{score}</span>
          </div>
          <Progress value={score} className="mt-1.5" />
        </div>
      </button>
      {open && (
        <div className="mt-3 pl-[26px]">
          <p className="text-xs leading-relaxed text-[color:var(--ink-secondary)]">{explanation}</p>
          <dl className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
            {inputs.map((i) => (
              <div key={i.label} className="flex justify-between gap-2 text-[11px]">
                <dt className="text-[color:var(--ink-muted)]">{i.label}</dt>
                <dd className="font-medium tabular text-[color:var(--ink)]">{i.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
