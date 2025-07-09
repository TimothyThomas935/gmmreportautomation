"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDistinctAreas } from "../queries/getAllAreas";
import { getMinersByArea } from "../queries/getMinersByArea";
import type { CurrentLocation } from "../types/CurrentLocation";
import AreaButtonGrid from "../components/AreaButtonGrid";
import MapLayout from "../components/MapLayout";

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
  // Store counts and names separately
  const [minersByArea, setMinersByArea] = useState<
    Record<string, CurrentLocation[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    const fetchAreasAndMiners = async () => {
      const uniqueAreas = await getDistinctAreas();
      setAreas(uniqueAreas);

      // Fetch each area's miners lazily
      uniqueAreas.forEach(async (area) => {
        const miners = await getMinersByArea(area.raw);
        setMinersByArea((prev) => ({
          ...prev,
          [area.label]: miners,
        }));
      });

      setLoading(false); // Consider moving this if you want to wait for all miners
    };

    fetchAreasAndMiners();
  }, []);

  // 🔍 Filter miners by first name
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
      <div className="absolute top-4 left-4 z-50">
        <input
          type="text"
          placeholder="Search First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="px-3 py-1 rounded border border-gray-300 text-black"
        />
      </div>

      {loading ? (
        <p className="text-white text-xl">Loading...</p>
      ) : (
        <AreaButtonGrid
          areas={areas.map((a) => a.label)}
          minersByArea={filteredMinersByArea}
          buttonPaddingClasses={buttonPaddingClasses}
        />
      )}

      <div className="absolute z-50" style={{ bottom: "95%", right: "2%" }}>
        <Link
          href="/movementReport"
          className="bg-green-600 text-white px-4 py-2 rounded shadow-md hover:bg-green-700"
        >
          Run Movement Report
        </Link>
      </div>
    </MapLayout>
  );
};

export default AreaButtons;
