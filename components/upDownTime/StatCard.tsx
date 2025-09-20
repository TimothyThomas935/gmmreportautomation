// components/upDownTime/StatCard.tsx
import { ReactNode } from "react";

type Props = { label: string; value: ReactNode };

export default function StatCard({ label, value }: Props) {
  return (
    <div className="rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 p-5 flex flex-col gap-2">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
