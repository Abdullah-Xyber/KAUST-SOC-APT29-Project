"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardBody, Select, Input } from "@/components/ui/primitives";
import { RunsTable } from "@/components/runs/RunsTable";
import { useBurhan } from "@/lib/state/DataProvider";

const STATUS_OPTIONS = ["all", "completed", "running", "partial", "failed"] as const;

export default function RunsPage() {
  return (
    <React.Suspense fallback={null}>
      <RunsPageInner />
    </React.Suspense>
  );
}

function RunsPageInner() {
  const { dataset, analysis } = useBurhan();
  const params = useSearchParams();

  const [status, setStatus] = React.useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [query, setQuery] = React.useState(params.get("q") ?? "");

  const runs = React.useMemo(() => {
    return [...dataset.runs]
      .filter((r) => status === "all" || r.status === status)
      .filter((r) => {
        if (!query.trim()) return true;
        const q = query.trim().toLowerCase();
        return (
          r.id.toLowerCase().includes(q) ||
          r.scenario.toLowerCase().includes(q) ||
          r.threatProfile.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }, [dataset.runs, status, query]);

  return (
    <div className="space-y-4 fade-up">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[color:var(--ink)]">Validation Runs</h2>
          <p className="text-xs text-[color:var(--ink-muted)]">
            Every adversary emulation exercise becomes a measurable validation result.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search scenario or run ID…"
            className="w-56"
          />
          <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-36">
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Card>
        <CardBody className="p-0">
          <RunsTable runs={runs} analysisByRun={analysis.byRun} />
        </CardBody>
      </Card>
    </div>
  );
}
