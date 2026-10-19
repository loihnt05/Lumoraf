import { MOCK_PROPERTIES } from "../mock/inventory-data";
import type { Property } from "../types/inventory";
import type { BookingRecord, BookingRefundInfo } from "../types/quote";
import type {
  AdminMonitorSummary,
  AuditActionType,
  AuditLogEntry,
  CancelBookingResult,
  CancellationEvaluation,
  DailyMetricPoint,
  EmailNotificationEvent,
  ManagedUser,
  ManagerDashboardSummary,
  OperationResult,
  RoomAccessCodeRecord,
  UserAccountStatus,
  UserRole,
} from "../types/operations";
import { getAllBookingsSnapshot, saveBookingsSnapshot } from "./bookings";
import { getPhysicalRoomsSnapshot } from "./inventory";

const USERS_STORAGE_KEY = "lumora_ops_users_v1";
const ACCESS_CODES_STORAGE_KEY = "lumora_ops_room_codes_v1";
const AUDIT_LOGS_STORAGE_KEY = "lumora_ops_audit_logs_v1";
const EMAIL_OUTBOX_STORAGE_KEY = "lumora_ops_email_outbox_v1";
const CUSTOM_PROPERTIES_STORAGE_KEY = "lumora_ops_properties_v1";

function createInitialUsers(): ManagedUser[] {
  const now = "2026-10-15T08:00:00.000Z";
  return [
    {
      id: "usr-admin-01",
      clerkUserId: "user_2lLumoraOwnerAdmin01",
      email: "owner@lumora.vn",
      fullName: "Nguyễn Hồng Lợi (Owner Admin)",
      phone: "0909123456",
      role: "ADMIN",
      status: "ACTIVE",
      assignedPropertyIds: ["prop-da-lat", "prop-sai-gon"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "usr-mgr-dalat",
      clerkUserId: "user_2lLumoraMgrDaLat01",
      email: "manager.dalat@lumora.vn",
      fullName: "Trần Minh Quân (Quản lý Đà Lạt)",
      phone: "0918222333",
      role: "MANAGER",
      status: "ACTIVE",
      assignedPropertyIds: ["prop-da-lat"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "usr-mgr-saigon",
      clerkUserId: "user_2lLumoraMgrSaiGon01",
      email: "manager.saigon@lumora.vn",
      fullName: "Lê Thu Hà (Quản lý Sài Gòn)",
      phone: "0933444555",
      role: "MANAGER",
      status: "ACTIVE",
      assignedPropertyIds: ["prop-sai-gon"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "usr-guest-01",
      clerkUserId: "user_2lLumoraGuest01",
      email: "khachhang@lumora.vn",
      fullName: "Phạm Hoàng Nam",
      phone: "0988777666",
      role: "USER",
      status: "ACTIVE",
      assignedPropertyIds: [],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

let memoryUsers: ManagedUser[] = createInitialUsers();
let memoryAccessCodes: RoomAccessCodeRecord[] = [];
let memoryAuditLogs: AuditLogEntry[] = [];
let memoryEmailEvents: EmailNotificationEvent[] = [];
let memoryProperties: Property[] = [...MOCK_PROPERTIES];

function readUsers(): ManagedUser[] {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return [...memoryUsers];
  }
  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [...memoryUsers];
    const parsed = JSON.parse(raw) as ManagedUser[];
    memoryUsers = parsed;
    return parsed;
  } catch {
    return [...memoryUsers];
  }
}

function writeUsers(users: ManagedUser[]): void {
  memoryUsers = [...users];
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    try {
      window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      window.dispatchEvent(new Event("lumora_ops_change"));
    } catch {
      // Ignore quota errors
    }
  }
}

function readAccessCodes(): RoomAccessCodeRecord[] {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return [...memoryAccessCodes];
  }
  try {
    const raw = window.localStorage.getItem(ACCESS_CODES_STORAGE_KEY);
    if (!raw) return [...memoryAccessCodes];
    const parsed = JSON.parse(raw) as RoomAccessCodeRecord[];
    memoryAccessCodes = parsed;
    return parsed;
  } catch {
    return [...memoryAccessCodes];
  }
}

function writeAccessCodes(codes: RoomAccessCodeRecord[]): void {
  memoryAccessCodes = [...codes];
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    try {
      window.localStorage.setItem(ACCESS_CODES_STORAGE_KEY, JSON.stringify(codes));
      window.dispatchEvent(new Event("lumora_ops_change"));
    } catch {
      // Ignore
    }
  }
}

function readAuditLogs(): AuditLogEntry[] {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return [...memoryAuditLogs];
  }
  try {
    const raw = window.localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    if (!raw) return [...memoryAuditLogs];
    const parsed = JSON.parse(raw) as AuditLogEntry[];
    memoryAuditLogs = parsed;
    return parsed;
  } catch {
    return [...memoryAuditLogs];
  }
}

function writeAuditLogs(logs: AuditLogEntry[]): void {
  memoryAuditLogs = [...logs];
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    try {
      window.localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(logs));
    } catch {
      // Ignore
    }
  }
}

function readEmailEvents(): EmailNotificationEvent[] {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return [...memoryEmailEvents];
  }
  try {
    const raw = window.localStorage.getItem(EMAIL_OUTBOX_STORAGE_KEY);
    if (!raw) return [...memoryEmailEvents];
    const parsed = JSON.parse(raw) as EmailNotificationEvent[];
    memoryEmailEvents = parsed;
    return parsed;
  } catch {
    return [...memoryEmailEvents];
  }
}

function writeEmailEvents(events: EmailNotificationEvent[]): void {
  memoryEmailEvents = [...events];
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    try {
      window.localStorage.setItem(EMAIL_OUTBOX_STORAGE_KEY, JSON.stringify(events));
    } catch {
      // Ignore
    }
  }
}

