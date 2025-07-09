"use client";

import { useEffect, useState } from "react";
import { getDistinctAreas } from "../queries/getAllAreas";
import { getMinersByArea } from "../queries/getMinersByArea";
import type { CurrentLocation } from "../types/CurrentLocation";
import AreaButtonGrid from "../components/AreaButtonGrid";
import MapLayout from "../components/MapLayout";
import Header from "../components/Header"; // ✅ import Header

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
    Record<string, CurrentLocation[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    const fetchAreasAndMiners = async () => {
      const uniqueAreas = await getDistinctAreas();
      setAreas(uniqueAreas);

      uniqueAreas.forEach(async (area) => {
        const miners = await getMinersByArea(area.raw);
        setMinersByArea((prev) => ({
          ...prev,
          [area.label]: miners,
        }));
      });

      setLoading(false);
    };

    fetchAreasAndMiners();
  }, []);

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

      {loading ? (
        <p className="text-white text-xl">Loading...</p>
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
