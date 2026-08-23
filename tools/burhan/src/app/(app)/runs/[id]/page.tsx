"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Target, Timer, TimerReset, ShieldCheck, ListChecks, Info } from "lucide-react";
import { Card, CardHeader, CardBody, Badge, Button, EmptyState, InfoHint } from "@/components/ui/primitives";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ScoreBreakdown } from "@/components/dashboard/ScoreBreakdown";
import { RunTimeline } from "@/components/runs/RunTimeline";
import { ResultsTable } from "@/components/runs/ResultsTable";
import { EvidenceFeed } from "@/components/runs/EvidenceFeed";
import { RecommendationList } from "@/components/recommendations/RecommendationList";
import { RUN_STATUS_BADGE } from "@/components/status/badges";
import { useBurhan } from "@/lib/state/DataProvider";
import { buildRunTimeline } from "@/lib/engine/timeline";
import { buildRunSummary } from "@/lib/reports/generate";
import { downloadFile, formatDateTime, formatDuration } from "@/lib/utils";
import { EVIDENCE_QUALITY_HINT, EVIDENCE_QUALITY_LABEL, type EvidenceQuality } from "@/lib/domain/evidenceQuality";

const TOOL_LABEL: Record<string, string> = {
  caldera: "MITRE CALDERA",
  "atomic-red-team": "Atomic Red Team",
  "custom-emulation": "Custom Emulation Tool",
};
const SIEM_LABEL: Record<string, string> = {
  elastic: "Elastic Security",
  splunk: "Splunk Enterprise Security",
  sentinel: "Microsoft Sentinel",
  "custom-siem": "Custom SIEM",
};

