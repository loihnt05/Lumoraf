import type { BookingMode } from "./booking-config";

export type QuoteSurcharge = {
  code: "NIGHT_SURCHARGE" | "CLEANING_FEE" | "OTHER";
  label: string;
  amount: number;
  description?: string;
};

export type QuoteDiscount = {
  code: string;
  label: string;
  amount: number;
};

export type PricingQuoteRequest = {
  roomId: string;
  propertyId: string;
  mode: BookingMode;
  // Fixed slot fields
  date?: string;
  slotId?: string;
  slotStartTime?: string;
  slotEndTime?: string;
  slotPrice?: number;
  // Custom time fields
  customStartTime?: string;
  customEndTime?: string;
  customDurationMinutes?: number;
  customNightHours?: number;
  // Overnight fields
  checkInDate?: string;
  checkOutDate?: string;
  numberOfNights?: number;
  // Base price reference
  basePrice?: number;
};

export type PricingQuote = {
  quoteId: string;
  roomId: string;
  roomNumber: string;
  roomName: string;
  roomTypeName: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  mode: BookingMode;
  modeLabel: string;
  dateRangeLabel: string;
  timeRangeLabel: string;
  durationLabel: string;
  durationMinutes: number;
  checkInISO: string;
  checkOutISO: string;
  baseLabel: string;
  baseAmount: number;
  nightHours: number;
  nightSurchargeAmount: number;
  surcharges: QuoteSurcharge[];
  discounts: QuoteDiscount[];
  subtotal: number;
  total: number;
  currency: "VND";
  cleaningBufferMinutes: number;
  cancellationPolicy: {
    summary: string;
    freeCancelHoursBefore: number;
    lateCancelFeePercent: number;
  };
  generatedAt: string;
  expiresAt: string;
};

export type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED";

export type RefundStatus = "NONE" | "REFUND_PENDING" | "REFUNDED" | "FAILED";

export type BookingRefundInfo = {
  id: string;
  bookingId: string;
  eligiblePercent: number;
  refundAmount: number;
  feeAmount: number;
  status: RefundStatus;
  reason: string;
  policyTierLabel: string;
  cancelledByRole: "USER" | "MANAGER" | "ADMIN";
  providerReference?: string;
  requestedAt: string;
  completedAt?: string;
};

export type MockPaymentAttempt = {
  id: string;
  paymentCode: string;
  bookingId: string;
  provider: "MOCK";
  amount: number;
  currency: "VND";
  status: PaymentStatus;
  failureReason?: string;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
};

export type BookingRecord = {
  id: string;
  bookingCode: string;
  userId: string;
  guestName: string;
  guestEmail: string;
  roomId: string;
  roomNumber: string;
  roomName: string;
  roomTypeName: string;
  roomImage: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  propertyCity: string;
  mode: BookingMode;
  status: BookingStatus;
  quoteSnapshot: PricingQuote;
  subtotal: number;
  surchargeAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: "VND";
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  cancelledAt?: string;
  checkInQrToken?: string;
  refundInfo?: BookingRefundInfo;
  payments: MockPaymentAttempt[];
};

export type CreateBookingInput = {
  userId: string;
  guestName: string;
  guestEmail: string;
  quote: PricingQuote;
  /** Optional simulation flags for testing UI-8.1 edge cases */
  simulateConflict?: boolean;
  simulatePriceChange?: boolean;
};

export type CreateBookingResult =
  | {
      ok: true;
      booking: BookingRecord;
    }
  | {
      ok: false;
      errorCode: "BOOKING_CONFLICT" | "PRICE_CHANGED" | "ROOM_BLOCKED" | "VALIDATION_ERROR";
      message: string;
      refreshedQuote?: PricingQuote;
    };
