// app/api/shift-events/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !body.action || !body.runStart) {
    return NextResponse.json({ error: "Missing action/runStart" }, { status: 400 });
  }
  const action = body.action === "UP" ? "UP" : "DOWN";
  const run_start = new Date(body.runStart).toISOString();
  const site_total_at_flip = typeof body.siteTotalAtFlip === "number" ? body.siteTotalAtFlip : null;
  const ts = body.ts ? new Date(body.ts).toISOString() : new Date().toISOString();

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("shift_events")
    .insert([{ ts, action, run_start, site_total_at_flip, source: "client" }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