export function getManagedPropertiesSnapshot(): Property[] {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return [...memoryProperties];
  }
  try {
    const raw = window.localStorage.getItem(CUSTOM_PROPERTIES_STORAGE_KEY);
    if (!raw) return [...memoryProperties];
    const parsed = JSON.parse(raw) as Property[];
    memoryProperties = parsed;
    return parsed;
  } catch {
    return [...memoryProperties];
  }
}

function writeManagedProperties(props: Property[]): void {
  memoryProperties = [...props];
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    try {
      window.localStorage.setItem(CUSTOM_PROPERTIES_STORAGE_KEY, JSON.stringify(props));
      window.dispatchEvent(new Event("lumora_inventory_change"));
    } catch {
      // Ignore
    }
  }
}

export function resetOperationsStoreForTest(): void {
  memoryUsers = createInitialUsers();
  memoryAccessCodes = [];
  memoryAuditLogs = [];
  memoryEmailEvents = [];
  memoryProperties = [...MOCK_PROPERTIES];
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    window.localStorage.removeItem(USERS_STORAGE_KEY);
    window.localStorage.removeItem(ACCESS_CODES_STORAGE_KEY);
    window.localStorage.removeItem(AUDIT_LOGS_STORAGE_KEY);
    window.localStorage.removeItem(EMAIL_OUTBOX_STORAGE_KEY);
    window.localStorage.removeItem(CUSTOM_PROPERTIES_STORAGE_KEY);
  }
}

/**
 * P6.8: Append a security audit log without ever recording plaintext PINs or secrets
 */
export function appendAuditLog(params: {
  actorUserId: string;
  actorName: string;
  actorRole: UserRole;
  action: AuditActionType;
  entityType: AuditLogEntry["entityType"];
  entityId: string;
  metadataSummary: string;
}): AuditLogEntry {
  // Scrub any 6-digit PIN pattern just in case
  const safeSummary = params.metadataSummary.replace(/\b\d{6}\b/g, "[REDACTED_PIN]");
  const entry: AuditLogEntry = {
    id: `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    actorUserId: params.actorUserId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    metadataSummary: safeSummary,
    createdAt: new Date().toISOString(),
  };

  const current = readAuditLogs();
  writeAuditLogs([entry, ...current]);
  return entry;
}

/**
 * P7.10: Idempotent email notification outbox writer
 */
export function enqueueEmailNotification(params: {
  idempotencyKey: string;
  bookingId: string;
  recipientEmail: string;
  template: EmailNotificationEvent["template"];
  subject: string;
}): EmailNotificationEvent {
  const existing = readEmailEvents();
  const duplicate = existing.find((e) => e.idempotencyKey === params.idempotencyKey);
  if (duplicate) {
    return duplicate;
  }

  const event: EmailNotificationEvent = {
    id: `eml_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
    idempotencyKey: params.idempotencyKey,
    bookingId: params.bookingId,
    recipientEmail: params.recipientEmail,
    template: params.template,
    subject: params.subject,
    status: "SENT_DEV_LOG",
    createdAt: new Date().toISOString(),
  };
  writeEmailEvents([event, ...existing]);
  return event;
}

/**
 * P1.6: Helper to verify if a user has permission on a given propertyId
 */
export function hasPropertyScopePermission(
  actorRole: UserRole,
  assignedPropertyIds: string[],
  targetPropertyId: string,
): boolean {
  if (actorRole === "ADMIN") return true;
  if (actorRole === "MANAGER") {
    return assignedPropertyIds.includes(targetPropertyId);
  }
  return false;
}

/**
 * P2.2 & P2.3: Create or Update Property (ADMIN can create/update all; MANAGER can only update assigned)
 */
export async function savePropertyInventory(params: {
  actorRole: UserRole;
  assignedPropertyIds: string[];
  property: {
    id?: string;
    name: string;
    slug: string;
    city: string;
    address: string;
    description: string;
    checkInTime: string;
    checkOutTime: string;
    status: "ACTIVE" | "INACTIVE";
  };
}): Promise<OperationResult<Property>> {
  await new Promise((resolve) => setTimeout(resolve, 80));

  const trimmedName = params.property.name.trim();
  const trimmedSlug = params.property.slug.trim().toLowerCase();
  if (!trimmedName || !trimmedSlug) {
    return {
      ok: false,
      errorCode: "VALIDATION_ERROR",
      message: "Tên chi nhánh và đường dẫn (slug) không được để trống.",
    };
  }

  const allProps = getManagedPropertiesSnapshot();
  const isCreating = !params.property.id;

  if (isCreating && params.actorRole !== "ADMIN") {
    return {
      ok: false,
      errorCode: "FORBIDDEN",
      message: "403 Forbidden: Chỉ ADMIN mới có quyền tạo chi nhánh mới.",
    };
  }

  if (
    !isCreating &&
    !hasPropertyScopePermission(
      params.actorRole,
      params.assignedPropertyIds,
      params.property.id!,
    )
  ) {
    return {
      ok: false,
      errorCode: "FORBIDDEN",
      message: "403 Forbidden: Bạn không được phân quyền quản lý chi nhánh này.",
    };
  }

  // Unique slug validation (P2.2)
  const slugConflict = allProps.some(
    (p) => p.slug.toLowerCase() === trimmedSlug && p.id !== params.property.id,
  );
  if (slugConflict) {
    return {
      ok: false,
      errorCode: "CONFLICT",
      message: `Slug "${trimmedSlug}" đã tồn tại. Vui lòng chọn slug duy nhất.`,
    };
  }

  if (isCreating) {
    const newProp: Property = {
      id: `prop-${trimmedSlug}`,
      name: trimmedName,
      slug: trimmedSlug,
      description: params.property.description.trim(),
      address: params.property.address.trim(),
      city: params.property.city.trim(),
      checkInTime: params.property.checkInTime || "14:00",
      checkOutTime: params.property.checkOutTime || "11:00",
      status: params.property.status,
      images: MOCK_PROPERTIES[0].images,
    };
    writeManagedProperties([...allProps, newProp]);
    appendAuditLog({
      actorUserId: "usr-admin-01",
      actorName: "Owner Admin",
      actorRole: params.actorRole,
      action: "PROPERTY_CREATE_UPDATE",
      entityType: "PROPERTY",
      entityId: newProp.id,
      metadataSummary: `Tạo chi nhánh mới "${newProp.name}" (${newProp.slug})`,
    });
    return { ok: true, data: newProp };
  }

  const idx = allProps.findIndex((p) => p.id === params.property.id);
  if (idx === -1) {
    return {
      ok: false,
      errorCode: "NOT_FOUND",
      message: "Không tìm thấy chi nhánh cần cập nhật.",
    };
  }

  const updatedProp: Property = {
    ...allProps[idx],
    name: trimmedName,
    slug: trimmedSlug,
    city: params.property.city.trim(),
    address: params.property.address.trim(),
    description: params.property.description.trim(),
    checkInTime: params.property.checkInTime,
    checkOutTime: params.property.checkOutTime,
    status: params.property.status,
  };
  allProps[idx] = updatedProp;
  writeManagedProperties(allProps);

  appendAuditLog({
    actorUserId: params.actorRole === "ADMIN" ? "usr-admin-01" : "usr-mgr",
    actorName: params.actorRole,
    actorRole: params.actorRole,
    action: "PROPERTY_CREATE_UPDATE",
    entityType: "PROPERTY",
    entityId: updatedProp.id,
    metadataSummary: `Cập nhật chi nhánh "${updatedProp.name}" (status=${updatedProp.status})`,
  });

  return { ok: true, data: updatedProp };
}

