import { supabase } from "../utils/subabaseClient";
import type { CurrentLocation } from "../types/CurrentLocation";

// Maps area to reader names that belong to that area
export const getMinersByArea = async (area: string): Promise<any[]> => {
  const { data: readers } = await supabase
    .from("Reader")
    .select("Name")
    .eq("Area", area);

  const readerNames = readers?.map((r) => r.Name) ?? [];

  const { data, error } = await supabase
    .from("CurrentLocation")
    .select("FirstName, LastName, ReaderName, DateTime, TagID")
    .in("ReaderName", readerNames)
    .order("DateTime", { ascending: false });

  if (error) {
    console.error(`Error fetching miners for ${area}:`, error);
    return [];
  }

  // Group by TagID, keep latest
  const seen = new Set();
  const unique = data.filter((entry) => {
    if (seen.has(entry.TagID)) return false;
    seen.add(entry.TagID);
    return true;
  });

  return unique;
};
