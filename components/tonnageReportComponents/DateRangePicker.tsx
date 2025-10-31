"use client";
import React from "react";

// components/tonnageReportComponents/DateRangePicker.tsx
export function DateRangePicker({ start, end, onChange, disabled = false }:{
    start: string; end: string;
    onChange: (next:{start:string; end:string}) => void;
    disabled?: boolean;
  }) {
    return (
      <div className="flex items-center gap-2">
        <input type="date" className="border rounded-xl px-3 py-2 text-sm disabled:opacity-50"
               value={start} onChange={(e)=>onChange({start:e.target.value, end})} disabled={disabled}/>
        <span className="text-zinc-500 text-sm">to</span>
        <input type="date" className="border rounded-xl px-3 py-2 text-sm disabled:opacity-50"
               value={end} onChange={(e)=>onChange({start, end:e.target.value})} disabled={disabled}/>
      </div>
    );
  }
  
