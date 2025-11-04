// app/api/shift-events/recent/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "10"), 100);

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("shift_events")
    .select("ts, action, run_start, site_total_at_flip, duration_hours")
    .order("ts", { ascending: false })
    .limit(limit);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []).map(r => ({
    ts: r.ts,
    action: r.action,
    runStart: r.run_start,
    siteTotalAtFlip: r.site_total_at_flip,
    runDurationHours: r.duration_hours ?? null, // passes straight through
  }));

  return NextResponse.json(rows);
}
