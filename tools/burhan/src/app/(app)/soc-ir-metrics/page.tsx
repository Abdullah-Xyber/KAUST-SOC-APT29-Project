"use client";

import * as React from "react";
import { Target, ShieldOff, Timer, UserCheck, ClipboardCheck, ShieldCheck, TimerReset, ArrowUpCircle } from "lucide-react";
import { ChartCard } from "@/components/charts/ChartCard";
import { RunTrendChart, RunTrendTable } from "@/components/charts/RunTrendChart";
import { Select, Badge, Card, InfoHint } from "@/components/ui/primitives";
import { useBurhan } from "@/lib/state/DataProvider";
import { formatDuration } from "@/lib/utils";
import { metricQuality, EVIDENCE_QUALITY_LABEL, EVIDENCE_QUALITY_HINT } from "@/lib/domain/evidenceQuality";

const QUALITY_TONE = { measured: "good", estimated: "warning", simulated: "outline" } as const;

/**
 * SOC & IR Metrics — one page answering "how well is the SOC detecting and
 * responding?" Two clear sections, a handful of numbers each, one trend
 * chart. Deeper per-run detail lives on the Validation Run Details page.
 *
 * Scoping to "All Runs" blends historical and demo evidence, so the
 * measured/estimated/simulated badge only appears once a single run — with
 * one clear evidence basis — is selected (§13).
 */
export default function SocIrMetricsPage() {
  const { dataset, analysis } = useBurhan();
  const [runId, setRunId] = React.useState<string>("all");

  const scopedRun = runId === "all" ? null : analysis.byRun[runId];
  const d = scopedRun ? scopedRun.detection : analysis.detection;
  const t = scopedRun ? scopedRun.time : analysis.time;
  const r = scopedRun ? scopedRun.response : analysis.response;

  const quality = (metric: Parameters<typeof metricQuality>[1]) =>
    scopedRun ? metricQuality(scopedRun.run, metric) : null;

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[color:var(--ink)]">SOC &amp; IR Metrics</h2>
          <p className="text-xs text-[color:var(--ink-muted)]">
            How well the SOC is detecting attacks, and how well incident response is handling what gets detected.
          </p>
        </div>
        <Select value={runId} onChange={(e) => setRunId(e.target.value)} className="w-64">
          <option value="all">All Runs (combined)</option>
          {dataset.runs
            .slice()
            .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
            .map((run) => (
              <option key={run.id} value={run.id}>
                {run.scenario} {run.evidenceBasis === "historical" ? "(Historical)" : "(Demo)"}
              </option>
            ))}
        </Select>
      </div>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-muted)]">
          SOC Metrics
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <MetricCard label="Detection Rate" value={`${d.detectionRate}%`} icon={Target} hint="Executed attack actions that produced an alert." quality={quality("detectionRate")} />
          <MetricCard label="Missed Detection Rate" value={`${d.missedDetectionRate}%`} icon={ShieldOff} higherIsBetter={false} hint="Executed attack actions with no matching alert." quality={quality("detectionRate")} />
          <MetricCard label="Mean Time to Detect" value={formatDuration(t.mttdMs)} icon={Timer} hint="Attack execution to first matching alert — from SIEM and CALDERA timestamps." quality={quality("mttd")} />
          <MetricCard label="Mean Time to Acknowledge" value={formatDuration(t.mttaMs)} icon={UserCheck} hint="Incident creation to analyst acknowledgement — an IR-side timing, not automated instrumentation." quality={quality("mttr")} />
          <MetricCard label="Average Triage Time" value={formatDuration(t.mttTriageMs)} icon={ClipboardCheck} hint="Acknowledgement to completed triage — an IR-side timing, not automated instrumentation." quality={quality("mttr")} />
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-muted)]">
          Incident Response Metrics
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <MetricCard label="Response Success Rate" value={`${r.responseSuccessRate}%`} icon={ShieldCheck} hint="Alerted attacks where the SOC took a response action." quality={quality("mttr")} />
          <MetricCard label="Mean Time to Respond" value={formatDuration(t.mttrMs)} icon={TimerReset} hint="Incident creation to the first response action." quality={quality("mttr")} />
          <MetricCard label="Mean Time to Contain" value={formatDuration(t.mttcMs)} icon={ShieldCheck} hint="Incident creation to confirmed containment." quality={quality("mttc")} />
          <MetricCard label="Escalation Time" value={formatDuration(t.mttEscalateMs)} icon={ArrowUpCircle} hint="Triage completion to escalation." quality={quality("mttr")} />
          <MetricCard label="Containment Success Rate" value={`${r.containmentSuccessRate}%`} icon={ShieldCheck} hint="Alerted attacks where containment was confirmed." quality={quality("mttc")} />
        </div>
      </section>

      <ChartCard
        title="Detection & Response Trend"
        description="Burhan Score, detection rate and response rate across validation runs"
        table={<RunTrendTable data={analysis.trend} />}
      >
        <RunTrendChart data={analysis.trend} />
      </ChartCard>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  quality,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  higherIsBetter?: boolean;
  quality: ReturnType<typeof metricQuality> | null;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center text-xs font-medium text-[color:var(--ink-muted)]">
          {label}
          {hint && <InfoHint>{hint}</InfoHint>}
        </p>
        <Icon className="h-3.5 w-3.5 text-[color:var(--ink-muted)]" />
      </div>
      <p className="mt-2 text-2xl font-bold tabular text-[color:var(--ink)]">{value}</p>
      {quality && (
        <Badge tone={QUALITY_TONE[quality]} className="mt-2" title={EVIDENCE_QUALITY_HINT[quality]}>
          {EVIDENCE_QUALITY_LABEL[quality]}
        </Badge>
      )}
    </Card>
  );
}
