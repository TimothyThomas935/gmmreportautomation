"use client";

import { useEffect, useState } from "react";
import { POLL_MS } from "@/app/UpDownTime/config";

type Status = {
  state: "up" | "down" | "loading";
  seconds: number; // current period length (uptime or downtime)
};

export function useProduction() {
  const [s, setS] = useState<Status>({ state: "loading", seconds: 0 });

  // Poll the server for ground truth & (re)seed the timer
  useEffect(() => {
    let mounted = true;

    const pull = async () => {
      try {
        const res = await fetch("/api/upDownTime/status", { cache: "no-store" });
        const json = await res.json();
        if (!mounted) return;

        if (!json?.ok) {
          // Don’t wipe seconds — just mark state down
          setS((prev) => ({ ...prev, state: "down" }));
          return;
        }

        const state = json.state === "up" ? "up" : "down";
        const seedSeconds = Number(json.seedSeconds ?? 0);

        setS({ state, seconds: seedSeconds });
      } catch {
        if (mounted) {
          setS((prev) => ({ ...prev, state: "down" }));
        }
      }
    };

    pull();
    const id = setInterval(pull, POLL_MS);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  // Local 1s tick that increments the current period length
  useEffect(() => {
    const id = setInterval(() => {
      setS((cur) =>
        cur.state === "loading"
          ? cur
          : { ...cur, seconds: cur.seconds + 1 }
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return s;
}