/**
 * P2.8 & P2.9: Daily Room Access Code Batch Generator (Idempotent per room_id + valid_date)
 */
function generateDeterministic6DigitPin(roomId: string, dateStr: string, salt: number = 0): string {
  const seedStr = `${roomId}:${dateStr}:${salt}`;
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const num = (Math.abs(hash) % 900000) + 100000;
  return String(num);
}

export async function runDailyRoomAccessCodeBatch(
  validDate: string,
  options?: { forceRotateRoomId?: string; actorRole?: UserRole },
): Promise<{ generatedCount: number; skippedExistingCount: number; codes: RoomAccessCodeRecord[] }> {
  await new Promise((resolve) => setTimeout(resolve, 60));

  const rooms = getPhysicalRoomsSnapshot().filter((r) => r.status === "ACTIVE");
  const properties = getManagedPropertiesSnapshot();
  const currentCodes = readAccessCodes();
  const nowIso = new Date().toISOString();

  let generatedCount = 0;
  let skippedExistingCount = 0;

  for (const room of rooms) {
    const existingIdx = currentCodes.findIndex(
      (c) => c.roomId === room.id && c.validDate === validDate && c.status === "ACTIVE",
    );

    if (existingIdx !== -1 && options?.forceRotateRoomId !== room.id) {
      // Idempotent (P2.9): Running batch twice on the same day does NOT overwrite existing active code
      skippedExistingCount++;
      continue;
    }

    if (existingIdx !== -1 && options?.forceRotateRoomId === room.id) {
      currentCodes[existingIdx] = {
        ...currentCodes[existingIdx],
        status: "ROTATED",
      };
    }

    const prop = properties.find((p) => p.id === room.propertyId);
    const salt = options?.forceRotateRoomId === room.id ? Date.now() % 1000 : 0;
    const newCode: RoomAccessCodeRecord = {
      id: `rac_${room.id}_${validDate}_${salt}`,
      roomId: room.id,
      roomNumber: room.roomNumber,
      roomName: room.name,
      propertyId: room.propertyId,
      propertyName: prop?.name ?? "Lumora",
      validDate,
      codeValue: generateDeterministic6DigitPin(room.id, validDate, salt),
      generatedAt: nowIso,
      status: "ACTIVE",
    };

    currentCodes.unshift(newCode);
    generatedCount++;
  }

  writeAccessCodes(currentCodes);

  if (generatedCount > 0) {
    appendAuditLog({
      actorUserId: "system-batch",
      actorName: options?.actorRole ?? "ADMIN",
      actorRole: options?.actorRole ?? "ADMIN",
      action: "ROOM_CODE_BATCH_ROTATE",
      entityType: "ACCESS_CODE",
      entityId: validDate,
      metadataSummary: `Batch mã khóa phòng ngày ${validDate}: tạo mới ${generatedCount} phòng, giữ nguyên ${skippedExistingCount} phòng (PIN không ghi vào log).`,
    });
  }

  return {
    generatedCount,
    skippedExistingCount,
    codes: currentCodes.filter((c) => c.validDate === validDate && c.status === "ACTIVE"),
  };
}

/**
 * P6.7: Staff (Manager/Admin) query for current Room Access Codes with Property Scope check
 */
export async function getStaffRoomAccessCodes(params: {
  validDate: string;
  propertyId: string;
  actorRole: UserRole;
  assignedPropertyIds: string[];
}): Promise<OperationResult<RoomAccessCodeRecord[]>> {
  if (
    !hasPropertyScopePermission(
      params.actorRole,
      params.assignedPropertyIds,
      params.propertyId,
    )
  ) {
    return {
      ok: false,
      errorCode: "FORBIDDEN",
      message: "403 Forbidden: Quản lý không có quyền xem mã khóa phòng của chi nhánh ngoài phạm vi được gán.",
    };
  }

  const batch = await runDailyRoomAccessCodeBatch(params.validDate);
  const filtered = batch.codes.filter((c) => c.propertyId === params.propertyId);
  return { ok: true, data: filtered };
}

/**
 * P7.11: Secure Guest Room Access Code Delivery Policy
 * Only returns the PIN if:
 * 1. Caller is the authenticated owner of the booking (`booking.userId === currentUserId`)
 * 2. Booking status is `CONFIRMED` or `CHECKED_IN` (never `PENDING_PAYMENT`, `CANCELLED`, or `EXPIRED`)
 */
