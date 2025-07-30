"use client";

import React, { useEffect, useState } from "react";
import { getFullHistoryWithReaderInfo } from "../../queries/getFullHistoryWithReaderInfo";
import { calculateSegmentSpeeds } from "../../utils/calculateSegmentSpeeds";
import { HistoryEntry } from "../../types/HistoryEntry";
import type { SpeedEntry, SegmentSpeed } from "../../types/SpeedEntry";

export default function SpeedReportPage() {
  const [expandedTagID, setExpandedTagID] = useState<number | null>(null);
  const [readerPath, setReaderPath] = useState<string[]>([]);
  const [speedEntries, setSpeedEntries] = useState<SpeedEntry[]>([]);

  // 1. Load reader path
  useEffect(() => {
    const fetchReaderPath = async () => {
      const res = await fetch("/HardCodedValues/speedReportReaders2Use.json");
      const data = await res.json();
      setReaderPath(data);
    };
    fetchReaderPath();
  }, []);

  // 2. Load history and calculate speeds
  useEffect(() => {
    if (!readerPath.length) return;

    const loadSpeeds = async () => {
      const today = new Date();
      const start = new Date(today);
      start.setHours(4, 0, 0, 0);
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);

      const history: HistoryEntry[] = await getFullHistoryWithReaderInfo(
        start,
        end,
        readerPath
      );
      const speedMap = calculateSegmentSpeeds(history, readerPath);

      const entries: SpeedEntry[] = Object.entries(speedMap).map(
        ([tagID, segments]) => {
          const example = history.find((h) => h.TagID === Number(tagID));
          return {
            tagID: Number(tagID),
            firstName: example?.FirstName ?? "Unknown",
            lastName: example?.LastName ?? "Unknown",
            averageSpeed:
              segments.reduce((sum, s) => sum + s.speed, 0) /
              (segments.length || 1),
            segments,
          };
        }
      );

      setSpeedEntries(entries);
    };

    loadSpeeds();
  }, [readerPath]);

  return (
    <div className="flex justify-center px-4 py-6">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold mb-6 text-white">
          Speed Report – North Mains
        </h1>

        <div className="overflow-x-auto shadow-md rounded-xl border border-gray-200">
          <table className="min-w-full table-auto bg-white text-sm text-gray-800 rounded-xl">
            <thead className="bg-gray-100 text-left text-sm font-semibold">
              <tr>
                <th className="px-4 py-3">First Name</th>
                <th className="px-4 py-3">Last Name</th>
                <th className="px-4 py-3">Tag ID</th>
                <th className="px-4 py-3">Avg. Speed (mph)</th>
                <th className="px-4 py-3">No.</th>
              </tr>
            </thead>

            <tbody>
              {speedEntries.map((entry, index) => (
                <React.Fragment key={entry.tagID}>
                  <tr
                    onClick={() =>
                      setExpandedTagID((id) =>
                        id === entry.tagID ? null : entry.tagID
                      )
                    }
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">{index + 1}</td>
                    {/* <- Row number */}
                    <td className="px-4 py-3">{entry.firstName}</td>
                    <td className="px-4 py-3">{entry.lastName}</td>
                    <td className="px-4 py-3">{entry.tagID}</td>
                    <td className="px-4 py-3">
                      {entry.averageSpeed.toFixed(1)}
                    </td>
                  </tr>
                  {expandedTagID === entry.tagID && (
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="px-4 py-3 text-sm">
                        <div className="bg-gray-100 p-3 rounded-md border border-gray-200">
                          <p className="font-medium mb-2 text-gray-700">
                            Segment Speeds:
                          </p>
                          <ul className="list-disc pl-5 space-y-1 text-gray-600">
                            {entry.segments.map((seg, i) => (
                              <li key={i}>
                                {seg.readerFrom} ({seg.timeFrom}) →{" "}
                                {seg.readerTo} ({seg.timeTo})
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
