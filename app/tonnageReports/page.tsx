"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Toolbar } from "@/components/tonnageReportComponents/Toolbar";
import { SummaryCards } from "@/components/tonnageReportComponents/SummaryCards";
import { ReportChart } from "@/components/tonnageReportComponents/ReportChart";
import { ReportTable } from "@/components/tonnageReportComponents/ReportTable";
import { hourIndexToLocalMs } from "@/utils/timeBuckets";
import dynamic from "next/dynamic";
const UptimeTimer = dynamic(
  () => import("@/components/tonnageReportComponents/UptimeTimer"),
  { ssr: false }
);

import type { Pile, Timeframe, ReportRow } from "@/components/tonnageReportComponents/types";

/* ---------- helpers ---------- */
function isoDate(d: Date) { return d.toISOString().slice(0, 10); }
function startOfToday() { const d = new Date(); d.setHours(0,0,0,0); return d; }

/* ---------- temp piles ---------- */
const INITIAL_PILES: Pile[] = [
  { id: 1, name: "Pile 1" },
  { id: 2, name: "Pile 2" },
  { id: 3, name: "Pile 3" },
  { id: 4, name: "Pile 4" },
];

type ApiRow = {
  bucket?: string;
  tagindex?: number;
  tagname?: string;
  total?: number;
  pile?: string;        // e.g. "Pile1"
  hour_index?: number;  // 0..23, 23 = current local hour
  val?: number;
};

export default function TonnageReportsPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("Last 24 Hours");
  const piles: Pile[] = INITIAL_PILES;
  const [selectedPileIds, setSelectedPileIds] = useState<number[]>([1, 4]);

  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // heartbeat (only used in Last 24 Hours mode)
  const [minuteTick, setMinuteTick] = useState(0);
  useEffect(() => {
    if (timeframe !== "Last 24 Hours") return;
    const id = setInterval(() => setMinuteTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, [timeframe]);

  // default date range (for day/week views)
  const today = new Date();
  const defaultStart = new Date(today); defaultStart.setDate(today.getDate() - 7);
  const [range, setRange] = useState({ start: isoDate(defaultStart), end: isoDate(today) });

  const activePiles = useMemo(
    () => piles.filter(p => selectedPileIds.includes(p.id)),
    [piles, selectedPileIds]
  );

  // clamp range + notice when in hourly mode
  useEffect(() => {
    if (timeframe !== "Last 24 Hours") { setNotice(null); return; }
    const start = isoDate(startOfToday());
    const end = isoDate(new Date());
    if (range.start !== start || range.end !== end) setRange({ start, end });
    setNotice("Hourly data is only stored for the last 24 hrs.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe]);

  // fetch + shape data (re-runs every minute in hourly mode)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErr(null);
      try {
        if (timeframe === "Last 24 Hours") {
          const res = await fetch("/api/tonnage?timeframe=hour", { cache: "no-store" });
          if (!res.ok) throw new Error(await res.text());
          const data: ApiRow[] = await res.json();

          const byHour: Record<number, ReportRow> = {};
          const anchor = new Date(); anchor.setMinutes(0, 0, 0); // single anchor for consistency

          // fill from API
          for (const r of (Array.isArray(data) ? data : [])) {
            const h = r.hour_index ?? 0;
            if (!byHour[h]) byHour[h] = { timestamp: hourIndexToLocalMs(h, anchor) };
            const pileLabel = r.pile?.replace(/(Pile)(\d+)/, "Pile $2") ?? "Unknown";
            byHour[h][pileLabel] = r.val ?? 0;
          }

          // prefill missing hours
          for (let h = 0; h <= 23; h++) {
            if (!byHour[h]) byHour[h] = { timestamp: hourIndexToLocalMs(h, anchor) };
          }

          // totals from active piles
          for (const hr of Object.values(byHour)) {
            hr.total = activePiles.reduce(
              (sum, p) => sum + Number(hr[p.name] || 0), 0
            );
          }

          // newest → oldest for the table (chart sorts on its own)
          const shaped = Object.values(byHour).sort(
            (a, b) => Number(b.timestamp) - Number(a.timestamp)
          );

          setRows(shaped);
          return;
        }

        // daily/weekly
        const tf = timeframe === "daily" ? "day" : "week";
        const startIso = `${range.start}T00:00:00Z`;
        const endIso = `${range.end}T23:59:59Z`;
        const url = new URL("/api/tonnage", window.location.origin);
        url.searchParams.set("timeframe", tf);
        url.searchParams.set("start", startIso);
        url.searchParams.set("end", endIso);
        if (activePiles.length) url.searchParams.set("piles", activePiles.map(p => p.id).join(","));

        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data: ApiRow[] = await res.json();

        const idToName = new Map(activePiles.map(p => [p.id, p.name] as const));
        const byBucket: Record<string, ReportRow> = {};

        for (const r of (Array.isArray(data) ? data : [])) {
          const ts = new Date(r.bucket!).toISOString();
          if (!byBucket[ts]) byBucket[ts] = { timestamp: ts };
          const displayName = idToName.get(r.tagindex!) ?? r.tagname!;
          byBucket[ts][displayName] = r.total ?? 0;
        }

        const shaped = Object.values(byBucket).sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        setRows(shaped);
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : "Failed to load data";
        setErr(message);
        setRows([]);
      } finally {

        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe, range, activePiles, minuteTick]);

  return (
    <main className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-4">
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Tonnage Reports</h1>

      <Toolbar
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        piles={piles}
        selectedPileIds={selectedPileIds}
        onSelectedPilesChange={setSelectedPileIds}
        range={range}
        onRangeChange={setRange}
      />

      {notice && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {notice}
        </div>
      )}
      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <SummaryCards rows={rows} piles={activePiles} timeframe={timeframe} />

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {timeframe === "Last 24 Hours" && (
          <section className="space-y-4">
            <UptimeTimer />
          </section>
        )}
        <ReportChart rows={rows} piles={activePiles} timeframe={timeframe} />
        <ReportTable rows={rows} piles={activePiles} timeframe={timeframe} />
      </section>

      {loading && <div className="text-sm text-zinc-500">Loading…</div>}
    </main>
  );
}