export async function getGuestRoomAccessCode(params: {
  bookingId: string;
  currentUserId: string;
}): Promise<OperationResult<{ codeValue: string; validDate: string; roomNumber: string }>> {
  const bookings = getAllBookingsSnapshot();
  const booking = bookings.find((b) => b.id === params.bookingId);

  if (!booking) {
    return {
      ok: false,
      errorCode: "NOT_FOUND",
      message: "Không tìm thấy đơn đặt phòng.",
    };
  }

  if (booking.userId !== params.currentUserId) {
    return {
      ok: false,
      errorCode: "FORBIDDEN",
      message: "403 Forbidden: Bạn không có quyền xem mã khóa phòng của khách hàng khác.",
    };
  }

  if (booking.status !== "CONFIRMED" && booking.status !== "CHECKED_IN") {
    return {
      ok: false,
      errorCode: "FORBIDDEN",
      message: `Chính sách bảo mật: Mã số khóa phòng chỉ được cấp khi đơn đã xác nhận thanh toán (trạng thái hiện tại: ${booking.status}).`,
    };
  }

  const checkInDate = booking.quoteSnapshot.checkInISO.slice(0, 10);
  const batch = await runDailyRoomAccessCodeBatch(checkInDate);
  const roomCode = batch.codes.find((c) => c.roomId === booking.roomId);

  if (!roomCode) {
    return {
      ok: false,
      errorCode: "NOT_FOUND",
      message: "Chưa tìm thấy mã khóa cho phòng này.",
    };
  }

  return {
    ok: true,
    data: {
      codeValue: roomCode.codeValue,
      validDate: roomCode.validDate,
      roomNumber: booking.roomNumber,
    },
  };
}

/**
 * P6.3 & P6.4: Admin User & Manager-Property Assignment Operations
 */
export async function getAdminUsers(actorRole: UserRole = "ADMIN"): Promise<OperationResult<ManagedUser[]>> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  if (actorRole !== "ADMIN") {
    return {
      ok: false,
      errorCode: "FORBIDDEN",
      message: "403 Forbidden: Chỉ ADMIN mới có quyền truy cập danh sách người dùng hệ thống.",
    };
  }
  return { ok: true, data: readUsers() };
}

export async function updateUserRole(params: {
  targetUserId: string;
  newRole: UserRole;
  actorRole: UserRole;
}): Promise<OperationResult<ManagedUser>> {
  await new Promise((resolve) => setTimeout(resolve, 60));
  if (params.actorRole !== "ADMIN") {
    return {
      ok: false,
      errorCode: "FORBIDDEN",
      message: "403 Forbidden: Chỉ ADMIN mới có quyền thay đổi vai trò (Role) người dùng.",
    };
  }

  const users = readUsers();
  const idx = users.findIndex((u) => u.id === params.targetUserId);
  if (idx === -1) {
    return { ok: false, errorCode: "NOT_FOUND", message: "Không tìm thấy người dùng." };
  }

  const target = users[idx];

  // Guard: Prevent demoting the last active ADMIN (P6.3)
  if (target.role === "ADMIN" && params.newRole !== "ADMIN") {
    const activeAdmins = users.filter((u) => u.role === "ADMIN" && u.status === "ACTIVE");
    if (activeAdmins.length <= 1) {
      return {
        ok: false,
        errorCode: "VALIDATION_ERROR",
        message: "Không thể hạ quyền ADMIN cuối cùng đang hoạt động trong hệ thống.",
      };
    }
  }

  const oldRole = target.role;
  const updated: ManagedUser = {
    ...target,
    role: params.newRole,
    assignedPropertyIds: params.newRole === "USER" ? [] : target.assignedPropertyIds,
    updatedAt: new Date().toISOString(),
  };

  users[idx] = updated;
  writeUsers(users);

  appendAuditLog({
    actorUserId: "usr-admin-01",
    actorName: "Owner Admin",
    actorRole: "ADMIN",
    action: "USER_ROLE_CHANGE",
    entityType: "USER",
    entityId: updated.id,
    metadataSummary: `Đổi vai trò của ${updated.email} từ ${oldRole} sang ${updated.role}`,
  });

  return { ok: true, data: updated };
}

export async function updateUserStatus(params: {
  targetUserId: string;
  newStatus: UserAccountStatus;
  actorRole: UserRole;
}): Promise<OperationResult<ManagedUser>> {
  await new Promise((resolve) => setTimeout(resolve, 60));
  if (params.actorRole !== "ADMIN") {
    return {
      ok: false,
      errorCode: "FORBIDDEN",
      message: "403 Forbidden: Chỉ ADMIN mới có quyền khóa/mở khóa tài khoản.",
    };
  }

  const users = readUsers();
  const idx = users.findIndex((u) => u.id === params.targetUserId);
  if (idx === -1) {
    return { ok: false, errorCode: "NOT_FOUND", message: "Không tìm thấy người dùng." };
  }

  const target = users[idx];
  if (target.role === "ADMIN" && params.newStatus === "DISABLED") {
    const activeAdmins = users.filter((u) => u.role === "ADMIN" && u.status === "ACTIVE");
    if (activeAdmins.length <= 1) {
      return {
        ok: false,
        errorCode: "VALIDATION_ERROR",
        message: "Không thể vô hiệu hóa tài khoản ADMIN cuối cùng.",
      };
    }
  }

  const updated: ManagedUser = {
    ...target,
    status: params.newStatus,
    updatedAt: new Date().toISOString(),
  };
  users[idx] = updated;
  writeUsers(users);

  appendAuditLog({
    actorUserId: "usr-admin-01",
    actorName: "Owner Admin",
    actorRole: "ADMIN",
    action: "USER_STATUS_CHANGE",
    entityType: "USER",
    entityId: updated.id,
    metadataSummary: `Cập nhật trạng thái tài khoản ${updated.email} sang ${updated.status}`,
  });

  return { ok: true, data: updated };
}

