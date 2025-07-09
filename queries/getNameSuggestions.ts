import { supabase } from "../utils/subabaseClient";

type Miner = {
  FirstName: string;
  LastName: string;
  TagID: string;
};

export const getNameSuggestions = async (prefix: string): Promise<Miner[]> => {
    const { data, error } = await supabase
      .from("CurrentLocation")
      .select("FirstName, LastName, TagID")
      .ilike("FirstName", `${prefix}%`)
      .limit(10);
  
    if (error) {
      console.error("Error fetching name suggestions:", error);
      return [];
    }
  
    const seen = new Set();
    const uniqueMiners = data.filter((miner) => {
      if (!miner.TagID || seen.has(miner.TagID)) return false;
      seen.add(miner.TagID);
      return true;
    });
  
    return uniqueMiners;
  };
  