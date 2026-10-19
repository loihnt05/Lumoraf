"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { BookingRecord } from "@/lib/types/quote";
import {
  getBookingById,
  simulateMockPaymentSuccess,
  simulateMockPaymentFailure,
  expireBookingHoldNow,
  cancelPendingBooking,
} from "@/lib/api/bookings";
import {
  enqueueEmailNotification,
  getGuestRoomAccessCode,
} from "@/lib/api/operations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  CreditCard,
  ShieldCheck,
  KeyRound,
  MapPin,
  Calendar,
  User as UserIcon,
  RotateCw,
  Loader2,
  Sparkles,
  Receipt,
  Ban,
  QrCode,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}₫`;
}

function formatRemainingTime(expiresAtIso: string, nowMs: number): {
  expired: boolean;
  formatted: string;
  secondsLeft: number;
} {
  const diffSec = Math.max(
    0,
    Math.floor((new Date(expiresAtIso).getTime() - nowMs) / 1000),
  );
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return {
    expired: diffSec <= 0,
    formatted: `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
    secondsLeft: diffSec,
  };
}

export default function BookingCheckoutPage() {
  const params = useParams();
  const bookingId = params?.bookingId as string;

  const [booking, setBooking] = React.useState<BookingRecord | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<
    "success" | "fail" | "expire" | "cancel" | null
  >(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [nowMs, setNowMs] = React.useState<number>(() => Date.now());

  // P7.11: Secure Guest Room Access Code reveal state
  const [guestPinData, setGuestPinData] = React.useState<{
    codeValue: string;
    validDate: string;
    roomNumber: string;
  } | null>(null);
  const [guestPinError, setGuestPinError] = React.useState<string | null>(null);
  const [isPinVisible, setIsPinVisible] = React.useState(false);

  const loadBooking = React.useCallback(async () => {
    if (!bookingId) return;
    try {
      const data = await getBookingById(bookingId);
      setBooking(data);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  React.useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  // Live 1s countdown ticker while booking is PENDING_PAYMENT
  React.useEffect(() => {
    if (!booking || booking.status !== "PENDING_PAYMENT") return;

    const interval = setInterval(() => {
      const current = Date.now();
      setNowMs(current);
      if (new Date(booking.expiresAt).getTime() <= current) {
        void loadBooking();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [booking, loadBooking]);

  const handleSimulateSuccess = async () => {
    if (!booking || actionLoading) return;
    setActionLoading("success");
    setActionError(null);
    try {
      const updated = await simulateMockPaymentSuccess(booking.id);
      enqueueEmailNotification({
        idempotencyKey: `confirm_${updated.id}`,
        bookingId: updated.id,
        recipientEmail: updated.guestEmail,
        template: "BOOKING_CONFIRMED",
        subject: `[Lumora] Xác nhận đặt phòng thành công #${updated.bookingCode}`,
      });
      setBooking(updated);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Không thể xử lý thanh toán.",
      );
      await loadBooking();
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevealGuestPin = async (callerUserId?: string) => {
    if (!booking) return;
    setGuestPinError(null);
    const res = await getGuestRoomAccessCode({
      bookingId: booking.id,
      currentUserId: callerUserId ?? booking.userId,
    });
    if (!res.ok) {
      setGuestPinData(null);
      setIsPinVisible(false);
      setGuestPinError(res.message);
      return;
    }
    setGuestPinData(res.data);
    setIsPinVisible(true);
  };

  const handleSimulateFailure = async () => {
    if (!booking || actionLoading) return;
    setActionLoading("fail");
    setActionError(null);
    try {
      const updated = await simulateMockPaymentFailure(booking.id);
      setBooking(updated);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Không thể mô phỏng lỗi thanh toán.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleSimulateExpire = async () => {
    if (!booking || actionLoading) return;
    setActionLoading("expire");
    setActionError(null);
    try {
      const updated = await expireBookingHoldNow(booking.id);
      setBooking(updated);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelHold = async () => {
    if (!booking || actionLoading) return;
    setActionLoading("cancel");
    setActionError(null);
    try {
      const updated = await cancelPendingBooking(booking.id);
      setBooking(updated);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        <Skeleton className="h-6 w-48 rounded-md" />
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <Skeleton className="h-96 w-full rounded-3xl" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-16 text-center">
        <p className="text-caption uppercase tracking-widest text-primary">
          404 · Không tìm thấy đơn đặt phòng
        </p>
        <h1 className="text-heading text-2xl font-medium text-foreground">
          Đơn đặt phòng không tồn tại
        </h1>
        <p className="text-sm text-muted-foreground">
          Mã đơn đặt phòng không hợp lệ hoặc dữ liệu phiên trình duyệt đã bị xóa.
        </p>
        <Button asChild className="rounded-full">
          <Link href="/booking">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span>Quay lại trang tìm phòng</span>
          </Link>
        </Button>
      </div>
    );
  }

  const countdown = formatRemainingTime(booking.expiresAt, nowMs);
  const isPending = booking.status === "PENDING_PAYMENT" && !countdown.expired;
  const isConfirmed =
    booking.status === "CONFIRMED" ||
    booking.status === "CHECKED_IN" ||
    booking.status === "CHECKED_OUT";
  const isExpired =
    booking.status === "EXPIRED" ||
    (booking.status === "PENDING_PAYMENT" && countdown.expired);
  const isCancelled = booking.status === "CANCELLED";

  const latestFailedPayment = [...booking.payments]
    .reverse()
    .find((p) => p.status === "FAILED");
  const activePendingPayment = booking.payments.find((p) => p.status === "PENDING");
  const paidPayment = booking.payments.find((p) => p.status === "PAID");
  const checkInQrCode =
    booking.checkInQrToken ??
    `LMR-CHK-${booking.bookingCode}-${booking.id.slice(-4).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      {/* 1. Top Navigation & Safe Back Link (Does NOT cancel booking hold) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <Link
          href={`/booking/${booking.roomId}`}
          className="group inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Quay lại {booking.roomName} (Giữ nguyên đơn đang chờ)</span>
        </Link>

        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/my-bookings"
            className="font-medium text-primary hover:underline"
          >
            Xem tất cả đặt phòng của tôi →
          </Link>
        </div>
      </div>

      {/* 2. Status Banner Header (PENDING_PAYMENT / CONFIRMED / EXPIRED / CANCELLED) */}
      {isConfirmed && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/90 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-emerald-700 text-white border-none text-[10px] font-semibold uppercase tracking-wider">
                    {booking.status === "CHECKED_IN"
                      ? "CHECKED_IN · Đang lưu trú"
                      : booking.status === "CHECKED_OUT"
                      ? "CHECKED_OUT · Đã trả phòng"
                      : "CONFIRMED · Đã xác nhận"}
                  </Badge>
                  <span className="text-xs font-mono font-semibold text-emerald-950">
                    #{booking.bookingCode}
                  </span>
                </div>
                <h1 className="text-heading text-2xl sm:text-3xl font-medium text-emerald-950">
                  {booking.status === "CHECKED_IN"
                    ? "Chúc bạn kỳ nghỉ tuyệt vời tại Lumora!"
                    : booking.status === "CHECKED_OUT"
                    ? "Cảm ơn bạn đã lưu trú tại Lumora!"
                    : "Đặt phòng thành công!"}
                </h1>
                <p className="text-xs sm:text-sm text-emerald-800 max-w-2xl leading-relaxed">
                  Cảm ơn <strong>{booking.guestName}</strong>. Phòng{" "}
                  <strong>{booking.roomName}</strong> tại{" "}
                  <strong>{booking.propertyName}</strong> đã được khóa lịch dành riêng cho bạn.
                </p>
              </div>
            </div>

            {paidPayment && (
              <div className="rounded-2xl bg-white/90 border border-emerald-200 px-4 py-3 text-xs text-emerald-950 space-y-0.5">
                <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">
                  Biên lai thanh toán
                </p>
                <p className="font-mono font-semibold">{paidPayment.transactionId}</p>
                <p className="text-[11px] text-emerald-700">
                  Đã thanh toán: {formatVnd(paidPayment.amount)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {isPending && (
        <div className="rounded-3xl border border-amber-200/90 bg-amber-50/70 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-amber-600 text-white border-none text-[10px] font-semibold uppercase tracking-wider">
                  PENDING_PAYMENT · Đang giữ phòng
                </Badge>
                <span className="text-xs font-mono font-semibold text-amber-950">
                  Mã đơn: #{booking.bookingCode}
                </span>
              </div>
              <h1 className="text-heading text-2xl sm:text-3xl font-medium text-foreground">
                Hoàn tất thanh toán để xác nhận đặt phòng
              </h1>
              <p className="text-xs text-muted-foreground">
                Phòng đang được tạm giữ cho bạn. Nếu quá thời gian giữ chỗ mà chưa thanh toán, phòng sẽ tự động mở lại cho khách khác.
              </p>
            </div>

            {/* Live Countdown Box */}
            <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-surface px-5 py-3.5 shadow-2xs shrink-0">
              <Clock
                className={cn(
                  "h-5 w-5",
                  countdown.secondsLeft <= 120
                    ? "text-red-600 animate-pulse"
                    : "text-amber-700",
                )}
              />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Thời gian giữ phòng còn lại
                </p>
                <p
                  className={cn(
                    "font-mono text-2xl font-bold tabular-nums",
                    countdown.secondsLeft <= 120 ? "text-red-600" : "text-foreground",
                  )}
                >
                  {countdown.formatted}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isExpired && (
        <div className="rounded-3xl border border-red-200 bg-red-50/90 p-6 sm:p-8 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white">
              <XCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-red-700 text-white border-none text-[10px] font-semibold uppercase tracking-wider">
                  EXPIRED · Hết hạn giữ phòng
                </Badge>
                <span className="text-xs font-mono font-semibold text-red-950">
                  #{booking.bookingCode}
                </span>
              </div>
              <h1 className="text-heading text-2xl font-medium text-red-950">
                Phiên giữ phòng 15 phút đã hết hạn
              </h1>
              <p className="text-xs sm:text-sm text-red-800 max-w-2xl leading-relaxed">
                Đơn đặt phòng này đã tự động chuyển sang trạng thái <strong>EXPIRED</strong> và giải phóng phòng vào kho trống. Vui lòng quay lại kiểm tra lịch trống mới nhất để đặt lại.
              </p>
            </div>
          </div>
          <div className="pt-1">
            <Button asChild className="rounded-full">
              <Link href={`/booking/${booking.roomId}`}>
                <RotateCw className="mr-2 h-4 w-4" />
                <span>Chọn lại khung giờ tại {booking.roomName}</span>
              </Link>
            </Button>
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="rounded-3xl border border-border bg-muted/50 p-6 sm:p-8 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted-foreground text-white">
              <Ban className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-muted-foreground text-white border-none text-[10px] font-semibold uppercase tracking-wider">
                  CANCELLED · Đã hủy đặt phòng
                </Badge>
                <span className="text-xs font-mono font-semibold text-foreground">
                  #{booking.bookingCode}
                </span>
                {booking.refundInfo && (
                  <Badge className="bg-emerald-700 text-white border-none text-[10px]">
                    {booking.refundInfo.policyTierLabel}
                  </Badge>
                )}
              </div>
              <h1 className="text-heading text-2xl font-medium text-foreground">
                Đơn đặt phòng đã được hủy
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Phòng đã được mở lại trên hệ thống.{" "}
                {booking.refundInfo
                  ? `Số tiền hoàn lại theo chính sách: ${formatVnd(booking.refundInfo.refundAmount)} (Trạng thái: ${booking.refundInfo.status}).`
                  : "Bạn đã chủ động hủy phiên giữ phòng này."}
              </p>
            </div>
          </div>
          <div className="pt-1">
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/booking/${booking.roomId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span>Quay lại trang phòng</span>
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* 3. Two-Column Layout: Booking Summary (Left) & Mock Payment / Next Steps (Right) */}
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] items-start">
        {/* Left Column: Authoritative Booking Snapshot */}
        <div className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                Booking details
              </span>
              <h2 className="text-heading text-xl font-medium text-foreground">
                Thông tin lưu trú đã chốt
              </h2>
            </div>
            <span className="font-mono text-xs font-semibold text-muted-foreground">
              #{booking.bookingCode}
            </span>
          </div>

          {/* Room Preview Row */}
          <div className="flex gap-4 items-center rounded-2xl bg-muted/30 p-3.5 border border-border/60">
            {booking.roomImage && (
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
                <Image
                  src={booking.roomImage}
                  alt={booking.roomName}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-none text-[10px] font-semibold">
                  {booking.roomNumber}
                </Badge>
                <span className="text-xs text-muted-foreground truncate">
                  {booking.roomTypeName}
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground truncate">
                {booking.roomName}
              </h3>
              <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>
                  {booking.propertyName} · {booking.propertyAddress}
                </span>
              </p>
            </div>
          </div>

          {/* Stay Schedule & Guest Details Grid */}
          <div className="grid gap-3.5 sm:grid-cols-2 text-xs">
            <div className="rounded-2xl border border-border/60 p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>Lịch nhận & trả phòng</span>
              </div>
              <p className="text-sm font-semibold text-foreground pt-1">
                {booking.quoteSnapshot.dateRangeLabel}
              </p>
              <p className="text-xs text-primary font-medium">
                {booking.quoteSnapshot.timeRangeLabel} ({booking.quoteSnapshot.durationLabel})
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <UserIcon className="h-3.5 w-3.5 text-primary" />
                <span>Khách lưu trú chính</span>
              </div>
              <p className="text-sm font-semibold text-foreground pt-1">
                {booking.guestName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {booking.guestEmail}
              </p>
            </div>
          </div>

          {/* Price Snapshot Breakdown */}
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between font-semibold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
              <span>Bảng kê chi phí (Price Snapshot)</span>
              <span>{booking.currency}</span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>{booking.quoteSnapshot.baseLabel}</span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatVnd(booking.subtotal)}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>Phụ phí khung đêm (23:00–06:00)</span>
              <span className="font-semibold text-foreground tabular-nums">
                {booking.surchargeAmount > 0
                  ? `+${formatVnd(booking.surchargeAmount)}`
                  : "—"}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>Dọn phòng ({booking.quoteSnapshot.cleaningBufferMinutes}p buffer) & Khóa số</span>
              <span className="text-emerald-700 font-medium">Đã bao gồm</span>
            </div>

            <div className="flex items-baseline justify-between border-t border-border/70 pt-3 text-sm font-bold text-foreground">
              <span>Tổng thanh toán</span>
              <span className="text-price text-xl text-primary tabular-nums">
                {formatVnd(booking.totalAmount)}
              </span>
            </div>
          </div>

          {/* Digital Smart Lock Access Code Policy Note */}
          <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-surface p-4 text-xs text-muted-foreground leading-relaxed">
            <KeyRound className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">
                Chính sách bảo mật Mã khóa phòng (Room Access Code)
              </p>
              <p className="mt-0.5">
                Mỗi phòng vật lý có mã khóa điện tử 6 chữ số được xoay vòng tự động mỗi ngày. Để đảm bảo an toàn, mã khóa chỉ được cấp cho khách chính chủ khi đơn ở trạng thái <strong>CONFIRMED</strong> và đến khung giờ nhận phòng.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Mock Payment Gateway (UI-8.3 & P7.8) or Confirmed Actions (P7.9 & P7.11) */}
        <aside className="space-y-6">
          {isPending && (
            <div className="rounded-3xl border border-border/90 bg-surface p-6 sm:p-7 shadow-xl shadow-black/5 space-y-6">
              <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                      Mock Payment Gateway · MVP
                    </span>
                  </div>
                  <h2 className="text-heading text-xl font-medium text-foreground">
                    Thanh toán QR hoặc Mô phỏng
                  </h2>
                </div>
                <CreditCard className="h-5 w-5 text-primary shrink-0" />
              </div>

              {/* P7.8: Payment QR Code Display Card (Strictly for Payment, distinct from Check-in QR) */}
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center space-y-3">
                <div className="flex items-center justify-between text-[11px]">
                  <Badge className="bg-primary text-primary-foreground border-none text-[10px]">
                    Payment QR · P7.8
                  </Badge>
                  <span className="font-mono text-muted-foreground">
                    Hết hạn sau {countdown.formatted}
                  </span>
                </div>

                <div className="mx-auto flex h-36 w-36 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-white p-3 shadow-2xs">
                  <QrCode className="h-20 w-20 text-foreground" />
                  <span className="mt-1 font-mono text-[9px] font-semibold text-muted-foreground">
                    VIETQR · {activePendingPayment?.paymentCode ?? "PAY-MOCK"}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Quét mã <strong>Payment QR</strong> để thanh toán{" "}
                  <strong className="text-foreground">
                    {formatVnd(booking.totalAmount)}
                  </strong>{" "}
                  (Mã này chỉ dùng cho thanh toán, không dùng để Check-in).
                </p>
              </div>

              {/* Payment Attempt Info */}
              <div className="rounded-2xl bg-muted/40 p-4 border border-border/60 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã giao dịch chờ:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {activePendingPayment?.paymentCode ?? "PAY-MOCK"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cổng thanh toán:</span>
                  <span className="font-medium text-foreground">
                    Lumora Sandbox (Mock Provider)
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-border/50">
                  <span className="font-semibold text-foreground">Số tiền cần trả:</span>
                  <span className="text-price text-lg font-bold text-primary tabular-nums">
                    {formatVnd(booking.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Previous Failed Attempt Alert (Retryable State) */}
              {latestFailedPayment && (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 space-y-1.5 animate-in fade-in-50"
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>Lần thanh toán trước không thành công</span>
                  </div>
                  <p className="leading-relaxed">
                    {latestFailedPayment.failureReason}
                  </p>
                  <p className="font-medium text-red-800 pt-1">
                    Đơn của bạn vẫn đang được giữ chỗ ({countdown.formatted}). Bạn có thể bấm thanh toán lại ngay bên dưới.
                  </p>
                </div>
              )}

              {actionError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {actionError}
                </div>
              )}

              {/* Mock Outcome Controls (UI-8.3) */}
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Chọn kịch bản kiểm thử thanh toán (Dev / QA)
                </p>

                <Button
                  size="lg"
                  disabled={actionLoading !== null}
                  onClick={handleSimulateSuccess}
                  className="w-full justify-center rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-md"
                >
                  {actionLoading === "success" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Đang xác nhận giao dịch...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      <span>
                        {latestFailedPayment
                          ? "Thử lại: Mô phỏng Thanh toán Thành công"
                          : "Mô phỏng Thanh toán Thành công (PAID)"}
                      </span>
                    </>
                  )}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  disabled={actionLoading !== null}
                  onClick={handleSimulateFailure}
                  className="w-full justify-center rounded-full border-red-200 text-red-700 hover:bg-red-50 font-medium"
                >
                  {actionLoading === "fail" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      <span>Mô phỏng Thanh toán Thất bại (FAILED)</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Secondary Dev & Cancel Actions */}
              <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  disabled={actionLoading !== null}
                  onClick={handleSimulateExpire}
                  className="text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Dev: Giả lập hết hạn 15 phút ngay
                </button>

                <button
                  type="button"
                  disabled={actionLoading !== null}
                  onClick={handleCancelHold}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Hủy giữ phòng
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>Trạng thái đơn được lưu bền vững khi tải lại trang (F5)</span>
              </div>
            </div>
          )}

          {isConfirmed && (
            <div className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 text-primary">
                <Receipt className="h-5 w-5" />
                <h2 className="text-heading text-lg font-medium text-foreground">
                  Check-in QR & Mã khóa phòng thông minh
                </h2>
              </div>

              {/* P7.9: Check-in QR Token Card (Distinct from Payment QR) */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-700 text-white border-none text-[10px]">
                    Check-in QR · P7.9
                  </Badge>
                  <Link
                    href="/manager"
                    className="text-[11px] font-semibold text-emerald-800 underline"
                  >
                    Quét thử tại /manager →
                  </Link>
                </div>

                <div className="flex items-center gap-3.5 rounded-xl bg-white p-3 border border-emerald-200">
                  <QrCode className="h-12 w-12 text-emerald-800 shrink-0" />
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Mã định danh Check-in (Token)
                    </p>
                    <p className="font-mono text-xs font-bold text-foreground truncate">
                      {checkInQrCode}
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      Xuất trình mã này cho Quản lý chi nhánh để xác nhận nhận phòng nhanh.
                    </p>
                  </div>
                </div>
              </div>

              {/* P7.11: Secure Guest Room Access Code Delivery Policy */}
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <KeyRound className="h-4 w-4 text-primary" />
                    <span>Mã khóa điện tử 6 số (Smart Lock PIN · P7.11)</span>
                  </div>
                  <Badge className="border border-border bg-surface text-foreground text-[10px]">
                    Owner-Only Policy
                  </Badge>
                </div>

                {guestPinData && isPinVisible ? (
                  <div className="rounded-xl bg-surface border border-primary/40 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">
                        Phòng {guestPinData.roomNumber} · Hiệu lực {guestPinData.validDate}
                      </p>
                      <p className="font-mono text-2xl font-bold tracking-[0.25em] text-primary">
                        {guestPinData.codeValue}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsPinVisible(false)}
                      className="rounded-full text-xs"
                    >
                      <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                      <span>Ẩn PIN</span>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-base font-bold tracking-widest text-muted-foreground">
                      ••••••
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRevealGuestPin(booking.userId)}
                        className="rounded-full text-xs"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        <span>Hiện mã PIN chính chủ</span>
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleRevealGuestPin("usr-stranger-99")}
                        className="text-[11px] text-muted-foreground underline hover:text-foreground"
                      >
                        Test 403 (Khách lạ)
                      </button>
                    </div>
                  </div>
                )}

                {guestPinError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-[11px] text-red-700 font-medium"
                  >
                    {guestPinError}
                  </div>
                )}
              </div>

              <div className="space-y-2.5 pt-2">
                <Button asChild size="lg" className="w-full justify-center rounded-full">
                  <Link href="/my-bookings">Xem danh sách đặt phòng của tôi</Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full justify-center rounded-full"
                >
                  <Link href="/booking">Khám phá thêm phòng khác</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Payment History Log */}
          {booking.payments.length > 0 && (
            <div className="rounded-2xl border border-border/70 bg-surface p-5 space-y-3 text-xs">
              <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">
                Lịch sử giao dịch thanh toán ({booking.payments.length})
              </p>
              <div className="space-y-2">
                {booking.payments.map((pm) => (
                  <div
                    key={pm.id}
                    className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2 border border-border/50"
                  >
                    <div>
                      <span className="font-mono font-semibold text-foreground">
                        {pm.paymentCode}
                      </span>
                      {pm.transactionId && (
                        <span className="ml-2 text-[10px] text-muted-foreground">
                          ({pm.transactionId})
                        </span>
                      )}
                    </div>
                    <Badge
                      className={cn(
                        "border-none text-[10px] font-semibold",
                        pm.status === "PAID"
                          ? "bg-emerald-100 text-emerald-900"
                          : pm.status === "FAILED"
                          ? "bg-red-100 text-red-800"
                          : pm.status === "PENDING"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {pm.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
