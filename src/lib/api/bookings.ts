import { MOCK_PROPERTIES } from "../mock/inventory-data";
import { getPhysicalRoomsSnapshot } from "./inventory";
import type {
  BookingRecord,
  CreateBookingInput,
  CreateBookingResult,
  MockPaymentAttempt,
  PricingQuote,
} from "../types/quote";

const BOOKINGS_STORAGE_KEY = "lumora_bookings_v1";

// In-memory store fallback for SSR / Vitest environments without localStorage
let memoryBookingsStore: BookingRecord[] = [];

function readAllBookings(): BookingRecord[] {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return [...memoryBookingsStore];
  }
  try {
    const raw = window.localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (!raw) return [...memoryBookingsStore];
    const parsed = JSON.parse(raw) as BookingRecord[];
    memoryBookingsStore = parsed;
    return parsed;
  } catch {
    return [...memoryBookingsStore];
  }
}

function writeAllBookings(bookings: BookingRecord[]): void {
  memoryBookingsStore = [...bookings];
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    try {
      window.localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
      window.dispatchEvent(new Event("lumora_bookings_change"));
    } catch {
      // Ignore storage quota errors
    }
  }
}

function refreshExpiredStatuses(bookings: BookingRecord[]): BookingRecord[] {
  const nowMs = Date.now();
  let changed = false;

  const updated = bookings.map((b) => {
    if (b.status === "PENDING_PAYMENT" && new Date(b.expiresAt).getTime() <= nowMs) {
      changed = true;
      return {
        ...b,
        status: "EXPIRED" as const,
        updatedAt: new Date().toISOString(),
        payments: b.payments.map((p) =>
          p.status === "PENDING" ? { ...p, status: "CANCELLED" as const } : p,
        ),
      };
    }
    return b;
  });

  if (changed) {
    writeAllBookings(updated);
  }
  return updated;
}

