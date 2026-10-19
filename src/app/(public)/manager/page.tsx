"use client";

import * as React from "react";
import Link from "next/link";
import {
  getManagedPropertiesSnapshot,
  getManagerDashboardSummary,
  getStaffRoomAccessCodes,
  performBookingCheckIn,
  performBookingCheckOut,
  runDailyRoomAccessCodeBatch,
  verifyCheckInQrToken,
} from "@/lib/api/operations";
import type {
  ManagerDashboardSummary,
  RoomAccessCodeRecord,
  UserRole,
} from "@/lib/types/operations";
import type { BookingRecord } from "@/lib/types/quote";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  CalendarCheck2,
  CheckCircle2,
  DoorOpen,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  LogOut,
  QrCode,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StaffPersona = {
  id: string;
  label: string;
  role: UserRole;
  assignedPropertyIds: string[];
  defaultPropertyId: string;
};

const STAFF_PERSONAS: StaffPersona[] = [
  {
    id: "mgr-dalat",
    label: "Manager Đà Lạt (Chỉ chi nhánh Đà Lạt)",
    role: "MANAGER",
    assignedPropertyIds: ["prop-da-lat"],
    defaultPropertyId: "prop-da-lat",
  },
  {
    id: "mgr-saigon",
    label: "Manager Sài Gòn (Chỉ chi nhánh Sài Gòn)",
    role: "MANAGER",
    assignedPropertyIds: ["prop-sai-gon"],
    defaultPropertyId: "prop-sai-gon",
  },
  {
    id: "admin-global",
    label: "Admin Global (Toàn quyền mọi chi nhánh)",
    role: "ADMIN",
    assignedPropertyIds: ["prop-da-lat", "prop-sai-gon"],
    defaultPropertyId: "prop-da-lat",
  },
];

