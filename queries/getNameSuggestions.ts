import { supabase } from "../utils/subabaseClient";

export const getNameSuggestions = async (prefix: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from("CurrentLocation")
    .select("FirstName")
    .ilike("FirstName", `${prefix}%`)
    .limit(10);

  if (error) {
    console.error("Error fetching name suggestions:", error);
    return [];
  }

  const uniqueNames = Array.from(
    new Set(data.map((row) => row.FirstName).filter(Boolean))
  );

  return uniqueNames;
};
