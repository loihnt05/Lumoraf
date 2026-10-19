import type { BookingRecord, BookingRefundInfo } from "./quote";

export type UserRole = "USER" | "MANAGER" | "ADMIN";
export type UserAccountStatus = "ACTIVE" | "DISABLED";

/**
 * P1.4, P1.5, P1.6, P6.3, P6.4: Local business user & property assignments
 */
export type ManagedUser = {
  id: string;
  clerkUserId: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  status: UserAccountStatus;
  assignedPropertyIds: string[];
  createdAt: string;
  updatedAt: string;
};

/**
 * P2.8, P2.9, P6.7, P7.11: Daily Room Access Code record
 */
export type RoomAccessCodeRecord = {
  id: string;
  roomId: string;
  roomNumber: string;
  roomName: string;
  propertyId: string;
  propertyName: string;
  validDate: string; // "YYYY-MM-DD"
  codeValue: string; // 6-digit string PIN, e.g. "849201"
  generatedAt: string;
  status: "ACTIVE" | "ROTATED";
};

/**
 * P6.8: Basic Security Audit Log (never stores plaintext PINs or secrets)
 */
export type AuditActionType =
  | "USER_ROLE_CHANGE"
  | "USER_STATUS_CHANGE"
  | "MANAGER_PROPERTY_ASSIGN"
  | "MANAGER_PROPERTY_REVOKE"
  | "ROOM_BLOCK_TOGGLE"
  | "BOOKING_CHECK_IN"
  | "BOOKING_CHECK_OUT"
  | "BOOKING_CANCEL_REFUND"
  | "PAYMENT_RECONCILE"
  | "ROOM_CODE_BATCH_ROTATE"
  | "PROPERTY_CREATE_UPDATE";

export type AuditLogEntry = {
  id: string;
  actorUserId: string;
  actorName: string;
  actorRole: UserRole;
  action: AuditActionType;
  entityType: "USER" | "PROPERTY" | "ROOM" | "BOOKING" | "ACCESS_CODE";
  entityId: string;
  metadataSummary: string;
  createdAt: string;
};

/**
 * P7.10: Email Notification Outbox Event (decoupled & idempotent)
 */
export type EmailNotificationEvent = {
  id: string;
  idempotencyKey: string;
  bookingId: string;
  recipientEmail: string;
  template:
    | "BOOKING_CONFIRMED"
    | "BOOKING_CANCELLED"
    | "REFUND_UPDATED"
    | "UPCOMING_CHECKIN_PIN";
  subject: string;
  status: "SENT_DEV_LOG" | "QUEUED";
  createdAt: string;
};

/**
 * P6.1: Manager Dashboard Summary DTO
 */
export type ManagerDashboardSummary = {
  propertyId: string;
  propertyName: string;
  propertyCity: string;
  totalRooms: number;
  activeRooms: number;
  blockedRooms: number;
  occupancyRatePercent: number;
  bookingsTodayCount: number;
  pendingCheckInCount: number;
  checkedInCount: number;
  upcomingBookings: BookingRecord[];
};

/**
 * P6.5 & P6.6: Admin Monitor Dashboard Metrics DTO
 */
export type DailyMetricPoint = {
  date: string;
  label: string;
  bookingsCount: number;
  simulatedRevenueVnd: number;
};

export type AdminMonitorSummary = {
  totalUsers: number;
  totalManagers: number;
  totalAdmins: number;
  totalProperties: number;
  totalRooms: number;
  activeRooms: number;
  blockedRooms: number;
  activeBookingsCount: number;
  simulatedRevenueVnd: number;
  revenueLabel: string;
  bookingsByStatus: Record<string, number>;
  dailyTrend: DailyMetricPoint[];
  latestBookings: BookingRecord[];
  auditLogs: AuditLogEntry[];
  emailEvents: EmailNotificationEvent[];
};

/**
 * P7.1 & P7.2: Cancellation Policy Evaluation Result
 */
export type CancellationEvaluation = {
  bookingId: string;
  canCancel: boolean;
  hoursUntilCheckIn: number;
  eligiblePercent: number; // 100 | 50 | 0
  refundAmount: number;
  feeAmount: number;
  policyTierLabel: string;
  explanation: string;
};

export type OperationResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      errorCode: "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_ERROR" | "CONFLICT";
      message: string;
    };

export type CancelBookingResult = OperationResult<{
  booking: BookingRecord;
  refund: BookingRefundInfo | null;
}>;