export async function toggleManagerPropertyAssignment(params: {
  managerUserId: string;
  propertyId: string;
  assign: boolean;
  actorRole: UserRole;
}): Promise<OperationResult<ManagedUser>> {
  await new Promise((resolve) => setTimeout(resolve, 60));
  if (params.actorRole !== "ADMIN") {
    return {
      ok: false,
      errorCode: "FORBIDDEN",
      message: "403 Forbidden: Chỉ ADMIN mới có quyền gán hoặc thu hồi chi nhánh của MANAGER.",
    };
  }

  const users = readUsers();
  const idx = users.findIndex((u) => u.id === params.managerUserId);
  if (idx === -1) {
    return { ok: false, errorCode: "NOT_FOUND", message: "Không tìm thấy người dùng." };
  }

  const target = users[idx];
  if (target.role !== "MANAGER" && target.role !== "ADMIN") {
    return {
      ok: false,
      errorCode: "VALIDATION_ERROR",
      message: "Chỉ tài khoản có vai trò MANAGER mới được gán quyền quản lý chi nhánh.",
    };
  }

  const currentSet = new Set(target.assignedPropertyIds);
  if (params.assign) {
    currentSet.add(params.propertyId);
  } else {
    currentSet.delete(params.propertyId);
  }

  const updated: ManagedUser = {
    ...target,
    assignedPropertyIds: Array.from(currentSet),
    updatedAt: new Date().toISOString(),
  };
  users[idx] = updated;
  writeUsers(users);

  appendAuditLog({
    actorUserId: "usr-admin-01",
    actorName: "Owner Admin",
    actorRole: "ADMIN",
    action: params.assign ? "MANAGER_PROPERTY_ASSIGN" : "MANAGER_PROPERTY_REVOKE",
    entityType: "USER",
    entityId: updated.id,
    metadataSummary: `${params.assign ? "Gán" : "Thu hồi"} chi nhánh ${params.propertyId} cho quản lý ${updated.email}`,
  });

  return { ok: true, data: updated };
}

/**
 * P6.2: Check-in / Check-out Operational Lifecycle
 * Enforces state transitions: CONFIRMED -> CHECKED_IN -> CHECKED_OUT -> COMPLETED
 * Enforces Manager property scope (403 if out of scope)
 */
export async function performBookingCheckIn(params: {
  bookingId: string;
  actorRole: UserRole;
  assignedPropertyIds: string[];
}): Promise<OperationResult<BookingRecord>> {
  await new Promise((resolve) => setTimeout(resolve, 80));
  const bookings = getAllBookingsSnapshot();
  const idx = bookings.findIndex((b) => b.id === params.bookingId);

  if (idx === -1) {
    return { ok: false, errorCode: "NOT_FOUND", message: "Không tìm thấy đơn đặt phòng." };
  }

  const target = bookings[idx];
  if (
    !hasPropertyScopePermission(
      params.actorRole,
      params.assignedPropertyIds,
      target.propertyId,
    )
  ) {
    return {
      ok: false,
      errorCode: "FORBIDDEN",
      message: `403 Forbidden: Bạn không có quyền thực hiện Check-in cho đơn thuộc chi nhánh "${target.propertyName}".`,
    };
  }

  if (target.status !== "CONFIRMED") {
    return {
      ok: false,
      errorCode: "VALIDATION_ERROR",
      message: `Không thể Check-in cho đơn đang ở trạng thái "${target.status}". Chỉ đơn CONFIRMED mới được phép Check-in.`,
    };
  }

  const nowIso = new Date().toISOString();
  const updated: BookingRecord = {
    ...target,
    status: "CHECKED_IN",
    checkedInAt: nowIso,
    updatedAt: nowIso,
  };
  bookings[idx] = updated;
  saveBookingsSnapshot(bookings);

  appendAuditLog({
    actorUserId: params.actorRole === "ADMIN" ? "usr-admin-01" : "usr-mgr",
    actorName: params.actorRole,
    actorRole: params.actorRole,
    action: "BOOKING_CHECK_IN",
    entityType: "BOOKING",
    entityId: updated.bookingCode,
    metadataSummary: `Xác nhận khách nhận phòng (CHECKED_IN) cho đơn #${updated.bookingCode} tại phòng ${updated.roomNumber}`,
  });

  return { ok: true, data: updated };
}

export async function performBookingCheckOut(params: {
  bookingId: string;
  actorRole: UserRole;
  assignedPropertyIds: string[];
}): Promise<OperationResult<BookingRecord>> {
  await new Promise((resolve) => setTimeout(resolve, 80));
  const bookings = getAllBookingsSnapshot();
  const idx = bookings.findIndex((b) => b.id === params.bookingId);

  if (idx === -1) {
    return { ok: false, errorCode: "NOT_FOUND", message: "Không tìm thấy đơn đặt phòng." };
  }

  const target = bookings[idx];
  if (
    !hasPropertyScopePermission(
      params.actorRole,
      params.assignedPropertyIds,
      target.propertyId,
    )
  ) {
    return {
      ok: false,
      errorCode: "FORBIDDEN",
      message: `403 Forbidden: Bạn không có quyền thực hiện Check-out cho đơn thuộc chi nhánh "${target.propertyName}".`,
    };
  }

  // Rule P6.2: Cannot check-out a booking that hasn't checked-in yet!
  if (target.status !== "CHECKED_IN") {
    return {
      ok: false,
      errorCode: "VALIDATION_ERROR",
      message: `Không thể Check-out khi khách chưa Check-in (trạng thái hiện tại: ${target.status}).`,
    };
  }

  const nowIso = new Date().toISOString();
  const updated: BookingRecord = {
    ...target,
    status: "CHECKED_OUT",
    checkedOutAt: nowIso,
    updatedAt: nowIso,
  };
  bookings[idx] = updated;
  saveBookingsSnapshot(bookings);

  appendAuditLog({
    actorUserId: params.actorRole === "ADMIN" ? "usr-admin-01" : "usr-mgr",
    actorName: params.actorRole,
    actorRole: params.actorRole,
    action: "BOOKING_CHECK_OUT",
    entityType: "BOOKING",
    entityId: updated.bookingCode,
    metadataSummary: `Xác nhận khách trả phòng (CHECKED_OUT) cho đơn #${updated.bookingCode} tại phòng ${updated.roomNumber}`,
  });

  return { ok: true, data: updated };
}