export default function RunDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { dataset, analysis } = useBurhan();

  const run = dataset.runs.find((r) => r.id === params.id);
  const runAnalysis = analysis.byRun[params.id];

  const timeline = React.useMemo(
    () => (run ? buildRunTimeline(dataset, run.id) : []),
    [dataset, run],
  );

  const evidence = React.useMemo(() => dataset.evidence.filter((e) => e.runId === params.id), [dataset.evidence, params.id]);
  const attackEvidence = evidence.filter((e) => e.kind === "attack" || e.kind === "telemetry");
  const defenseEvidence = evidence.filter((e) => e.kind === "detection" || e.kind === "incident" || e.kind === "response");

  if (!run) {
    return (
      <EmptyState
        title="Run not found"
        description={`No validation run with ID "${params.id}" exists in the current dataset.`}
        action={
          <Button variant="primary" onClick={() => router.push("/runs")}>
            Back to Validation Runs
          </Button>
        }
      />
    );
  }

  const badge = RUN_STATUS_BADGE[run.status];
  const isHistorical = run.evidenceBasis === "historical";

  // A small, focused finding: only recommendations tied to a missed or
  // partially-detected technique in this run (§10 — no standalone engine page).
  const missedTechniqueIds = new Set(
    runAnalysis?.results.filter((r) => r.outcome === "missed" || r.outcome === "partially-detected").map((r) => r.techniqueId) ?? [],
  );
  const findings = (runAnalysis?.recommendations ?? []).filter(
    (r) => r.techniqueIds.length === 0 || r.techniqueIds.some((t) => missedTechniqueIds.has(t)),
  );

  return (
    <div className="space-y-5 fade-up">
      <button
        onClick={() => router.push("/runs")}
        className="flex items-center gap-1.5 text-xs font-medium text-[color:var(--ink-muted)] hover:text-[color:var(--ink)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Validation Runs
      </button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-[color:var(--ink)]">{run.scenario}</h2>
            <Badge tone={badge.tone}>{badge.label}</Badge>
            <Badge tone={isHistorical ? "brand" : "outline"}>
              {isHistorical ? "Historical Project Data" : "Demo / Simulated Data"}
            </Badge>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[color:var(--ink-muted)]">
            Burhan correlates offensive and defensive evidence into one validation timeline.
          </p>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[color:var(--ink-muted)]">{run.description}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[color:var(--ink-secondary)]">
            <span>
              <span className="text-[color:var(--ink-muted)]">Run ID </span>
              <span className="font-mono">{run.id}</span>
            </span>
            <span>
              <span className="text-[color:var(--ink-muted)]">Threat profile </span>
              {run.threatProfile}
            </span>
            <span>
              <span className="text-[color:var(--ink-muted)]">Emulation </span>
              {TOOL_LABEL[run.emulationTool]}
            </span>
            <span>
              <span className="text-[color:var(--ink-muted)]">SIEM </span>
              {SIEM_LABEL[run.siem]}
            </span>
            <span>
              <span className="text-[color:var(--ink-muted)]">Started </span>
              {formatDateTime(run.startedAt)}
            </span>
            <span>
              <span className="text-[color:var(--ink-muted)]">Operator </span>
              {run.operator}
            </span>
          </div>
        </div>
        {runAnalysis && (
          <Button
            variant="secondary"
            onClick={() =>
              downloadFile(
                `${run.id}-summary.md`,
                buildRunSummary(runAnalysis, dataset),
                "text/markdown",
              )
            }
          >
            <Download className="h-3.5 w-3.5" /> Export Summary
          </Button>
        )}
      </div>

      {!runAnalysis ? (
        <Card>
          <CardBody>
            <p className="text-sm text-[color:var(--ink-secondary)]">
              {run.status === "failed"
                ? "This exercise failed to execute — no attack actions ran, so there is nothing to correlate or score."
                : "This run has not produced any correlated results yet."}
            </p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <KpiCard
              label="Validation Score"
              value={`${runAnalysis.score.overall}`}
              icon={Target}
              hint={isHistorical ? "Burhan-derived score based on imported validation evidence." : undefined}
            />
            <KpiCard
              label="Detection Rate"
              value={`${runAnalysis.detection.detectionRate}%`}
              icon={ShieldCheck}
              hint={isHistorical ? EVIDENCE_QUALITY_HINT.measured : EVIDENCE_QUALITY_HINT.simulated}
            />
            <KpiCard
              label="Response Rate"
              value={`${runAnalysis.response.responseSuccessRate}%`}
              icon={ShieldCheck}
              hint={isHistorical ? EVIDENCE_QUALITY_HINT.measured : EVIDENCE_QUALITY_HINT.simulated}
            />
            <KpiCard
              label="MTTD"
              value={formatDuration(runAnalysis.time.mttdMs)}
              icon={Timer}
              hint={isHistorical ? EVIDENCE_QUALITY_HINT.measured : EVIDENCE_QUALITY_HINT.simulated}
            />
            <KpiCard
              label="MTTR"
              value={formatDuration(runAnalysis.time.mttrMs)}
              icon={TimerReset}
              hint={isHistorical ? EVIDENCE_QUALITY_HINT.estimated : EVIDENCE_QUALITY_HINT.simulated}
            />
            <KpiCard label="Techniques" value={`${runAnalysis.detection.executionsTested}`} icon={ListChecks} />
          </div>

          {run.baselineFacts && (
            <Card className="border-[color:var(--primary)]/25 bg-[color:var(--primary-soft)] p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--primary)]">
                <Info className="h-3.5 w-3.5" /> Reported directly from the original KAUST project
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <BaselineFact label="Alerts Generated" value={`${run.baselineFacts.alertsGenerated}`} quality="measured" />
                <BaselineFact label="Estimated MTTC" value={`~${run.baselineFacts.estimatedMttcMinutes} min`} quality="estimated" />
                <BaselineFact label="Estimated MTTR / Remediation" value={`~${run.baselineFacts.estimatedMttrMinutes} min`} quality="estimated" />
                <BaselineFact label="Preliminary FPR" value={`~${run.baselineFacts.estimatedFprPct}%`} quality="estimated" />
              </div>
            </Card>
          )}

          <Tabs defaultValue="timeline">
            <TabsList>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="evidence">Attack vs. Defense</TabsTrigger>
              <TabsTrigger value="techniques">Techniques</TabsTrigger>
              <TabsTrigger value="score">Score</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardHeader
                  title="Execution timeline"
                  description="Attack executed → telemetry received → detection triggered → SOC alert → analyst acknowledged → incident escalated → containment performed"
                />
                <CardBody>
                  <RunTimeline events={timeline} />
                </CardBody>
              </Card>
            </TabsContent>

            <TabsContent value="evidence" className="mt-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Attack Evidence" description="What the emulation tool and endpoint telemetry recorded" />
                  <CardBody>
                    <EvidenceFeed items={attackEvidence} tone="attack" />
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader title="Defensive Evidence" description="What the SIEM and response tooling recorded" />
                  <CardBody>
                    <EvidenceFeed items={defenseEvidence} tone="defense" />
                  </CardBody>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="techniques" className="mt-4 space-y-4">
              <Card>
                <CardHeader
                  title="Techniques executed"
                  description="Detected or missed, with detection and response latency. Click a row for the full evidence chain."
                />
                <CardBody className="p-0">
                  <ResultsTable results={runAnalysis.results} />
                </CardBody>
              </Card>

              {findings.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-muted)]">
                    Findings
                  </h3>
                  <RecommendationList recommendations={findings} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="score" className="mt-4">
              <Card>
                <CardHeader title="Burhan Score for this run" description="50% detection · 30% response · 20% speed" />
                <CardBody>
                  <ScoreBreakdown breakdown={runAnalysis.score} />
                </CardBody>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function BaselineFact({ label, value, quality }: { label: string; value: string; quality: EvidenceQuality }) {
  return (
    <div className="rounded-lg border border-[color:var(--primary)]/20 bg-[color:var(--surface)] px-3 py-2">
      <p className="flex items-center text-[10px] uppercase tracking-wide text-[color:var(--ink-muted)]">
        {label}
        <InfoHint>{EVIDENCE_QUALITY_HINT[quality]}</InfoHint>
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular text-[color:var(--ink)]">{value}</p>
      <p className="mt-0.5 text-[10px] font-medium text-[color:var(--primary)]">{EVIDENCE_QUALITY_LABEL[quality]}</p>
    </div>
  );
}
