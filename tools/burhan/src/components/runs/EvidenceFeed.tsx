"use client";

import type { Evidence } from "@/lib/domain/types";
import { formatTime } from "@/lib/utils";
import { useEvidenceDrawer } from "@/components/evidence/EvidenceDrawer";
import { Crosshair, Radio, ShieldAlert, Siren } from "lucide-react";

const KIND_ICON: Record<Evidence["kind"], React.ComponentType<{ className?: string }>> = {
  attack: Crosshair,
  telemetry: Radio,
  detection: Siren,
  incident: ShieldAlert,
  response: ShieldAlert,
};

/** Compact chronological feed used to show attack vs. defensive evidence side-by-side (§8). */
export function EvidenceFeed({ items, tone }: { items: Evidence[]; tone: "attack" | "defense" }) {
  const { openEvidence } = useEvidenceDrawer();

  if (!items.length) {
    return (
      <p className="rounded-lg border border-dashed border-[color:var(--border-strong)] px-3 py-6 text-center text-[11px] text-[color:var(--ink-muted)]">
        No evidence recorded for this run.
      </p>
    );
  }

  return (
    <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
      {items.map((e) => {
        const Icon = KIND_ICON[e.kind];
        return (
          <button
            key={e.id}
            onClick={() => openEvidence(e)}
            className={`flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition hover:brightness-[0.98] ${
              tone === "attack"
                ? "border-[color:var(--critical)]/20 bg-[color:var(--critical-soft)]"
                : "border-[color:var(--primary)]/20 bg-[color:var(--primary-soft)]"
            }`}
          >
            <Icon
              className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                tone === "attack" ? "text-[color:var(--critical-ink)]" : "text-[color:var(--primary)]"
              }`}
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className="font-mono text-[10px] font-semibold text-[color:var(--ink-muted)]">
                  {formatTime(e.timestamp)}
                </span>
                <span className="truncate text-xs font-medium text-[color:var(--ink)]">{e.title}</span>
              </span>
              <span className="mt-0.5 block truncate text-[11px] text-[color:var(--ink-muted)]">{e.source}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
