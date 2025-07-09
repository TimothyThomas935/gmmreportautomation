"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getReadersWithMinersByArea } from "../../queries/getReadersWithMinersByArea";

type ReaderWithMiners = {
  name: string;
  description: string;
  miners: { FirstName: string | null; LastName: string | null }[];
};

const AreaPage = () => {
  const { area } = useParams();
  const [readers, setReaders] = useState<ReaderWithMiners[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideEmpty, setHideEmpty] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const decoded = decodeURIComponent(area as string);
      const results = await getReadersWithMinersByArea(decoded);
      setReaders(results);
      setLoading(false);
    };

    fetchData();
  }, [area]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Readers in {decodeURIComponent(area as string)}
      </h1>

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

          {readers
            .filter((reader) => !hideEmpty || reader.miners.length > 0)
            .map((reader) => (
              <div
                key={reader.name}
                className="border border-gray-300 rounded-lg p-4 shadow-md bg-white"
              >
                <h2 className="text-xl text-black font-semibold mb-2">
                  {reader.name}
                </h2>

                {reader.miners.length > 0 ? (
                  <ul className="list-disc pl-6 text-gray-800">
                    {reader.miners.map((miner, i) => (
                      <li key={i}>
                        {miner.FirstName ?? ""} {miner.LastName ?? ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">
                    No miners currently here.
                  </p>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default AreaPage;
