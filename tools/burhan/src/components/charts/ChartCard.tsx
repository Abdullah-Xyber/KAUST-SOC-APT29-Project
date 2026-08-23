"use client";

import * as React from "react";
import { List, TableProperties } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/primitives";
import { InfoHint } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

/**
 * Shared chart shell. Provides the relief channel the palette validation
 * requires (§ dataviz skill): any chart using a sub-3:1 series color ships a
 * table-view toggle alongside the visual, so the data is never color-only.
 */
export function ChartCard({
  title,
  description,
  hint,
  action,
  table,
  children,
  className,
}: {
  title: string;
  description?: string;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  /** Table-view content; when provided, a toggle appears in the header. */
  table?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const [showTable, setShowTable] = React.useState(false);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader
        title={
          <span className="flex items-center">
            {title}
            {hint && <InfoHint>{hint}</InfoHint>}
          </span>
        }
        description={description}
        action={
          <div className="flex items-center gap-1.5">
            {action}
            {table && (
              <button
                onClick={() => setShowTable((s) => !s)}
                aria-label={showTable ? "Show chart" : "Show data table"}
                className="rounded-md p-1.5 text-[color:var(--ink-muted)] hover:bg-[color:var(--surface-sunken)] hover:text-[color:var(--ink)]"
                title={showTable ? "Show chart" : "Show data table"}
              >
                {showTable ? <List className="h-3.5 w-3.5" /> : <TableProperties className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        }
      />
      <div className="p-5">{showTable && table ? table : children}</div>
    </Card>
  );
}

export function ChartLegend({
  items,
}: {
  items: { label: string; color: string; dashed?: boolean }[];
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-[color:var(--ink-secondary)]">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: item.color, opacity: item.dashed ? 0.5 : 1 }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export const CHART_TICK_STYLE = { fontSize: 11, fill: "var(--ink-muted)" };
export const CHART_GRID_COLOR = "var(--grid)";
