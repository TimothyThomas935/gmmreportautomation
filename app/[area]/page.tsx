"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getReadersWithMinersByArea } from "../../queries/getReadersWithMinersByArea";
import Header from "../../components/Header";

type ReaderWithMiners = {
  name: string;
  description: string;
  miners: { FirstName: string | null; LastName: string | null }[];
};

const AreaPage = () => {
  const { area } = useParams();
  const [readers, setReaders] = useState<ReaderWithMiners[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideEmpty, setHideEmpty] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const labelToRawMap: Record<string, string> = {
    Surface: "MINE 3",
  };  

  useEffect(() => {
    const fetchData = async () => {
      const label = decodeURIComponent(area as string);
      const raw = labelToRawMap[label] || label; // default to label if no mapping
      const results = await getReadersWithMinersByArea(raw);
      setReaders(results);
      setLoading(false);
    };
  
    fetchData();
  }, [area]);
  

  return (
    <div className="p-6">
      <Header
        title={`Readers in ${decodeURIComponent(area as string)}`}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-6">
          <div className="mb-4">
            <label className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                checked={hideEmpty}
                onChange={() => setHideEmpty(!hideEmpty)}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="text-sm">Hide readers with no miners</span>
            </label>
          </div>

          {readers.map((reader) => {
            const filteredMiners = reader.miners.filter(
              (m) =>
                !searchValue.trim() ||
                m.FirstName?.toLowerCase().includes(searchValue.toLowerCase())
            );

            // Skip if hiding empty readers and no matching miners
            if (hideEmpty && filteredMiners.length === 0) return null;

            return (
              <div
                key={reader.name}
                className="border border-gray-300 rounded-lg p-4 shadow-md bg-white"
              >
                <h2 className="text-xl text-black font-semibold mb-2">
                  {reader.name}
                </h2>

                {filteredMiners.length > 0 ? (
                  <ul className="list-disc pl-6 text-gray-800">
                    {filteredMiners.map((miner, i) => (
                      <li key={i}>
                        {miner.FirstName ?? ""} {miner.LastName ?? ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No matching miners.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AreaPage;
