"use client";

import { useEffect, useState } from "react";
import { getMovementHistory } from "../../queries/getMovementHistory";
import NameAutocomplete from "../../components/NameAutocomplete";

const MovementReport = () => {
  const [firstName, setFirstName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
  
    const start = startDate ? `${startDate} 00:00:00+00` : undefined;
    const end = endDate ? `${endDate} 23:59:59+00` : undefined;
  
    const data = await getMovementHistory(
      firstName.trim(),
      start,
      end
    );
  
    setResults(data);
    setLoading(false);
  };
  

  const clearFilters = () => {
    setFirstName("");
    setStartDate("");
    setEndDate("");
    setResults([]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen text-black">
      <h1 className="text-3xl font-bold mb-4">Movement History</h1>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <NameAutocomplete value={firstName} onChange={setFirstName} />
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

        <button
          onClick={fetchData}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Filter
        </button>

        <button
          onClick={clearFilters}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Clear
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
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
  );
};

export default MovementReport;
