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
      const { data, error } = await supabase.rpc("api_hourly_tonnage_simple", {
        // add args here if your RPC supports filters, e.g.:
        // p_tagindexes: tagindexes,
      });
      if (error) throw error;

      const rows = Array.isArray(data) ? data : [];
      return NextResponse.json(rows);
    }

    // ───────────────── DAILY / WEEKLY (bucket, tagindex, tagname, total) ─────────────────
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
  } catch (err: unknown) {
    // standard TS pattern: narrow unknown to Error
    const message =
      err instanceof Error ? err.message : "Unknown error";

    console.error("Error in /api/tonnage:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