/**
 * P7.9: Verify Check-in QR Token (distinct from Payment QR)
 */
export async function verifyCheckInQrToken(params: {
  qrToken: string;
  actorRole: UserRole;
  assignedPropertyIds: string[];
}): Promise<OperationResult<BookingRecord>> {
  const token = params.qrToken.trim();
  if (token.startsWith("PAY-MOCK-") || token.startsWith("VIETQR:")) {
    return {
      ok: false,
      errorCode: "VALIDATION_ERROR",
      message: "Đây là mã QR Thanh toán (Payment QR), không phải mã QR Check-in nhận phòng!",
    };
  }

  if (!token.startsWith("LMR-CHK-")) {
    return {
      ok: false,
      errorCode: "VALIDATION_ERROR",
      message: "Định dạng mã QR Check-in không hợp lệ.",
    };
  }

  const bookings = getAllBookingsSnapshot();
  const matched = bookings.find(
    (b) =>
      b.checkInQrToken === token ||
      `LMR-CHK-${b.bookingCode}-${b.id.slice(-4).toUpperCase()}` === token,
  );

  if (!matched) {
    return {
      ok: false,
      errorCode: "NOT_FOUND",
      message: "Không tìm thấy đơn đặt phòng tương ứng với mã QR Check-in này.",
    };
  }

  if (
    !hasPropertyScopePermission(
      params.actorRole,
      params.assignedPropertyIds,
      matched.propertyId,
    )
  ) {
    return {
      ok: false,
      errorCode: "FORBIDDEN",
      message: `403 Forbidden: Đơn #${matched.bookingCode} thuộc chi nhánh "${matched.propertyName}" ngoài phạm vi quản lý của bạn.`,
    };
  }

  if (matched.status === "EXPIRED" || matched.status === "CANCELLED") {
    return {
      ok: false,
      errorCode: "VALIDATION_ERROR",
      message: `Đơn #${matched.bookingCode} đã ở trạng thái ${matched.status}, mã QR Check-in đã bị vô hiệu hóa.`,
    };
  }

  return { ok: true, data: matched };
}

/**
 * P7.1, P7.2 & P7.7: Cancellation Policy v1 & Idempotent Refund Domain
 */
export function evaluateCancellationPolicy(
  booking: BookingRecord,
  cancelTimeISO: string = new Date().toISOString(),
): CancellationEvaluation {
  if (
    booking.status !== "PENDING_PAYMENT" &&
    booking.status !== "CONFIRMED"
  ) {
    return {
      bookingId: booking.id,
      canCancel: false,
      hoursUntilCheckIn: 0,
      eligiblePercent: 0,
      refundAmount: 0,
      feeAmount: booking.totalAmount,
      policyTierLabel: "Không thể hủy",
      explanation: `Đơn ở trạng thái ${booking.status} không thể hủy thêm.`,
    };
  }

  const checkInMs = new Date(booking.quoteSnapshot.checkInISO).getTime();
  const cancelMs = new Date(cancelTimeISO).getTime();
  const hoursUntilCheckIn = Math.round(((checkInMs - cancelMs) / (1000 * 60 * 60)) * 10) / 10;

  if (booking.status === "PENDING_PAYMENT") {
    return {
      bookingId: booking.id,
      canCancel: true,
      hoursUntilCheckIn,
      eligiblePercent: 100,
      refundAmount: 0,
      feeAmount: 0,
      policyTierLabel: "Hủy giữ chỗ miễn phí (Chưa thanh toán)",
      explanation: "Đơn đang trong thời gian giữ chỗ 15 phút, chưa phát sinh giao dịch thanh toán.",
    };
  }

  const freeHoursThreshold = booking.quoteSnapshot.cancellationPolicy.freeCancelHoursBefore;
  const partialHoursThreshold = booking.mode === "OVERNIGHT" ? 24 : 4;

  let eligiblePercent = 0;
  let policyTierLabel = "";
  let explanation = "";

  if (hoursUntilCheckIn >= freeHoursThreshold) {
    eligiblePercent = 100;
    policyTierLabel = `Hoàn tiền 100% (Hủy trước >= ${freeHoursThreshold}h)`;
    explanation = `Thời điểm hủy cách giờ check-in ${hoursUntilCheckIn} giờ (đạt mốc miễn phí >= ${freeHoursThreshold}h). Hoàn lại 100% số tiền đã thanh toán.`;
  } else if (hoursUntilCheckIn >= partialHoursThreshold) {
    eligiblePercent = 50;
    policyTierLabel = `Hoàn tiền 50% (Hủy từ ${partialHoursThreshold}h đến dưới ${freeHoursThreshold}h)`;
    explanation = `Thời điểm hủy cách giờ check-in ${hoursUntilCheckIn} giờ. Áp dụng phí hủy muộn 50%, hoàn lại 50% số tiền đã thanh toán.`;
  } else {
    eligiblePercent = 0;
    policyTierLabel = `Không hoàn tiền (Hủy sát giờ < ${partialHoursThreshold}h hoặc sau check-in)`;
    explanation = `Thời điểm hủy cách giờ check-in ${hoursUntilCheckIn} giờ (dưới ${partialHoursThreshold}h). Phòng vẫn được giải phóng nhưng không hoàn tiền theo chính sách.`;
  }

  const refundAmount = Math.round((booking.totalAmount * eligiblePercent) / 100 / 1000) * 1000;
  const feeAmount = booking.totalAmount - refundAmount;

  return {
    bookingId: booking.id,
    canCancel: true,
    hoursUntilCheckIn,
    eligiblePercent,
    refundAmount,
    feeAmount,
    policyTierLabel,
    explanation,
  };
}

