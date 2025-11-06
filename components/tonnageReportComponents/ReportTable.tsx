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
    <div className="w-full rounded-2xl shadow-sm border border-zinc-200/70 bg-white p-4 overflow-auto">
      <div className="text-2xl text-black font-medium mb-2">
        Report Table ({timeframe})
      </div>
      <table className="min-w-full text-lg text-black border-collapse">
        <thead className="text-zinc-600 border-b">
          <tr>
            <th className="py-2 pr-4 text-left">Timestamp</th>

            {/* Tons + Ash headers centered */}
            {piles.map((p) => (
              <React.Fragment key={p.id}>
                <th className="py-2 pr-4 text-center whitespace-nowrap">
                  {p.name} (tons)
                </th>
                <th className="py-2 pr-4 text-center whitespace-nowrap">
                  {p.name} Ash
                </th>
              </React.Fragment>
            ))}

            <th className="py-2 pr-2 text-center whitespace-nowrap">
              Total (tons)
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r, idx) => {
            const rowTotal = piles.reduce(
              (sum, p) => sum + Number(r[p.name] ?? 0),
              0
            );

            return (
              <tr key={idx} className="border-t">
                <td className="py-2 pr-4 text-left whitespace-nowrap">
                  {new Date(r.timestamp).toLocaleString()}
                </td>

                {piles.map((p) => {
                  const tons = Number(r[p.name] ?? 0);
                  const ashKey = `${p.name} Ash`;
                  const ashVal = r[ashKey];

                  return (
                    <React.Fragment key={p.id}>
                      <td className="py-2 pr-4 text-center tabular-nums">
                        {tons.toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 text-center tabular-nums">
                        {typeof ashVal === "number"
                          ? ashVal.toLocaleString()
                          : ashVal ?? "0"}
                      </td>
                    </React.Fragment>
                  );
                })}

                <td className="py-2 pr-2 text-center font-medium tabular-nums">
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
