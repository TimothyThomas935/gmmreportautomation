// app/api/tonnage/sync-hourly-history/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hourIndexToLocalMs } from "@/utils/timeBuckets";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type HourlyRow = {
  hour_index: number;   // 0..23, where 23 is current hour
  pile: string | null;  // e.g. "Pile1"
  val: number | null;   // tons
};

type HistoryRow = {
  ts_start: string;
  pile_name: string;
  tons: number;
};

function startOfCurrentHour(): Date {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  return d;
}

export async function POST() {
  try {
    // 1) Get the hourly data (same RPC as your 24h view)
    const { data, error } = await supabase.rpc("api_hourly_tonnage_simple", {});
    if (error) {
      console.error("RPC api_hourly_tonnage_simple failed:", error);
      return NextResponse.json({ error: "RPC failed" }, { status: 500 });
    }

    const rows: HourlyRow[] = Array.isArray(data) ? (data as HourlyRow[]) : [];

    // 2) Anchor at the start of the current hour (local → then converted by hourIndexToLocalMs)
    const anchor = startOfCurrentHour();

    const historyRows: HistoryRow[] = [];

    for (const r of rows) {
      const h = r.hour_index;

      // Skip current hour (23), only log completed hours 0..21 this accounts for the 10 min overlap
      if (h < 0 || h > 21) continue;

      // Compute the real timestamp for this hour index the same way the UI does
      const tsMs = hourIndexToLocalMs(h, anchor);
      const tsStartIso = new Date(tsMs).toISOString();

      const pileName =
        r.pile?.replace(/(Pile)(\d+)/, "Pile $2") ?? "Unknown";

      historyRows.push({
        ts_start: tsStartIso,
        pile_name: pileName,
        tons: r.val ?? 0,
      });
    }

    if (!historyRows.length) {
      return NextResponse.json({ ok: true, message: "No rows to sync" });
    }

    // 3) Upsert into history table (idempotent)
    const { error: upsertError } = await supabase
      .from("tonnage_hourly_history")
      .upsert(historyRows, { onConflict: "ts_start,pile_name" });

    if (upsertError) {
      console.error("Upsert tonnage_hourly_history failed:", upsertError);
      return NextResponse.json({ error: "Upsert failed" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      rowsWritten: historyRows.length,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("sync-hourly-history error:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
