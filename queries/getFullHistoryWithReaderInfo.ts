// File: queries/getFullHistoryWithReaderInfo.ts
import { supabase } from "../utils/subabaseClient";
import { HistoryEntry } from "../types/HistoryEntry";

/**
 * Fetches full history entries with reader and name info.
 */
export async function getFullHistoryWithReaderInfo(
  start: Date,
  end: Date,
  readerNamesToInclude: string[] // Add this!
): Promise<HistoryEntry[]> {
  const pageSize = 1000;
  let allRows: HistoryEntry[] = [];
  let from = 0;
  let to = pageSize - 1;

  console.log(
    `Fetching HistoryByTag from ${start.toISOString()} to ${end.toISOString()}`
  );

  // 1. Fetch paginated HistoryByTag rows
  while (true) {
    const { data, error } = await supabase
      .from("HistoryByTag")
      .select("TagID, DateTime, NewAntennaSerialNumber")
      .gte("DateTime", start.toISOString())
      .lte("DateTime", end.toISOString())
      .range(from, to);

    if (error) {
      console.error("Error loading HistoryByTag batch:", error);
      break;
    }

    if (!data || data.length === 0) break;

    console.log(`Fetched ${data.length} rows (range ${from}-${to})`);
    allRows.push(...data);

    if (data.length < pageSize) break;

    from += pageSize;
    to += pageSize;
  }

  console.log(`Total HistoryByTag rows fetched: ${allRows.length}`);
  if (allRows.length === 0) return [];

  // 2. Fetch Reader metadata
  const readerSerials = Array.from(
    new Set(allRows.map((h) => h.NewAntennaSerialNumber))
  );
  const { data: readers, error: readerError } = await supabase
    .from("Reader")
    .select("NewAntennaSerialNumber, Area, Name")
    .in("NewAntennaSerialNumber", readerSerials);

  if (readerError || !readers) {
    console.error("Error loading Reader metadata:", readerError);
    return [];
  }

  console.log(`Reader rows returned: ${readers.length}`);
  const readerMap = new Map(readers.map((r) => [r.NewAntennaSerialNumber, r]));

  // 3. Fetch miner names
  const tagIDs = Array.from(new Set(allRows.map((h) => h.TagID)));
  const { data: names, error: nameError } = await supabase
    .from("CurrentLocation")
    .select("TagID, FirstName, LastName")
    .in("TagID", tagIDs);

  if (nameError || !names) {
    console.error("Error loading miner names:", nameError);
    return [];
  }

  console.log(`Miner name rows returned: ${names.length}`);
  const nameMap = new Map(names.map((n) => [n.TagID, n]));

  // 4. Enrich and return full records
  const enriched = allRows.map(
    (h): HistoryEntry => ({
      ...h,
      Reader: readerMap.get(h.NewAntennaSerialNumber),
      FirstName: nameMap.get(h.TagID)?.FirstName ?? "Unknown",
      LastName: nameMap.get(h.TagID)?.LastName ?? "Unknown",
    })
  );

  console.log(`Final enriched history entries: ${enriched.length}`);
  return enriched;
}
