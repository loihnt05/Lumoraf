import { beforeEach, describe, expect, it } from "vitest";
import { fetchPricingQuote } from "./quote";
import {
  clearBookingsStoreForTest,
  createBooking,
  expireBookingHoldNow,
  simulateMockPaymentFailure,
  simulateMockPaymentSuccess,
} from "./bookings";

describe("Stage UI-7 & UI-8: Authoritative Quote, Reserve & Mock Payment", () => {
  beforeEach(() => {
    clearBookingsStoreForTest();
  });

  it("UI-7.1: computes Fixed 3h quote cheaper than Custom 3h quote and applies +20% night surcharge", async () => {
    const fixedQuote = await fetchPricingQuote({
      roomId: "room-dl-no5",
      propertyId: "prop-da-lat",
      mode: "FIXED",
      date: "2026-10-20",
      slotId: "slot-1",
      slotStartTime: "07:00",
      slotEndTime: "10:00",
    });

    const customQuote = await fetchPricingQuote({
      roomId: "room-dl-no5",
      propertyId: "prop-da-lat",
      mode: "CUSTOM",
      date: "2026-10-20",
      customStartTime: "10:30",
      customEndTime: "13:30",
      customDurationMinutes: 180,
      customNightHours: 0,
    });

    expect(fixedQuote.total).toBe(299000);
    expect(fixedQuote.nightSurchargeAmount).toBe(0);
    expect(customQuote.total).toBeGreaterThan(fixedQuote.total);

    const nightFixedQuote = await fetchPricingQuote({
      roomId: "room-dl-no5",
      propertyId: "prop-da-lat",
      mode: "FIXED",
      date: "2026-10-20",
      slotId: "slot-5",
      slotStartTime: "21:00",
      slotEndTime: "00:00",
    });

    expect(nightFixedQuote.nightSurchargeAmount).toBe(60000);
    expect(nightFixedQuote.total).toBe(359000);
  });

  it("UI-8.1: creates PENDING_PAYMENT booking and blocks overlapping booking with BOOKING_CONFLICT", async () => {
    const quote = await fetchPricingQuote({
      roomId: "room-dl-no5",
      propertyId: "prop-da-lat",
      mode: "FIXED",
      date: "2026-10-22",
      slotId: "slot-2",
      slotStartTime: "10:30",
      slotEndTime: "13:30",
    });

    const first = await createBooking({
      userId: "usr_1",
      guestName: "Loi Tran",
      guestEmail: "loitn@lumora.vn",
      quote,
    });

    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.booking.status).toBe("PENDING_PAYMENT");

    // Second overlapping request on the same room & time must be rejected
    const second = await createBooking({
      userId: "usr_2",
      guestName: "Another Guest",
      guestEmail: "guest2@lumora.vn",
      quote,
    });

    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.errorCode).toBe("BOOKING_CONFLICT");
    }
  });

  it("UI-8.1: returns PRICE_CHANGED with refreshedQuote when server price updates before reserve", async () => {
    const quote = await fetchPricingQuote({
      roomId: "room-dl-no6",
      propertyId: "prop-da-lat",
      mode: "OVERNIGHT",
      checkInDate: "2026-10-25",
      checkOutDate: "2026-10-27",
      numberOfNights: 2,
    });

    const res = await createBooking({
      userId: "usr_1",
      guestName: "Loi Tran",
      guestEmail: "loitn@lumora.vn",
      quote,
      simulatePriceChange: true,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errorCode).toBe("PRICE_CHANGED");
      expect(res.refreshedQuote?.total).toBeGreaterThan(quote.total);
    }
  });

  it("UI-8.2 & UI-8.3: supports mock payment failure retry, idempotent confirmation, and hold expiry", async () => {
    const quote = await fetchPricingQuote({
      roomId: "room-dl-no6",
      propertyId: "prop-da-lat",
      mode: "FIXED",
      date: "2026-10-28",
      slotId: "slot-3",
      slotStartTime: "14:00",
      slotEndTime: "17:00",
    });

    const created = await createBooking({
      userId: "usr_1",
      guestName: "Loi Tran",
      guestEmail: "loitn@lumora.vn",
      quote,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    // 1. Simulate failed payment -> booking stays PENDING_PAYMENT
    const afterFail = await simulateMockPaymentFailure(created.booking.id);
    expect(afterFail.status).toBe("PENDING_PAYMENT");
    expect(afterFail.payments.some((p) => p.status === "FAILED")).toBe(true);

    // 2. Retry and succeed -> booking transitions to CONFIRMED
    const afterSuccess = await simulateMockPaymentSuccess(created.booking.id);
    expect(afterSuccess.status).toBe("CONFIRMED");
    expect(afterSuccess.payments.some((p) => p.status === "PAID")).toBe(true);

    // 3. Double success is idempotent
    const secondSuccess = await simulateMockPaymentSuccess(created.booking.id);
    expect(secondSuccess.status).toBe("CONFIRMED");
    expect(secondSuccess.confirmedAt).toBe(afterSuccess.confirmedAt);
  });

  it("UI-8.2: rejects payment if 15-minute hold has expired", async () => {
    const quote = await fetchPricingQuote({
      roomId: "room-dl-no5",
      propertyId: "prop-da-lat",
      mode: "FIXED",
      date: "2026-10-29",
      slotId: "slot-1",
      slotStartTime: "07:00",
      slotEndTime: "10:00",
    });

    const created = await createBooking({
      userId: "usr_1",
      guestName: "Loi Tran",
      guestEmail: "loitn@lumora.vn",
      quote,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const expired = await expireBookingHoldNow(created.booking.id);
    expect(expired.status).toBe("EXPIRED");

    await expect(
      simulateMockPaymentSuccess(created.booking.id),
    ).rejects.toThrow(/hết hạn/);
  });
});
