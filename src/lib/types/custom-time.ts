export type UnavailableRange = {
  id: string;
  startDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endDate: string; // "YYYY-MM-DD"
  endTime: string; // "HH:mm"
  startMinutes: number; // minutes from start of startDate (0 to 1440+)
  endMinutes: number; // minutes from start of startDate
  label: string; // "Unavailable" / "Đã bận"
  reason: "BOOKED" | "CLEANING" | "MAINTENANCE";
};

export type CustomTimeSelection = {
  startDate: string;
  startTime: string; // e.g. "10:30"
  endDate: string;
  endTime: string; // e.g. "15:00"
  durationMinutes: number; // e.g. 270 min (4.5h)
  isValidDuration: boolean; // >= 180 min
  hasConflict: boolean;
  conflictMessage?: string;
  nightHours: number; // hours falling between 23:00 and 06:00
  estimatedPrice: number;
};
