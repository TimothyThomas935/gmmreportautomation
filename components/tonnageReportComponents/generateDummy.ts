import type { ReportRow, Timeframe, Pile } from "./types";

export function generateDummyRows(
  timeframe: Timeframe,
  piles: Pile[],
  start: Date,
  end: Date
): ReportRow[] {
  const rows: ReportRow[] = [];
  const stepMs =
    timeframe === "Last 24 Hours"
      ? 60 * 60 * 1000
      : timeframe === "daily"
      ? 24 * 60 * 60 * 1000
      : 7 * 24 * 60 * 60 * 1000;
  for (let t = start.getTime(); t <= end.getTime(); t += stepMs) {
    const dt = new Date(t);
    const row: ReportRow = { timestamp: dt.toISOString() };
    for (const p of piles) {
      const seed = Math.abs(Math.sin((t / stepMs + p.id * 13) * 0.37) * 1000);
      const value = Math.round(
        seed * (timeframe === "Last 24 Hours" ? 1 : timeframe === "daily" ? 12 : 60)
      );
      row[p.name] = value;
    }
    rows.push(row);
  }
  return rows;
}
