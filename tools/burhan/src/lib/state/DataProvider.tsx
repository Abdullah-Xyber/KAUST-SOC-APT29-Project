"use client";

import * as React from "react";
import type {
  AttackEvent,
  BurhanDataset,
  CorrelationConfig,
  DetectionEvent,
  Incident,
  IncidentStatus,
  ResponseAction,
  ResponsePhase,
  ScoreWeights,
  ValidationRun,
} from "@/lib/domain/types";
import { DEFAULT_CORRELATION_CONFIG, DEFAULT_SCORE_WEIGHTS } from "@/lib/domain/types";
import { generateDataset, LIVE_STEP_TOTAL } from "@/lib/demo/generator";
import { LIVE_RUN_ID } from "@/lib/demo/scenarios";
import { analyze, type Analysis } from "@/lib/engine/analytics";
import { buildEvidenceForImport } from "@/lib/state/importEvidence";

/**
 * The single source of truth for the running application.
 *
 * Holds the generated demo dataset, any manually-imported records, live
 * validation playback state, and user-configurable scoring/correlation
 * settings — then feeds all of it through the real analytics pipeline
 * (`analyze`) on every change. No page computes its own numbers.
 */

export type LiveStatus = "idle" | "running" | "paused" | "completed";

export const MANUAL_IMPORT_RUN_ID = "BRH-MANUAL-IMPORT";

interface ImportedData {
  attackEvents: AttackEvent[];
  telemetryEvents: never[];
  detectionEvents: DetectionEvent[];
  incidents: Incident[];
  responseActions: ResponseAction[];
}

const EMPTY_IMPORT: ImportedData = {
  attackEvents: [],
  telemetryEvents: [],
  detectionEvents: [],
  incidents: [],
  responseActions: [],
};

interface BurhanContextValue {
  dataset: BurhanDataset;
  analysis: Analysis;

  liveStepCount: number;
  liveTotal: number;
  liveStatus: LiveStatus;
  liveSpeed: number;
  setLiveSpeed: (s: number) => void;
  startLive: () => void;
  pauseLive: () => void;
  resumeLive: () => void;
  resetLive: () => void;

  weights: ScoreWeights;
  setWeights: (w: ScoreWeights) => void;
  correlationConfig: CorrelationConfig;
  setCorrelationConfig: (c: CorrelationConfig) => void;

  importAttackEvent: (e: Omit<AttackEvent, "id" | "runId" | "raw"> & { raw?: Record<string, unknown> }) => void;
  importDetectionEvent: (e: Omit<DetectionEvent, "id" | "runId" | "raw"> & { raw?: Record<string, unknown> }) => void;
  /** One IR action per call — the incident it belongs to is created or extended by label. */
  importIrAction: (row: {
    incidentLabel: string;
    action: string;
    host: string;
    phase: ResponsePhase;
    timestamp: string;
    status: "success" | "failed" | "pending";
  }) => void;
  importedCounts: { attacks: number; detections: number; incidents: number; irActions: number };

  resetDemo: () => void;
}

const BurhanContext = React.createContext<BurhanContextValue | null>(null);

