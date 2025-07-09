import { supabase } from "../utils/subabaseClient";

type Area = {
  raw: string;
  label: string;
};

export const getDistinctAreas = async (): Promise<Area[]> => {
  const { data, error } = await supabase.from("Reader").select("Area");

  if (error) {
    console.error("Error fetching areas:", error);
    return [];
  }

  const areaNameMap: Record<string, string> = {
    "MINE 3": "Surface",
  };

  const uniqueAreas = Array.from(
    new Set(
      data
        .map((item) => item.Area?.trim())
        .filter((area): area is string => !!area && area !== "")
    )
  )
    .map((raw) => ({
      raw,
      label: areaNameMap[raw] || raw,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return uniqueAreas;
};
