"use client";

import { useEffect, useState } from "react";
import { getMovementHistory } from "../../queries/getMovementHistory";
import { getDistinctAreas } from "../../queries/getAllAreas";
import Header from "../../components/Header";
import MapLayout from "../../components/MapLayout";
import AreaButtonGrid from "../../components/AreaButtonGrid";
import { areaPositions } from "../../public/HardCodedValues/areaPositions";
import MovementPathsOverlay from "../../components/MovementPathsOverlay";

type Miner = {
  FirstName: string;
  LastName: string;
  TagID: string;
};

const MovementReport = () => {
  const [selectedMiner, setSelectedMiner] = useState<Miner | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [areas, setAreas] = useState<{ raw: string; label: string }[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const fetchData = async () => {
    if (!selectedMiner?.TagID) return;
    setLoading(true);
    const start = startDate ? `${startDate} 00:00:00+00` : undefined;
    const end = endDate ? `${endDate} 23:59:59+00` : undefined;
    const data = await getMovementHistory(selectedMiner.TagID, start, end);
    setResults(data);
    setLoading(false);
  };

  const [snapshotTime, setSnapshotTime] = useState("");
  const getSnapshotResults = () => {
    if (!snapshotTime || !startDate) return [];

    const snapshotDateTime = new Date(`${startDate}T${snapshotTime}`);
    return results.filter((row) => {
      const rowTime = new Date(row.DateTime);
      const diff = Math.abs(rowTime.getTime() - snapshotDateTime.getTime());
      return diff < 5 * 60 * 1000; // within 5 minutes
    });
  };

  const clearFilters = () => {
    setSelectedMiner(null);
    setStartDate("");
    setEndDate("");
    setResults([]);
  };

  const getMinerCountsByArea = () => {
    const counts: Record<string, number> = {};
    for (const row of results) {
      if (row.Area) {
        counts[row.Area] = (counts[row.Area] || 0) + 1;
      }
    }
    return counts;
  };

  const getPathCounts = () => {
    const counts: Record<string, number> = {};

    for (let i = 1; i < results.length; i++) {
      const from = results[i - 1].Area;
      const to = results[i].Area;
      if (from && to && from !== to) {
        const key = `${from}->${to}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    }

    return Object.entries(counts).map(([key, count]) => {
      const [from, to] = key.split("->");
      return { from, to, count };
    });
  };

  useEffect(() => {
    const fetchAreas = async () => {
      const uniqueAreas = await getDistinctAreas();
      setAreas(uniqueAreas);
    };
    fetchAreas();
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen text-black">
      <Header
        title="Movement History"
        searchValue={searchValue}
        onSearchChange={(value) => {
          setSearchValue(value);
          if (!value) setSelectedMiner(null);
        }}
        onSelect={(miner) => {
          setSelectedMiner(miner);
          setSearchValue(miner.FirstName);
        }}
      />

      <div className="p-6">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <input
            type="time"
            value={snapshotTime}
            onChange={(e) => setSnapshotTime(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <button
            onClick={fetchData}
            disabled={!selectedMiner}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Run Movement Report
          </button>
          <button
            onClick={clearFilters}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Clear
          </button>
          <label className="inline-flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showMap}
              onChange={() => setShowMap(!showMap)}
              disabled={!selectedMiner}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <span
              className={`text-sm ${!selectedMiner ? "text-gray-400" : ""}`}
            >
              Show Map
            </span>
          </label>
        </div>

        {selectedMiner && (
          <div className="text-sm text-gray-700 mb-4">
            Selected: {selectedMiner.FirstName} {selectedMiner.LastName} (TagID:{" "}
            {selectedMiner.TagID})
          </div>
        )}

        {/* Results */}
        {loading ? (
          <p>Loading...</p>
        ) : showMap ? (
          <div className="relative flex-grow border rounded overflow-hidden min-h-[70vh]">
            <MapLayout>
              <AreaButtonGrid
                areas={areas.map((a) => a.label)}
                minersByArea={
                  snapshotTime
                    ? Object.fromEntries(
                        getSnapshotResults().map((r) => [r.Area, [{}]])
                      )
                    : Object.fromEntries(
                        Object.entries(getMinerCountsByArea()).map(
                          ([area, count]) => [area, Array(count).fill({})]
                        )
                      )
                }
              />
              <MovementPathsOverlay paths={getPathCounts()} />
            </MapLayout>
          </div>
        ) : results.length > 0 ? (
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-4 py-2">First Name</th>
                <th className="border px-4 py-2">Last Name</th>
                <th className="border px-4 py-2">Reader</th>
                <th className="border px-4 py-2">Area</th>
                <th className="border px-4 py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, index) => (
                <tr key={index}>
                  <td className="border px-4 py-2">{row.FirstName}</td>
                  <td className="border px-4 py-2">{row.LastName}</td>
                  <td className="border px-4 py-2">{row.ReaderName}</td>
                  <td className="border px-4 py-2">{row.Area}</td>
                  <td className="border px-4 py-2">{row.DateTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No results found.</p>
        )}
      </div>
    </div>
  );
};

export default MovementReport;
