"use client";

import type { ValidationResult } from "@/lib/domain/types";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/primitives";
import { OUTCOME_BADGE } from "@/components/status/badges";
import { formatDuration, formatTime } from "@/lib/utils";
import { useEvidenceDrawer } from "@/components/evidence/EvidenceDrawer";
import { CheckCircle2, XCircle } from "lucide-react";

function Dot({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--good-ink)]" />
  ) : (
    <XCircle className="h-3.5 w-3.5 text-[color:var(--ink-muted)]" />
  );
}

export function ResultsTable({ results }: { results: ValidationResult[] }) {
  const { openResult } = useEvidenceDrawer();

  return (
    <Table>
      <THead>
        <Tr>
          <Th>Technique</Th>
          <Th>Host</Th>
          <Th>Executed</Th>
          <Th>Telemetry</Th>
          <Th>Alert</Th>
          <Th>Detection time</Th>
          <Th>Incident</Th>
          <Th>Contained</Th>
          <Th>Outcome</Th>
        </Tr>
      </THead>
      <TBody>
        {results.map((r) => {
          const badge = OUTCOME_BADGE[r.outcome];
          return (
            <Tr key={r.id} clickable onClick={() => openResult(r)}>
              <Td>
                <span className="font-mono text-xs font-semibold text-[color:var(--ink)]">{r.techniqueId}</span>
                <span className="mt-0.5 block text-[11px] text-[color:var(--ink-muted)]">{r.techniqueName}</span>
              </Td>
              <Td className="text-[color:var(--ink-secondary)]">{r.hostname}</Td>
              <Td className="whitespace-nowrap font-mono text-[11px] text-[color:var(--ink-secondary)]">
                {formatTime(r.executedAt)}
              </Td>
              <Td>
                <Dot ok={r.telemetryReceived} />
              </Td>
              <Td>
                <Dot ok={r.alertGenerated} />
              </Td>
              <Td className="tabular text-[color:var(--ink-secondary)]">{formatDuration(r.detectionLatencyMs)}</Td>
              <Td>
                <Dot ok={r.incidentCreated} />
              </Td>
              <Td>
                <Dot ok={r.contained} />
              </Td>
              <Td>
                <Badge tone={badge.tone}>{badge.label}</Badge>
              </Td>
            </Tr>
          );
        })}
      </TBody>
    </Table>
  );
}
