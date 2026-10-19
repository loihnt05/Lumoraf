import type { SlotState } from "@/lib/booking-states";

export type FixedSlot = {
  id: string;
  slotNumber: number;
  startTime: string; // "07:00"
  endTime: string; // "10:00"
  durationMinutes: number; // 180
  cleaningBufferMinutes: number; // 30
  price: number; // in VND
  state: SlotState; // "AVAILABLE" | "SELECTED" | "BOOKED" | "UNAVAILABLE"
  isNightWindow: boolean;
  surchargeNote?: string;
};

export type DayAvailability = {
  date: string; // "YYYY-MM-DD"
  isFullyBooked: boolean;
  hasAvailableSlots: boolean;
};