function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function ManagerDashboardPage() {
  const [persona, setPersona] = React.useState<StaffPersona>(STAFF_PERSONAS[0]);
  const [selectedPropertyId, setSelectedPropertyId] =
    React.useState<string>("prop-da-lat");
  const [selectedDate, setSelectedDate] = React.useState<string>(getTodayDateStr);

  const [dashboard, setDashboard] =
    React.useState<ManagerDashboardSummary | null>(null);
  const [scopeError, setScopeError] = React.useState<string | null>(null);
  const [roomCodes, setRoomCodes] = React.useState<RoomAccessCodeRecord[]>([]);
  const [revealedRoomIds, setRevealedRoomIds] = React.useState<
    Record<string, boolean>
  >({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // P6.2: Check-in / Check-out confirmation modal state
  const [pendingAction, setPendingAction] = React.useState<{
    type: "CHECK_IN" | "CHECK_OUT";
    booking: BookingRecord;
  } | null>(null);

  // P7.9: Check-in QR verification state
  const [qrInput, setQrInput] = React.useState("");
  const [qrScanResult, setQrScanResult] = React.useState<{
    ok: boolean;
    message: string;
    booking?: BookingRecord;
  } | null>(null);

  const properties = React.useMemo(() => getManagedPropertiesSnapshot(), []);

  const refreshData = React.useCallback(
    async (
      propId: string,
      activePersona: StaffPersona,
      dateStr: string,
    ) => {
      const [dashRes, codesRes] = await Promise.all([
        getManagerDashboardSummary({
          propertyId: propId,
          actorRole: activePersona.role,
          assignedPropertyIds: activePersona.assignedPropertyIds,
        }),
        getStaffRoomAccessCodes({
          validDate: dateStr,
          propertyId: propId,
          actorRole: activePersona.role,
          assignedPropertyIds: activePersona.assignedPropertyIds,
        }),
      ]);

      if (!dashRes.ok) {
        setDashboard(null);
        setScopeError(dashRes.message);
      } else {
        setDashboard(dashRes.data);
        setScopeError(null);
      }

      if (codesRes.ok) {
        setRoomCodes(codesRes.data);
      } else {
        setRoomCodes([]);
      }
      setIsLoading(false);
    },
    [],
  );

  React.useEffect(() => {
    let active = true;
    Promise.all([
      getManagerDashboardSummary({
        propertyId: selectedPropertyId,
        actorRole: persona.role,
        assignedPropertyIds: persona.assignedPropertyIds,
      }),
      getStaffRoomAccessCodes({
        validDate: selectedDate,
        propertyId: selectedPropertyId,
        actorRole: persona.role,
        assignedPropertyIds: persona.assignedPropertyIds,
      }),
    ]).then(([dashRes, codesRes]) => {
      if (!active) return;
      if (!dashRes.ok) {
        setDashboard(null);
        setScopeError(dashRes.message);
      } else {
        setDashboard(dashRes.data);
        setScopeError(null);
      }
      setRoomCodes(codesRes.ok ? codesRes.data : []);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [selectedPropertyId, persona, selectedDate]);

  const handleConfirmLifecycleAction = async () => {
    if (!pendingAction) return;
    const { type, booking } = pendingAction;
    setPendingAction(null);

    const res =
      type === "CHECK_IN"
        ? await performBookingCheckIn({
            bookingId: booking.id,
            actorRole: persona.role,
            assignedPropertyIds: persona.assignedPropertyIds,
          })
        : await performBookingCheckOut({
            bookingId: booking.id,
            actorRole: persona.role,
            assignedPropertyIds: persona.assignedPropertyIds,
          });

    if (!res.ok) {
      setFeedback({ type: "error", message: res.message });
      return;
    }

    setFeedback({
      type: "success",
      message:
        type === "CHECK_IN"
          ? `Đã xác nhận Check-in cho khách "${booking.guestName}" tại phòng ${booking.roomNumber} (#${booking.bookingCode}).`
          : `Đã xác nhận Check-out trả phòng cho đơn #${booking.bookingCode} (${booking.roomNumber}).`,
    });
    await refreshData(selectedPropertyId, persona, selectedDate);
  };

  const handleRunDailyPinBatch = async (forceRoomId?: string) => {
    const batch = await runDailyRoomAccessCodeBatch(selectedDate, {
      forceRotateRoomId: forceRoomId,
      actorRole: persona.role,
    });
    setFeedback({
      type: "success",
      message: forceRoomId
        ? `Đã cấp lại mã khóa thông minh mới cho phòng trong ngày ${selectedDate}.`
        : `Batch xoay mã khóa hằng ngày (${selectedDate}): Tạo mới ${batch.generatedCount} mã, giữ nguyên ${batch.skippedExistingCount} mã đã tồn tại (Idempotent).`,
    });
    await refreshData(selectedPropertyId, persona, selectedDate);
  };

  const handleVerifyQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    const res = await verifyCheckInQrToken({
      qrToken: qrInput,
      actorRole: persona.role,
      assignedPropertyIds: persona.assignedPropertyIds,
    });
    if (!res.ok) {
      setQrScanResult({ ok: false, message: res.message });
    } else {
      setQrScanResult({
        ok: true,
        message: `Mã QR Check-in hợp lệ! Đơn #${res.data.bookingCode} — Khách: ${res.data.guestName} — Phòng ${res.data.roomNumber}.`,
        booking: res.data,
      });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Role/Property Scope Bar (P6.1 & P1.6) */}
      <div className="flex flex-col gap-5 border-b border-border/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <Building2 className="h-4 w-4" />
            <span>Stage 6 · Operations & Property Management</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-foreground">
            Bảng điều hành &{" "}
            <span className="font-script text-4xl sm:text-5xl lg:text-6xl text-[#C48443] font-normal not-italic px-1 inline-block -rotate-1 align-baseline">
              operations.
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            Quản lý nhận/trả phòng (Check-in/Check-out), quét mã QR Check-in và
            vận hành mã khóa thông minh hằng ngày trong phạm vi chi nhánh được
            phân quyền.
          </p>
        </div>

        {/* Persona Switcher for Testing P1.6 & P6.1 Property Scope */}
        <div className="rounded-2xl border border-border/80 bg-surface p-3.5 shadow-xs space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Chuyển đổi tài khoản vận hành (Kiểm thử phân quyền P1.6):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {STAFF_PERSONAS.map((p) => {
              const active = p.id === persona.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setIsLoading(true);
                    setPersona(p);
                    setFeedback(null);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Property Selector & Date Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground mr-1">
            Chi nhánh:
          </span>
          {properties.map((prop) => {
            const isSelected = prop.id === selectedPropertyId;
            const isAssigned =
              persona.role === "ADMIN" ||
              persona.assignedPropertyIds.includes(prop.id);

            return (
              <button
                key={prop.id}
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setSelectedPropertyId(prop.id);
                  setFeedback(null);
                }}
                className={cn(
                  "inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border/80 bg-surface text-foreground hover:border-primary/50",
                )}
              >
                <span>{prop.name}</span>
                {!isAssigned && (
                  <Badge className="bg-red-100 text-red-800 border-none text-[9px] px-1.5 py-0">
                    Ngoài scope (Test 403)
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="mgr-date"
            className="text-xs font-medium text-muted-foreground"
          >
            Ngày vận hành:
          </label>
          <input
            id="mgr-date"
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(e.target.value);
            }}
            className="h-9 rounded-xl border border-border/80 bg-surface px-3 text-xs font-medium text-foreground"
          />
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          className={cn(
            "rounded-2xl border p-4 text-xs font-medium flex items-center justify-between gap-3",
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800",
          )}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[11px] underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 403 Forbidden Property Scope Guard State (P1.6 & P6.1) */}
      {scopeError ? (
        <div
          role="alert"
          className="rounded-3xl border border-red-200 bg-red-50/90 p-8 text-center space-y-4"
        >
          <ShieldAlert className="h-10 w-10 text-red-600 mx-auto" />
          <div className="space-y-1 max-w-lg mx-auto">
            <h2 className="text-lg font-semibold text-red-950">
              Truy cập bị từ chối theo phạm vi chi nhánh (Property Scope 403)
            </h2>
            <p className="text-xs leading-relaxed text-red-800">{scopeError}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSelectedPropertyId(persona.defaultPropertyId)}
            className="rounded-full border-red-300 bg-surface text-xs font-semibold text-red-800"
          >
            Quay về chi nhánh được phân quyền ({persona.defaultPropertyId})
          </Button>
        </div>
      ) : isLoading || !dashboard ? (
        <div className="rounded-3xl border border-border/70 bg-surface p-8 text-center text-xs text-muted-foreground">
          Đang tải dữ liệu vận hành chi nhánh...
        </div>
      ) : (
        <>
          {/* 1. KPI Summary Cards (P6.1) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-xs space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Phòng Hoạt Động / Tạm Khóa
              </span>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {dashboard.activeRooms} / {dashboard.totalRooms}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Đang khóa bảo trì: {dashboard.blockedRooms} phòng
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-xs space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Khách Chờ Check-in
              </span>
              <p className="text-2xl font-bold text-primary tabular-nums">
                {dashboard.pendingCheckInCount}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Đơn ở trạng thái CONFIRMED
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-xs space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Đang Lưu Trú (Checked-in)
              </span>
              <p className="text-2xl font-bold text-emerald-700 tabular-nums">
                {dashboard.checkedInCount}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Khách đã nhận phòng thực tế
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-xs space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Công Suất Phòng Ước Tính
              </span>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {dashboard.occupancyRatePercent}%
              </p>
              <p className="text-[11px] text-muted-foreground">
                Tại {dashboard.propertyName}
              </p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.45fr_1fr] items-start">
            {/* Left Column: P6.2 Check-in / Check-out Lifecycle & Bookings List */}
            <section className="rounded-3xl border border-border/80 bg-surface p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-4">
                <div>
                  <h2 className="text-heading text-lg font-medium text-foreground flex items-center gap-2">
                    <CalendarCheck2 className="h-5 w-5 text-primary" />
                    <span>
                      Điều Hành Check-in / Check-out ({dashboard.propertyName})
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Quy tắc P6.2: Chỉ đơn CONFIRMED mới được Check-in; chỉ đơn
                    CHECKED_IN mới được Check-out.
                  </p>
                </div>

                <Link
                  href="/booking"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  + Tạo đơn test mới
                </Link>
              </div>

              {dashboard.upcomingBookings.length === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-8 text-center space-y-2">
                  <DoorOpen className="h-6 w-6 text-muted-foreground mx-auto" />
                  <p className="text-xs font-semibold text-foreground">
                    Chưa có đơn đặt phòng nào tại {dashboard.propertyName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Bạn có thể đặt thử 1 phòng tại trang Booking và thanh toán
                    Mock PAID để thực hành Check-in / Check-out tại đây.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboard.upcomingBookings.map((bk) => (
                    <div
                      key={bk.id}
                      className="rounded-2xl border border-border/80 bg-background/50 p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-foreground">
                            #{bk.bookingCode}
                          </span>
                          <Badge className="bg-primary/10 text-primary border-none text-[10px]">
                            Phòng {bk.roomNumber}
                          </Badge>
                          <Badge
                            className={cn(
                              "border-none text-[10px]",
                              bk.status === "CONFIRMED"
                                ? "bg-emerald-100 text-emerald-900"
                                : bk.status === "CHECKED_IN"
                                ? "bg-blue-100 text-blue-900"
                                : bk.status === "CHECKED_OUT"
                                ? "bg-neutral-200 text-neutral-800"
                                : "bg-amber-100 text-amber-900",
                            )}
                          >
                            {bk.status}
                          </Badge>
                        </div>

                        <span className="text-xs font-bold text-foreground tabular-nums">
                          {bk.totalAmount.toLocaleString("vi-VN")}₫
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>
                          Khách hàng:{" "}
                          <strong className="text-foreground">
                            {bk.guestName}
                          </strong>{" "}
                          ({bk.guestEmail})
                        </p>
                        <p>
                          Lịch lưu trú: {bk.quoteSnapshot.dateRangeLabel} ·{" "}
                          {bk.quoteSnapshot.timeRangeLabel}
                        </p>
                        {bk.checkInQrToken && (
                          <p className="font-mono text-[11px] text-primary">
                            Mã QR Check-in: {bk.checkInQrToken}
                          </p>
                        )}
                      </div>

                      {/* Lifecycle Action Buttons (P6.2) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50">
                        <div className="text-[10px] text-muted-foreground">
                          {bk.checkedInAt &&
                            `Check-in: ${new Date(bk.checkedInAt).toLocaleTimeString("vi-VN")}`}
                          {bk.checkedOutAt &&
                            ` · Check-out: ${new Date(bk.checkedOutAt).toLocaleTimeString("vi-VN")}`}
                        </div>

                        <div className="flex items-center gap-2">
                          {bk.status === "CONFIRMED" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                setPendingAction({
                                  type: "CHECK_IN",
                                  booking: bk,
                                })
                              }
                              className="h-8 rounded-full text-xs gap-1.5"
                            >
                              <LogIn className="h-3.5 w-3.5" />
                              <span>Xác nhận Check-in</span>
                            </Button>
                          )}

                          {bk.status === "CHECKED_IN" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setPendingAction({
                                  type: "CHECK_OUT",
                                  booking: bk,
                                })
                              }
                              className="h-8 rounded-full text-xs gap-1.5 border-primary text-primary hover:bg-primary/10"
                            >
                              <LogOut className="h-3.5 w-3.5" />
                              <span>Xác nhận Check-out</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Right Column: P7.9 Check-in QR Verifier & P6.7 Room Access Code Operations */}
            <div className="space-y-6">
              {/* P7.9: Check-in QR Scanner / Verifier */}
              <section className="rounded-3xl border border-border/80 bg-surface p-6 shadow-xs space-y-4">
                <div className="space-y-1">
                  <h2 className="text-heading text-base font-medium text-foreground flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-primary" />
                    <span>Quét / Xác thực Mã QR Check-in (P7.9)</span>
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Phân biệt rõ với QR Thanh toán (Payment QR). Từ chối mã QR
                    của đơn đã hủy hoặc hết hạn.
                  </p>
                </div>

                <form onSubmit={handleVerifyQr} className="flex gap-2">
                  <input
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="Nhập mã LMR-CHK-... hoặc PAY-MOCK-..."
                    aria-label="Mã QR Check-in cần kiểm tra"
                    className="h-10 flex-1 rounded-xl border border-border/80 bg-background px-3 text-xs font-mono text-foreground"
                  />
                  <Button type="submit" size="sm" className="h-10 rounded-xl px-4 text-xs">
                    Kiểm tra QR
                  </Button>
                </form>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setQrInput("PAY-MOCK-991204")
                    }
                    className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Thử quét nhầm Payment QR
                  </button>
                  {dashboard.upcomingBookings[0]?.checkInQrToken && (
                    <button
                      type="button"
                      onClick={() =>
                        setQrInput(dashboard.upcomingBookings[0].checkInQrToken!)
                      }
                      className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-[10px] font-medium text-primary"
                    >
                      Điền QR của đơn #{dashboard.upcomingBookings[0].bookingCode}
                    </button>
                  )}
                </div>

                {qrScanResult && (
                  <div
                    role="status"
                    className={cn(
                      "rounded-2xl border p-3.5 text-xs space-y-2",
                      qrScanResult.ok
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-red-200 bg-red-50 text-red-800",
                    )}
                  >
                    <p className="font-semibold">{qrScanResult.message}</p>
                    {qrScanResult.ok &&
                      qrScanResult.booking?.status === "CONFIRMED" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            setPendingAction({
                              type: "CHECK_IN",
                              booking: qrScanResult.booking!,
                            })
                          }
                          className="h-8 rounded-full text-xs"
                        >
                          <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                          <span>Check-in ngay cho khách này</span>
                        </Button>
                      )}
                  </div>
                )}
              </section>

              {/* P6.7 & P2.9: Daily Room Access Code Operations */}
              <section className="rounded-3xl border border-border/80 bg-surface p-6 shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h2 className="text-heading text-base font-medium text-foreground flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-primary" />
                      <span>Mã Khóa Phòng Thông Minh ({selectedDate})</span>
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      P2.9 & P6.7: Tự động xoay mã 6 số mỗi ngày. Che mã mặc định
                      để bảo mật.
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleRunDailyPinBatch()}
                    className="h-8 rounded-full text-[11px] gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Chạy Batch Ngày</span>
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {roomCodes.map((rc) => {
                    const isRevealed = !!revealedRoomIds[rc.roomId];
                    return (
                      <div
                        key={rc.id}
                        className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 p-3 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-foreground">
                            Phòng {rc.roomNumber} · {rc.roomName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Hiệu lực: {rc.validDate} ·{" "}
                            <span className="text-emerald-700 font-medium">
                              ACTIVE
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-muted px-2.5 py-1 font-mono text-sm font-bold tracking-widest text-foreground">
                            {isRevealed ? rc.codeValue : "••••••"}
                          </span>

                          <button
                            type="button"
                            aria-label={
                              isRevealed ? "Ẩn mã khóa phòng" : "Hiện mã khóa phòng"
                            }
                            onClick={() =>
                              setRevealedRoomIds((prev) => ({
                                ...prev,
                                [rc.roomId]: !prev[rc.roomId],
                              }))
                            }
                            className="rounded-lg border border-border/80 bg-surface p-1.5 text-muted-foreground hover:text-foreground"
                          >
                            {isRevealed ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            title="Cấp lại mã mới cho phòng này"
                            onClick={() => handleRunDailyPinBatch(rc.roomId)}
                            className="rounded-lg border border-border/80 bg-surface px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                          >
                            Đổi mã
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-xl bg-primary/5 p-3 text-[11px] text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    Mã PIN không bao giờ được ghi ra application log hoặc trả về
                    ở API danh sách phòng công khai.
                  </span>
                </div>
              </section>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Dialog for Check-in / Check-out (P6.2) */}
      <Dialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>
                {pendingAction?.type === "CHECK_IN"
                  ? "Xác nhận Check-in nhận phòng"
                  : "Xác nhận Check-out trả phòng"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed pt-1">
              {pendingAction?.type === "CHECK_IN"
                ? `Bạn đang chuyển trạng thái đơn #${pendingAction.booking.bookingCode} của khách "${pendingAction.booking.guestName}" (Phòng ${pendingAction.booking.roomNumber}) từ CONFIRMED sang CHECKED_IN.`
                : `Bạn đang xác nhận khách "${pendingAction?.booking.guestName}" đã bàn giao Phòng ${pendingAction?.booking.roomNumber} và chuyển đơn #${pendingAction?.booking.bookingCode} sang CHECKED_OUT.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingAction(null)}
              className="rounded-full text-xs"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleConfirmLifecycleAction}
              className="rounded-full text-xs"
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              <span>Xác nhận thực hiện</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
