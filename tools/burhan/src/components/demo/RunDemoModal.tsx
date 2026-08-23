"use client";

import * as React from "react";
import Link from "next/link";
import { Play, Pause, RotateCcw, Target, ShieldAlert, XCircle, CheckCircle2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Badge, Button } from "@/components/ui/primitives";
import { ScoreRing } from "@/components/charts/ScoreRing";
import { LiveConsole } from "@/components/live/LiveConsole";
import { useBurhan, LIVE_RUN_ID } from "@/lib/state/DataProvider";
import { buildRunTimeline } from "@/lib/engine/timeline";

/**
 * "Run Demo" (§13): a compact APT29 replay that simulates one validation
 * scenario with timed events, for the exhibition floor. Deliberately a modal
 * over the Dashboard rather than its own page — the underlying step timer
 * lives in DataProvider either way, so nothing about the engine changes,
 * only how much chrome wraps it.
 */
export function RunDemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dataset, analysis, liveStatus, liveStepCount, liveTotal, startLive, pauseLive, resumeLive, resetLive } =
    useBurhan();

  const timeline = React.useMemo(() => buildRunTimeline(dataset, LIVE_RUN_ID), [dataset]);
  const runAnalysis = analysis.byRun[LIVE_RUN_ID];
  const results = runAnalysis?.results ?? [];
  const missed = results.filter((r) => r.outcome === "missed");
  const progressPct = Math.round((liveStepCount / liveTotal) * 100);

  React.useEffect(() => {
    if (open && liveStatus === "idle") startLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Run Demo — APT29 Validation — Live Demo"
      description="Simulated Demo Data — a compact CALDERA replay streaming into Elastic Security, correlated by Burhan in real time. Not the original KAUST project result."
      className="max-w-3xl"
      footer={
        <>
          {liveStatus === "running" ? (
            <Button variant="secondary" onClick={pauseLive}>
              <Pause className="h-3.5 w-3.5" /> Pause
            </Button>
          ) : liveStatus === "paused" ? (
            <Button variant="primary" onClick={resumeLive}>
              <Play className="h-3.5 w-3.5" /> Resume
            </Button>
          ) : (
            <Button variant="primary" onClick={startLive}>
              <Play className="h-3.5 w-3.5" /> Restart
            </Button>
          )}
          <Button variant="ghost" onClick={resetLive}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
          <Link href={`/runs/${LIVE_RUN_ID}`}>
            <Button variant="secondary">View full run</Button>
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <StatusBadge status={liveStatus} />
          <Badge tone="outline">Simulated Demo Data</Badge>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color:var(--surface-sunken)]">
            <div
              className="h-full rounded-full bg-[color:var(--primary)] transition-[width] duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          <Counter label="Executed" value={runAnalysis?.detection.executionsTested ?? 0} icon={Target} />
          <Counter
            label="Detected"
            value={(runAnalysis?.detection.executionsDetected ?? 0) + (runAnalysis?.detection.executionsBlocked ?? 0)}
            icon={CheckCircle2}
            tone="good"
          />
          <Counter label="Missed" value={runAnalysis?.detection.executionsMissed ?? 0} icon={XCircle} tone="critical" />
          <Counter label="Detection Rate" value={runAnalysis ? `${runAnalysis.detection.detectionRate}%` : "0%"} icon={ShieldAlert} />
          <div className="col-span-2 flex items-center justify-center gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-sunken)] p-2.5 sm:col-span-1">
            <ScoreRing score={runAnalysis?.score.overall ?? 0} band={runAnalysis?.score.band ?? "critical"} size={52} strokeWidth={6} />
          </div>
        </div>

        <LiveConsole events={timeline} />

        {missed.length > 0 && (
          <div className="rounded-lg border border-[color:var(--critical)]/30 bg-[color:var(--critical-soft)] p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--critical-ink)]">
              <XCircle className="h-3.5 w-3.5" /> Detection gap demonstrated
            </p>
            {missed.map((r) => (
              <p key={r.id} className="mt-1 text-xs leading-relaxed text-[color:var(--ink-secondary)]">
                <span className="font-mono font-semibold text-[color:var(--critical-ink)]">{r.techniqueId}</span> —{" "}
                {r.techniqueName} executed on {r.hostname} with no telemetry and no alert.
              </p>
            ))}
          </div>
        )}

        {liveStatus === "completed" && (
          <p className="text-center text-xs font-medium text-[color:var(--good-ink)]">
            Validation completed — {results.length} techniques executed, {runAnalysis?.detection.detectionRate}%
            detected.
          </p>
        )}
      </div>
    </Dialog>
  );
}

function StatusBadge({ status }: { status: "idle" | "running" | "paused" | "completed" }) {
  if (status === "running") return <Badge tone="brand">● Running</Badge>;
  if (status === "paused") return <Badge tone="warning">Paused</Badge>;
  if (status === "completed") return <Badge tone="good">Validation Completed</Badge>;
  return <Badge tone="neutral">Idle</Badge>;
}

function Counter({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  tone?: "good" | "critical";
}) {
  return (
    <div className="rounded-lg border border-[color:var(--border)] p-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-medium uppercase tracking-wide text-[color:var(--ink-muted)]">{label}</p>
        <Icon
          className="h-3 w-3"
          style={{ color: tone === "good" ? "var(--good-ink)" : tone === "critical" ? "var(--critical-ink)" : "var(--ink-muted)" }}
        />
      </div>
      <p
        className="mt-0.5 text-lg font-bold tabular"
        style={{ color: tone === "good" ? "var(--good-ink)" : tone === "critical" ? "var(--critical-ink)" : "var(--ink)" }}
      >
        {value}
      </p>
    </div>
  );
}
