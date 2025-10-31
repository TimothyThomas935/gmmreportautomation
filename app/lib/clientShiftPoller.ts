import { startOfCurrentHour } from "@/utils/timeBuckets";
import type { HourRow, DerivedStatus } from "../lib/shiftStatus";
import { deriveStatusFromHourly } from "../lib/shiftStatus";

const THRESHOLD = 50;

/* ---------------------- tiny async lock (1 at a time) ---------------------- */
let lock = false;
async function tryLock<T>(fn: () => Promise<T>): Promise<T | null> {
  if (lock) return null;
  lock = true;
  try {
    return await fn();
  } finally {
    lock = false;
  }
}

/* ----------------------------- fetch helpers ------------------------------ */
async function fetchHourly(): Promise<HourRow[]> {
  const r = await fetch("/api/tonnage?timeframe=hour", { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  return Array.isArray(data) ? (data as HourRow[]) : [];
}

async function fetchLatest(): Promise<{
  exists: boolean;
  action?: "UP" | "DOWN";
  runStart?: string; // ISO
}> {
  const r = await fetch("/api/shift-events/latest", { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function postFlip(payload: {
  action: "UP" | "DOWN";
  runStart: string; // ISO
  siteTotalAtFlip?: number;
}) {
  await fetch("/api/shift-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/* -------------------------- core poller (minute) -------------------------- */
async function pollOnce() {
  await tryLock(async () => {
    const [rows, latest] = await Promise.all([fetchHourly(), fetchLatest()]);
    const derived: DerivedStatus | null = deriveStatusFromHourly(rows, {
      threshold: THRESHOLD,
      anchor: startOfCurrentHour(),
    });
    if (!derived) return;

    const derivedAction = derived.currentAction;
    const derivedRunStartIso = new Date(derived.runStartMs).toISOString();

    const latestAction = latest.exists ? latest.action : undefined;
    const latestRunStartIso = latest.exists && latest.runStart ? latest.runStart : undefined;

    const changed =
      !latest.exists ||
      latestAction !== derivedAction ||
      latestRunStartIso !== derivedRunStartIso;

    if (changed) {
      await postFlip({
        action: derivedAction,
        runStart: derivedRunStartIso,
        siteTotalAtFlip: derived.totalAtRunStart,
      });
      // simple dedupe memory (optional)
      try {
        localStorage.setItem(
          "shift:lastFlip",
          JSON.stringify({ action: derivedAction, runStart: derivedRunStartIso })
        );
      } catch {}
    }
  });
}

/* -------- schedule aligned to the top of the minute (visible only) -------- */
function scheduleAligned(tick: () => void) {
  const scheduleNext = () => {
    // align to next minute boundary
    const now = Date.now();
    const msToNextMinute = 60_000 - (now % 60_000);
    setTimeout(() => {
      if (document.visibilityState === "visible") tick();
      setInterval(() => {
        if (document.visibilityState === "visible") tick();
      }, 60_000);
    }, msToNextMinute);
  };
  // kick once immediately (in case we just crossed a minute)
  if (document.visibilityState === "visible") tick();
  scheduleNext();
}

/* ------------------------- public start entrypoint ------------------------- */
export function startClientShiftPoller() {
  scheduleAligned(() => {
    pollOnce().catch(console.error);
  });
}
