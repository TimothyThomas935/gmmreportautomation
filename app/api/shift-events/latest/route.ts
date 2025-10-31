// app/api/shift-events/latest/route.ts
import { NextResponse } from "next/server";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export async function GET() {
  try {
    const { rows } = await pool.query(`
      select action, run_start, site_total_at_flip, ts
      from shift_events
      order by ts desc
      limit 1
    `);

    if (!rows?.length) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    const r = rows[0];
    return NextResponse.json(
      {
        exists: true,
        action: r.action,                                 // "UP" | "DOWN"
        runStart: new Date(r.run_start).toISOString(),
        siteTotalAtFlip: r.site_total_at_flip,
        loggedAt: new Date(r.ts).toISOString(),
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[shift-events/latest] failed:", e);
    return NextResponse.json({ error: e?.message ?? "error" }, { status: 500 });
  }
}
