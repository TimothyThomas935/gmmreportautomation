"use client";

import { useEffect, useState } from "react";
import { getDistinctAreas } from "../queries/getAllAreas";
import { getMinersByArea } from "../queries/getMinersByArea";
import type { CurrentLocation } from "../types/CurrentLocation";
import AreaButtonGrid from "../components/AreaButtonGrid";
import MapLayout from "../components/MapLayout";
import Header from "../components/Header";
import { getSnapshotAtTime } from "../queries/getSnapshotAtTime";

type Area = {
  raw: string;
  label: string;
};

const buttonPaddingClasses =
  "text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl " +
  "px-1 sm:px-2 md:px-2 lg:px-2 xl:px-2 " +
  "py-0.5 sm:py-1 md:py-1 lg:py-1 xl:py-1";

const AreaButtons = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [minersByArea, setMinersByArea] = useState<
    Record<string, Partial<CurrentLocation>[]>
  >({});

  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [useSnapshot, setUseSnapshot] = useState(false);

  useEffect(() => {
    const fetchAreasAndMiners = async () => {
      const uniqueAreas = await getDistinctAreas();
      setAreas(uniqueAreas);

      // If snapshot mode, get all data and group
      if (useSnapshot && date && time) {
        const timestamp = `${date}T${time}:00+00:00`;

        const snapshot = await getSnapshotAtTime(timestamp);
        console.log("Snapshot timestamp:", timestamp);


        // Group by ReaderName or Area
        const grouped: Record<string, Partial<CurrentLocation>[]> = {};
        for (const rows of Object.values(snapshot)) {
          for (const row of rows) {
            const area = row.ReaderName ?? "Unknown"; // fallback if needed
            if (!grouped[area]) grouped[area] = [];
            grouped[area].push(row);
          }
        }
        setMinersByArea(grouped);
      } else {
        // Live mode
        for (const area of uniqueAreas) {
          const miners = await getMinersByArea(area.raw);
          setMinersByArea((prev) => ({
            ...prev,
            [area.label]: miners,
          }));
        }
      }

      setLoading(false);
    };

    fetchAreasAndMiners();
    setLoading(false);
  }, [date, time, useSnapshot]);

  const filteredMinersByArea = Object.fromEntries(
    Object.entries(minersByArea).map(([area, miners]) => [
      area,
      firstName.trim()
        ? miners.filter((m) =>
            m.FirstName?.toLowerCase().includes(firstName.toLowerCase())
          )
        : miners,
    ])
  );

  return (
    <MapLayout>
      <Header
        title="Live Location"
        searchValue={firstName}
        onSearchChange={setFirstName}
      />

      <div className="flex gap-2 items-center mb-4 px-4">
        <label className="text-black">
          <input
            type="checkbox"
            checked={useSnapshot}
            onChange={() => setUseSnapshot(!useSnapshot)}
            className="mr-2"
          />
          Use Snapshot
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="text-black px-2 py-1 rounded"
          disabled={!useSnapshot}
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="px-2 py-1 text-black rounded"
          disabled={!useSnapshot}
        />
      </div>

      {loading ? (
        <p className="text-black text-xl">Loading...</p>
      ) : (
        <AreaButtonGrid
          areas={areas.map((a) => a.label)}
          minersByArea={filteredMinersByArea}
          buttonPaddingClasses={buttonPaddingClasses}
        />
      )}
    </MapLayout>
  );
};

export default AreaButtons;
