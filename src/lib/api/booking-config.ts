import type { RoomTypeBookingConfig } from "@/lib/types/booking-config";
import { DEFAULT_BOOKING_CONFIG } from "@/lib/types/booking-config";

// Mock configuration map per room type (allows testing dynamic feature toggles)
const MOCK_CONFIGS: Record<string, RoomTypeBookingConfig> = {
  // Deluxe Room: All 3 modes enabled
  "rt-dl-deluxe": {
    ...DEFAULT_BOOKING_CONFIG,
    roomTypeId: "rt-dl-deluxe",
  },
  // Luxury Suite: All 3 modes enabled
  "rt-dl-luxury": {
    ...DEFAULT_BOOKING_CONFIG,
    roomTypeId: "rt-dl-luxury",
  },
  // Forest Villa: Fixed slot disabled by Admin (only Custom and Overnight enabled)
  "rt-dl-villa": {
    ...DEFAULT_BOOKING_CONFIG,
    roomTypeId: "rt-dl-villa",
    fixedEnabled: false,
    customEnabled: true,
    overnightEnabled: true,
  },
  // Minimal Studio: Overnight disabled (day-stay only)
  "rt-sg-studio": {
    ...DEFAULT_BOOKING_CONFIG,
    roomTypeId: "rt-sg-studio",
    fixedEnabled: true,
    customEnabled: true,
    overnightEnabled: false,
  },
  // Courtyard Loft: All 3 modes enabled
  "rt-sg-loft": {
    ...DEFAULT_BOOKING_CONFIG,
    roomTypeId: "rt-sg-loft",
  },
};

export async function getRoomTypeBookingConfig(
  roomTypeId: string,
): Promise<RoomTypeBookingConfig> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 50));
  return MOCK_CONFIGS[roomTypeId] ?? { ...DEFAULT_BOOKING_CONFIG, roomTypeId };
}
