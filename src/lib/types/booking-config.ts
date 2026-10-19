export type BookingMode = "FIXED" | "CUSTOM" | "OVERNIGHT";

export type AdminRole = "ADMIN" | "MANAGER";

export type AdminFixedSlotConfig = {
  id: string;
  slotNumber: number;
  label?: string;
  startTime: string; // e.g. "07:00"
  endTime: string; // e.g. "10:00" or "00:00"
  priceOverride: number | null; // null = use RoomType fixedBasePrice (+ night surcharge if applicable)
  isActive: boolean;
};

export type RoomTypeBookingConfig = {
  roomTypeId: string;
  // Fixed slot configuration (UI-9.1 & UI-9.2)
  fixedEnabled: boolean;
  fixedDurationMinutes: number; // e.g. 180 min
  fixedCleaningBufferMinutes: number; // e.g. 30 min
  fixedSlots: AdminFixedSlotConfig[];

  // Custom time configuration (UI-9.1)
  customEnabled: boolean;
  customStepMinutes: number; // e.g. 30 min
  customMinDurationMinutes: number; // e.g. 180 min
  customMaxDurationMinutes: number | null; // e.g. null (no max)
  customCleaningBufferMinutes: number; // e.g. 30 min

  // Overnight configuration (UI-9.1)
  overnightEnabled: boolean;
  overnightCheckInTime: string; // e.g. "14:00"
  overnightCheckOutTime: string; // e.g. "11:00"
  overnightCleaningBufferMinutes: number; // e.g. 60 min

  // Night window surcharge configuration (UI-9.1 & UI-9.3)
  nightWindowStart: string; // e.g. "23:00"
  nightWindowEnd: string; // e.g. "06:00"
  nightSurchargePercent: number; // e.g. 20 (20%)

  // Authoritative Pricing configuration per RoomType (UI-9.3)
  fixedBasePrice: number; // e.g. 299000
  customHourlyPrice: number; // e.g. 115000
  overnightPrice: number; // e.g. 837000
  currency: "VND";
};

export const DEFAULT_FIXED_SLOTS_TEMPLATE: AdminFixedSlotConfig[] = [
  {
    id: "slot-1",
    slotNumber: 1,
    label: "Slot 1 · Ca sáng",
    startTime: "07:00",
    endTime: "10:00",
    priceOverride: null,
    isActive: true,
  },
  {
    id: "slot-2",
    slotNumber: 2,
    label: "Slot 2 · Ca trưa",
    startTime: "10:30",
    endTime: "13:30",
    priceOverride: null,
    isActive: true,
  },
  {
    id: "slot-3",
    slotNumber: 3,
    label: "Slot 3 · Ca chiều",
    startTime: "14:00",
    endTime: "17:00",
    priceOverride: null,
    isActive: true,
  },
  {
    id: "slot-4",
    slotNumber: 4,
    label: "Slot 4 · Ca tối",
    startTime: "17:30",
    endTime: "20:30",
    priceOverride: null,
    isActive: true,
  },
  {
    id: "slot-5",
    slotNumber: 5,
    label: "Slot 5 · Ca đêm muộn",
    startTime: "21:00",
    endTime: "00:00",
    priceOverride: null,
    isActive: true,
  },
];

export const DEFAULT_BOOKING_CONFIG: RoomTypeBookingConfig = {
  roomTypeId: "default",
  fixedEnabled: true,
  fixedDurationMinutes: 180,
  fixedCleaningBufferMinutes: 30,
  fixedSlots: DEFAULT_FIXED_SLOTS_TEMPLATE,
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
  fixedBasePrice: 299000,
  customHourlyPrice: 115000,
  overnightPrice: 837000,
  currency: "VND",
};
