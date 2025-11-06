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
    const perPileTons: Record<string, number> = {};
    const perPileAshTons: Record<string, number> = {}; // tons * ash

    for (const p of piles) {
      perPileTons[p.name] = 0;
      perPileAshTons[p.name] = 0;
    }

    let siteTotalTons = 0;
    let siteAshTons = 0;

    for (const r of rows) {
      for (const p of piles) {
        const tons = Number(r[p.name] ?? 0);
        if (!Number.isFinite(tons) || tons <= 0) continue;

        const ashKey = `${p.name} Ash`;
        const ashVal = r[ashKey];

        perPileTons[p.name] += tons;
        siteTotalTons += tons;

        if (typeof ashVal === "number") {
          perPileAshTons[p.name] += tons * ashVal;
          siteAshTons += tons * ashVal;
        }
      }
    }

    const perPileAvgAsh: Record<string, number | null> = {};
    for (const p of piles) {
      const t = perPileTons[p.name];
      perPileAvgAsh[p.name] =
        t > 0 ? perPileAshTons[p.name] / t : null;
    }

    const siteAvgAsh =
      siteTotalTons > 0 ? siteAshTons / siteTotalTons : null;

    return { perPileTons, perPileAvgAsh, siteTotalTons, siteAvgAsh };
  }, [rows, piles]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Site summary */}
      <Card>
        <div className="text-xs uppercase text-zinc-500">
          Site total ({timeframe})
        </div>
        <div className="text-2xl text-black font-semibold">
          {totals.siteTotalTons.toLocaleString()} tons
        </div>
        <div className="mt-1 text-sm text-zinc-600">
          Avg ash:{" "}
          {totals.siteAvgAsh != null
            ? `${totals.siteAvgAsh.toFixed(2)}`
            : "—"}
        </div>
      </Card>

      {/* Per-pile cards */}
      {piles.slice(0, 4).map((p) => (
        <Card key={p.id}>
          <div className="text-xs uppercase text-zinc-500">
            {p.name}
          </div>
          <div className="text-4xl text-black font-semibold">
            {totals.perPileTons[p.name].toLocaleString()} tons
          </div>
          <div className="mt-1 text-sm text-zinc-600">
            Avg ash:{" "}
            {totals.perPileAvgAsh[p.name] != null
              ? totals.perPileAvgAsh[p.name]!.toFixed(2)
              : "—"}
          </div>
        </Card>
      ))}
    </div>
  );
}
