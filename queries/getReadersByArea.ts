import { supabase } from "../utils/subabaseClient";

export const getReadersByArea = async (area: string) => {
  const { data, error } = await supabase
    .from("Reader")
    .select("Name, Status")
    .eq("Area", area);

  if (error) {
    console.error("Error fetching readers for area:", area, error);
    return [];
  }

  return data;
};
