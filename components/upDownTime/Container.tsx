// components/upDownTime/Container.tsx
import { PropsWithChildren } from "react";

export default function Container({ children }: PropsWithChildren) {
  return (
    <main className="min-h-screen transition-colors duration-300 data-[down=true]:bg-red-100/60">
      <section className="mx-auto max-w-6xl px-4 py-8">{children}</section>
    </main>
  );
}
