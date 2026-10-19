import { beforeEach, describe, expect, it } from "vitest";
import {
  clearBookingsStoreForTest,
  createBooking,
  simulateMockPaymentSuccess,
} from "./bookings";
import { resetRoomBlocksForTest } from "./inventory";
import { fetchPricingQuote } from "./quote";
import {
  appendAuditLog,
  cancelBookingWithRefundPolicy,
  evaluateCancellationPolicy,
  getAdminMonitorMetrics,
  getGuestRoomAccessCode,
  getManagerDashboardSummary,
  performBookingCheckIn,
  performBookingCheckOut,
  reconcileMissedWebhookPayment,
  resetOperationsStoreForTest,
  runDailyRoomAccessCodeBatch,
  savePropertyInventory,
  toggleManagerPropertyAssignment,
  updateUserRole,
  updateUserStatus,
  verifyCheckInQrToken,
} from "./operations";

describe("Stage 2, Stage 6 & Stage 7 Operations, RBAC, Lifecycle & Refund Policies", () => {
  beforeEach(() => {
    resetRoomBlocksForTest();
    clearBookingsStoreForTest();
    resetOperationsStoreForTest();
  });

  it("Stage 2 (P2.2, P2.3, P2.8, P2.9): enforces Property unique slug + RBAC and idempotent Daily Room Access Code batch", async () => {
    // 1. MANAGER cannot create a brand new property (403 FORBIDDEN)
    const mgrCreate = await savePropertyInventory({
      actorRole: "MANAGER",
      assignedPropertyIds: ["prop-da-lat"],
      property: {
        name: "Lumora Nha Trang",
        slug: "lumora-nha-trang",
        city: "Nha Trang",
        address: "12 Trần Phú",
        description: "Test",
        checkInTime: "14:00",
        checkOutTime: "11:00",
        status: "ACTIVE",
      },
    });
    expect(mgrCreate.ok).toBe(false);
    if (!mgrCreate.ok) {
      expect(mgrCreate.errorCode).toBe("FORBIDDEN");
    }

    // 2. ADMIN creates a new property successfully
    const adminCreate = await savePropertyInventory({
      actorRole: "ADMIN",
      assignedPropertyIds: [],
      property: {
        name: "Lumora Hội An",
        slug: "lumora-hoi-an",
        city: "Hội An",
        address: "18 Nguyễn Thái Học",
        description: "Di sản phố cổ",
        checkInTime: "14:00",
        checkOutTime: "11:00",
        status: "ACTIVE",
      },
    });
    expect(adminCreate.ok).toBe(true);

    // 3. Duplicate slug is rejected with CONFLICT
    const duplicateSlug = await savePropertyInventory({
      actorRole: "ADMIN",
      assignedPropertyIds: [],
      property: {
        name: "Lumora Hội An 2",
        slug: "lumora-hoi-an",
        city: "Hội An",
        address: "99 Trần Phú",
        description: "Trùng slug",
        checkInTime: "14:00",
        checkOutTime: "11:00",
        status: "ACTIVE",
      },
    });
    expect(duplicateSlug.ok).toBe(false);
    if (!duplicateSlug.ok) {
      expect(duplicateSlug.errorCode).toBe("CONFLICT");
    }

    // 4. Daily Room Access Code Batch is idempotent on same validDate (P2.9)
    const firstBatch = await runDailyRoomAccessCodeBatch("2026-10-25");
    expect(firstBatch.generatedCount).toBeGreaterThan(0);
    expect(firstBatch.skippedExistingCount).toBe(0);

    const secondBatch = await runDailyRoomAccessCodeBatch("2026-10-25");
    expect(secondBatch.generatedCount).toBe(0);
    expect(secondBatch.skippedExistingCount).toBe(firstBatch.generatedCount);
  });

  it("Stage 6 (P6.1, P6.2, P6.3, P6.4, P6.8): enforces Manager Property Scope, Check-in -> Check-out transition, Last-Admin Guard, and PIN-redacted Audit Logs", async () => {
    // 1. P6.1: Da Lat Manager cannot access Sai Gon dashboard (403 FORBIDDEN)
    const forbiddenDash = await getManagerDashboardSummary({
      propertyId: "prop-sai-gon",
      actorRole: "MANAGER",
      assignedPropertyIds: ["prop-da-lat"],
    });
    expect(forbiddenDash.ok).toBe(false);
    if (!forbiddenDash.ok) {
      expect(forbiddenDash.errorCode).toBe("FORBIDDEN");
    }

    // 2. P6.2: Check-in / Check-out lifecycle guard (cannot check-out before check-in)
    const stage6Quote = await fetchPricingQuote({
      roomId: "room-dl-no5",
      propertyId: "prop-da-lat",
      mode: "FIXED",
      date: "2026-10-26",
      slotId: "slot-1",
      slotStartTime: "07:00",
      slotEndTime: "10:00",
      slotPrice: 299000,
    });
    const stage6Created = await createBooking({
      userId: "usr-guest-01",
      guestName: "Phạm Hoàng Nam",
      guestEmail: "khachhang@lumora.vn",
      quote: stage6Quote,
    });
    expect(stage6Created.ok).toBe(true);
    if (!stage6Created.ok) return;
    const confirmedBooking = await simulateMockPaymentSuccess(
      stage6Created.booking.id,
    );

    const prematureCheckOut = await performBookingCheckOut({
      bookingId: confirmedBooking.id,
      actorRole: "MANAGER",
      assignedPropertyIds: ["prop-da-lat"],
    });
    expect(prematureCheckOut.ok).toBe(false);
    if (!prematureCheckOut.ok) {
      expect(prematureCheckOut.errorCode).toBe("VALIDATION_ERROR");
    }

    const validCheckIn = await performBookingCheckIn({
      bookingId: confirmedBooking.id,
      actorRole: "MANAGER",
      assignedPropertyIds: ["prop-da-lat"],
    });
    expect(validCheckIn.ok).toBe(true);
    if (validCheckIn.ok) {
      expect(validCheckIn.data.status).toBe("CHECKED_IN");
      expect(validCheckIn.data.checkedInAt).toBeDefined();
    }

    const validCheckOut = await performBookingCheckOut({
      bookingId: confirmedBooking.id,
      actorRole: "MANAGER",
      assignedPropertyIds: ["prop-da-lat"],
    });
    expect(validCheckOut.ok).toBe(true);
    if (validCheckOut.ok) {
      expect(validCheckOut.data.status).toBe("CHECKED_OUT");
      expect(validCheckOut.data.checkedOutAt).toBeDefined();
    }

    // 3. P6.3: Cannot demote or disable the last active ADMIN
    const demoteLastAdmin = await updateUserRole({
      targetUserId: "usr-admin-01",
      newRole: "USER",
      actorRole: "ADMIN",
    });
    expect(demoteLastAdmin.ok).toBe(false);

    const disableLastAdmin = await updateUserStatus({
      targetUserId: "usr-admin-01",
      newStatus: "DISABLED",
      actorRole: "ADMIN",
    });
    expect(disableLastAdmin.ok).toBe(false);

    // 4. P6.4: Assign Sai Gon property to Da Lat Manager
    const assignRes = await toggleManagerPropertyAssignment({
      managerUserId: "usr-mgr-dalat",
      propertyId: "prop-sai-gon",
      assign: true,
      actorRole: "ADMIN",
    });
    expect(assignRes.ok).toBe(true);
    if (assignRes.ok) {
      expect(assignRes.data.assignedPropertyIds).toContain("prop-sai-gon");
    }

    // 5. P6.8: Audit Log automatically redacts any 6-digit PIN pattern
    const log = appendAuditLog({
      actorUserId: "usr-admin-01",
      actorName: "Owner Admin",
      actorRole: "ADMIN",
      action: "ROOM_CODE_BATCH_ROTATE",
      entityType: "ACCESS_CODE",
      entityId: "room-dl-no5",
      metadataSummary: "Thử nghiệm ghi PIN 654321 vào nhật ký",
    });
    expect(log.metadataSummary).toContain("[REDACTED_PIN]");
    expect(log.metadataSummary).not.toContain("654321");

    const monitor = await getAdminMonitorMetrics({ actorRole: "ADMIN" });
    expect(monitor.ok).toBe(true);
  });

  it("Stage 7 (P7.1, P7.2, P7.6, P7.7, P7.9, P7.11): evaluates 100%/50%/0% Cancellation Refund tiers, distinguishes Check-in QR vs Payment QR, and enforces Owner-only Guest PIN policy", async () => {
    // Create a pending booking and confirm it via Payment Reconciliation (P7.6)
    const quote = await fetchPricingQuote({
      roomId: "room-dl-no5",
      propertyId: "prop-da-lat",
      mode: "OVERNIGHT",
      checkInDate: "2026-10-28",
      checkOutDate: "2026-10-30",
      numberOfNights: 2,
    });

    const created = await createBooking({
      userId: "usr-guest-01",
      guestName: "Phạm Hoàng Nam",
      guestEmail: "khachhang@lumora.vn",
      quote,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const hold = created.booking;

    // P7.11: Guest CANNOT view PIN while booking is still PENDING_PAYMENT
    const pinWhilePending = await getGuestRoomAccessCode({
      bookingId: hold.id,
      currentUserId: "usr-guest-01",
    });
    expect(pinWhilePending.ok).toBe(false);

    // P7.6: Admin reconciles missed webhook payment -> CONFIRMED
    const reconciled = await reconcileMissedWebhookPayment({
      bookingId: hold.id,
      actorRole: "ADMIN",
    });
    expect(reconciled.ok).toBe(true);
    if (!reconciled.ok) return;
    expect(reconciled.data.status).toBe("CONFIRMED");
    expect(reconciled.data.checkInQrToken).toMatch(/^LMR-CHK-/);

    // P7.9: Reject Payment QR when scanned at Check-in QR scanner
    const wrongQrType = await verifyCheckInQrToken({
      qrToken: "VIETQR:LUMORA:PAY-MOCK-123",
      actorRole: "MANAGER",
      assignedPropertyIds: ["prop-da-lat"],
    });
    expect(wrongQrType.ok).toBe(false);

    // P7.9: Accept valid Check-in QR token within Manager's property scope
    const validQr = await verifyCheckInQrToken({
      qrToken: reconciled.data.checkInQrToken!,
      actorRole: "MANAGER",
      assignedPropertyIds: ["prop-da-lat"],
    });
    expect(validQr.ok).toBe(true);

    // P7.11: Non-owner is blocked with 403 FORBIDDEN, while owner gets the 6-digit PIN
    const strangerPin = await getGuestRoomAccessCode({
      bookingId: hold.id,
      currentUserId: "usr-stranger-999",
    });
    expect(strangerPin.ok).toBe(false);
    if (!strangerPin.ok) {
      expect(strangerPin.errorCode).toBe("FORBIDDEN");
    }

    const ownerPin = await getGuestRoomAccessCode({
      bookingId: hold.id,
      currentUserId: "usr-guest-01",
    });
    expect(ownerPin.ok).toBe(true);
    if (ownerPin.ok) {
      expect(ownerPin.data.codeValue).toMatch(/^\d{6}$/);
    }

    // P7.1 & P7.2: Evaluate 100%, 50%, and 0% refund tiers on OVERNIGHT booking (check-in 2026-10-28T14:00:00+07:00)
    const eval100 = evaluateCancellationPolicy(
      reconciled.data,
      "2026-10-24T10:00:00+07:00", // > 48h before check-in
    );
    expect(eval100.eligiblePercent).toBe(100);
    expect(eval100.refundAmount).toBe(reconciled.data.totalAmount);

    const eval50 = evaluateCancellationPolicy(
      reconciled.data,
      "2026-10-27T08:00:00+07:00", // ~30h before check-in (between 24h and 48h)
    );
    expect(eval50.eligiblePercent).toBe(50);

    const eval0 = evaluateCancellationPolicy(
      reconciled.data,
      "2026-10-28T10:00:00+07:00", // 4h before check-in (< 24h)
    );
    expect(eval0.eligiblePercent).toBe(0);
    expect(eval0.refundAmount).toBe(0);

    // P7.7: Execute cancellation with 50% refund and verify idempotency on second call
    const cancel1 = await cancelBookingWithRefundPolicy({
      bookingId: hold.id,
      reason: "Đổi lịch công tác",
      actorRole: "USER",
      cancelTimeISO: "2026-10-27T08:00:00+07:00",
    });
    expect(cancel1.ok).toBe(true);
    if (cancel1.ok) {
      expect(cancel1.data.booking.status).toBe("CANCELLED");
      expect(cancel1.data.refund?.eligiblePercent).toBe(50);
      expect(cancel1.data.refund?.status).toBe("REFUNDED");
    }

    const cancel2 = await cancelBookingWithRefundPolicy({
      bookingId: hold.id,
      reason: "Gọi lần 2 (idempotent)",
      actorRole: "USER",
      cancelTimeISO: "2026-10-28T10:00:00+07:00",
    });
    expect(cancel2.ok).toBe(true);
    if (cancel1.ok && cancel2.ok) {
      expect(cancel2.data.refund?.id).toBe(cancel1.data.refund?.id);
      expect(cancel2.data.refund?.refundAmount).toBe(
        cancel1.data.refund?.refundAmount,
      );
    }

    expect(typeof simulateMockPaymentSuccess).toBe("function");
  });
});
