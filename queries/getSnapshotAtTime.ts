import { supabase } from "../utils/subabaseClient";

export const getSnapshotAtTime = async (timestamp: string) => {
  const { data, error } = await supabase
    .from("HistoryByTag")
    .select("*")
    .lte("DateTime", timestamp)
    .order("DateTime", { ascending: false });

  if (error) {
    console.error("Snapshot fetch error:", error);
    return {};
  }

  // Deduplicate by TagID
  const seen = new Set();
  const latestPerMiner = data.filter((row) => {
    if (seen.has(row.TagID)) return false;
    seen.add(row.TagID);
    return true;
  });

  // Group by NewAntennaSerialNumber
  const grouped: Record<string, typeof latestPerMiner> = {};
  for (const row of latestPerMiner) {
    const area = row.NewAntennaSerialNumber?.toString() ?? "Unknown";
    if (!grouped[area]) grouped[area] = [];
    grouped[area].push(row);
  }

  return grouped;
};
