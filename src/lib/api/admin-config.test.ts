import { beforeEach, describe, expect, it } from "vitest";
import {
  getRoomTypeBookingConfig,
  resetAllRoomTypeConfigsForTest,
  updateRoomTypeBookingConfig,
} from "./booking-config";
import { getFixedSlotsAvailability } from "./availability";
import { fetchPricingQuote } from "./quote";
import {
  getPhysicalRoomsSnapshot,
  resetRoomBlocksForTest,
  setRoomBlockedStatus,
} from "./inventory";
import { clearBookingsStoreForTest, createBooking } from "./bookings";

describe("Stage UI-9: Admin Configuration for Time, Slots, Pricing & Room Blocking", () => {
  beforeEach(() => {
    resetAllRoomTypeConfigsForTest();
    resetRoomBlocksForTest();
    clearBookingsStoreForTest();
  });

  it("UI-9.1: validates duration/step rules and persists mode toggles without redeploy", async () => {
    const initial = await getRoomTypeBookingConfig("rt-dl-deluxe");
    expect(initial.customEnabled).toBe(true);

    // Invalid customMinDurationMinutes (not divisible by 30m step)
    const invalidRes = await updateRoomTypeBookingConfig({
      ...initial,
      customStepMinutes: 30,
      customMinDurationMinutes: 170,
    });
    expect(invalidRes.ok).toBe(false);

    // Valid update: disable Custom mode
    const validRes = await updateRoomTypeBookingConfig({
      ...initial,
      customEnabled: false,
    });
    expect(validRes.ok).toBe(true);

    const updated = await getRoomTypeBookingConfig("rt-dl-deluxe");
    expect(updated.customEnabled).toBe(false);
  });

  it("UI-9.2: blocks overlapping active fixed slots and warns on tight cleaning buffer", async () => {
    const cfg = await getRoomTypeBookingConfig("rt-dl-deluxe");

    // Make Slot 2 overlap Slot 1 (07:00-10:00 and 09:30-12:30)
    const overlappingSlots = cfg.fixedSlots.map((s) =>
      s.slotNumber === 2 ? { ...s, startTime: "09:30", endTime: "12:30" } : s,
    );

    const overlapRes = await updateRoomTypeBookingConfig({
      ...cfg,
      fixedSlots: overlappingSlots,
    });
    expect(overlapRes.ok).toBe(false);

    // Make Slot 2 start at 10:15 (only 15m gap < 30m cleaning buffer -> allowed with warning)
    const tightBufferSlots = cfg.fixedSlots.map((s) =>
      s.slotNumber === 2 ? { ...s, startTime: "10:15", endTime: "13:15" } : s,
    );

    const tightRes = await updateRoomTypeBookingConfig({
      ...cfg,
      fixedSlots: tightBufferSlots,
    });
    expect(tightRes.ok).toBe(true);
    expect(tightRes.warnings.length).toBeGreaterThan(0);
  });

  it("UI-9.3: reflects Admin pricing and night surcharge updates immediately in Quote & Availability APIs", async () => {
    const cfg = await getRoomTypeBookingConfig("rt-dl-deluxe");

    const saved = await updateRoomTypeBookingConfig({
      ...cfg,
      fixedBasePrice: 350000,
      customHourlyPrice: 140000,
      overnightPrice: 950000,
      nightSurchargePercent: 30,
    });
    expect(saved.ok).toBe(true);

    const slots = await getFixedSlotsAvailability("room-dl-no5", "2026-10-21");
    expect(slots[0].price).toBe(350000);

    const fixedNightQuote = await fetchPricingQuote({
      roomId: "room-dl-no5",
      propertyId: "prop-da-lat",
      mode: "FIXED",
      date: "2026-10-21",
      slotId: "slot-5",
      slotStartTime: "21:00",
      slotEndTime: "00:00",
    });
    // 350,000 + 30% (105,000) = 455,000
    expect(fixedNightQuote.baseAmount).toBe(350000);
    expect(fixedNightQuote.nightSurchargeAmount).toBe(105000);
    expect(fixedNightQuote.total).toBe(455000);

    const overnightQuote = await fetchPricingQuote({
      roomId: "room-dl-no5",
      propertyId: "prop-da-lat",
      mode: "OVERNIGHT",
      checkInDate: "2026-10-21",
      checkOutDate: "2026-10-23",
      numberOfNights: 2,
    });
    expect(overnightQuote.total).toBe(1900000);
  });

  it("UI-9.4: enforces ADMIN-only room blocking and prevents booking blocked rooms", async () => {
    // MANAGER attempt must fail with 403
    const managerAttempt = await setRoomBlockedStatus(
      "room-dl-no5",
      true,
      "MANAGER",
    );
    expect(managerAttempt.ok).toBe(false);
    if (!managerAttempt.ok) {
      expect(managerAttempt.status).toBe(403);
    }

    // ADMIN attempt succeeds
    const adminAttempt = await setRoomBlockedStatus(
      "room-dl-no5",
      true,
      "ADMIN",
    );
    expect(adminAttempt.ok).toBe(true);

    const snapshot = getPhysicalRoomsSnapshot().find(
      (r) => r.id === "room-dl-no5",
    );
    expect(snapshot?.isBlocked).toBe(true);

    // Attempting to create a booking on a blocked room is rejected
    const quote = await fetchPricingQuote({
      roomId: "room-dl-no5",
      propertyId: "prop-da-lat",
      mode: "FIXED",
      date: "2026-10-25",
      slotId: "slot-1",
      slotStartTime: "07:00",
      slotEndTime: "10:00",
    });

    const bookingAttempt = await createBooking({
      userId: "usr_1",
      guestName: "Loi Tran",
      guestEmail: "loitn@lumora.vn",
      quote,
    });
    expect(bookingAttempt.ok).toBe(false);
    if (!bookingAttempt.ok) {
      expect(bookingAttempt.errorCode).toBe("ROOM_BLOCKED");
    }
  });
});
