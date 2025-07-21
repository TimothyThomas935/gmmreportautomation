"use client";

import Link from "next/link";
import type { CurrentLocation } from "../types/CurrentLocation";
import { areaPositions } from "../public/areaPositions";

type Props = {
  areas: string[];
  minersByArea: Record<string, Partial<CurrentLocation>[]>;
  buttonPaddingClasses?: string;
};

const AreaButtonGrid = ({
  areas,
  minersByArea,
  buttonPaddingClasses = "",
}: Props) => {
  return (
    <>
      {areas.map((area) => {
        const position = areaPositions[area];
        if (!position) return null;

        return (
          <Link
            key={area}
            href={`/${encodeURIComponent(area)}`}
            className={`absolute bg-blue-600 text-white rounded hover:bg-blue-700 ${buttonPaddingClasses} flex flex-col items-center`}
            style={{ top: position.top, left: position.left }}
          >
            <span className="font-semibold">
              {area} ({minersByArea[area]?.length ?? 0})
            </span>
            
            <div className="text-xs text-white mt-1">
              {minersByArea[area]?.slice(0, 5).map((miner, i) => (
                <div key={i}>
                  {miner.FirstName ?? ""} {miner.LastName ?? ""}
                </div>
              ))}
            </div>
          </Link>
        );
      })}
    </>
  );
};

export default AreaButtonGrid;
