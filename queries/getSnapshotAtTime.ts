import { supabase } from "../utils/subabaseClient";

export async function getSnapshotAtTime(timestamp: string) {
  // Step 1: Get latest record for each TagID at or before timestamp
  const { data: allTags, error } = await supabase
    .from("HistoryByTag")
    .select("*")
    .lte("DateTime", timestamp)
    .order("TagID", { ascending: true })
    .order("DateTime", { ascending: false });

  if (error) {
    console.error("Error fetching HistoryByTag:", error);
    return {};
  }

  // Step 2: Keep only the most recent entry per TagID
  const latestByTag: Record<number, typeof allTags[0]> = {};
  for (const entry of allTags) {
    if (!latestByTag[entry.TagID]) {
      latestByTag[entry.TagID] = entry;
    }
  }

  // Step 3: Enrich with Reader and CurrentLocation
  const enriched = await Promise.all(
    Object.values(latestByTag).map(async (entry) => {
      const [readerRes, currentRes] = await Promise.all([
        supabase
          .from("Reader")
          .select("Name, Area, Description")
          .eq("NewAntennaSerialNumber", entry.NewAntennaSerialNumber)
          .maybeSingle(),
        supabase
          .from("CurrentLocation")
          .select("FirstName, LastName, TagType, Person")
          .eq("TagID", entry.TagID)
          .maybeSingle(),
      ]);

      return {
        TagID: entry.TagID,
        history_time: entry.DateTime,
        ReaderName: readerRes.data?.Name ?? null,
        Area: readerRes.data?.Area ?? null,
        ReaderDescription: readerRes.data?.Description ?? null,
        FirstName: currentRes.data?.FirstName ?? null,
        LastName: currentRes.data?.LastName ?? null,
        TagType: currentRes.data?.TagType ?? null,
        Person: currentRes.data?.Person ?? null,
      };
    })
  );

  return enriched;
}
