"use client";

import * as React from "react";

interface Row {
  label: string;
  value: string;
  color?: string;
}

/** Shared Recharts tooltip shell, styled to the Burhan surface tokens. */
export function ChartTooltipShell({
  label,
  rows,
}: {
  label?: string;
  rows: Row[];
}) {
  return (
    <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 shadow-[var(--shadow-pop)]">
      {label && <p className="mb-1 text-[11px] font-semibold text-[color:var(--ink)]">{label}</p>}
      <div className="space-y-0.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2 text-[11px]">
            {r.color && <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />}
            <span className="text-[color:var(--ink-muted)]">{r.label}</span>
            <span className="ml-auto font-medium tabular text-[color:var(--ink)]">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
