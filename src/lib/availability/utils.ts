import type { TimeRange, UnavailableRange } from "./types";

// ─── Time conversion utilities ────────────────────────────────────────────────

/** Convert "HH:MM" string to total minutes from midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Convert total minutes from midnight to "HH:MM" string */
export function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(1440, minutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Return the check-out time given a check-in time and duration in minutes.
 * Returns null if the result overflows midnight.
 */
export function calcCheckOut(checkIn: string, durationMinutes: number): string | null {
  const start = timeToMinutes(checkIn);
  const end = start + durationMinutes;
  if (end > 1440) return null; // overflows midnight
  return minutesToTime(end);
}

// ─── Range utilities ──────────────────────────────────────────────────────────

/** Check whether two time ranges overlap (exclusive ends) */
export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  const aStart = timeToMinutes(a.start);
  const aEnd = timeToMinutes(a.end);
  const bStart = timeToMinutes(b.start);
  const bEnd = timeToMinutes(b.end);
  return aStart < bEnd && aEnd > bStart;
}

/** Check whether a room is fully available for the requested range */
export function isRoomAvailable(
  unavailableRanges: UnavailableRange[],
  requestedRange: TimeRange,
): boolean {
  return !unavailableRanges.some((r) => rangesOverlap(r, requestedRange));
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

/** Returns { left, width } as percentages of the 24-hour track */
export function getRangePosition(range: TimeRange): { left: number; width: number } {
  const startMin = timeToMinutes(range.start);
  const endMin = timeToMinutes(range.end);
  return {
    left: (startMin / 1440) * 100,
    width: ((endMin - startMin) / 1440) * 100,
  };
}

/** Returns the current-time position as a percentage of the 24-hour track */
export function getNowPosition(now: Date): number {
  const minutes = now.getHours() * 60 + now.getMinutes();
  return (minutes / 1440) * 100;
}

// ─── Duration helpers ─────────────────────────────────────────────────────────

/** Map a StayDuration value to minutes */
export function durationToMinutes(
  duration: import("./types").StayDuration,
  customHours = 4,
): number {
  switch (duration) {
    case "3h":
      return 180;
    case "6h":
      return 360;
    case "overnight":
      return 600; // 22:00 → 08:00 treated as 10h for overlap calc
    case "custom":
      return customHours * 60;
  }
}

/** Human-readable label for a duration */
export function durationLabel(
  duration: import("./types").StayDuration,
  customHours = 4,
): string {
  switch (duration) {
    case "3h":
      return "3 hours";
    case "6h":
      return "6 hours";
    case "overnight":
      return "Overnight";
    case "custom":
      return `${customHours} hours`;
  }
}

/** Price key for a given duration */
export function priceForDuration(
  room: import("./types").Room,
  duration: import("./types").StayDuration,
): number {
  switch (duration) {
    case "3h":
      return room.price3h;
    case "6h":
      return room.price6h;
    case "overnight":
      return room.overnightPrice;
    case "custom":
      return room.price3h; // fallback
  }
}

/** Format price as "299k" */
export function formatPrice(priceInK: number): string {
  return `${priceInK}k`;
}

/** Format a date for display */
export function formatDate(date: Date): string {
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
  if (isToday) return "Today";

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Check if a date is today */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/** Format date as "Mon · 19 Oct" */
export function formatDateLong(date: Date): string {
  const isT = isToday(date);
  const dayLabel = isT
    ? "Today"
    : date.toLocaleDateString("en-GB", { weekday: "short" });
  const dateStr = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  return `${dayLabel} · ${dateStr}`;
}

/** Add days to a date */
export function addDays(date: Date, delta: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}
