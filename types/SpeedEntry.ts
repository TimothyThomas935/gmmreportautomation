export type SpeedEntry = {
  tagID: number;
  firstName: string;
  lastName: string;
  averageSpeed: number;
  segments: SegmentSpeed[];
};

export type SegmentSpeed = {
    readerFrom: string;
    readerTo: string;
    timeFrom: string;
    timeTo: string;
    speed: number; // mph
    durationSeconds: number; // ⬅️ new
  };
  
