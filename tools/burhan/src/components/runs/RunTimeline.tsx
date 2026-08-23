"use client";

import {
  Crosshair,
  Radio,
  Siren,
  FolderOpen,
  UserCheck,
  ClipboardCheck,
  ArrowUpCircle,
  Wrench,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import type { TimelineEvent } from "@/lib/engine/timeline";
import { formatDuration, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const KIND_META: Record<
  TimelineEvent["kind"],
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  attack: { icon: Crosshair, color: "var(--critical-ink)", bg: "var(--critical-soft)" },
  telemetry: { icon: Radio, color: "var(--ink-secondary)", bg: "var(--surface-sunken)" },
  detection: { icon: Siren, color: "var(--serious)", bg: "var(--serious-soft)" },
  incident: { icon: FolderOpen, color: "var(--primary)", bg: "var(--primary-soft)" },
  acknowledge: { icon: UserCheck, color: "var(--primary)", bg: "var(--primary-soft)" },
  triage: { icon: ClipboardCheck, color: "var(--primary)", bg: "var(--primary-soft)" },
  escalate: { icon: ArrowUpCircle, color: "var(--warning-ink)", bg: "var(--warning-soft)" },
  response: { icon: Wrench, color: "var(--good-ink)", bg: "var(--good-soft)" },
  contain: { icon: ShieldCheck, color: "var(--good-ink)", bg: "var(--good-soft)" },
  resolve: { icon: CheckCircle2, color: "var(--good-ink)", bg: "var(--good-soft)" },
};

export function RunTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) {
    return (
      <p className="py-8 text-center text-xs text-[color:var(--ink-muted)]">
        This run has not produced any timeline events yet.
      </p>
    );
  }

  return (
    <ol className="relative space-y-0.5 border-l-2 border-[color:var(--border)] pl-6">
      {events.map((e) => {
        const meta = KIND_META[e.kind];
        const Icon = meta.icon;
        return (
          <li key={e.id} className="relative py-2.5">
            <span
              className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-[color:var(--surface)]"
              style={{ background: meta.bg, color: meta.color }}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-mono text-[11px] font-semibold text-[color:var(--ink-muted)]">
                {formatTime(e.timestamp)}
              </span>
              <span className="text-xs font-semibold text-[color:var(--ink)]">{e.title}</span>
              {typeof e.sinceLastMs === "number" && e.sinceLastMs > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                    "bg-[color:var(--surface-sunken)] text-[color:var(--ink-muted)]",
                  )}
                >
                  +{formatDuration(e.sinceLastMs)}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-[color:var(--ink-secondary)]">{e.description}</p>
          </li>
        );
      })}
    </ol>
  );
}