function generateBookingCode(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LMR-${yy}${mm}${dd}-${rand}`;
}

function generatePaymentCode(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `PAY-MOCK-${rand}`;
}

export function clearBookingsStoreForTest(): void {
  memoryBookingsStore = [];
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    window.localStorage.removeItem(BOOKINGS_STORAGE_KEY);
  }
}

export function getAllBookingsSnapshot(): BookingRecord[] {
  return refreshExpiredStatuses(readAllBookings());
}

export function saveBookingsSnapshot(bookings: BookingRecord[]): void {
  writeAllBookings(bookings);
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  // Simulate transaction latency
  await new Promise((resolve) => setTimeout(resolve, 180));

  const rooms = getPhysicalRoomsSnapshot();
  const room = rooms.find((r) => r.id === input.quote.roomId);

  if (!room || room.status !== "ACTIVE") {
    return {
      ok: false,
      errorCode: "VALIDATION_ERROR",
      message: "Phòng không tồn tại hoặc đã ngừng hoạt động.",
    };
  }

  if (room.isBlocked) {
    return {
      ok: false,
      errorCode: "ROOM_BLOCKED",
      message: "Phòng này vừa được chuyển sang trạng thái bảo trì / tạm khóa.",
    };
  }

  // 1. Check simulated conflict or real overlap in active holds / confirmed / checked-in bookings
  const existingBookings = refreshExpiredStatuses(readAllBookings());
  const reqStart = new Date(input.quote.checkInISO).getTime();
  const reqEnd = new Date(input.quote.checkOutISO).getTime();

  const hasOverlap = existingBookings.some((b) => {
    if (b.roomId !== room.id) return false;
    if (
      b.status !== "PENDING_PAYMENT" &&
      b.status !== "CONFIRMED" &&
      b.status !== "CHECKED_IN"
    ) {
      return false;
    }
    const bStart = new Date(b.quoteSnapshot.checkInISO).getTime();
    const bEnd = new Date(b.quoteSnapshot.checkOutISO).getTime();
    return reqStart < bEnd && reqEnd > bStart;
  });

  if (input.simulateConflict || hasOverlap) {
    return {
      ok: false,
      errorCode: "BOOKING_CONFLICT",
      message:
        "Rất tiếc, khung giờ hoặc phòng này vừa được một khách hàng khác giữ chỗ. Hệ thống đã làm mới lại lịch trống.",
    };
  }

  // 2. Check simulated server price change (UI-8.1 verification scenario)
  if (input.simulatePriceChange) {
    const delta = 30000;
    const refreshedQuote: PricingQuote = {
      ...input.quote,
      quoteId: `qt_refreshed_${Date.now().toString(36)}`,
      baseAmount: input.quote.baseAmount + delta,
      subtotal: input.quote.subtotal + delta,
      total: input.quote.total + delta,
      generatedAt: new Date().toISOString(),
    };
    return {
      ok: false,
      errorCode: "PRICE_CHANGED",
      message:
        "Giá phòng vừa được cập nhật từ hệ thống. Vui lòng kiểm tra bảng giá mới trước khi xác nhận đặt phòng.",
      refreshedQuote,
    };
  }

  const property = MOCK_PROPERTIES.find((p) => p.id === room.propertyId);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
  const bookingId = `bk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  const initialPayment: MockPaymentAttempt = {
    id: `pm_${Date.now().toString(36)}`,
    paymentCode: generatePaymentCode(),
    bookingId,
    provider: "MOCK",
    amount: input.quote.total,
    currency: "VND",
    status: "PENDING",
    createdAt: now.toISOString(),
  };

  const newBooking: BookingRecord = {
    id: bookingId,
    bookingCode: generateBookingCode(),
    userId: input.userId,
    guestName: input.guestName,
    guestEmail: input.guestEmail,
    roomId: room.id,
    roomNumber: room.roomNumber,
    roomName: room.name,
    roomTypeName: room.roomType?.name ?? "Standard",
    roomImage: room.images[0] ?? "",
    propertyId: property?.id ?? room.propertyId,
    propertyName: property?.name ?? "Lumora Homestay",
    propertyAddress: property?.address ?? "",
    propertyCity: property?.city ?? "Đà Lạt",
    mode: input.quote.mode,
    status: "PENDING_PAYMENT",
    quoteSnapshot: input.quote,
    subtotal: input.quote.baseAmount,
    surchargeAmount: input.quote.nightSurchargeAmount,
    discountAmount: 0,
    totalAmount: input.quote.total,
    currency: "VND",
    expiresAt,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    payments: [initialPayment],
  };

  writeAllBookings([newBooking, ...existingBookings]);

  return {
    ok: true,
    booking: newBooking,
  };
}

export async function getBookingById(bookingId: string): Promise<BookingRecord | null> {
  await new Promise((resolve) => setTimeout(resolve, 60));
  const all = refreshExpiredStatuses(readAllBookings());
  return all.find((b) => b.id === bookingId) ?? null;
}

export async function getUserBookings(userId?: string): Promise<BookingRecord[]> {
  await new Promise((resolve) => setTimeout(resolve, 60));
  const all = refreshExpiredStatuses(readAllBookings());
  if (!userId) return all;
  return all.filter((b) => b.userId === userId);
}

