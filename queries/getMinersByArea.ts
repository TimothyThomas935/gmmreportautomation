import { supabase } from "../utils/subabaseClient";
import type { CurrentLocation } from "../types/CurrentLocation";

export const getMinersByArea = async (
  area: string,
  timestamp?: string
): Promise<
  Pick<
    CurrentLocation,
    "FirstName" | "LastName" | "ReaderName" | "DateTime" | "TagID"
  >[]
> => {
  const { data: readers } = await supabase
    .from("Reader")
    .select("Name")
    .eq("Area", area);

  const readerNames = readers?.map((r) => r.Name) ?? [];

  const query = supabase
    .from("CurrentLocation")
    .select("FirstName, LastName, ReaderName, DateTime, TagID")
    .in("ReaderName", readerNames)
    .lte("DateTime", timestamp)
    .order("TagID", { ascending: true }) // to group
    .order("DateTime", { ascending: false }); // newest first per tag

  const { data, error } = await query;

  if (error) {
    console.error(`Error fetching miners for ${area}:`, error);
    return [];
  }

  // Deduplicate by TagID — keep latest record per miner
  const seen = new Set();
  const unique = data.filter((entry) => {
    if (seen.has(entry.TagID)) return false;
    seen.add(entry.TagID);
    return true;
  });

  return unique;
};
