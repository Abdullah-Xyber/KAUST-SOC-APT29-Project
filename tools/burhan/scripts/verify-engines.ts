/**
 * Engine verification harness.
 *
 * Runs the real correlation, metrics and scoring engines against the demo
 * dataset and prints what the platform will actually display. Used to confirm
 * the numbers on screen are produced by the pipeline rather than authored.
 *
 *   npm run verify
 */
import { generateDataset, LIVE_STEP_TOTAL } from "@/lib/demo/generator";
import { analyze } from "@/lib/engine/analytics";
import { formatDuration } from "@/lib/utils";

function report(label: string, liveSteps: number) {
  const dataset = generateDataset({ liveStepCount: liveSteps });
  const a = analyze(dataset);

  console.log(`\n=================== ${label} ===================`);
  console.log(
    `runs=${dataset.runs.length}  attackEvents=${dataset.attackEvents.length}  ` +
      `alerts=${dataset.detectionEvents.length} (FP ${dataset.falsePositiveCount})  ` +
      `incidents=${dataset.incidents.length}  actions=${dataset.responseActions.length}  ` +
      `evidence=${dataset.evidence.length}  results=${a.results.length}`,
  );

  console.log("\n-- Per-run --");
  for (const ra of a.runAnalyses) {
    const c = ra.score.components;
    console.log(
      `${ra.run.id}  ${ra.run.scenario.padEnd(34)} score=${String(ra.score.overall).padStart(3)} ` +
        `[det ${c[0].score} / resp ${c[1].score} / speed ${c[2].score}]  ` +
        `detRate=${ra.detection.detectionRate}%  MTTD=${formatDuration(ra.time.mttdMs)}  ` +
        `MTTR=${formatDuration(ra.time.mttrMs)}  MTTC=${formatDuration(ra.time.mttcMs)}  ` +
        `D/P/M=${ra.detection.executionsDetected}/${ra.detection.executionsPartial}/${ra.detection.executionsMissed}`,
    );
  }

  console.log("\n-- Aggregate (all runs) --");
  console.log(
    `techniques tested=${a.detection.techniquesTested} detected=${a.detection.techniquesDetected} ` +
      `partial=${a.detection.techniquesPartial} missed=${a.detection.techniquesMissed}`,
  );
  console.log(
    `detectionRate=${a.detection.detectionRate}%  responseSuccess=${a.response.responseSuccessRate}%  ` +
      `containment=${a.response.containmentSuccessRate}%  FPrate=${a.detection.falsePositiveRate}%`,
  );
  console.log(
    `MTTD=${formatDuration(a.time.mttdMs)}  MTTA=${formatDuration(a.time.mttaMs)}  ` +
      `MTTR=${formatDuration(a.time.mttrMs)}  MTTC=${formatDuration(a.time.mttcMs)}`,
  );
  console.log(
    `latest=${a.latest?.run.id} score=${a.latest?.score.overall} band=${a.latest?.score.band} delta=${a.scoreDelta}`,
  );
  console.log(`recommendations=${a.recommendations.length}, top:`);
  for (const r of a.recommendations.slice(0, 5)) {
    console.log(`   [${r.severity.toUpperCase()}] ${r.title}`);
  }

  const missedTechniques = a.techniqueStats.filter((t) => t.state === "missed").map((t) => t.techniqueId);
  console.log(`missed techniques: ${missedTechniques.join(", ") || "none"}`);
}

report("BASELINE (live run not started)", 0);
report(`AFTER LIVE RUN (${LIVE_STEP_TOTAL} steps)`, LIVE_STEP_TOTAL);
