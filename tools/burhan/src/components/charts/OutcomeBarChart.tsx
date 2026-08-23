"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { TrendPoint } from "@/lib/engine/analytics";
import { ChartLegend, CHART_TICK_STYLE, CHART_GRID_COLOR } from "@/components/charts/ChartCard";
import { ChartTooltipShell } from "@/components/charts/ChartTooltip";

/**
 * Detected / partially detected / missed technique executions per run.
 * These are outcome states, not arbitrary series identity, so they wear the
 * reserved status palette rather than the categorical one.
 */
export function OutcomeBarChart({ data }: { data: TrendPoint[] }) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 24 }} barCategoryGap="28%">
          <CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} />
          <XAxis
            dataKey="label"
            tick={CHART_TICK_STYLE}
            axisLine={{ stroke: "var(--axis)" }}
            tickLine={false}
            interval={0}
            angle={-28}
            textAnchor="end"
            height={64}
            tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 15)}…` : v)}
          />
          <YAxis tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as TrendPoint;
              return (
                <ChartTooltipShell
                  label={point.label}
                  rows={[
                    { label: "Detected", value: `${point.detected}`, color: "var(--good)" },
                    { label: "Partial", value: `${point.partial}`, color: "var(--warning)" },
                    { label: "Missed", value: `${point.missed}`, color: "var(--critical)" },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="detected" stackId="a" fill="var(--good)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="partial" stackId="a" fill="var(--warning)" />
          <Bar dataKey="missed" stackId="a" fill="var(--critical)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <ChartLegend
        items={[
          { label: "Detected", color: "var(--good)" },
          { label: "Partially detected", color: "var(--warning)" },
          { label: "Missed", color: "var(--critical)" },
        ]}
      />
    </div>
  );
}
