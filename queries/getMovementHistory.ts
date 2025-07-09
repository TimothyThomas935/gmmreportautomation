import { supabase } from "../utils/subabaseClient";

export const getMovementHistory = async (
  tagId?: string,
  startDate?: string,
  endDate?: string
) => {
  let tagIDs: number[] = [];

  if (tagId) {
    tagIDs = [Number(tagId)];
  } else if (tagId === undefined) {
    return []; // If no tagId is passed, return empty
  }

  let historyQuery = supabase
    .from("HistoryByTag")
    .select("TagID, IPPort, DateTime, NewAntennaSerialNumber")
    .order("DateTime", { ascending: false })
    .limit(1000);

  if (tagIDs.length > 0) {
    historyQuery = historyQuery.in("TagID", tagIDs);
  }

  if (startDate) historyQuery = historyQuery.gte("DateTime", startDate);
  if (endDate) historyQuery = historyQuery.lte("DateTime", endDate);

  const { data: history, error: historyError } = await historyQuery;
  if (historyError || !history) {
    console.error("History query failed:", historyError);
    return [];
  }

  const [{ data: people }, { data: readers }] = await Promise.all([
    supabase.from("CurrentLocation").select("TagID, FirstName, LastName"),
    supabase.from("Reader").select("NewAntennaSerialNumber, Name, Area"),
  ]);

  const peopleMap = new Map(
    (people ?? []).map((p) => [p.TagID, { FirstName: p.FirstName, LastName: p.LastName }])
  );

  const readerMap = new Map(
    (readers ?? []).map((r) => [r.NewAntennaSerialNumber, { Name: r.Name, Area: r.Area }])
  );

  return history.map((row) => ({
    FirstName: peopleMap.get(row.TagID)?.FirstName ?? "",
    LastName: peopleMap.get(row.TagID)?.LastName ?? "",
    ReaderName: readerMap.get(row.NewAntennaSerialNumber)?.Name ?? "",
    Area: readerMap.get(row.NewAntennaSerialNumber)?.Area ?? "",
    IPPort: row.IPPort ?? "",
    TagID: row.TagID,
    DateTime: row.DateTime ?? "",
  }));
};
