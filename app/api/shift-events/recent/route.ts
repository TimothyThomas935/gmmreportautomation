// app/api/shift-events/recent/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

type ShiftEventRow = {
  ts: string;                  // timestamptz in ISO form
  action: "UP" | "DOWN";       // matches your CHECK constraint
  run_start: string;           // timestamptz in ISO form
  site_total_at_flip: number | null;
  duration_hours: number | null;
};

type ShiftEventDto = {
  ts: string;
  action: "UP" | "DOWN";
  runStart: string;
  siteTotalAtFlip: number | null;
  runDurationHours: number | null;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "10"), 100);

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("shift_events")
    .select("ts, action, run_start, site_total_at_flip, duration_hours")
    .order("ts", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows: ShiftEventDto[] = (data ?? []).map((r: ShiftEventRow) => ({
    ts: r.ts,
    action: r.action,
    runStart: r.run_start,
    siteTotalAtFlip: r.site_total_at_flip,
    runDurationHours: r.duration_hours,
  }));

  return NextResponse.json(rows);
}
