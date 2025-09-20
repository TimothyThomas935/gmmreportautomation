"use client";

import Container from "./Container";
import PageHeader from "./PageHeader";
import StatCard from "./StatCard";
import ForemanInput from "./ForemanInput";
import PeriodTimer from "./PeriodTimer";
import { useProduction } from "./useProduction";
import { ForemanProvider } from "./ForemanContext";

export default function UpDownTimeClient() {
  const { state } = useProduction();

  const bg =
    state === "loading" ? "bg-gray-50"
    : state === "up"      ? "bg-green-100/60"
                          : "bg-red-100/60";

  const title =
    state === "loading" ? "Loading…"
    : state === "up"      ? "Uptime"
                          : "Downtime";

  return (
    <main className={`min-h-screen transition-colors duration-300 ${bg}`}>
      <ForemanProvider>
        <Container>
          <PageHeader title="Up / Down Time" subtitle="20-minute heartbeat monitor" />
          <div className="grid gap-6 md:grid-cols-3">
            <StatCard label={title} value={<PeriodTimer />} />
            <StatCard
              label="Foreman 1 on Duty"
              value={<ForemanInput which="foreman1" placeholder="Enter foreman 1 name" />}
            />
            <StatCard
              label="Foreman 2 on Duty"
              value={<ForemanInput which="foreman2" placeholder="Enter foreman 2 name" />}
            />
          </div>
        </Container>
      </ForemanProvider>
    </main>
  );
}
