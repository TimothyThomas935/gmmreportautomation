"use client";
import React, { useEffect, useMemo, useState } from "react";
import { hourIndexToLocalMs, startOfCurrentHour } from "@/utils/timeBuckets";
import { startClientShiftPoller } from "@/lib/clientShiftPoller";

type Latest = {
  exists: boolean;
  action?: "UP" | "DOWN";
  runStart?: string;                  // ISO
  siteTotalAtFlip?: number | null;
  loggedAt?: string;                  // ISO
};

type ShiftEvent = {
  ts: string;                         // ISO
  action: "UP" | "DOWN";
  runStart: string;                   // ISO
  siteTotalAtFlip?: number;
};

type HourRow = { hour_index: number; val?: number };

const THRESHOLD = 50;

function fmt(seconds: number) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function UptimeTimer() {
  const [mounted, setMounted] = useState(false);
  const [latest, setLatest] = useState<Latest>({ exists: false });
  const [recent, setRecent] = useState<ShiftEvent[]>([]);
  const [hourRows, setHourRows] = useState<HourRow[]>([]);
  const [nowMs, setNowMs] = useState<number>(Date.now());

  // avoid hydration mismatch for ticking clock
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // 1s tick for the live timer
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // kick off the client “cron” fallback (runs every minute, posts flips if needed)
  useEffect(() => {
    startClientShiftPoller();
  }, []);

  // poll server: latest flip, recent flips, hourly rows
  useEffect(() => {
    const load = async () => {
      const [latestRes, recentRes, hoursRes] = await Promise.allSettled([
        fetch("/api/shift-events/latest", { cache: "no-store" }),
        fetch("/api/shift-events/recent?limit=10", { cache: "no-store" }),
        fetch("/api/tonnage?timeframe=hour", { cache: "no-store" }),
      ]);

      if (latestRes.status === "fulfilled" && latestRes.value.ok) {
        setLatest(await latestRes.value.json());
      }
      if (recentRes.status === "fulfilled" && recentRes.value.ok) {
        setRecent(await recentRes.value.json());
      }
      if (hoursRes.status === "fulfilled" && hoursRes.value.ok) {
        const rows = await hoursRes.value.json();
        setHourRows(Array.isArray(rows) ? rows : []);
      }
    };

    load().catch(console.error);
    const id = setInterval(() => load().catch(console.error), 60_000);
    return () => clearInterval(id);
  }, []);

  // Build 24h strip (oldest → newest) using a single anchor so labels + data match
  const perHour = useMemo(() => {
    const anchor = startOfCurrentHour();
    const totals = new Map<number, number>();

    for (const r of hourRows) {
      const key = hourIndexToLocalMs(r.hour_index ?? 0, anchor);
      totals.set(key, (totals.get(key) ?? 0) + (r.val ?? 0));
    }

    const out: Array<{
      t: number;
      total: number;
      hasSample: boolean;
      color: string; // emerald=up, amber=some production, rose=down, zinc=unknown
    }> = [];

    for (let i = 23; i >= 0; i--) {
      const d = new Date(anchor);
      d.setHours(d.getHours() - i);
      const t = d.getTime();
      const total = totals.get(t) ?? 0;
      const hasSample = totals.has(t);

      let color = "bg-zinc-300/70"; // unknown
      if (hasSample) {
        if (total >= THRESHOLD) color = "bg-emerald-500/80"; // up
        else if (total > 0) color = "bg-amber-400/80";       // some production
        else color = "bg-rose-500/80";                        // down
      }

      out.push({ t, total, hasSample, color });
    }
    return out;
  }, [hourRows]);

  const action = latest.exists ? (latest.action as "UP" | "DOWN") : "DOWN";
  const runStartMs =
    latest.exists && latest.runStart
      ? new Date(latest.runStart).getTime()
      : perHour[0]?.t ?? Date.now();
  const elapsedSec = Math.max(0, (nowMs - runStartMs) / 1000);

  const badge =
    action === "UP"
      ? "bg-emerald-100 text-black ring-1 ring-emerald-300"
      : "bg-rose-100 text-black ring-1 ring-rose-300";

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm">
      {/* Status + Timer */}
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${badge}`}>
          <span className={`h-2 w-2 rounded-full ${action === "UP" ? "bg-emerald-600" : "bg-rose-600"}`} />
          <span className="text-black">{action}</span>
        </span>
        <span className="text-3xl text-black font-semibold tabular-nums">
          {fmt(elapsedSec)}
        </span>
        <span className="text-sm text-black">
          since {new Date(runStartMs).toLocaleString()}
        </span>
      </div>

      {/* 24h strip */}
      <div>
        <div className="mb-2 text-sm text-black">Last 24 hours</div>
        <div className="grid grid-cols-24 gap-[2px]">
          {perHour.map((h) => (
            <div
              key={h.t}
              title={`${new Date(h.t).toLocaleString()} • ${h.total.toFixed(1)} tons`}
              className={`h-3 rounded-sm ${h.color}`}
            />
          ))}
        </div>

        {/* first/last time labels */}
        <div className="mt-1 grid grid-cols-24 text-[10px] text-black">
          <div className="col-span-1 text-left">
            {new Date(perHour[0].t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="col-span-22" />
          <div className="col-span-1 text-right">
            {new Date(perHour[perHour.length - 1].t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>

      {/* Recent flips */}
      <div className="rounded-2xl bg-white shadow-sm text-black overflow-hidden">
        <div className="border-b px-4 py-2 font-medium">Recent State Changes</div>
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left">
            <tr>
              <th className="px-4 py-2 w-[40%]">Logged At</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2 w-[40%]">Run Start</th>
              <th className="px-4 py-2 text-right">Site Total @ Flip</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-zinc-500" colSpan={4}>No flips yet</td>
              </tr>
            ) : (
              recent.map((e, i) => (
                <tr key={`${e.ts}-${i}`} className="border-t">
                  <td className="px-4 py-2">{new Date(e.ts).toLocaleString()}</td>
                  <td className="px-4 py-2">{e.action}</td>
                  <td className="px-4 py-2">{new Date(e.runStart).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">
                    {typeof e.siteTotalAtFlip === "number" ? e.siteTotalAtFlip.toFixed(1) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
