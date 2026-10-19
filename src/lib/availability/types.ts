// ─── Core availability types ──────────────────────────────────────────────────

export type TimeRange = {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
};

export type UnavailableReason = "BOOKED" | "CLEANING" | "BLOCKED" | "MAINTENANCE";

export type UnavailableRange = TimeRange & {
  reason?: UnavailableReason;
};

export type RoomType = "Standard" | "Deluxe" | "Luxury";

export type Room = {
  id: string;
  name: string;
  type: RoomType;
  image: string; // placeholder url or unsplash
  price3h: number; // in thousands VND
  price6h: number;
  overnightPrice: number;
  unavailableRanges: UnavailableRange[];
  floor?: number;
  maxGuests?: number;
  sqm?: number;
};

export type StayDuration = "3h" | "6h" | "overnight" | "custom";

export type BookingIntent = {
  date: Date;
  checkIn: string; // "HH:MM"
  duration: StayDuration;
  customHours?: number; // used when duration === "custom"
};

export type RoomAvailabilityResult = {
  room: Room;
  isAvailable: boolean;
  checkOut: string | null; // "HH:MM" – null when intent is incomplete
};

export type SortOption = "recommended" | "price-asc" | "earliest";

export type ViewMode = "day" | "week";
