// /app/api/cron/shift-monitor/route.ts
import { NextResponse } from "next/server";
import { updateShiftStatus } from "../../../lib/shiftStatus"; // your logic to detect flips

export const config = {
  schedule: "*/5 * * * *", // every 5 minutes (standard cron syntax)
};

export async function GET() {
  await updateShiftStatus();
  return NextResponse.json({ ok: true });
}