export async function cancelBookingWithRefundPolicy(params: {
  bookingId: string;
  reason: string;
  actorRole: UserRole;
  cancelTimeISO?: string;
}): Promise<CancelBookingResult> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const bookings = getAllBookingsSnapshot();
  const idx = bookings.findIndex((b) => b.id === params.bookingId);

  if (idx === -1) {
    return { ok: false, errorCode: "NOT_FOUND", message: "Không tìm thấy đơn đặt phòng." };
  }

  const target = bookings[idx];

  // Idempotent if already cancelled with refundInfo (P7.7)
  if (target.status === "CANCELLED" && target.refundInfo) {
    return {
      ok: true,
      data: { booking: target, refund: target.refundInfo },
    };
  }

  const evalResult = evaluateCancellationPolicy(target, params.cancelTimeISO);
  if (!evalResult.canCancel) {
    return {
      ok: false,
      errorCode: "VALIDATION_ERROR",
      message: evalResult.explanation,
    };
  }

  const nowIso = params.cancelTimeISO ?? new Date().toISOString();
  const wasPaid = target.status === "CONFIRMED" || target.payments.some((p) => p.status === "PAID");

  const refundInfo: BookingRefundInfo | undefined = wasPaid
    ? {
        id: `rfd_${target.id}`,
        bookingId: target.id,
        eligiblePercent: evalResult.eligiblePercent,
        refundAmount: evalResult.refundAmount,
        feeAmount: evalResult.feeAmount,
        status: evalResult.refundAmount > 0 ? "REFUNDED" : "NONE",
        reason: params.reason.trim() || "Khách hàng yêu cầu hủy đặt phòng",
        policyTierLabel: evalResult.policyTierLabel,
        cancelledByRole: params.actorRole,
        providerReference:
          evalResult.refundAmount > 0
            ? `RFD_MOCK_${Date.now().toString(36).toUpperCase()}`
            : undefined,
        requestedAt: nowIso,
        completedAt: evalResult.refundAmount > 0 ? nowIso : undefined,
      }
    : undefined;

  const updatedBooking: BookingRecord = {
    ...target,
    status: "CANCELLED",
    cancelledAt: nowIso,
    updatedAt: nowIso,
    refundInfo,
  };

  bookings[idx] = updatedBooking;
  saveBookingsSnapshot(bookings);

  appendAuditLog({
    actorUserId: params.actorRole === "USER" ? target.userId : "usr-staff",
    actorName: params.actorRole,
    actorRole: params.actorRole,
    action: "BOOKING_CANCEL_REFUND",
    entityType: "BOOKING",
    entityId: updatedBooking.bookingCode,
    metadataSummary: `Hủy đơn #${updatedBooking.bookingCode} (${evalResult.policyTierLabel}) — Hoàn tiền: ${evalResult.refundAmount.toLocaleString("vi-VN")}₫`,
  });

  enqueueEmailNotification({
    idempotencyKey: `cancel_${updatedBooking.id}`,
    bookingId: updatedBooking.id,
    recipientEmail: updatedBooking.guestEmail,
    template: "BOOKING_CANCELLED",
    subject: `[Lumora] Xác nhận hủy đặt phòng #${updatedBooking.bookingCode}`,
  });

  return {
    ok: true,
    data: { booking: updatedBooking, refund: refundInfo ?? null },
  };
}

/**
 * P7.6: Payment Reconciliation Action (Admin recovers missed webhook)
 */
export async function reconcileMissedWebhookPayment(params: {
  bookingId: string;
  actorRole: UserRole;
}): Promise<OperationResult<BookingRecord>> {
  if (params.actorRole !== "ADMIN") {
    return {
      ok: false,
      errorCode: "FORBIDDEN",
      message: "403 Forbidden: Chỉ ADMIN mới có quyền đối soát (Reconcile) giao dịch thanh toán.",
    };
  }

  const bookings = getAllBookingsSnapshot();
  const idx = bookings.findIndex((b) => b.id === params.bookingId);
  if (idx === -1) {
    return { ok: false, errorCode: "NOT_FOUND", message: "Không tìm thấy đơn đặt phòng." };
  }

  const target = bookings[idx];
  if (target.status === "CONFIRMED") {
    return { ok: true, data: target };
  }

  const nowIso = new Date().toISOString();
  const txId = `RECONCILED_TX_${Date.now().toString(36).toUpperCase()}`;

  const updated: BookingRecord = {
    ...target,
    status: "CONFIRMED",
    confirmedAt: nowIso,
    updatedAt: nowIso,
    checkInQrToken:
      target.checkInQrToken ??
      `LMR-CHK-${target.bookingCode}-${target.id.slice(-4).toUpperCase()}`,
    payments: target.payments.map((p, i) =>
      i === target.payments.length - 1
        ? { ...p, status: "PAID" as const, transactionId: txId, paidAt: nowIso }
        : p,
    ),
  };

  bookings[idx] = updated;
  saveBookingsSnapshot(bookings);

  appendAuditLog({
    actorUserId: "usr-admin-01",
    actorName: "Owner Admin",
    actorRole: "ADMIN",
    action: "PAYMENT_RECONCILE",
    entityType: "BOOKING",
    entityId: updated.bookingCode,
    metadataSummary: `Đối soát thanh toán thủ công (Payment Reconciliation) cho đơn #${updated.bookingCode} -> CONFIRMED`,
  });

  return { ok: true, data: updated };
}

/**
 * P6.1: Manager Dashboard Summary (with strict property-scope enforcement)
 */
