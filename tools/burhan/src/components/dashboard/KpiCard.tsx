"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card, InfoHint } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  hint?: React.ReactNode;
  /** Positive = improvement. Sign and color are derived from this. */
  delta?: number;
  deltaLabel?: string;
  /** Set false when a higher delta is actually worse (e.g. MTTD rising). */
  higherIsBetter?: boolean;
  tone?: "default" | "brand";
  className?: string;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  delta,
  deltaLabel = "vs previous run",
  higherIsBetter = true,
  tone = "default",
  className,
}: KpiCardProps) {
  const improved = delta === undefined ? null : higherIsBetter ? delta > 0 : delta < 0;
  const flat = delta === 0;

  return (
    <Card
      className={cn(
        "p-4",
        tone === "brand" && "border-[color:var(--primary)]/25 bg-[color:var(--primary-soft)]",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="flex items-center text-xs font-medium text-[color:var(--ink-muted)]">
          {label}
          {hint && <InfoHint>{hint}</InfoHint>}
        </p>
        {Icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[color:var(--surface-sunken)] text-[color:var(--ink-muted)]">
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tabular text-[color:var(--ink)]">{value}</p>
      {delta !== undefined && (
        <p
          className={cn(
            "mt-1.5 flex items-center gap-1 text-xs font-medium",
            flat
              ? "text-[color:var(--ink-muted)]"
              : improved
                ? "text-[color:var(--good-ink)]"
                : "text-[color:var(--critical-ink)]",
          )}
        >
          {flat ? <Minus className="h-3 w-3" /> : improved ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {delta > 0 ? "+" : ""}
          {delta}
          {deltaLabel && <span className="font-normal text-[color:var(--ink-muted)]">{deltaLabel}</span>}
        </p>
      )}
    </Card>
  );
}
