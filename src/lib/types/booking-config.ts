export type BookingMode = "FIXED" | "CUSTOM" | "OVERNIGHT";

export type RoomTypeBookingConfig = {
  roomTypeId: string;
  // Fixed slot configuration
  fixedEnabled: boolean;
  fixedDurationMinutes: number; // e.g. 180 min
  fixedCleaningBufferMinutes: number; // e.g. 30 min

  // Custom time configuration
  customEnabled: boolean;
  customStepMinutes: number; // e.g. 30 min
  customMinDurationMinutes: number; // e.g. 180 min
  customMaxDurationMinutes: number | null; // e.g. null (no max)
  customCleaningBufferMinutes: number; // e.g. 30 min

  // Overnight configuration
  overnightEnabled: boolean;
  overnightCheckInTime: string; // e.g. "14:00"
  overnightCheckOutTime: string; // e.g. "11:00"
  overnightCleaningBufferMinutes: number; // e.g. 60 min

  // Night window surcharge configuration
  nightWindowStart: string; // e.g. "23:00"
  nightWindowEnd: string; // e.g. "06:00"
  nightSurchargePercent: number; // e.g. 20 (20%)
};

export const DEFAULT_BOOKING_CONFIG: RoomTypeBookingConfig = {
  roomTypeId: "default",
  fixedEnabled: true,
  fixedDurationMinutes: 180,
  fixedCleaningBufferMinutes: 30,
  customEnabled: true,
  customStepMinutes: 30,
  customMinDurationMinutes: 180,
  customMaxDurationMinutes: null,
  customCleaningBufferMinutes: 30,
  overnightEnabled: true,
  overnightCheckInTime: "14:00",
  overnightCheckOutTime: "11:00",
  overnightCleaningBufferMinutes: 60,
  nightWindowStart: "23:00",
  nightWindowEnd: "06:00",
  nightSurchargePercent: 20,
};
