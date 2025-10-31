// app/api/shift-events/compute/route.ts
import { NextResponse } from "next/server";
import { deriveStatusFromHourly, HourRow } from "../../../lib/shiftStatus";
import { startOfCurrentHour } from "@/utils/timeBuckets";
import pg from "pg";

// ---- DB pool (Postgres via DATABASE_URL) ----
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// ---- Implement this to read exactly what powers /api/tonnage?timeframe=hour ----
async function getHourlyRows(): Promise<HourRow[]> {
  // Example if you already have a SQL view that returns hour_index + val per pile:
  // Replace with your actual query/logic.
  const { rows } = await pool.query<HourRow>(`
    /* your real hourly source here */
    select hour_index, sum(val) as val
    from site_hourly_view_last_24h
    group by hour_index
  `);
  return rows ?? [];
}

export async function POST() {
  try {
    const rows = await getHourlyRows();                 // 0..23, 23=current hour
    const status = deriveStatusFromHourly(rows, { anchor: startOfCurrentHour() });

    if (!status) {
      return NextResponse.json({ status: "no-known-state" }, { status: 200 });
    }

    const { currentAction, runStartMs, totalAtRunStart } = status;

    // Insert if new (unique on (action, run_start))
    await pool.query(
      `
      insert into shift_events(action, run_start, site_total_at_flip)
      values ($1, to_timestamp($2/1000.0), $3)
      on conflict (action, run_start) do nothing
      `,
      [currentAction, runStartMs, totalAtRunStart ?? null]
    );

    return NextResponse.json(
      {
        status: "ok",
        action: currentAction,
        runStart: new Date(runStartMs).toISOString(),
        siteTotalAtFlip: totalAtRunStart ?? null,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[shift-events/compute] failed:", e);
    return NextResponse.json({ error: e?.message ?? "error" }, { status: 500 });
  }
}
