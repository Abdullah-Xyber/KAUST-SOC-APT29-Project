"use client";

import * as React from "react";
import { RotateCcw, Save } from "lucide-react";
import { Card, CardHeader, CardBody, Field, Input, Button, Switch, Label } from "@/components/ui/primitives";
import { useBurhan } from "@/lib/state/DataProvider";
import { normalizeWeights } from "@/lib/engine/scoring";
import type { ScoreWeights } from "@/lib/domain/types";
import { DEFAULT_SCORE_WEIGHTS } from "@/lib/domain/types";

const WEIGHT_LABELS: { key: keyof ScoreWeights; label: string; description: string }[] = [
  { key: "detectionEffectiveness", label: "Detection Effectiveness", description: "Were attacks detected or prevented?" },
  { key: "responseEffectiveness", label: "Response Effectiveness", description: "Were detected attacks worked and contained?" },
  { key: "detectionSpeed", label: "Detection Speed", description: "How quickly, relative to your MTTD target?" },
];

export default function SettingsPage() {
  const { dataset, weights, setWeights, correlationConfig, setCorrelationConfig, resetDemo } = useBurhan();
  const [draft, setDraft] = React.useState<ScoreWeights>(weights);
  const [savedMsg, setSavedMsg] = React.useState(false);

  const total = Object.values(draft).reduce((a, b) => a + b, 0);

  function save() {
    setWeights(normalizeWeights(draft));
    setSavedMsg(true);
    window.setTimeout(() => setSavedMsg(false), 2500);
  }

  return (
    <div className="max-w-3xl space-y-6 fade-up">
      <div>
        <h2 className="text-lg font-semibold text-[color:var(--ink)]">Settings</h2>
        <p className="text-xs text-[color:var(--ink-muted)]">
          Scoring weights, correlation rules and the demo environment for Burhan Demo Enterprise.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Burhan Score weights"
          description="Must sum to 100%. Every score on every page recalculates immediately when you save."
        />
        <CardBody className="space-y-4">
          {WEIGHT_LABELS.map((w) => (
            <div key={w.key}>
              <div className="flex items-center justify-between">
                <Label>{w.label}</Label>
                <span className="text-xs font-semibold tabular text-[color:var(--ink)]">
                  {Math.round(draft[w.key] * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(draft[w.key] * 100)}
                onChange={(e) => setDraft((d) => ({ ...d, [w.key]: Number(e.target.value) / 100 }))}
                className="mt-1.5 w-full accent-[color:var(--primary)]"
              />
              <p className="mt-1 text-[11px] text-[color:var(--ink-muted)]">{w.description}</p>
            </div>
          ))}
          <p className={`text-xs font-medium ${Math.round(total * 100) === 100 ? "text-[color:var(--good-ink)]" : "text-[color:var(--warning-ink)]"}`}>
            Total: {Math.round(total * 100)}% {Math.round(total * 100) !== 100 && "— will be normalized to 100% on save"}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="primary" onClick={save}>
              <Save className="h-3.5 w-3.5" /> Save weights
            </Button>
            <Button variant="ghost" onClick={() => setDraft(DEFAULT_SCORE_WEIGHTS)}>
              Reset to default (50/30/20)
            </Button>
            {savedMsg && <span className="text-xs font-medium text-[color:var(--good-ink)]">Saved.</span>}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Correlation engine"
          description="Controls how an attack action is matched against SIEM alerts."
        />
        <CardBody className="space-y-4">
          <Field label="Correlation window (seconds)" hint="How long after an attack executes a detection may still count as matching it.">
            <Input
              type="number"
              min={30}
              value={correlationConfig.windowSeconds}
              onChange={(e) => setCorrelationConfig({ ...correlationConfig, windowSeconds: Number(e.target.value) })}
            />
          </Field>
          <Field label="Late-detection threshold (seconds)" hint="Detections slower than this still count, but are flagged as a speed gap.">
            <Input
              type="number"
              min={10}
              value={correlationConfig.lateDetectionSeconds}
              onChange={(e) => setCorrelationConfig({ ...correlationConfig, lateDetectionSeconds: Number(e.target.value) })}
            />
          </Field>
          <div className="flex items-center justify-between rounded-lg border border-[color:var(--border)] px-3 py-2.5">
            <div>
              <p className="text-xs font-medium text-[color:var(--ink)]">Match on hostname</p>
              <p className="text-[11px] text-[color:var(--ink-muted)]">Require the alert and attack to reference the same host.</p>
            </div>
            <Switch
              checked={correlationConfig.matchOnHost}
              onChange={(v) => setCorrelationConfig({ ...correlationConfig, matchOnHost: v })}
              label="Match on hostname"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[color:var(--border)] px-3 py-2.5">
            <div>
              <p className="text-xs font-medium text-[color:var(--ink)]">Require high confidence for full credit</p>
              <p className="text-[11px] text-[color:var(--ink-muted)]">Low-confidence alerts count as a partial detection rather than a clean one.</p>
            </div>
            <Switch
              checked={correlationConfig.requireHighConfidenceForFullCredit}
              onChange={(v) => setCorrelationConfig({ ...correlationConfig, requireHighConfidenceForFullCredit: v })}
              label="Require high confidence"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Organization" description="Response-time targets used by the Detection Speed sub-score." />
        <CardBody className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
          <Target label="MTTD target" value={`${dataset.organization.targets.mttdSeconds}s`} />
          <Target label="MTTA target" value={`${dataset.organization.targets.mttaSeconds}s`} />
          <Target label="MTTR target" value={`${dataset.organization.targets.mttrSeconds}s`} />
          <Target label="MTTC target" value={`${dataset.organization.targets.mttcSeconds}s`} />
          <Target label="Detection rate target" value={`${dataset.organization.targets.detectionRatePct}%`} />
          <Target label="Response rate target" value={`${dataset.organization.targets.responseRatePct}%`} />
        </CardBody>
      </Card>

      <Card className="border-[color:var(--critical)]/25">
        <CardHeader title="Demo environment" description="Reset every run, weight and imported record back to the exhibition starting state." />
        <CardBody>
          <Button variant="danger" onClick={resetDemo}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset demo to initial state
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

function Target({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-sunken)] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-[color:var(--ink-muted)]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular text-[color:var(--ink)]">{value}</p>
    </div>
  );
}
