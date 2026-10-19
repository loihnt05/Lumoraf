import type { UnavailableRange } from "../types/custom-time";

export function timeToMinutes(timeStr: string): number {
  const [hours, mins] = timeStr.split(":").map(Number);
  return (hours || 0) * 60 + (mins || 0);
}

export function minutesToTime(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export async function getUnavailableRanges(
  roomId: string,
  dateStr: string,
): Promise<UnavailableRange[]> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 80));

  const dayNum = parseInt(dateStr.split("-")[2] || "1", 10);
  const ranges: UnavailableRange[] = [];

  // 1. Morning booked block: 07:00 – 10:00 + 30m cleaning buffer (07:00 – 10:30)
  if (dayNum % 2 === 0 || roomId.includes("no5")) {
    ranges.push({
      id: "unav-morning",
      startDate: dateStr,
      startTime: "07:00",
      endDate: dateStr,
      endTime: "10:30",
      startMinutes: timeToMinutes("07:00"),
      endMinutes: timeToMinutes("10:30"),
      label: "Đã có khách đặt & Vệ sinh",
      reason: "BOOKED",
    });
  }

  // 2. Afternoon booked block: 14:00 – 17:00 + 30m cleaning buffer (14:00 – 17:30)
  if (dayNum % 3 === 0 || dayNum % 5 === 0) {
    ranges.push({
      id: "unav-afternoon",
      startDate: dateStr,
      startTime: "14:00",
      endDate: dateStr,
      endTime: "17:30",
      startMinutes: timeToMinutes("14:00"),
      endMinutes: timeToMinutes("17:30"),
      label: "Đã có khách đặt & Vệ sinh",
      reason: "BOOKED",
    });
  }

  return ranges;
}

export function checkRangeConflict(
  startMinutes: number,
  endMinutes: number,
  unavailableRanges: UnavailableRange[],
): { hasConflict: boolean; conflictingRange?: UnavailableRange } {
  for (const range of unavailableRanges) {
    // Overlap condition: reqStart < rangeEnd && reqEnd > rangeStart
    if (startMinutes < range.endMinutes && endMinutes > range.startMinutes) {
      return { hasConflict: true, conflictingRange: range };
    }
  }
  return { hasConflict: false };
}

export function calculateNightHours(startMinutes: number, endMinutes: number): number {
  // Night window is 23:00 (1380m) to 06:00 (360m next day)
  let nightMinutes = 0;
  const step = 30;

  for (let m = startMinutes; m < endMinutes; m += step) {
    const timeOfDay = m % 1440;
    // Between 23:00 (1380) and 24:00 (1440), or between 00:00 (0) and 06:00 (360)
    if (timeOfDay >= 1380 || timeOfDay < 360) {
      nightMinutes += step;
    }
  }

  return nightMinutes / 60;
}

export function calculateCustomQuote(
  durationMinutes: number,
  nightHours: number,
  basePrice: number = 299000,
): number {
  // Custom hourly rate carries a ~15% flexibility rate compared to Fixed 3h bundle
  const customHourlyRate = Math.round((basePrice * 1.15) / 3 / 1000) * 1000;
  const totalHours = durationMinutes / 60;
  const baseCost = Math.round((totalHours * customHourlyRate) / 1000) * 1000;
  // Night hours surcharge (+20% on hours inside 23:00 - 06:00)
  const nightSurcharge = Math.round((nightHours * customHourlyRate * 0.2) / 1000) * 1000;

  return baseCost + nightSurcharge;
}

