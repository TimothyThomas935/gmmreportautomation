"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { hourIndexToLocalMs } from "@/utils/timeBuckets";

const THRESHOLD = 50; // tons/hr
const TZ_OPTS = {
  timeZone: "America/Denver",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
} as const;

type HourRow = { hour_index: number; pile?: string; val?: number };
type ShiftEvent = {
  ts: string;
  action: "UP" | "DOWN";
  runStart: string;
  siteTotalAtFlip?: number;
  // optional duration fields from DB / API
  run_duration_hours?: number | null;
  runDurationHours?: number | null;
};


function startOfCurrentHour(): Date {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  return d;
}
function dts(ms: number) {
  return new Date(ms).toLocaleString("en-US", TZ_OPTS);
}
function fmt(seconds: number) {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function UptimeTimer() {
  // aggregated totals keyed by *anchored* hour-start (ms)
  const [hourAgg, setHourAgg] = useState<Map<number, { total: number }>>(
    new Map()
  );
  const [anchorMs, setAnchorMs] = useState<number>(
    startOfCurrentHour().getTime()
  );
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [events, setEvents] = useState<ShiftEvent[]>([]);
  const lastPostedRef = useRef<{
    action: "UP" | "DOWN";
    runStart: number;
  } | null>(null);

  // 1s tick (UI only)
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // fetch hourly rows every 60s; use ONE anchor per fetch
  async function fetchHourly() {
    const res = await fetch("/api/tonnage?timeframe=hour", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as HourRow[];

    const anchor = startOfCurrentHour();
    const anchorTime = anchor.getTime();
    const map = new Map<number, { total: number }>();

    for (const r of data ?? []) {
      const h = r.hour_index ?? 0; // 0..23, 23 = current local hour
      const key = hourIndexToLocalMs(h, anchor);
      const prev = map.get(key);
      map.set(key, { total: (prev?.total ?? 0) + (r.val ?? 0) });
    }

    setHourAgg(map);
    setAnchorMs(anchorTime);
  }

  useEffect(() => {
    fetchHourly().catch(console.error);
    const id = setInterval(() => fetchHourly().catch(console.error), 60_000);
    return () => clearInterval(id);
  }, []);
  // inside UptimeTimer component
  useEffect(() => {
    let stop = false;

    async function load() {
      const r = await fetch("/api/shift-events/recent?limit=10", {
        cache: "no-store",
      });
      if (!r.ok) return;
      const rows = await r.json();
      if (!stop) setEvents(rows); // rows: { ts, action, runStart, siteTotalAtFlip }[]
    }

    load().catch(console.error);
    const id = setInterval(() => load().catch(console.error), 60_000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  // build anchored 24-hour window (oldest → newest)
  const windowStarts = useMemo(() => {
    const out: number[] = [];
    for (let i = 23; i >= 0; i--) {
      const d = new Date(anchorMs);
      d.setHours(d.getHours() - i);
      out.push(d.getTime());
    }
    return out;
  }, [anchorMs]);

  // derive current action, run start, elapsed
  const model = useMemo(() => {
    const perHour = windowStarts.map((t) => {
      const rec = hourAgg.get(t);
      const total = rec?.total ?? 0;
      const hasSample = hourAgg.has(t);
      const isUp: boolean | null = hasSample ? total >= THRESHOLD : null;
      return { t, total, hasSample, isUp };
    });

    // most recent KNOWN hour defines current state
    let idx = perHour.length - 1;
    while (idx >= 0 && perHour[idx].isUp === null) idx--;
    const currentKnown = idx >= 0 ? perHour[idx] : null;
    const currentAction: "UP" | "DOWN" =
      currentKnown && currentKnown.isUp ? "UP" : "DOWN";

    // walk back (skipping unknowns) to get runStart
    let runStart = perHour[0]?.t ?? anchorMs - 23 * 3600_000;
    if (currentKnown) {
      runStart = currentKnown.t;
      for (let i = idx - 1; i >= 0; i--) {
        const h = perHour[i];
        if (h.isUp === null) continue; // ignore unknown hour
        if ((h.isUp ? "UP" : "DOWN") !== currentAction) break; // flip encountered
        runStart = h.t; // extend run backward
      }
    } else {
      runStart = perHour[0]?.t ?? runStart;
    }

    const elapsedSec = Math.max(0, (nowMs - runStart) / 1000);
    return { perHour, currentAction, runStart, elapsedSec, currentKnown };
  }, [windowStarts, hourAgg, nowMs, anchorMs]);

  // post event when (action, runStart) changes and we have a known state
  useEffect(() => {
    if (!model.currentKnown) return;
    const cur = { action: model.currentAction, runStart: model.runStart };
    const last = lastPostedRef.current;
    if (last && last.action === cur.action && last.runStart === cur.runStart)
      return;

    lastPostedRef.current = cur;

    const payload: ShiftEvent = {
      ts: new Date().toISOString(),
      action: cur.action,
      runStart: new Date(cur.runStart).toISOString(),
      siteTotalAtFlip: hourAgg.get(cur.runStart)?.total ?? undefined,
    };

    fetch("/api/shift-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(console.error);

    setEvents((prev) => [payload, ...prev].slice(0, 10));
  }, [model.currentAction, model.runStart, model.currentKnown, hourAgg]);

  const badge =
    model.currentAction === "UP"
      ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300"
      : "bg-rose-100 text-rose-700 ring-1 ring-rose-300";

  const timerColor = model.currentAction === "UP" ? "text-black" : "text-black";

  const firstT = model.perHour[0]?.t;
  const lastT = model.perHour[model.perHour.length - 1]?.t;

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm text-black">
      {/* Status + timer */}
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${badge}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              model.currentAction === "UP" ? "bg-emerald-600" : "bg-rose-600"
            }`}
          />
          {model.currentAction}
        </span>
        <span
          className={`text-3xl font-semibold tabular-nums ${timerColor}`}
          suppressHydrationWarning
        >
          {fmt(model.elapsedSec)}
        </span>
        <span className="text-sm text-zinc-600">
          since {dts(model.runStart)}
          {model.currentKnown?.hasSample === false
            ? " (unknown current hour)"
            : ""}
        </span>
      </div>

      {/* 24h strip */}
      <div>
        <div className="mb-2 text-sm text-zinc-600">Last 24 hours</div>
        <div className="grid grid-cols-24 gap-[2px]">
          {model.perHour.map((h) => {
            // color priority: unknown → gray; known with >0 & <THRESHOLD → amber; known & >=THRESHOLD → green; known & ==0 → red
            const cls =
              h.isUp === null
                ? "bg-zinc-300/70"
                : h.total > 0 && h.total < THRESHOLD
                ? "bg-amber-400/80"
                : h.isUp
                ? "bg-emerald-500/80"
                : "bg-rose-500/80";
            return (
              <div
                key={h.t}
                title={`${dts(h.t)} • ${
                  h.isUp === null ? "no data" : `${h.total.toFixed(1)} tons`
                }`}
                className={`h-3 rounded-sm ${cls}`}
              />
            );
          })}
        </div>

        {/* first/last time labels under the strip */}
        {firstT && lastT && (
          <div className="mt-1 grid grid-cols-24 text-[10px] text-zinc-700">
            <div className="col-span-1 text-left">
              {new Date(firstT).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="col-span-22" />
            <div className="col-span-1 text-right">
              {new Date(lastT).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        )}
      </div>

      {/* Recent events */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="border-b px-4 py-2 font-medium">
          Recent State Changes
        </div>
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left">
            <tr>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2 w-[40%]">Run Start</th>
              <th className="px-4 py-2">Duration (hrs)</th>
              <th className="px-4 py-2 text-right">Site Total @ Flip</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-zinc-500" colSpan={4}>
                  No flips yet
                </td>
              </tr>
            ) : (
              events.map((e, i) => {
                const hrs = e.run_duration_hours ?? e.runDurationHours ?? null;
                return (
                  <tr key={`${e.runStart}-${i}`} className="border-t">
                    <td className="px-4 py-2">{e.action}</td>
                    <td className="px-4 py-2">{dts(Date.parse(e.runStart))}</td>
                    <td className="px-4 py-2">{hrs ?? "—"}</td>
                    <td className="px-4 py-2 text-right">
                      {typeof e.siteTotalAtFlip === "number"
                        ? e.siteTotalAtFlip.toFixed(1)
                        : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
