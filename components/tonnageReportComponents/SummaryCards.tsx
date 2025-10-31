"use client";
import React, { useMemo } from "react";
import type { ReportRow, Pile, Timeframe } from "./types";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl shadow-sm border border-zinc-200/70 bg-white p-4">
      {children}
    </div>
  );
}

export function SummaryCards({
  rows,
  piles,
  timeframe,
}: {
  rows: ReportRow[];
  piles: Pile[];
  timeframe: Timeframe;
}) {
  const totals = useMemo(() => {
    const out: Record<string, number> = {};
    for (const p of piles) out[p.name] = 0;
    for (const r of rows) {
      for (const p of piles) out[p.name] += Number(r[p.name] || 0);
    }
    const siteTotal = Object.values(out).reduce((a, b) => a + b, 0);
    return { perPile: out, siteTotal };
  }, [rows, piles]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card>
        <div className="text-xs uppercase text-zinc-500">
          Site total ({timeframe})
        </div>
        <div className="text-2xl text-black font-semibold">
          {totals.siteTotal.toLocaleString()} tons
        </div>
      </Card>
      {piles.slice(0, 4).map((p) => (
        <Card key={p.id}>
          <div className="text-xs uppercase text-zinc-500">{p.name}</div>
          <div className="text-4xl text-black font-semibold">
            {totals.perPile[p.name].toLocaleString()} tons
          </div>
        </Card>
      ))}
    </div>
  );
}
