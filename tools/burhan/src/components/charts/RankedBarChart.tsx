"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { CHART_TICK_STYLE, CHART_GRID_COLOR } from "@/components/charts/ChartCard";
import { ChartTooltipShell } from "@/components/charts/ChartTooltip";

export interface RankedBarDatum {
  name: string;
  value: number;
  detail?: string;
}

function rampFor(rate: number): string {
  if (rate >= 90) return "var(--good)";
  if (rate >= 70) return "var(--ramp-3)";
  if (rate >= 40) return "var(--warning)";
  return "var(--critical)";
}

/**
 * A single magnitude ranked across named rows (rule effectiveness, data
 * source coverage). One ordinal hue shaded by value — not a categorical
 * palette, since these rows are not distinct identity series.
 */
export function RankedBarChart({
  data,
  unit = "%",
  valueDomain = [0, 100],
}: {
  data: RankedBarDatum[];
  unit?: string;
  valueDomain?: [number, number];
}) {
  if (!data.length) {
    return (
      <p className="flex h-40 items-center justify-center text-xs text-[color:var(--ink-muted)]">
        No data available for this view.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 32, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={CHART_GRID_COLOR} horizontal={false} />
        <XAxis type="number" domain={valueDomain} tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} width={160} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0]?.payload as RankedBarDatum;
            return (
              <ChartTooltipShell
                label={d.name}
                rows={[
                  { label: "Value", value: `${d.value}${unit}` },
                  ...(d.detail ? [{ label: "Detail", value: d.detail }] : []),
                ]}
              />
            );
          }}
        />
        <Bar
          dataKey="value"
          radius={[0, 4, 4, 0]}
          label={{ position: "right", fontSize: 11, fill: "var(--ink-secondary)", formatter: (v: unknown) => `${v}${unit}` }}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={unit === "%" ? rampFor(d.value) : "var(--series-1)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
