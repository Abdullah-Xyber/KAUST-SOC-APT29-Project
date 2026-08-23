"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { TrendPoint } from "@/lib/engine/analytics";
import { ChartLegend, CHART_TICK_STYLE, CHART_GRID_COLOR } from "@/components/charts/ChartCard";
import { ChartTooltipShell } from "@/components/charts/ChartTooltip";
import { formatDate } from "@/lib/utils";

/**
 * Burhan Score, Detection Rate and Response Rate across validation runs — all
 * three share one 0-100 axis, so this stays a single-axis chart rather than
 * the dual-axis trap.
 */
export function RunTrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length < 2) {
    return (
      <p className="flex h-56 items-center justify-center text-xs text-[color:var(--ink-muted)]">
        Run at least two validations to see a trend.
      </p>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={230}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => formatDate(v)}
            tick={CHART_TICK_STYLE}
            axisLine={{ stroke: "var(--axis)" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={CHART_TICK_STYLE}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as TrendPoint;
              return (
                <ChartTooltipShell
                  label={`${point.label} · ${formatDate(label as string)}`}
                  rows={[
                    { label: "Burhan Score", value: `${point.score}`, color: "var(--series-1)" },
                    { label: "Detection rate", value: `${point.detectionRate}%`, color: "var(--series-3)" },
                    { label: "Response rate", value: `${point.responseRate}%`, color: "var(--series-2)" },
                  ]}
                />
              );
            }}
          />
          <Line type="monotone" dataKey="score" stroke="var(--series-1)" strokeWidth={2.5} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="detectionRate" stroke="var(--series-3)" strokeWidth={2} dot={{ r: 2.5 }} strokeDasharray="0" />
          <Line type="monotone" dataKey="responseRate" stroke="var(--series-2)" strokeWidth={2} dot={{ r: 2.5 }} />
        </LineChart>
      </ResponsiveContainer>
      <ChartLegend
        items={[
          { label: "Burhan Score", color: "var(--series-1)" },
          { label: "Detection rate %", color: "var(--series-3)" },
          { label: "Response rate %", color: "var(--series-2)" },
        ]}
      />
    </div>
  );
}

export function RunTrendTable({ data }: { data: TrendPoint[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[color:var(--border)] text-left text-[color:var(--ink-muted)]">
            <th className="py-1.5 pr-3 font-medium">Run</th>
            <th className="py-1.5 pr-3 font-medium">Date</th>
            <th className="py-1.5 pr-3 font-medium">Score</th>
            <th className="py-1.5 pr-3 font-medium">Detection %</th>
            <th className="py-1.5 font-medium">Response %</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.runId} className="border-b border-[color:var(--border)] last:border-0">
              <td className="py-1.5 pr-3 text-[color:var(--ink)]">{d.label}</td>
              <td className="py-1.5 pr-3 text-[color:var(--ink-muted)]">{formatDate(d.date)}</td>
              <td className="py-1.5 pr-3 font-medium tabular text-[color:var(--ink)]">{d.score}</td>
              <td className="py-1.5 pr-3 tabular text-[color:var(--ink)]">{d.detectionRate}%</td>
              <td className="py-1.5 tabular text-[color:var(--ink)]">{d.responseRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
