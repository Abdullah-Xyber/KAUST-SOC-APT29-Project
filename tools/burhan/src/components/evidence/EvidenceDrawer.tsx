"use client";

import * as React from "react";
import Link from "next/link";
import {
  Crosshair,
  Radio,
  ShieldAlert,
  Siren,
  Code2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Drawer } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/primitives";
import type { Evidence, ValidationResult } from "@/lib/domain/types";
import { useBurhan } from "@/lib/state/DataProvider";
import { formatDuration, formatFullTimestamp } from "@/lib/utils";
import { OUTCOME_BADGE } from "@/components/status/badges";

interface EvidenceDrawerContextValue {
  openResult: (result: ValidationResult) => void;
  openEvidence: (evidence: Evidence) => void;
}

const Ctx = React.createContext<EvidenceDrawerContextValue | null>(null);

export function useEvidenceDrawer(): EvidenceDrawerContextValue {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useEvidenceDrawer must be used inside EvidenceDrawerProvider");
  return ctx;
}

export function EvidenceDrawerProvider({ children }: { children: React.ReactNode }) {
  const [result, setResult] = React.useState<ValidationResult | null>(null);
  const [single, setSingle] = React.useState<Evidence | null>(null);

  const value: EvidenceDrawerContextValue = {
    openResult: (r) => {
      setSingle(null);
      setResult(r);
    },
    openEvidence: (e) => {
      setResult(null);
      setSingle(e);
    },
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <ResultEvidenceDrawer result={result} onClose={() => setResult(null)} />
      <SingleEvidenceDrawer evidence={single} onClose={() => setSingle(null)} />
    </Ctx.Provider>
  );
}

/**
 * Renders nothing itself — call `useEvidenceDrawer().openResult(result)` from
 * anywhere in the tree to open it. Exported for pages that only need the
 * click target (a badge, a row, a "View evidence" link).
 */
