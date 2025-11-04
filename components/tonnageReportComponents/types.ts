export type Timeframe = "Last 24 Hours" | "daily" | "weekly";
export type Pile = { id: number; name: string };
export type ReportRow = {
    timestamp: number | string;
    [key: string]: number | string | undefined;
  };
  
