"use client";
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { ReportRow, Pile, Timeframe } from "./types";

const COLORS = [
  "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
  "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
];

const GOAL_Y = 200;
const GOAL_COLOR = "#16a34a";
const BREAK_EVEN_Y = 50;
const BREAK_EVEN_COLOR = "#f59e0b";
const TOTAL_COLOR = "#16a34a"; // near-black for total

export function ReportChart({
  rows,
  piles,
  timeframe,
}: {
  rows: ReportRow[];
  piles: Pile[];
  timeframe: Timeframe;
}) {
  // Ensure X runs left→right from oldest→newest, and ensure `total` exists
  const dataAsc = useMemo(() => {
    const asc = [...rows].sort(
      (a, b) => Number(a.timestamp) - Number(b.timestamp)
    );
    return asc.map((r) => {
      const total =
        typeof r.total === "number"
          ? r.total
          : piles.reduce((s, p) => s + Number((r as any)[p.name] || 0), 0);
      return { ...r, total };
    });
  }, [rows, piles]);

  const Swatch = ({ color, dashed = false }: { color: string; dashed?: boolean }) => (
    <span
      style={{
        display: "inline-block",
        width: 18,
        height: 0,
        borderTop: `3px ${dashed ? "dashed" : "solid"} ${color}`,
      }}
    />
  );

  const renderLegend = () => (
    <ul className="flex flex-wrap justify-center gap-4">
      {piles.map((p, i) => (
        <li key={`pile-${p.id}`} className="flex items-center gap-2 text-sm text-black">
          <Swatch color={COLORS[i % COLORS.length]} />
          <span>{p.name}</span>
        </li>
      ))}
      <li key="legend-total" className="flex items-center gap-2 text-sm text-black">
        <Swatch color={TOTAL_COLOR} />
        <span>Total</span>
      </li>
      <li key="legend-goal" className="flex items-center gap-2 text-sm text-black">
        <Swatch color={GOAL_COLOR} dashed />
        <span>{`Goal (${GOAL_Y})`}</span>
      </li>
      <li key="legend-break-even" className="flex items-center gap-2 text-sm text-black">
        <Swatch color={BREAK_EVEN_COLOR} dashed />
        <span>{`Break-even (${BREAK_EVEN_Y})`}</span>
      </li>
    </ul>
  );

  return (
    <div className="rounded-2xl shadow-sm border border-zinc-200/70 bg-white p-4">
      <div className="text-2xl font-medium mb-2 text-black">
        Trend ({timeframe})
      </div>

      <div className="h-80">
        <ResponsiveContainer>
          <LineChart data={dataAsc} margin={{ left: 16, right: 16, top: 8, bottom: 16 }}>
            <CartesianGrid strokeDasharray="3 3" />

            {/* X Axis — oldest on left, newest on right */}
            <XAxis
              dataKey="timestamp"
              tickFormatter={(v) =>
                new Date(v as number).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              }
              minTickGap={32}
              label={{ value: "Hours", position: "insideBottom", offset: -10, fill: "#000", fontWeight: 600 }}
            />

            {/* Y Axis */}
            <YAxis
              domain={[0, (dataMax: number) => Math.max(GOAL_Y, BREAK_EVEN_Y, dataMax)]}
              label={{ value: "Tons", angle: -90, position: "insideLeft", fill: "#000", fontWeight: 600, offset: 10 }}
            />

            <Tooltip
              labelFormatter={(v) =>
                new Date(v as number).toLocaleString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  month: "short",
                  day: "numeric",
                })
              }
              labelStyle={{ color: "#000" }}
            />

            {/* Goal + Break-even */}
            <ReferenceLine y={GOAL_Y} ifOverflow="extendDomain" stroke={GOAL_COLOR} strokeDasharray="4 4" />
            <ReferenceLine y={BREAK_EVEN_Y} ifOverflow="extendDomain" stroke={BREAK_EVEN_COLOR} strokeDasharray="4 4" />

            {/* Piles */}
            {piles.map((p, i) => (
              <Line
                key={p.id}
                type="monotone"
                dataKey={p.name}
                name={p.name}
                dot={false}
                strokeWidth={2}
                stroke={COLORS[i % COLORS.length]}
                isAnimationActive={false}
              />
            ))}

            {/* Total line */}
            <Line
              type="monotone"
              dataKey="total"
              name="Total"
              dot={false}
              strokeWidth={3}
              stroke={TOTAL_COLOR}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 mb-2 flex justify-center">{renderLegend()}</div>
    </div>
  );
}
