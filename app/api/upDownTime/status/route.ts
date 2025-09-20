import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { THRESHOLD_SECONDS, SAMPLE_SCAN_LIMIT } from "@/app/UpDownTime/config";

export const revalidate = 0;

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) {
    return NextResponse.json({ ok: false, error: "Missing Supabase env" }, { status: 500 });
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  // Get the most recent N rows across ALL tagindex values
  const { data: rows, error } = await sb
    .from("float_samples")
    .select("dateandtime,millitm")
    .order("dateandtime", { ascending: false })
    .order("millitm", { ascending: false })
    .limit(SAMPLE_SCAN_LIMIT);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!rows || rows.length === 0) {
    // no data at all → consider DOWN from forever ago
    return NextResponse.json({
      ok: true,
      state: "down",
      // timer should start at 0 when the first 20-min threshold is crossed;
      // with no rows, we just show the elapsed since server start (0 here).
      seedSeconds: 0,
    });
  }

  // Convert to epoch seconds (including millitm)
  const toEpoch = (r: any) =>
    new Date(r.dateandtime).getTime() / 1000 + (r.millitm ? r.millitm / 1000 : 0);

  const epochs = rows.map(toEpoch);
  const latest = epochs[0];
  const now = Date.now() / 1000;
  const sinceLatest = Math.max(0, Math.floor(now - latest));

  if (sinceLatest >= THRESHOLD_SECONDS) {
    // Currently DOWN.
    // Timer starts when the threshold is crossed: latest + THRESHOLD
    const start = latest + THRESHOLD_SECONDS;
    const seedSeconds = Math.max(0, Math.floor(now - start));
    return NextResponse.json({ ok: true, state: "down", seedSeconds });
  }

  // Currently UP. Find the most recent GAP > THRESHOLD to locate uptime start.
  // Scan adjacent pairs newest→older until we hit a big gap.
  let uptimeStart = latest; // if no large gap found within the window
  for (let i = 0; i < epochs.length - 1; i++) {
    const newer = epochs[i];
    const older = epochs[i + 1];
    if (newer - older > THRESHOLD_SECONDS) {
      // Downtime ended at `newer`; uptime started at that row time
      uptimeStart = newer;
      break;
    }
  }

  const seedSeconds = Math.max(0, Math.floor(now - uptimeStart));
  return NextResponse.json({ ok: true, state: "up", seedSeconds });
}
