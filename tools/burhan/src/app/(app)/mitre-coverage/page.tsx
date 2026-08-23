"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardBody, Badge, Select } from "@/components/ui/primitives";
import { MitreMatrix, MatrixLegend } from "@/components/mitre/MitreMatrix";
import { TechniqueDrawer } from "@/components/mitre/TechniqueDrawer";
import { useBurhan } from "@/lib/state/DataProvider";
import { buildMatrix, type MatrixCell } from "@/lib/engine/matrix";
import { computeTechniqueStats } from "@/lib/engine/metrics";
import { MITRE_TECHNIQUES } from "@/lib/domain/mitre";
import { KAUST_RUN_ID } from "@/lib/demo/scenarios";

export default function MitreCoveragePage() {
  return (
    <React.Suspense fallback={null}>
      <MitreCoverageInner />
    </React.Suspense>
  );
}

function MitreCoverageInner() {
  const { dataset, analysis } = useBurhan();
  const params = useSearchParams();
  const [selected, setSelected] = React.useState<MatrixCell | null>(null);
  // Defaults to the real KAUST baseline — every state on this matrix should
  // read "Tested & Detected" until a different (often demo) run is chosen.
  const [runId, setRunId] = React.useState<string>(KAUST_RUN_ID);

  const scopedRun = analysis.byRun[runId];
  const techniqueStats = React.useMemo(
    () => computeTechniqueStats(scopedRun?.results ?? []),
    [scopedRun],
  );
  const matrix = React.useMemo(() => buildMatrix(techniqueStats), [techniqueStats]);

  React.useEffect(() => {
    const q = params.get("technique");
    if (!q) return;
    // A technique deep-link should search every run, not just the default one.
    for (const run of analysis.runAnalyses) {
      const stats = computeTechniqueStats(run.results);
      const found = stats.find((s) => s.techniqueId === q);
      if (found) {
        setRunId(run.run.id);
        const scopedMatrix = buildMatrix(stats);
        for (const cells of Object.values(scopedMatrix)) {
          const cell = cells.find((c) => c.techniqueId === q);
          if (cell) {
            setSelected(cell);
            break;
          }
        }
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const tested = techniqueStats.length;
  const detected = techniqueStats.filter((t) => t.state === "detected").length;
  const partial = techniqueStats.filter((t) => t.state === "partial").length;
  const missed = techniqueStats.filter((t) => t.state === "missed").length;
  const notTested = MITRE_TECHNIQUES.length - tested;
  const fullyValidated = tested > 0 && missed === 0 && partial === 0;
  const isHistorical = scopedRun?.run.evidenceBasis === "historical";

  return (
    <div className="space-y-4 fade-up">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-[color:var(--ink)]">MITRE Coverage</h2>
            {scopedRun && (
              <Badge tone={isHistorical ? "brand" : "outline"}>
                {isHistorical ? "Historical Project Data" : "Demo / Simulated Data"}
              </Badge>
            )}
          </div>
          <p className="text-xs text-[color:var(--ink-muted)]">
            {tested} of {MITRE_TECHNIQUES.length} tracked techniques exercised in this run · {detected} detected
            {partial > 0 ? ` · ${partial} partial` : ""}
            {missed > 0 ? ` · ${missed} missed` : ""} · {notTested} not yet tested
            {fullyValidated ? ` · ${tested} / ${tested} validated` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={runId} onChange={(e) => setRunId(e.target.value)} className="w-64">
            {analysis.runAnalyses
              .slice()
              .sort((a, b) => b.run.startedAt.localeCompare(a.run.startedAt))
              .map((ra) => (
                <option key={ra.run.id} value={ra.run.id}>
                  {ra.run.scenario} {ra.run.evidenceBasis === "historical" ? "(Historical)" : "(Demo)"}
                </option>
              ))}
          </Select>
          <MatrixLegend />
        </div>
      </div>

      <Card>
        <CardHeader
          title="Coverage matrix"
          description="Tactics run left to right, following the ATT&CK kill chain. Click any technique for full detail."
        />
        <CardBody>
          <MitreMatrix matrix={matrix} onSelect={setSelected} selectedId={selected?.techniqueId} />
        </CardBody>
      </Card>

      <TechniqueDrawer cell={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
