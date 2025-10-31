import { hourIndexToLocalMs, startOfCurrentHour } from "@/utils/timeBuckets";

export type HourRow = { hour_index: number; val?: number };

export type DerivedStatus = {
  currentAction: "UP" | "DOWN";
  runStartMs: number; // epoch ms for start-of-hour
  perHour: Array<{ t: number; total: number; hasSample: boolean; isUp: boolean | null }>;
  totalAtRunStart?: number;
};

export function deriveStatusFromHourly(
  rows: HourRow[],
  opts?: { threshold?: number; anchor?: Date }
): DerivedStatus | null {
  const THRESHOLD = opts?.threshold ?? 50;
  const anchor = opts?.anchor ?? startOfCurrentHour();

  // 1) aggregate totals by anchored hour
  const totals = new Map<number, number>();
  for (const r of rows ?? []) {
    const key = hourIndexToLocalMs(r.hour_index ?? 0, anchor);
    totals.set(key, (totals.get(key) ?? 0) + (r.val ?? 0));
  }

  // 2) build 24h window (oldest → newest)
  const starts: number[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(anchor);
    d.setHours(d.getHours() - i);
    starts.push(d.getTime());
  }

  const perHour = starts.map((t) => {
    const total = totals.get(t) ?? 0;
    const hasSample = totals.has(t);
    const isUp: boolean | null = hasSample ? total >= THRESHOLD : null;
    return { t, total, hasSample, isUp };
  });

  // 3) locate most recent KNOWN hour
  let idx = perHour.length - 1;
  while (idx >= 0 && perHour[idx].isUp === null) idx--;
  const currentKnown = idx >= 0 ? perHour[idx] : null;
  if (!currentKnown) return null;

  const currentAction: "UP" | "DOWN" = currentKnown.isUp ? "UP" : "DOWN";

  // 4) walk backward (skipping unknowns) to find start of the current run
  let runStartMs = currentKnown.t;
  for (let i = idx - 1; i >= 0; i--) {
    const h = perHour[i];
    if (h.isUp === null) continue;
    if ((h.isUp ? "UP" : "DOWN") !== currentAction) break;
    runStartMs = h.t;
  }

  return {
    currentAction,
    runStartMs,
    perHour,
    totalAtRunStart: totals.get(runStartMs) ?? undefined,
  };
}
