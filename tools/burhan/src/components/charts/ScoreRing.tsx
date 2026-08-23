"use client";

import { cn } from "@/lib/utils";
import type { ScoreBand } from "@/lib/domain/types";

const BAND_COLOR: Record<ScoreBand, string> = {
  excellent: "var(--good)",
  strong: "var(--primary)",
  moderate: "var(--warning)",
  weak: "var(--serious)",
  critical: "var(--critical)",
};

/**
 * The Burhan Score gauge. A single-series radial progress ring — not a pie
 * chart splitting a whole, so it stays outside the categorical-palette rules
 * and can safely use a status-band color to carry meaning.
 */
export function ScoreRing({
  score,
  band,
  size = 176,
  strokeWidth = 14,
  className,
}: {
  score: number;
  band: ScoreBand;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);
  const color = BAND_COLOR[band];

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--grid)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold tabular text-[color:var(--ink)]">{Math.round(score)}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-[color:var(--ink-muted)]">/ 100</span>
      </div>
    </div>
  );
}
