// File: utils/calculateSegmentSpeeds.ts
import { HistoryEntry } from "../types/HistoryEntry";
import { SegmentSpeed } from "../types/SpeedEntry";

// Assume distances between readers (hardcoded for now)
const distances: Record<string, number> = {
  "A→B": 1000, // feet
  "B→C": 1200,
  "C→D": 800,
  // Add more as needed
};

export function calculateSegmentSpeeds(
  history: HistoryEntry[],
  readerPath: string[]
): Record<number, SegmentSpeed[]> {
  const byTag: Record<number, HistoryEntry[]> = {};

  for (const entry of history) {
    if (!byTag[entry.TagID]) byTag[entry.TagID] = [];
    byTag[entry.TagID].push(entry);
  }

  const results: Record<number, SegmentSpeed[]> = {};

  for (const [tagIDStr, entries] of Object.entries(byTag)) {
    const tagID = Number(tagIDStr);
    entries.sort(
      (a, b) => new Date(a.DateTime).getTime() - new Date(b.DateTime).getTime()
    );

    const segments: SegmentSpeed[] = [];

    for (let i = 0; i < readerPath.length - 1; i++) {
      const from = readerPath[i];
      const to = readerPath[i + 1];

      let lastSeenAtFrom: HistoryEntry | null = null;

      for (const entry of entries) {
        const readerName = entry.Reader?.Name;
        if (!readerName) continue;

        if (readerName === from) {
          lastSeenAtFrom = entry;
        }

        if (readerName === to && lastSeenAtFrom) {
          const timeFrom = new Date(lastSeenAtFrom.DateTime).getTime();
          const timeTo = new Date(entry.DateTime).getTime();
          const durationSeconds = Math.round((timeTo - timeFrom) / 1000);

          segments.push({
            readerFrom: from,
            readerTo: to,
            timeFrom: lastSeenAtFrom.DateTime,
            timeTo: entry.DateTime,
            speed: 0, // dummy
            durationSeconds,
          });

          lastSeenAtFrom = null;
        }
      }
    }

    if (segments.length > 0) {
      results[tagID] = segments;
    }
  }

  return results;
}
