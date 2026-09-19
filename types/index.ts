export type WorkLocation = 'oficina' | 'casa';

export interface TimeEntry {
  id: string;
  date: string; // YYYY-MM-DD
  location: WorkLocation;
  startTime: number; // timestamp in ms
  endTime: number; // timestamp in ms
  durationSeconds: number;
  notes?: string;
}

export interface ActiveShift {
  startTime: number; // timestamp in ms
  date: string;
  location: WorkLocation;
}

