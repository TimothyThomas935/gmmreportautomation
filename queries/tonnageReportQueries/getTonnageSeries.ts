export type TonnageRow = {
    bucket: string;   // ISO
    tagindex: number;
    tagname: string;
    total: number;
  };
  
  export async function getTonnageSeries(opts: {
    timeframe: "Last 24 Hours" | "daily" | "weekly";
    start: string; // 'YYYY-MM-DD'
    end: string;   // 'YYYY-MM-DD'
    tagindexes?: number[]; // optional
  }) {
    const tf = opts.timeframe === "Last 24 Hours" ? "Last 24 Hours" : opts.timeframe === "daily" ? "day" : "week";
    const url = new URL("/api/tonnage", window.location.origin);
    url.searchParams.set("timeframe", tf);
    url.searchParams.set("start", `${opts.start}T00:00:00Z`);
    url.searchParams.set("end", `${opts.end}T23:59:59Z`);
    if (opts.tagindexes?.length) url.searchParams.set("piles", opts.tagindexes.join(","));
  
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());
    const data: TonnageRow[] = await res.json();
    return data;
  }
  