export function EvidenceTrigger({
  result,
  children,
  className,
}: {
  result: ValidationResult;
  children: React.ReactNode;
  className?: string;
}) {
  const { openResult } = useEvidenceDrawer();
  return (
    <button type="button" onClick={() => openResult(result)} className={className}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------- single evidence -- */

function SingleEvidenceDrawer({ evidence, onClose }: { evidence: Evidence | null; onClose: () => void }) {
  return (
    <Drawer open={!!evidence} onClose={onClose} eyebrow="Evidence Record" title={evidence?.title ?? ""} width="max-w-lg">
      {evidence && <EvidenceCard evidence={evidence} defaultOpen />}
    </Drawer>
  );
}

/* --------------------------------------------------- validation result -- */

const EMULATION_SOURCE_LABEL: Record<string, string> = {
  caldera: "MITRE CALDERA",
  "atomic-red-team": "Atomic Red Team",
  "custom-emulation": "Custom Emulation Tool",
};
const SIEM_SOURCE_LABEL: Record<string, string> = {
  elastic: "Elastic Security",
  splunk: "Splunk Enterprise Security",
  sentinel: "Microsoft Sentinel",
  "custom-siem": "Custom SIEM",
};

function ResultEvidenceDrawer({ result, onClose }: { result: ValidationResult | null; onClose: () => void }) {
  const { dataset } = useBurhan();

  const items = React.useMemo(() => {
    if (!result) return [];
    return result.evidenceIds
      .map((id) => dataset.evidence.find((e) => e.id === id))
      .filter((e): e is Evidence => !!e);
  }, [result, dataset.evidence]);

  const attack = items.filter((e) => e.kind === "attack" || e.kind === "telemetry");
  const defense = items.filter((e) => e.kind === "detection" || e.kind === "incident" || e.kind === "response");

  const attackEvent = React.useMemo(
    () => (result ? dataset.attackEvents.find((a) => a.id === result.attackEventId) : undefined),
    [result, dataset.attackEvents],
  );
  const detectionEvent = React.useMemo(
    () => (result?.detectionEventId ? dataset.detectionEvents.find((d) => d.id === result.detectionEventId) : undefined),
    [result, dataset.detectionEvents],
  );

  return (
    <Drawer
      open={!!result}
      onClose={onClose}
      eyebrow="Validation Evidence"
      title={result ? `${result.techniqueId} — ${result.techniqueName}` : ""}
      width="max-w-3xl"
    >
      {result && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={OUTCOME_BADGE[result.outcome].tone}>{OUTCOME_BADGE[result.outcome].label}</Badge>
            <Badge tone="outline">{result.hostname}</Badge>
            <Link
              href={`/runs/${result.runId}`}
              className="text-xs font-medium text-[color:var(--primary)] hover:underline"
            >
              View run {result.runId} →
            </Link>
          </div>

          <AtAGlance result={result} attackEvent={attackEvent} detectionEvent={detectionEvent} />

          <MetricStrip result={result} />

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-muted)]">
              Attack Executed → Telemetry Received → Detection Triggered → SOC Alert → SOC/IR Action → Result
            </p>
            <ol className="space-y-2 border-l-2 border-[color:var(--border)] pl-4">
              {result.correlationNotes.map((note, i) => (
                <li key={i} className="relative text-xs leading-relaxed text-[color:var(--ink-secondary)]">
                  <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-[color:var(--primary)]" />
                  {note}
                </li>
              ))}
            </ol>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <EvidenceColumn
              icon={<Crosshair className="h-3.5 w-3.5" />}
              title="Attack Evidence"
              tone="text-[color:var(--critical-ink)]"
              items={attack}
            />
            <EvidenceColumn
              icon={<ShieldAlert className="h-3.5 w-3.5" />}
              title="Defensive Evidence"
              tone="text-[color:var(--primary)]"
              items={defense}
            />
          </div>

          {result.gaps.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-muted)]">
                Coverage gaps identified
              </p>
              <div className="space-y-2">
                {result.gaps.map((g, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-[color:var(--critical)]/25 bg-[color:var(--critical-soft)] p-3"
                  >
                    <p className="text-xs font-semibold text-[color:var(--critical-ink)]">{g.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[color:var(--critical-ink)]/85">
                      {g.description}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--ink-secondary)]">
                      <span className="font-semibold">Recommended:</span> {g.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

/**
 * The compact per-technique summary Burhan exists to produce (§7): what ran,
 * where, and whether the SOC's own tooling caught it — with the exact
 * detection rule that fired, or "—" when nothing did.
 */
function AtAGlance({
  result,
  attackEvent,
  detectionEvent,
}: {
  result: ValidationResult;
  attackEvent?: { source: string; process: string; command: string };
  detectionEvent?: { source: string; ruleName: string };
}) {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Technique", value: `${result.techniqueId} — ${result.techniqueName}` },
    { label: "Host", value: result.hostname },
    {
      label: "Attack Source",
      value: attackEvent ? (EMULATION_SOURCE_LABEL[attackEvent.source] ?? attackEvent.source) : "—",
    },
    { label: "Attack", value: attackEvent ? attackEvent.process : "—" },
    {
      label: "Result",
      value: <Badge tone={OUTCOME_BADGE[result.outcome].tone}>{OUTCOME_BADGE[result.outcome].label}</Badge>,
    },
    {
      label: "Detection Source",
      value: detectionEvent ? (SIEM_SOURCE_LABEL[detectionEvent.source] ?? detectionEvent.source) : "—",
    },
    { label: "Detection Rule", value: detectionEvent ? detectionEvent.ruleName : "—" },
  ];

  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-sunken)] p-4 sm:grid-cols-2">
      {rows.map((r) => (
        <div key={r.label} className="flex gap-2 text-xs">
          <dt className="w-32 shrink-0 text-[color:var(--ink-muted)]">{r.label}</dt>
          <dd className="min-w-0 flex-1 font-medium text-[color:var(--ink)]">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function MetricStrip({ result }: { result: ValidationResult }) {
  const cells: { label: string; value: string }[] = [
    { label: "Detection latency", value: formatDuration(result.detectionLatencyMs) },
    { label: "Acknowledge", value: formatDuration(result.acknowledgeLatencyMs) },
    { label: "Triage", value: formatDuration(result.triageLatencyMs) },
    { label: "Containment", value: formatDuration(result.containmentLatencyMs) },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {cells.map((c) => (
        <div key={c.label} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-sunken)] px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-[color:var(--ink-muted)]">{c.label}</p>
          <p className="mt-0.5 text-sm font-semibold tabular text-[color:var(--ink)]">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function EvidenceColumn({
  icon,
  title,
  tone,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  tone: string;
  items: Evidence[];
}) {
  return (
    <div>
      <p className={`mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${tone}`}>
        {icon}
        {title}
      </p>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[color:var(--border-strong)] px-3 py-4 text-center text-[11px] text-[color:var(--ink-muted)]">
          No evidence recorded.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((e) => (
            <EvidenceCard key={e.id} evidence={e} />
          ))}
        </div>
      )}
    </div>
  );
}

const KIND_ICON: Record<Evidence["kind"], React.ReactNode> = {
  attack: <Crosshair className="h-3.5 w-3.5" />,
  telemetry: <Radio className="h-3.5 w-3.5" />,
  detection: <Siren className="h-3.5 w-3.5" />,
  incident: <ShieldAlert className="h-3.5 w-3.5" />,
  response: <ShieldAlert className="h-3.5 w-3.5" />,
};

function EvidenceCard({ evidence, defaultOpen = false }: { evidence: Evidence; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [showRaw, setShowRaw] = React.useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-[color:var(--surface-sunken)]"
      >
        <span className="text-[color:var(--ink-muted)]">{KIND_ICON[evidence.kind]}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-[color:var(--ink)]">{evidence.title}</span>
          <span className="block text-[10px] text-[color:var(--ink-muted)]">
            {evidence.source} · {formatFullTimestamp(evidence.timestamp)}
          </span>
        </span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[color:var(--ink-muted)]" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[color:var(--ink-muted)]" />
        )}
      </button>
      {open && (
        <div className="border-t border-[color:var(--border)] px-3 py-3">
          <p className="text-xs leading-relaxed text-[color:var(--ink-secondary)]">{evidence.summary}</p>
          <dl className="mt-2.5 space-y-1.5">
            {evidence.fields.map((f) => (
              <div key={f.label} className="flex gap-2 text-[11px]">
                <dt className="w-28 shrink-0 text-[color:var(--ink-muted)]">{f.label}</dt>
                <dd className={`min-w-0 flex-1 break-words text-[color:var(--ink)] ${f.mono ? "font-mono" : ""}`}>
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
          <button
            onClick={() => setShowRaw((v) => !v)}
            className="mt-3 flex items-center gap-1 text-[10px] font-medium text-[color:var(--primary)] hover:underline"
          >
            <Code2 className="h-3 w-3" />
            {showRaw ? "Hide raw payload" : "View raw payload"}
          </button>
          {showRaw && (
            <pre className="mt-2 max-h-56 overflow-auto rounded-md bg-[color:var(--surface-inverse)] p-2.5 font-mono text-[10px] leading-relaxed text-cyan-100">
              {JSON.stringify(evidence.raw, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