export async function getManagerDashboardSummary(params: {
  propertyId: string;
  actorRole: UserRole;
  assignedPropertyIds: string[];
}): Promise<OperationResult<ManagerDashboardSummary>> {
  await new Promise((resolve) => setTimeout(resolve, 60));

  if (
    !hasPropertyScopePermission(
      params.actorRole,
      params.assignedPropertyIds,
      params.propertyId,
    )
  ) {
    return {
      ok: false,
      errorCode: "FORBIDDEN",
      message: `403 Forbidden: Quản lý không được phân quyền truy cập dữ liệu vận hành của chi nhánh "${params.propertyId}".`,
    };
  }

  const properties = getManagedPropertiesSnapshot();
  const prop = properties.find((p) => p.id === params.propertyId);
  if (!prop) {
    return { ok: false, errorCode: "NOT_FOUND", message: "Không tìm thấy chi nhánh." };
  }

  const rooms = getPhysicalRoomsSnapshot().filter((r) => r.propertyId === prop.id);
  const activeRooms = rooms.filter((r) => r.status === "ACTIVE" && !r.isBlocked).length;
  const blockedRooms = rooms.filter((r) => r.isBlocked).length;

  const bookings = getAllBookingsSnapshot().filter((b) => b.propertyId === prop.id);
  const pendingCheckInCount = bookings.filter((b) => b.status === "CONFIRMED").length;
  const checkedInCount = bookings.filter((b) => b.status === "CHECKED_IN").length;
  const activeCount = bookings.filter(
    (b) =>
      b.status === "PENDING_PAYMENT" ||
      b.status === "CONFIRMED" ||
      b.status === "CHECKED_IN",
  ).length;

  const occupancyRatePercent =
    activeRooms > 0
      ? Math.min(100, Math.round(((checkedInCount + pendingCheckInCount + 1) / activeRooms) * 100))
      : 0;

  return {
    ok: true,
    data: {
      propertyId: prop.id,
      propertyName: prop.name,
      propertyCity: prop.city,
      totalRooms: rooms.length,
      activeRooms,
      blockedRooms,
      occupancyRatePercent,
      bookingsTodayCount: activeCount,
      pendingCheckInCount,
      checkedInCount,
      upcomingBookings: bookings,
    },
  };
}

/**
 * P6.5 & P6.6: Admin Monitor Metrics Summary (ADMIN only)
 */
export async function getAdminMonitorMetrics(params?: {
  actorRole?: UserRole;
  propertyIdFilter?: string;
}): Promise<OperationResult<AdminMonitorSummary>> {
  await new Promise((resolve) => setTimeout(resolve, 60));
  const role = params?.actorRole ?? "ADMIN";

  if (role !== "ADMIN") {
    return {
      ok: false,
      errorCode: "FORBIDDEN",
      message: "403 Forbidden: Chỉ ADMIN mới có quyền truy cập System Monitor Dashboard.",
    };
  }

  const users = readUsers();
  const properties = getManagedPropertiesSnapshot();
  const allRooms = getPhysicalRoomsSnapshot();
  const allBookings = getAllBookingsSnapshot();

  const filteredRooms =
    params?.propertyIdFilter && params.propertyIdFilter !== "all"
      ? allRooms.filter((r) => r.propertyId === params.propertyIdFilter)
      : allRooms;

  const filteredBookings =
    params?.propertyIdFilter && params.propertyIdFilter !== "all"
      ? allBookings.filter((b) => b.propertyId === params.propertyIdFilter)
      : allBookings;

  const bookingsByStatus: Record<string, number> = {
    PENDING_PAYMENT: 0,
    CONFIRMED: 0,
    CHECKED_IN: 0,
    CHECKED_OUT: 0,
    CANCELLED: 0,
    EXPIRED: 0,
  };

  let simulatedRevenueVnd = 0;

  for (const b of filteredBookings) {
    bookingsByStatus[b.status] = (bookingsByStatus[b.status] ?? 0) + 1;
    const paidSum = b.payments
      .filter((p) => p.status === "PAID")
      .reduce((acc, p) => acc + p.amount, 0);
    const refunded = b.refundInfo?.status === "REFUNDED" ? b.refundInfo.refundAmount : 0;
    simulatedRevenueVnd += Math.max(0, paidSum - refunded);
  }

  const dailyTrend: DailyMetricPoint[] = [
    { date: "2026-10-14", label: "14/10", bookingsCount: 3, simulatedRevenueVnd: 1850000 },
    { date: "2026-10-15", label: "15/10", bookingsCount: 5, simulatedRevenueVnd: 3120000 },
    { date: "2026-10-16", label: "16/10", bookingsCount: 4, simulatedRevenueVnd: 2490000 },
    { date: "2026-10-17", label: "17/10", bookingsCount: 6, simulatedRevenueVnd: 4250000 },
    {
      date: "2026-10-18",
      label: "Hôm nay",
      bookingsCount: Math.max(2, filteredBookings.length),
      simulatedRevenueVnd: Math.max(1250000, simulatedRevenueVnd),
    },
  ];

  return {
    ok: true,
    data: {
      totalUsers: users.length,
      totalManagers: users.filter((u) => u.role === "MANAGER").length,
      totalAdmins: users.filter((u) => u.role === "ADMIN").length,
      totalProperties: properties.length,
      totalRooms: filteredRooms.length,
      activeRooms: filteredRooms.filter((r) => r.status === "ACTIVE" && !r.isBlocked).length,
      blockedRooms: filteredRooms.filter((r) => r.isBlocked).length,
      activeBookingsCount:
        (bookingsByStatus.PENDING_PAYMENT ?? 0) +
        (bookingsByStatus.CONFIRMED ?? 0) +
        (bookingsByStatus.CHECKED_IN ?? 0),
      simulatedRevenueVnd,
      revenueLabel: "Doanh thu mô phỏng (Simulated Mock Payments PAID)",
      bookingsByStatus,
      dailyTrend,
      latestBookings: filteredBookings.slice(0, 10),
      auditLogs: readAuditLogs(),
      emailEvents: readEmailEvents(),
    },
  };
}
