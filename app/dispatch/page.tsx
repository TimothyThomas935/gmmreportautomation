"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import BackButton from "../../components/BackButton";
import { supabase } from "../../utils/supabaseClient";
import type { CurrentLocation } from "../../types/CurrentLocation";

const DispatchPage: NextPage = () => {
  const [data, setData] = useState<CurrentLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Supabase client:", supabase);
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('CurrentLocation')
        .select('FirstName, LastName, DateTime, TagID, ReaderName')
        .eq('Person', 1)
        .eq('ReaderName', 'Dispatch')
        .order('DateTime', { ascending: false });
    
      console.log('Filtered data:', data);
      console.log('Fetch error:', error);
    
      if (data && data.length > 0) {
        console.log('First row:', data[0]);
      } else {
        console.log('No matching rows returned');
      }
    
      setData(data as CurrentLocation[]);
      setLoading(false);
    };
    
    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 text-black">
      <div className="bg-white p-4 shadow-md">
        <div className="flex flex-row items-center space-x-4">
          <BackButton />
          <h1 className="text-3xl font-bold">Dispatch</h1>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {loading ? (
          <p className="text-lg">Loading...</p>
        ) : (
          <div className="overflow-x-auto border-2 border-gray-300 rounded-lg bg-white shadow-md max-w-full">
            <table className="table-auto border-collapse w-full text-sm text-black">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border px-4 py-2">First Name</th>
                  <th className="border px-4 py-2">Last Name</th>
                  <th className="border px-4 py-2">Tag ID</th>
                  <th className="border px-4 py-2">Reader Name</th>
                  <th className="border px-4 py-2">Date/Time</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.TagID} className="text-center">
                    <td className="border px-4 py-2">{item.FirstName ?? ""}</td>
                    <td className="border px-4 py-2">{item.LastName ?? ""}</td>
                    <td className="border px-4 py-2">{item.TagID}</td>
                    <td className="border px-4 py-2">
                      {item.ReaderName ?? ""}
                    </td>
                    <td className="border px-4 py-2">{item.DateTime ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DispatchPage;