export async function simulateMockPaymentSuccess(
  bookingId: string,
): Promise<BookingRecord> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const all = refreshExpiredStatuses(readAllBookings());
  const index = all.findIndex((b) => b.id === bookingId);
  if (index === -1) {
    throw new Error("Không tìm thấy đơn đặt phòng.");
  }

  const target = all[index];

  // Idempotent if already CONFIRMED (P5.3 / UI-8.3)
  if (target.status === "CONFIRMED") {
    return target;
  }

  if (target.status === "EXPIRED") {
    throw new Error("Thời gian giữ phòng 15 phút đã hết hạn. Không thể thanh toán đơn này.");
  }

  if (target.status === "CANCELLED") {
    throw new Error("Đơn đặt phòng đã bị hủy.");
  }

  const nowIso = new Date().toISOString();
  const txId = `MOCK_TX_${Date.now().toString(36).toUpperCase()}`;

  const updatedPayments: MockPaymentAttempt[] = target.payments.some(
    (p) => p.status === "PENDING",
  )
    ? target.payments.map((p) =>
        p.status === "PENDING"
          ? {
              ...p,
              status: "PAID" as const,
              transactionId: txId,
              paidAt: nowIso,
            }
          : p,
      )
    : [
        ...target.payments,
        {
          id: `pm_${Date.now().toString(36)}`,
          paymentCode: generatePaymentCode(),
          bookingId: target.id,
          provider: "MOCK" as const,
          amount: target.totalAmount,
          currency: "VND" as const,
          status: "PAID" as const,
          transactionId: txId,
          paidAt: nowIso,
          createdAt: nowIso,
        },
      ];

  const updatedBooking: BookingRecord = {
    ...target,
    status: "CONFIRMED",
    confirmedAt: nowIso,
    updatedAt: nowIso,
    checkInQrToken:
      target.checkInQrToken ??
      `LMR-CHK-${target.bookingCode}-${target.id.slice(-4).toUpperCase()}`,
    payments: updatedPayments,
  };

  all[index] = updatedBooking;
  writeAllBookings(all);
  return updatedBooking;
}

export async function simulateMockPaymentFailure(
  bookingId: string,
  reason: string = "Giao dịch mô phỏng bị từ chối bởi cổng thanh toán (Insufficient funds / User cancelled).",
): Promise<BookingRecord> {
  await new Promise((resolve) => setTimeout(resolve, 180));
  const all = refreshExpiredStatuses(readAllBookings());
  const index = all.findIndex((b) => b.id === bookingId);
  if (index === -1) {
    throw new Error("Không tìm thấy đơn đặt phòng.");
  }

  const target = all[index];
  if (target.status !== "PENDING_PAYMENT") {
    return target;
  }

  const nowIso = new Date().toISOString();

  // Mark existing PENDING attempt as FAILED and create a new PENDING attempt ready for retry
  const markedFailed = target.payments.map((p) =>
    p.status === "PENDING"
      ? {
          ...p,
          status: "FAILED" as const,
          failureReason: reason,
        }
      : p,
  );

  const retryAttempt: MockPaymentAttempt = {
    id: `pm_retry_${Date.now().toString(36)}`,
    paymentCode: generatePaymentCode(),
    bookingId: target.id,
    provider: "MOCK",
    amount: target.totalAmount,
    currency: "VND",
    status: "PENDING",
    createdAt: nowIso,
  };

  const updatedBooking: BookingRecord = {
    ...target,
    updatedAt: nowIso,
    payments: [...markedFailed, retryAttempt],
  };

  all[index] = updatedBooking;
  writeAllBookings(all);
  return updatedBooking;
}

export async function expireBookingHoldNow(bookingId: string): Promise<BookingRecord> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const all = readAllBookings();
  const index = all.findIndex((b) => b.id === bookingId);
  if (index === -1) {
    throw new Error("Không tìm thấy đơn đặt phòng.");
  }

  const pastIso = new Date(Date.now() - 60 * 1000).toISOString();
  all[index] = {
    ...all[index],
    expiresAt: pastIso,
  };
  writeAllBookings(all);

  const refreshed = refreshExpiredStatuses(all);
  return refreshed[index];
}

export async function cancelPendingBooking(bookingId: string): Promise<BookingRecord> {
  await new Promise((resolve) => setTimeout(resolve, 120));
  const all = readAllBookings();
  const index = all.findIndex((b) => b.id === bookingId);
  if (index === -1) {
    throw new Error("Không tìm thấy đơn đặt phòng.");
  }

  const nowIso = new Date().toISOString();
  const updatedBooking: BookingRecord = {
    ...all[index],
    status: "CANCELLED",
    cancelledAt: nowIso,
    updatedAt: nowIso,
    payments: all[index].payments.map((p) =>
      p.status === "PENDING" ? { ...p, status: "CANCELLED" as const } : p,
    ),
  };

  all[index] = updatedBooking;
  writeAllBookings(all);
  return updatedBooking;
}
