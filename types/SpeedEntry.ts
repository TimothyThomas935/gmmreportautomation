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
  speed: number;
  timeFrom: string;
  timeTo: string;
};
