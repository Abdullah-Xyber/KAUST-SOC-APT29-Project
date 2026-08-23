"use client";

import * as React from "react";
import Link from "next/link";
import { Target, Timer, ShieldCheck, ListChecks, CheckCircle2, XCircle, Activity, PlayCircle, Siren } from "lucide-react";
import { Badge, Button, EmptyState, InfoHint } from "@/components/ui/primitives";
import { Card, CardHeader, CardBody } from "@/components/ui/primitives";
import { ChartCard } from "@/components/charts/ChartCard";
import { ScoreRing } from "@/components/charts/ScoreRing";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RunTrendChart, RunTrendTable } from "@/components/charts/RunTrendChart";
import { OutcomeBarChart } from "@/components/charts/OutcomeBarChart";
import { RunsTable } from "@/components/runs/RunsTable";
import { RunDemoModal } from "@/components/demo/RunDemoModal";
import { useBurhan } from "@/lib/state/DataProvider";
import { KAUST_RUN_ID } from "@/lib/demo/scenarios";
import { BAND_LABEL } from "@/lib/engine/scoring";
import { formatDuration, formatDurationPrecise } from "@/lib/utils";
import { useEvidenceDrawer } from "@/components/evidence/EvidenceDrawer";
import { EVIDENCE_QUALITY_HINT } from "@/lib/domain/evidenceQuality";

export default function DashboardPage() {
  const { dataset, analysis } = useBurhan();
  const { openResult } = useEvidenceDrawer();
  const [demoOpen, setDemoOpen] = React.useState(false);

  // The dashboard is pinned to the real KAUST project baseline, not whatever
  // ran most recently — a live demo elsewhere in the app should never bump
  // "this is what the original experiment proved" off the homepage (§5).
  const baseline = analysis.byRun[KAUST_RUN_ID];

  const recentRuns = [...dataset.runs]
    .filter((r) => r.status !== "scheduled")
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, 5);

  const criticalFindings = analysis.results
    .filter((r) => r.outcome === "missed")
    .sort((a, b) => b.executedAt.localeCompare(a.executedAt))
    .slice(0, 4);

  if (!baseline) {
    return (
      <EmptyState
        title="No validation data yet"
        description="Run the demo to see your SOC readiness here."
        icon={<Activity className="h-5 w-5" />}
        action={<Button variant="primary" onClick={() => setDemoOpen(true)}>Run Demo</Button>}
      />
    );
  }

  const incidentsForBaseline = dataset.incidents.filter((i) => i.runId === baseline.run.id);
  const responseStatus = incidentsForBaseline.length && incidentsForBaseline.every((i) => i.status === "resolved")
    ? "Completed"
    : "In Progress";
  const alertsGenerated = baseline.run.baselineFacts?.alertsGenerated ?? dataset.detectionEvents.filter((d) => d.runId === baseline.run.id && d.isTruePositive).length;

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[color:var(--ink)]">Dashboard</h2>
          <p className="text-xs text-[color:var(--ink-muted)]">
            Did we detect it, and did we respond correctly and quickly enough?
          </p>
        </div>
        <Button variant="primary" onClick={() => setDemoOpen(true)}>
          <PlayCircle className="h-3.5 w-3.5" /> Run Demo
        </Button>
      </div>

      {/* ---------------------------------------------------------- hero -- */}
      <Card className="flex flex-col items-center gap-2 p-6 text-center">
        <Badge tone="brand">Baseline: Original APT29 Project</Badge>
        <p className="mt-1 flex items-center text-xs font-semibold uppercase tracking-wider text-[color:var(--ink-muted)]">
          Burhan Validation Score
          <InfoHint>Burhan-derived score based on imported validation evidence — not a metric the original project itself produced.</InfoHint>
        </p>
        <ScoreRing score={baseline.score.overall} band={baseline.score.band} className="mt-2" />
        <Badge tone={baseline.score.band === "critical" || baseline.score.band === "weak" ? "critical" : baseline.score.band === "moderate" ? "warning" : "good"}>
          {BAND_LABEL[baseline.score.band]}
        </Badge>
        <p className="max-w-md text-xs leading-relaxed text-[color:var(--ink-secondary)]">
          This represents the final validated result from the original APT29 living-off-the-land project at KAUST —
          scored by 50% detection · 30% response · 20% speed.
        </p>
        <Link href={`/runs/${baseline.run.id}`} className="mt-1 text-xs font-medium text-[color:var(--primary)] hover:underline">
          View validation details →
        </Link>
      </Card>

      {/* --------------------------------------------------------- KPI grid -- */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Detection Rate"
          value={`${baseline.detection.detectionRate}%`}
          icon={Target}
          hint={EVIDENCE_QUALITY_HINT.measured}
        />
        <KpiCard label="Response Status" value={responseStatus} icon={ShieldCheck} hint="Incident response outcome for this validation run." />
        <KpiCard
          label="Mean Time to Detect"
          value={formatDurationPrecise(baseline.time.mttdMs)}
          icon={Timer}
          hint={EVIDENCE_QUALITY_HINT.measured}
        />
        <KpiCard label="Alerts Generated" value={`${alertsGenerated}`} icon={Siren} hint={EVIDENCE_QUALITY_HINT.measured} />
        <KpiCard label="Techniques Tested" value={`${baseline.detection.techniquesTested}`} icon={ListChecks} />
        <KpiCard label="Techniques Detected" value={`${baseline.detection.techniquesDetected}`} icon={CheckCircle2} />
        <KpiCard label="Techniques Missed" value={`${baseline.detection.techniquesMissed}`} icon={XCircle} higherIsBetter={false} />
      </div>

      {/* ------------------------------------------------------------ charts -- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Validation Score Trend"
          description="Burhan Score, detection rate and response rate across validation runs"
          table={<RunTrendTable data={analysis.trend} />}
        >
          <RunTrendChart data={analysis.trend} />
        </ChartCard>
        <ChartCard title="Detection vs. Missed Techniques" description="Technique execution outcomes per validation run">
          <OutcomeBarChart data={analysis.trend} />
        </ChartCard>
      </div>

      {/* --------------------------------------------------- runs + findings -- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader
            title="Recent Validation Runs"
            description="Every adversary emulation exercise becomes a measurable validation result."
            action={
              <Link href="/runs" className="text-xs font-medium text-[color:var(--primary)] hover:underline">
                View all
              </Link>
            }
          />
          <RunsTable runs={recentRuns} analysisByRun={analysis.byRun} />
        </Card>

        <Card>
          <CardHeader title="Critical Findings" description="Attacks executed with no corresponding detection" />
          <CardBody className="space-y-2.5">
            {criticalFindings.length === 0 ? (
              <p className="text-xs text-[color:var(--ink-muted)]">No missed detections in the current dataset.</p>
            ) : (
              criticalFindings.map((f) => (
                <button
                  key={f.id}
                  onClick={() => openResult(f)}
                  className="flex w-full items-start gap-2.5 rounded-lg border border-[color:var(--critical)]/20 bg-[color:var(--critical-soft)] p-3 text-left transition hover:brightness-[0.98]"
                >
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--critical-ink)]" />
                  <span>
                    <span className="block text-xs font-semibold text-[color:var(--critical-ink)]">
                      {f.techniqueId} — {f.techniqueName}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-[color:var(--ink-secondary)]">
                      Executed on {f.hostname} but generated no SIEM alert.
                    </span>
                  </span>
                </button>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <RunDemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
