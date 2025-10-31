// app/api/tonnage/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server key
);

function parseTagindexes(pilesParam: string | null): number[] | null {
  if (!pilesParam) return null;
  const ids = pilesParam
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n));
  return ids.length ? ids : null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tfRaw = (searchParams.get("timeframe") ?? "day").toLowerCase(); // "hour" | "hourly" | "day" | "week" | "daily" | "weekly"
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const pilesParam = searchParams.get("piles");
  const tagindexes = parseTagindexes(pilesParam);

  try {
    // ───────────────── HOURLY (your table expects hour_index, pile, val) ─────────────────
    if (tfRaw === "hour" || tfRaw === "hourly") {
      // Use the RPC that matches your SQL you liked (hour_index/pile/val).
      // Change the name here if your function is different.
      const { data, error } = await supabase.rpc("api_hourly_tonnage_simple", {
        // include args if your function accepts filters like p_tagindexes
        // p_tagindexes: tagindexes,
      });
      if (error) throw error;

      // Ensure array; your frontend maps: hour_index, pile, val
      const rows = Array.isArray(data) ? data : [];
      return NextResponse.json(rows);
    }

    // ───────────────── DAILY / WEEKLY (bucket, tagindex, tagname, total) ─────────────────
    // Map any UI variants to RPC values
    const timeframe =
      tfRaw === "daily" ? "day" :
      tfRaw === "weekly" ? "week" :
      tfRaw; // already 'day' or 'week'

    if (!start || !end) {
      return NextResponse.json(
        { error: "start and end are required (ISO strings)" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("api_get_tonnage_series", {
      p_timeframe: timeframe,  // 'day' | 'week'
      p_start: start,
      p_end: end,
      p_tagindexes: tagindexes, // int[] or null
    });
    if (error) throw error;

    const rows = Array.isArray(data) ? data : [];
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("Error in /api/tonnage:", err?.message || err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
