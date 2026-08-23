"use client";

import Link from "next/link";
import { Drawer } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/primitives";
import { getTechnique } from "@/lib/domain/mitre";
import type { MatrixCell } from "@/lib/engine/matrix";
import { MATRIX_STATE_LABEL } from "@/lib/engine/matrix";
import { useBurhan } from "@/lib/state/DataProvider";
import { useEvidenceDrawer } from "@/components/evidence/EvidenceDrawer";
import { formatDuration, formatTime } from "@/lib/utils";

const STATE_TONE = {
  detected: "good",
  partial: "warning",
  missed: "critical",
  "not-tested": "neutral",
} as const;

export function TechniqueDrawer({ cell, onClose }: { cell: MatrixCell | null; onClose: () => void }) {
  const { analysis } = useBurhan();
  const { openResult } = useEvidenceDrawer();

  const technique = cell ? getTechnique(cell.techniqueId) : undefined;
  const results = cell ? analysis.results.filter((r) => r.techniqueId === cell.techniqueId) : [];

  return (
    <Drawer
      open={!!cell}
      onClose={onClose}
      eyebrow="MITRE ATT&CK Technique"
      title={cell ? `${cell.techniqueId} — ${cell.techniqueName}` : ""}
      width="max-w-2xl"
    >
      {cell && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STATE_TONE[cell.state]}>{MATRIX_STATE_LABEL[cell.state]}</Badge>
            {technique?.platforms.map((p) => (
              <Badge key={p} tone="outline">
                {p}
              </Badge>
            ))}
          </div>

          {technique && <p className="text-xs leading-relaxed text-[color:var(--ink-secondary)]">{technique.description}</p>}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Tests" value={`${cell.stat?.tests ?? 0}`} />
            <Stat label="Detected" value={`${cell.stat?.detected ?? 0}`} />
            <Stat label="Detection Rate" value={cell.stat ? `${cell.stat.detectionRate}%` : "—"} />
            <Stat label="Avg. Detection Time" value={formatDuration(cell.stat?.avgDetectionTimeMs)} />
          </div>

          {technique && technique.dataSources.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-muted)]">
                Required data sources
              </p>
              <div className="flex flex-wrap gap-1.5">
                {technique.dataSources.map((d) => (
                  <span key={d} className="rounded bg-[color:var(--surface-sunken)] px-2 py-1 text-[11px] text-[color:var(--ink-secondary)]">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {cell.stat && cell.stat.rules.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-muted)]">
                Detection rules that have fired
              </p>
              <ul className="space-y-1">
                {cell.stat.rules.map((r) => (
                  <li key={r} className="rounded-md border border-[color:var(--border)] px-2.5 py-1.5 text-xs text-[color:var(--ink-secondary)]">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {cell.stat && cell.stat.runIds.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-muted)]">
                Related validation runs
              </p>
              <div className="flex flex-wrap gap-1.5">
                {cell.stat.runIds.map((id) => (
                  <Link
                    key={id}
                    href={`/runs/${id}`}
                    className="rounded-md border border-[color:var(--border)] px-2 py-1 font-mono text-[11px] text-[color:var(--primary)] hover:underline"
                  >
                    {id}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-muted)]">
                Evidence per execution
              </p>
              <div className="space-y-1.5">
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => openResult(r)}
                    className="flex w-full items-center justify-between rounded-md border border-[color:var(--border)] px-2.5 py-1.5 text-left text-xs hover:bg-[color:var(--surface-sunken)]"
                  >
                    <span className="text-[color:var(--ink-secondary)]">
                      {r.hostname} · {formatTime(r.executedAt)}
                    </span>
                    <Badge tone={STATE_TONE[r.outcome === "blocked" ? "detected" : r.outcome === "detected" ? "detected" : r.outcome === "partially-detected" ? "partial" : "missed"]}>
                      {r.outcome}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-sunken)] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-[color:var(--ink-muted)]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular text-[color:var(--ink)]">{value}</p>
    </div>
  );
}
