"use client";
import React from "react";
import type { ReportRow, Pile, Timeframe } from "./types";

export function ReportTable({
  rows,
  piles,
  timeframe,
}: {
  rows: ReportRow[];
  piles: Pile[];
  timeframe: Timeframe;
}) {
  return (
    <div className="rounded-2xl shadow-sm border border-zinc-200/70 bg-white p-4 overflow-auto">
      <div className="text-2xl text-black font-medium mb-2">Report Table ({timeframe})</div>
      <table className="min-w-full text-lg text-black">
        <thead className="text-left text-zinc-600">
          <tr>
            <th className="py-2 pr-4">Timestamp</th>
            {piles.map((p) => (
              <th key={p.id} className="py-2 pr-4 whitespace-nowrap">
                {p.name} (tons)
              </th>
            ))}
            <th className="py-2 pr-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            const rowTotal = piles.reduce(
              (sum, p) => sum + Number(r[p.name] || 0),
              0
            );
            return (
              <tr key={idx} className="border-t">
                <td className="py-2 pr-4 whitespace-nowrap">
                  {new Date(r.timestamp).toLocaleString()}
                </td>
                {piles.map((p) => (
                  <td key={p.id} className="py-2 pr-4 text-right tabular-nums">
                    {Number(r[p.name] || 0).toLocaleString()}
                  </td>
                ))}
                <td className="py-2 pr-2 text-right font-medium tabular-nums">
                  {rowTotal.toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
