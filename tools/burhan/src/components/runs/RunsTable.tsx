"use client";

import { useRouter } from "next/navigation";
import type { ValidationRun } from "@/lib/domain/types";
import type { RunAnalysis } from "@/lib/engine/analytics";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/primitives";
import { RUN_STATUS_BADGE } from "@/components/status/badges";
import { formatDateTime } from "@/lib/utils";
import { PlayCircle } from "lucide-react";

const TOOL_LABEL: Record<string, string> = {
  caldera: "MITRE CALDERA",
  "atomic-red-team": "Atomic Red Team",
  "custom-emulation": "Custom Emulation",
};

export function RunsTable({
  runs,
  analysisByRun,
}: {
  runs: ValidationRun[];
  analysisByRun: Record<string, RunAnalysis>;
}) {
  const router = useRouter();

  if (runs.length === 0) {
    return (
      <EmptyState
        icon={<PlayCircle className="h-5 w-5" />}
        title="No validation runs"
        description="Runs created here or imported from Data Import will appear in this table."
      />
    );
  }

  return (
    <Table>
      <THead>
        <Tr>
          <Th>Run</Th>
          <Th>Scenario</Th>
          <Th>Source</Th>
          <Th>Threat Profile</Th>
          <Th>Started</Th>
          <Th>Techniques</Th>
          <Th>Detection</Th>
          <Th>Response</Th>
          <Th>Score</Th>
          <Th>Status</Th>
        </Tr>
      </THead>
      <TBody>
        {runs.map((run) => {
          const a = analysisByRun[run.id];
          const badge = RUN_STATUS_BADGE[run.status];
          return (
            <Tr key={run.id} clickable onClick={() => router.push(`/runs/${run.id}`)}>
              <Td className="font-mono text-xs text-[color:var(--ink-secondary)]">{run.id}</Td>
              <Td>
                <span className="font-medium text-[color:var(--ink)]">{run.scenario}</span>
                <span className="mt-0.5 block text-[11px] text-[color:var(--ink-muted)]">
                  {TOOL_LABEL[run.emulationTool] ?? run.emulationTool}
                </span>
              </Td>
              <Td>
                <Badge tone={run.evidenceBasis === "historical" ? "brand" : "outline"}>
                  {run.evidenceBasis === "historical" ? "Historical" : "Demo"}
                </Badge>
              </Td>
              <Td className="text-[color:var(--ink-secondary)]">{run.threatProfile}</Td>
              <Td className="whitespace-nowrap text-[color:var(--ink-secondary)]">{formatDateTime(run.startedAt)}</Td>
              <Td className="tabular text-[color:var(--ink-secondary)]">{run.techniqueIds.length}</Td>
              <Td className="tabular text-[color:var(--ink-secondary)]">
                {a ? `${a.detection.detectionRate}%` : "—"}
              </Td>
              <Td className="tabular text-[color:var(--ink-secondary)]">
                {a ? `${a.response.responseSuccessRate}%` : "—"}
              </Td>
              <Td className="font-semibold tabular text-[color:var(--ink)]">{a ? a.score.overall : "—"}</Td>
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
