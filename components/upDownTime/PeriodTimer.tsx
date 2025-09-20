"use client";
import { useProduction } from "./useProduction";


function fmtHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function PeriodTimer() {
  const { state, seconds } = useProduction();
  const label = state === "loading" ? "—" : fmtHMS(seconds);
  return <span className="tabular-nums text-black">{label}</span>;
}
