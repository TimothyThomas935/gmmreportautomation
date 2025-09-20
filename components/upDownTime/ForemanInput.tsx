"use client";

import { useId, useMemo, useState } from "react";
import { useForemen } from "./ForemanContext";

type Props = {
  placeholder?: string;
  which: "foreman1" | "foreman2";
};

export default function ForemanInput({ placeholder, which }: Props) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const { foreman1, foreman2, setForeman1, setForeman2 } = useForemen();

  const committed = which === "foreman1" ? foreman1 : foreman2;

  const canCommit = useMemo(() => {
    const v = draft.trim();
    return v.length > 0 && v !== committed;
  }, [draft, committed]);

  const commit = () => {
    if (!canCommit) return;
    const v = draft.trim();
    if (which === "foreman1") setForeman1(v);
    else setForeman2(v);
    setDraft(""); // clear input after committing
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Visible label comes from StatCard; keep this for screen readers only */}
      <label htmlFor={id} className="sr-only">
        {which === "foreman1" ? "Foreman 1 on Duty" : "Foreman 2 on Duty"}
      </label>

      <div className="flex gap-2">
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2
                     text-gray-900 placeholder:text-gray-500 shadow-sm
                     outline-none ring-0 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          inputMode="text"
          autoComplete="off"
        />

        <button
          type="button"
          onClick={commit}
          disabled={!canCommit}
          className={`shrink-0 rounded-xl px-3 py-2 font-medium shadow-sm transition
                      ring-1 ring-black/10
                      ${canCommit
                        ? "bg-slate-700 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
          aria-disabled={!canCommit}
          title={canCommit ? "Save current name" : "Enter a new name to enable"}
        >
          Change
        </button>
      </div>

      <div className="text-xs text-gray-600">
        Current: <span className="font-medium text-gray-800">{committed || "—"}</span>
      </div>
    </div>
  );
}
