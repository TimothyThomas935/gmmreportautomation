import { supabase } from "../utils/subabaseClient";
import { HistoryEntry } from "../types/HistoryEntry";

async function fetchAllHistory(start: string, end: string): Promise<HistoryEntry[]> {
  const pageSize = 1000;
  let allRows: HistoryEntry[] = [];
  let from = 0;
  let to = pageSize - 1;

  console.log(`[fetchAllHistory] Start: ${start}, End: ${end}`);

  while (true) {
    console.log(`[fetchAllHistory] Fetching rows ${from} to ${to}`);
    const { data, error } = await supabase
      .from("HistoryByTag")
      .select("TagID, DateTime, NewAntennaSerialNumber")
      .gte("DateTime", start)
      .lte("DateTime", end)
      .range(from, to);

    if (error) {
      console.error("[fetchAllHistory] Error loading batch:", error);
      break;
    }

    const count = data?.length ?? 0;
    console.log(`[fetchAllHistory] Rows returned this batch: ${count}`);

    if (!data || count === 0) {
      console.log("[fetchAllHistory] No more data in this range.");
      break;
    }

    allRows.push(...data);
    console.log(`[fetchAllHistory] Total rows so far: ${allRows.length}`);

    if (count < pageSize) {
      console.log("[fetchAllHistory] Last page fetched, stopping.");
      break;
    }

    from += pageSize;
    to += pageSize;
  }

  return allRows;
}

export async function getMinersInAreaToday(area: string) {
  const today = new Date();
  const start = new Date(today);
  start.setHours(4, 0, 0, 0);

  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  console.log(`[getMinersInAreaToday] Querying area "${area}" from ${start.toISOString()} to ${end.toISOString()}`);

  const history = await fetchAllHistory(start.toISOString(), end.toISOString());

  if (!history || history.length === 0) {
    console.warn("[getMinersInAreaToday] No history data found.");
    return [];
  }

  console.log(`[getMinersInAreaToday] Total history rows fetched: ${history.length}`);

  const readerSerials = Array.from(
    new Set(history.map((h) => h.NewAntennaSerialNumber))
  );
  console.log(`[getMinersInAreaToday] Unique reader serials extracted: ${readerSerials.length}`);

  const { data: readers, error: readerError } = await supabase
    .from("Reader")
    .select("NewAntennaSerialNumber, Area, Name")
    .in("NewAntennaSerialNumber", readerSerials);

  if (readerError || !readers) {
    console.error("[getMinersInAreaToday] Error loading readers:", readerError);
    return [];
  }

  console.log(`[getMinersInAreaToday] Reader rows returned: ${readers.length}`);

  const readerMap = new Map(readers.map((r) => [r.NewAntennaSerialNumber, r]));

  const joined = history.map(
    (h): HistoryEntry => ({
      ...h,
      Reader: readerMap.get(h.NewAntennaSerialNumber),
    })
  );

  console.log(`[getMinersInAreaToday] Joined history rows: ${joined.length}`);

  const filtered = joined.filter((entry) => entry.Reader?.Area === area);
  console.log(`[getMinersInAreaToday] Filtered rows in area "${area}": ${filtered.length}`);

  const uniqueTagIDs = Array.from(new Set(filtered.map((e) => e.TagID)));
  console.log(`[getMinersInAreaToday] Unique TagIDs in area "${area}": ${uniqueTagIDs.length}`);

  if (uniqueTagIDs.length === 0) return [];

  const { data: names, error: nameError } = await supabase
    .from("CurrentLocation")
    .select("TagID, FirstName, LastName")
    .in("TagID", uniqueTagIDs);

  if (nameError || !names) {
    console.error("[getMinersInAreaToday] Error loading names:", nameError);
    return [];
  }

  console.log(`[getMinersInAreaToday] Names fetched from CurrentLocation: ${names.length}`);

  const nameMap = new Map(names.map((n) => [n.TagID, n]));

  const final = uniqueTagIDs.map((tagID) => {
    const person = nameMap.get(tagID);
    return {
      tagID,
      firstName: person?.FirstName ?? "Unknown",
      lastName: person?.LastName ?? "Unknown",
    };
  });

  console.log(`[getMinersInAreaToday] Final list to return: ${final.length} entries`);
  return final;
}
