"use client";
import React, { useEffect, useRef } from "react";
import type { Pile } from "./types";

export function PileSelector({
  piles,
  selected,
  onChange,
}: {
  piles: Pile[];
  selected: number[]; // pile ids
  onChange: (next: number[]) => void;
}) {
  const allChecked = selected.length === piles.length;
  const toggleAll = () => onChange(allChecked ? [] : piles.map((p) => p.id));

  const detailsRef = useRef<HTMLDetailsElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        detailsRef.current?.open &&
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        detailsRef.current.open = false;
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && detailsRef.current?.open) {
        detailsRef.current.open = false;
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <details ref={detailsRef} className="group">
        <summary className="cursor-pointer flex items-center gap-2 border border-white rounded-xl px-3 py-2 text-sm select-none bg-black text-white">
          Select piles
          <svg
            className="h-4 w-4 ml-1 transition group-open:rotate-180"
            viewBox="0 0 16 16"
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" fill="none" />
          </svg>
        </summary>

        {/* floating dropdown — black background */}
        <div className="absolute left-0 mt-2 w-56 border border-white rounded-xl p-3 bg-black text-white shadow-sm z-50">
          <label className="flex items-center gap-2 text-sm mb-2">
            <input type="checkbox" checked={allChecked} onChange={toggleAll} />
            <span className="font-medium">All piles</span>
          </label>

          <div className="max-h-48 overflow-auto pr-1">
            {piles.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-2 text-sm py-1"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={(e) =>
                    onChange(
                      e.target.checked
                        ? [...selected, p.id]
                        : selected.filter((id) => id !== p.id)
                    )
                  }
                />
                {p.name}
              </label>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
