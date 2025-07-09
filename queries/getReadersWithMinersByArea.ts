import { supabase } from "../utils/subabaseClient";
import type { CurrentLocation } from "../types/CurrentLocation";

type ReaderWithMiners = {
  name: string;
  description: string;
  status: number | null;
  miners: Pick<CurrentLocation, "FirstName" | "LastName" | "ReaderName" | "TagID">[];
};

export const getReadersWithMinersByArea = async (
  area: string
): Promise<ReaderWithMiners[]> => {
  // Get all readers in the area, including Status
  const { data: readers, error: readerError } = await supabase
    .from("Reader")
    .select("Name, Description, Status")
    .eq("Area", area);

  if (readerError || !readers) {
    console.error("Failed to fetch readers:", readerError);
    return [];
  }

  const readerNames = readers.map((r) => r.Name);
  if (readerNames.length === 0) {
    return readers.map((r) => ({
      name: r.Name,
      description: r.Description,
      status: r.Status ?? null,
      miners: [],
    }));
  }

  // Get recent miner locations for those readers
  const { data: locations, error: locationError } = await supabase
    .from("CurrentLocation")
    .select("FirstName, LastName, ReaderName, TagID")
    .in("ReaderName", readerNames)
    .order("DateTime", { ascending: false });

  if (locationError) {
    console.error("Failed to fetch locations:", locationError);
    return [];
  }

  // Deduplicate miners by TagID (most recent only)
  const seen = new Set();
  const latest = locations.filter((l) => {
    if (seen.has(l.TagID)) return false;
    seen.add(l.TagID);
    return true;
  });

  // Map each reader to its matching miners
  return readers.map((reader) => ({
    name: reader.Name,
    description: reader.Description,
    status: reader.Status ?? null,
    miners: latest.filter((m) => m.ReaderName === reader.Name) || [],
  }));
};
