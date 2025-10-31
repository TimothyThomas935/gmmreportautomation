"use client";
import React from "react";
import { TimeframeToggle } from "./TimeframeToggle";
import { DateRangePicker } from "./DateRangePicker";
import { PileSelector } from "./PileSelector";
import type { Timeframe, Pile } from "./types.js";

export function Toolbar({
  timeframe,
  onTimeframeChange,
  piles,
  selectedPileIds,
  onSelectedPilesChange,
  range,
  onRangeChange,
}: {
  timeframe: Timeframe;
  onTimeframeChange: (t: Timeframe) => void;
  piles: Pile[];
  selectedPileIds: number[];
  onSelectedPilesChange: (ids: number[]) => void;
  range: { start: string; end: string };
  onRangeChange: (r: { start: string; end: string }) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-3 items-center">
      <TimeframeToggle value={timeframe} onChange={onTimeframeChange} />
      <div className="flex flex-wrap gap-3">
        <DateRangePicker
          start={range.start}
          end={range.end}
          onChange={onRangeChange}
          disabled={timeframe === "Last 24 Hours"}
        />
      </div>
      <PileSelector
        piles={piles}
        selected={selectedPileIds}
        onChange={onSelectedPilesChange}
      />
    </div>
  );
}
