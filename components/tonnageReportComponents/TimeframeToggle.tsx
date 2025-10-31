"use client";
import React from "react";
import { Clock3, Calendar, BarChart3 } from "lucide-react";
import type { Timeframe } from "./types";

function Pill({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm border transition ${
        active
          ? "bg-black text-white border-black"
          : "bg-white text-zinc-700 border-zinc-300 hover:border-zinc-500"
      }`}
    >
      {children}
    </button>
  );
}

export function TimeframeToggle({
  value,
  onChange,
}: {
  value: Timeframe;
  onChange: (v: Timeframe) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Pill active={value === "Last 24 Hours"} onClick={() => onChange("Last 24 Hours")}>
        <Clock3 className="inline-block mr-2 h-4 w-4" /> Last 24 Hours
      </Pill>
      <Pill active={value === "daily"} onClick={() => onChange("daily")}>
        <Calendar className="inline-block mr-2 h-4 w-4" /> Daily
      </Pill>
      <Pill active={value === "weekly"} onClick={() => onChange("weekly")}>
        <BarChart3 className="inline-block mr-2 h-4 w-4" /> Weekly
      </Pill>
    </div>
  );
}