let importSeq = 0;
const nextImportId = (prefix: string) => `${prefix}-IMP-${String((importSeq += 1)).padStart(4, "0")}`;

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [liveStepCount, setLiveStepCount] = React.useState(0);
  const [liveStatus, setLiveStatus] = React.useState<LiveStatus>("idle");
  const [liveSpeed, setLiveSpeed] = React.useState(1);

  const [weights, setWeights] = React.useState<ScoreWeights>(DEFAULT_SCORE_WEIGHTS);
  const [correlationConfig, setCorrelationConfig] = React.useState<CorrelationConfig>(
    DEFAULT_CORRELATION_CONFIG,
  );

  const [imported, setImported] = React.useState<ImportedData>(EMPTY_IMPORT);

  /* --------------------------------------------------- live playback timer -- */
  React.useEffect(() => {
    if (liveStatus !== "running") return;
    const interval = window.setInterval(
      () => {
        setLiveStepCount((c) => {
          const next = c + 1;
          if (next >= LIVE_STEP_TOTAL) {
            setLiveStatus("completed");
            return LIVE_STEP_TOTAL;
          }
          return next;
        });
      },
      Math.max(300, 1600 / liveSpeed),
    );
    return () => window.clearInterval(interval);
  }, [liveStatus, liveSpeed]);

  const startLive = React.useCallback(() => {
    setLiveStepCount(0);
    setLiveStatus("running");
  }, []);
  const pauseLive = React.useCallback(() => setLiveStatus((s) => (s === "running" ? "paused" : s)), []);
  const resumeLive = React.useCallback(
    () => setLiveStatus((s) => (s === "paused" ? "running" : s)),
    [],
  );
  const resetLive = React.useCallback(() => {
    setLiveStepCount(0);
    setLiveStatus("idle");
  }, []);

  /* ------------------------------------------------------------- dataset -- */
  const baseDataset = React.useMemo(
    () => generateDataset({ liveStepCount }),
    [liveStepCount],
  );

  const importRun: ValidationRun | null = imported.attackEvents.length
    ? {
        id: MANUAL_IMPORT_RUN_ID,
        scenario: "Manually Imported Evidence",
        scenarioId: "sc-manual-import",
        threatProfile: "Unclassified",
        emulationTool: "custom-emulation",
        siem: "custom-siem",
        status: "completed",
        startedAt: imported.attackEvents[0]?.executedAt ?? new Date(0).toISOString(),
        completedAt: undefined,
        operator: "Manual Import",
        description:
          "Attack, detection and response records added through Data Import rather than a connected tool.",
        targets: Array.from(new Set(imported.attackEvents.map((a) => a.hostname))),
        techniqueIds: Array.from(new Set(imported.attackEvents.map((a) => a.techniqueId))),
        evidenceBasis: "demo",
      }
    : null;

  const dataset: BurhanDataset = React.useMemo(() => {
    if (!importRun) return baseDataset;
    const merged: BurhanDataset = {
      ...baseDataset,
      runs: [...baseDataset.runs, importRun],
      attackEvents: [...baseDataset.attackEvents, ...imported.attackEvents],
      telemetryEvents: baseDataset.telemetryEvents,
      detectionEvents: [...baseDataset.detectionEvents, ...imported.detectionEvents],
      incidents: [...baseDataset.incidents, ...imported.incidents],
      responseActions: [...baseDataset.responseActions, ...imported.responseActions],
    };
    return { ...merged, evidence: [...merged.evidence, ...buildEvidenceForImport(imported)] };
  }, [baseDataset, imported, importRun]);

  const analysis = React.useMemo(
    () => analyze(dataset, { correlationConfig, weights }),
    [dataset, correlationConfig, weights],
  );

  /* ------------------------------------------------------------- imports -- */
  const importAttackEvent: BurhanContextValue["importAttackEvent"] = React.useCallback((e) => {
    const id = nextImportId("AE");
    setImported((prev) => ({
      ...prev,
      attackEvents: [
        ...prev.attackEvents,
        { ...e, id, runId: MANUAL_IMPORT_RUN_ID, raw: e.raw ?? { source: "manual-import" } },
      ],
    }));
  }, []);

  const importDetectionEvent: BurhanContextValue["importDetectionEvent"] = React.useCallback((e) => {
    const id = nextImportId("DE");
    setImported((prev) => ({
      ...prev,
      detectionEvents: [
        ...prev.detectionEvents,
        { ...e, id, runId: MANUAL_IMPORT_RUN_ID, raw: e.raw ?? { source: "manual-import" } },
      ],
    }));
  }, []);

  const importIrAction: BurhanContextValue["importIrAction"] = React.useCallback((row) => {
    setImported((prev) => {
      const incidentId = row.incidentLabel.trim().toUpperCase() || nextImportId("INC");
      const existing = prev.incidents.find((i) => i.id === incidentId);

      const newAction: ResponseAction = {
        id: nextImportId("RA"),
        runId: MANUAL_IMPORT_RUN_ID,
        incidentId,
        type: "notify-stakeholders",
        mode: "manual",
        system: "analyst",
        actor: "Manual Import",
        description: row.action,
        startedAt: row.timestamp,
        completedAt: row.status === "pending" ? undefined : row.timestamp,
        status: row.status,
        isContainment: row.phase === "containment" && row.status === "success",
        phase: row.phase,
        raw: { source: "manual-import" },
      };

      const base: Incident = existing ?? {
        id: incidentId,
        runId: MANUAL_IMPORT_RUN_ID,
        alertIds: [],
        title: row.incidentLabel,
        severity: "medium",
        status: "open",
        hostname: row.host,
        assignee: "Manual Import",
        team: "Manual Import",
        createdAt: row.timestamp,
        raw: { source: "manual-import" },
      };

      const responseActions = [...prev.responseActions, newAction];
      const forIncident = responseActions
        .filter((a) => a.incidentId === incidentId)
        .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
      const firstSuccessOfPhase = (phase: ResponsePhase) =>
        forIncident.find((a) => a.phase === phase && a.status === "success")?.startedAt;
      const lastSuccessOfPhase = (phase: ResponsePhase) =>
        [...forIncident].reverse().find((a) => a.phase === phase && a.status === "success")?.startedAt;

      const status: IncidentStatus = lastSuccessOfPhase("recovery")
        ? "resolved"
        : firstSuccessOfPhase("containment")
          ? "contained"
          : forIncident.some((a) => a.phase === "detection-triage")
            ? "triaged"
            : "open";

      const updatedIncident: Incident = {
        ...base,
        hostname: base.hostname || row.host,
        createdAt: forIncident[0]?.startedAt ?? base.createdAt,
        acknowledgedAt: firstSuccessOfPhase("detection-triage") ?? base.acknowledgedAt,
        containedAt: firstSuccessOfPhase("containment") ?? base.containedAt,
        resolvedAt: lastSuccessOfPhase("recovery") ?? base.resolvedAt,
        status,
      };

      return {
        ...prev,
        incidents: existing
          ? prev.incidents.map((i) => (i.id === incidentId ? updatedIncident : i))
          : [...prev.incidents, updatedIncident],
        responseActions,
      };
    });
  }, []);

  const resetDemo = React.useCallback(() => {
    setLiveStepCount(0);
    setLiveStatus("idle");
    setImported(EMPTY_IMPORT);
    setWeights(DEFAULT_SCORE_WEIGHTS);
    setCorrelationConfig(DEFAULT_CORRELATION_CONFIG);
  }, []);

  const value: BurhanContextValue = {
    dataset,
    analysis,
    liveStepCount,
    liveTotal: LIVE_STEP_TOTAL,
    liveStatus,
    liveSpeed,
    setLiveSpeed,
    startLive,
    pauseLive,
    resumeLive,
    resetLive,
    weights,
    setWeights,
    correlationConfig,
    setCorrelationConfig,
    importAttackEvent,
    importDetectionEvent,
    importIrAction,
    importedCounts: {
      attacks: imported.attackEvents.length,
      detections: imported.detectionEvents.length,
      incidents: imported.incidents.length,
      irActions: imported.responseActions.length,
    },
    resetDemo,
  };

  return <BurhanContext.Provider value={value}>{children}</BurhanContext.Provider>;
}

export function useBurhan(): BurhanContextValue {
  const ctx = React.useContext(BurhanContext);
  if (!ctx) throw new Error("useBurhan must be used inside DataProvider");
  return ctx;
}

/** Convenience for pages that only need the computed analysis. */
export function useAnalysis(): Analysis {
  return useBurhan().analysis;
}

export { LIVE_RUN_ID };
