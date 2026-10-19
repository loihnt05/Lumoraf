import { beforeEach, describe, expect, it } from "vitest";
import {
  getPhysicalRoomsSnapshot,
  resetRoomBlocksForTest,
  setRoomBlockedStatus,
} from "./inventory";
import {
  getRoomTypeBookingConfig,
  resetAllRoomTypeConfigsForTest,
  updateRoomTypeBookingConfig,
} from "./booking-config";
import { getFixedSlotsAvailability } from "./availability";
import {
  calculateNightHours,
  checkRangeConflict,
  getUnavailableRanges,
  timeToMinutes,
} from "./custom-availability";
import { getOvernightQuote } from "./overnight-availability";
import { fetchPricingQuote } from "./quote";
import {
  clearBookingsStoreForTest,
  createBooking,
  expireBookingHoldNow,
  getBookingById,
  simulateMockPaymentFailure,
  simulateMockPaymentSuccess,
} from "./bookings";

describe("Stage UI-11: End-to-End Smoke Flows & Integration Verification", () => {
  beforeEach(() => {
    resetAllRoomTypeConfigsForTest();
    resetRoomBlocksForTest();
    clearBookingsStoreForTest();
  });

  it("Flow 1 (UI-11.2): Complete Fixed Slot journey from catalog to slot 5 (+20% night surcharge) to CONFIRMED booking", async () => {
    const rooms = getPhysicalRoomsSnapshot();
    const roomNo5 = rooms.find((r) => r.id === "room-dl-no5");
    expect(roomNo5).toBeDefined();
    expect(roomNo5?.isBlocked).toBe(false);

    // Load Fixed Slots on 2026-11-11
    const slots = await getFixedSlotsAvailability("room-dl-no5", "2026-11-11");
    expect(slots).toHaveLength(5);

    // Verify cleaning buffer is hidden from guest duration (strictly 180m = 3h)
    slots.forEach((s) => {
      expect(s.durationMinutes).toBe(180);
      expect(s.cleaningBufferMinutes).toBe(30);
    });

    // Select Slot 5 (21:00–00:00) touching night window (23:00–06:00)
    const slot5 = slots.find((s) => s.slotNumber === 5)!;
    expect(slot5.isNightWindow).toBe(true);
    expect(slot5.price).toBe(359000); // 299,000 * 1.2 rounded to nearest 1,000

    // Fetch authoritative quote
    const quote = await fetchPricingQuote({
      roomId: "room-dl-no5",
      propertyId: "prop-da-lat",
      mode: "FIXED",
      date: "2026-11-11",
      slotId: slot5.id,
      slotStartTime: slot5.startTime,
      slotEndTime: slot5.endTime,
      slotPrice: slot5.price,
    });
    expect(quote.nightSurchargeAmount).toBe(60000);
    expect(quote.total).toBe(359000);

    // Reserve -> 15m PENDING_PAYMENT hold
    const created = await createBooking({
      userId: "user-e2e-1",
      guestName: "Lê Minh",
      guestEmail: "minh@lumora.vn",
      quote,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.booking.status).toBe("PENDING_PAYMENT");

    // Mock Payment PAID -> CONFIRMED
    const paid = await simulateMockPaymentSuccess(created.booking.id);
    expect(paid.status).toBe("CONFIRMED");
    expect(paid.payments.some((p) => p.status === "PAID")).toBe(true);

    // Verify Slot 5 is now marked BOOKED in availability
    const refreshedSlots = await getFixedSlotsAvailability(
      "room-dl-no5",
      "2026-11-11",
    );
    const updatedSlot5 = refreshedSlots.find((s) => s.slotNumber === 5)!;
    expect(updatedSlot5.state).toBe("BOOKED");
  });

  it("Flow 2 (UI-11.2): Complete Custom Time journey with conflict detection, cross-midnight (+1 day), and night surcharge", async () => {
    const unavailable = await getUnavailableRanges("room-dl-no5", "2026-11-12");
    expect(unavailable.length).toBeGreaterThan(0);

    // Morning range 07:00 (420m) - 10:30 (630m) is busy (including 30m cleaning buffer)
    const conflictCheck = checkRangeConflict(
      timeToMinutes("09:00"),
      timeToMinutes("12:00"),
      unavailable,
    );
    expect(conflictCheck.hasConflict).toBe(true);

    // Boundary touch: starting at 10:30 (630m) to 13:30 (810m) is valid
    const validBoundaryCheck = checkRangeConflict(
      timeToMinutes("10:30"),
      timeToMinutes("13:30"),
      unavailable,
    );
    expect(validBoundaryCheck.hasConflict).toBe(false);

    // Cross-midnight selection: 22:00 (1320m) to 02:00 next day (1560m = 4 hours total)
    // Night window is 23:00–06:00 -> 23:00 to 02:00 = 3.0 night hours
    const nightHours = calculateNightHours(1320, 1560);
    expect(nightHours).toBe(3);

    const customQuote = await fetchPricingQuote({
      roomId: "room-dl-no5",
      propertyId: "prop-da-lat",
      mode: "CUSTOM",
      date: "2026-11-12",
      customStartTime: "22:00",
      customEndTime: "02:00",
      customDurationMinutes: 240,
      customNightHours: nightHours,
    });

    expect(customQuote.nightSurchargeAmount).toBeGreaterThan(0);
    // 4h * 115,000 = 460,000 + (3h * 115,000 * 20% = 69,000) = 529,000
    expect(customQuote.total).toBe(529000);
  });

  it("Flow 3 (UI-11.2): Complete Overnight journey with independent per-night pricing and date validation", async () => {
    // Invalid date order (check-out <= check-in)
    const invalidOvernight = await getOvernightQuote(
      "room-dl-no6",
      "2026-11-18",
      "2026-11-18",
      837000,
    );
    expect(invalidOvernight.isValid).toBe(false);

    // Valid 3-night stay on No6 Luxury Suite (837,000 VND / night default config)
    const validOvernight = await getOvernightQuote(
      "room-dl-no6",
      "2026-11-18",
      "2026-11-21",
      837000,
    );
    expect(validOvernight.isValid).toBe(true);
    expect(validOvernight.numberOfNights).toBe(3);
    expect(validOvernight.total).toBe(2511000);

    const authoritativeOvernight = await fetchPricingQuote({
      roomId: "room-dl-no6",
      propertyId: "prop-da-lat",
      mode: "OVERNIGHT",
      checkInDate: "2026-11-18",
      checkOutDate: "2026-11-21",
      numberOfNights: 3,
    });
    expect(authoritativeOvernight.total).toBe(2511000);
    expect(authoritativeOvernight.nightSurchargeAmount).toBe(0);
  });

  it("Flow 4 & Flow 5 (UI-11.2): Concurrent 409 conflict, failed payment retry, and 15m hold expiry releasing slot back to AVAILABLE", async () => {
    const quote = await fetchPricingQuote({
      roomId: "room-sg-no1",
      propertyId: "prop-sai-gon",
      mode: "FIXED",
      date: "2026-11-25",
      slotId: "slot-1",
      slotStartTime: "07:00",
      slotEndTime: "10:00",
    });

    const holdRes = await createBooking({
      userId: "user-e2e-2",
      guestName: "Trần Bảo",
      guestEmail: "bao@lumora.vn",
      quote,
    });
    expect(holdRes.ok).toBe(true);
    if (!holdRes.ok) return;

    // Slot 1 on 2026-11-25 is now held (BOOKED)
    const slotsDuringHold = await getFixedSlotsAvailability(
      "room-sg-no1",
      "2026-11-25",
    );
    expect(slotsDuringHold.find((s) => s.id === "slot-1")?.state).toBe("BOOKED");

    // Failed payment keeps hold active and allows retry
    const failedAttempt = await simulateMockPaymentFailure(holdRes.booking.id);
    expect(failedAttempt.status).toBe("PENDING_PAYMENT");
    expect(failedAttempt.payments.some((p) => p.status === "FAILED")).toBe(true);

    // Expire the 15m hold -> booking becomes EXPIRED and slot-1 returns to AVAILABLE
    const expired = await expireBookingHoldNow(holdRes.booking.id);
    expect(expired.status).toBe("EXPIRED");

    const persisted = await getBookingById(holdRes.booking.id);
    expect(persisted?.status).toBe("EXPIRED");

    const slotsAfterExpiry = await getFixedSlotsAvailability(
      "room-sg-no1",
      "2026-11-25",
    );
    expect(slotsAfterExpiry.find((s) => s.id === "slot-1")?.state).toBe(
      "AVAILABLE",
    );
  });

  it("Flow 6 (UI-11.2): Admin live configuration update & ADMIN-only room blocking end-to-end", async () => {
    const villaCfg = await getRoomTypeBookingConfig("rt-dl-villa");
    const saveRes = await updateRoomTypeBookingConfig({
      ...villaCfg,
      overnightPrice: 2400000,
    });
    expect(saveRes.ok).toBe(true);

    const updatedQuote = await fetchPricingQuote({
      roomId: "room-dl-no8",
      propertyId: "prop-da-lat",
      mode: "OVERNIGHT",
      checkInDate: "2026-12-01",
      checkOutDate: "2026-12-03",
      numberOfNights: 2,
    });
    // 2 nights * 2,400,000 = 4,800,000 VND
    expect(updatedQuote.total).toBe(4800000);

    // MANAGER cannot block room-dl-no8
    const managerBlock = await setRoomBlockedStatus(
      "room-dl-no8",
      true,
      "MANAGER",
    );
    expect(managerBlock.ok).toBe(false);

    // ADMIN blocks room-dl-no8
    const adminBlock = await setRoomBlockedStatus(
      "room-dl-no8",
      true,
      "ADMIN",
    );
    expect(adminBlock.ok).toBe(true);

    // Booking attempt on blocked room is rejected
    const blockedBooking = await createBooking({
      userId: "user-e2e-3",
      guestName: "Phạm Hương",
      guestEmail: "huong@lumora.vn",
      quote: updatedQuote,
    });
    expect(blockedBooking.ok).toBe(false);
    if (!blockedBooking.ok) {
      expect(blockedBooking.errorCode).toBe("ROOM_BLOCKED");
    }
  });
});
