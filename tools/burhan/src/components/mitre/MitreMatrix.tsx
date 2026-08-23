"use client";

import { MITRE_TACTICS } from "@/lib/domain/mitre";
import type { MatrixCell, MatrixState } from "@/lib/engine/matrix";
import { cn } from "@/lib/utils";

const STATE_STYLE: Record<MatrixState, string> = {
  detected: "bg-[color:var(--good-soft)] border-[color:var(--good)]/40 text-[color:var(--good-ink)]",
  partial: "bg-[color:var(--warning-soft)] border-[color:var(--warning)]/40 text-[color:var(--warning-ink)]",
  missed: "bg-[color:var(--critical-soft)] border-[color:var(--critical)]/40 text-[color:var(--critical-ink)]",
  "not-tested": "bg-[color:var(--surface-sunken)] border-[color:var(--border)] text-[color:var(--ink-muted)]",
};

export function MitreMatrix({
  matrix,
  onSelect,
  selectedId,
}: {
  matrix: Record<string, MatrixCell[]>;
  onSelect: (cell: MatrixCell) => void;
  selectedId?: string;
}) {
  const tactics = [...MITRE_TACTICS].sort((a, b) => a.order - b.order);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3" style={{ minWidth: tactics.length * 172 }}>
        {tactics.map((tactic) => {
          const cells = matrix[tactic.id] ?? [];
          return (
            <div key={tactic.id} className="w-40 shrink-0">
              <div className="mb-2 rounded-md bg-[color:var(--surface-inverse)] px-2 py-1.5">
                <p className="text-[11px] font-semibold text-white">{tactic.name}</p>
                <p className="text-[9px] text-white/50">{cells.length} techniques</p>
              </div>
              <div className="space-y-1.5">
                {cells.map((cell) => (
                  <button
                    key={`${tactic.id}-${cell.techniqueId}`}
                    onClick={() => onSelect(cell)}
                    className={cn(
                      "w-full rounded-md border px-2 py-1.5 text-left transition hover:brightness-[0.97]",
                      STATE_STYLE[cell.state],
                      selectedId === cell.techniqueId && "ring-2 ring-[color:var(--primary)] ring-offset-1 ring-offset-[color:var(--surface)]",
                    )}
                  >
                    <span className="block font-mono text-[10px] font-semibold">{cell.techniqueId}</span>
                    <span className="block truncate text-[10px] leading-tight">{cell.techniqueName}</span>
                  </button>
                ))}
                {cells.length === 0 && (
                  <p className="px-2 py-3 text-center text-[10px] text-[color:var(--ink-muted)]">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MatrixLegend() {
  const items: { state: MatrixState; label: string }[] = [
    { state: "detected", label: "Tested & Detected" },
    { state: "partial", label: "Partially Detected" },
    { state: "missed", label: "Tested & Missed" },
    { state: "not-tested", label: "Not Tested" },
  ];
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((i) => (
        <span key={i.state} className="flex items-center gap-1.5 text-[11px] text-[color:var(--ink-secondary)]">
          <span className={cn("h-3 w-3 rounded border", STATE_STYLE[i.state])} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
