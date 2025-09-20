"use client";

import { createContext, useContext, useState, PropsWithChildren } from "react";

type Foremen = {
  foreman1: string;
  foreman2: string;
};

type Ctx = Foremen & {
  setForeman1: (name: string) => void;
  setForeman2: (name: string) => void;
};

const ForemanCtx = createContext<Ctx | null>(null);

export function ForemanProvider({ children }: PropsWithChildren) {
  const [foreman1, setForeman1] = useState("");
  const [foreman2, setForeman2] = useState("");
  return (
    <ForemanCtx.Provider value={{ foreman1, foreman2, setForeman1, setForeman2 }}>
      {children}
    </ForemanCtx.Provider>
  );
}

export function useForemen() {
  const ctx = useContext(ForemanCtx);
  if (!ctx) throw new Error("useForemen must be used within <ForemanProvider>");
  return ctx;
}
