export type HistoryEntry = {
    TagID: number;
    DateTime: string;
    NewAntennaSerialNumber: string;
    Reader?: {
      NewAntennaSerialNumber: string;
      Area: string;
      Name: string;
    };
    FirstName?: string;
    LastName?: string;
  };
  