"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import type { BookingRecord, BookingStatus } from "@/lib/types/quote";
import type { CancellationEvaluation } from "@/lib/types/operations";
import { getUserBookings } from "@/lib/api/bookings";
import {
  cancelBookingWithRefundPolicy,
  evaluateCancellationPolicy,
  getGuestRoomAccessCode,
} from "@/lib/api/operations";
import { useAuth } from "@/lib/auth/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  MapPin,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Lock,
  Sparkles,
  KeyRound,
  QrCode,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}₫`;
}

function getStatusBadge(status: BookingStatus) {
  switch (status) {
    case "CONFIRMED":
      return (
        <Badge className="bg-emerald-100 text-emerald-900 border-none text-[11px] font-semibold flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
          <span>CONFIRMED · Đã xác nhận</span>
        </Badge>
      );
    case "CHECKED_IN":
      return (
        <Badge className="bg-blue-100 text-blue-900 border-none text-[11px] font-semibold flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-blue-700" />
          <span>CHECKED_IN · Đang lưu trú</span>
        </Badge>
      );
    case "CHECKED_OUT":
    case "COMPLETED":
      return (
        <Badge className="bg-slate-200 text-slate-900 border-none text-[11px] font-semibold flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-slate-700" />
          <span>CHECKED_OUT · Đã trả phòng</span>
        </Badge>
      );
    case "PENDING_PAYMENT":
      return (
        <Badge className="bg-amber-100 text-amber-900 border-none text-[11px] font-semibold flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-amber-700" />
          <span>PENDING_PAYMENT · Chờ thanh toán</span>
        </Badge>
      );
    case "EXPIRED":
      return (
        <Badge className="bg-red-100 text-red-800 border-none text-[11px] font-semibold flex items-center gap-1">
          <XCircle className="h-3.5 w-3.5 text-red-600" />
          <span>EXPIRED · Hết hạn giữ chỗ</span>
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge className="bg-muted text-muted-foreground border-none text-[11px] font-semibold flex items-center gap-1">
          <Ban className="h-3.5 w-3.5" />
          <span>CANCELLED · Đã hủy</span>
        </Badge>
      );
  }
}

export default function MyBookingsPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading, openSignInModal, login } = useAuth();
  const [bookings, setBookings] = React.useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  // P7.11: Guest PIN Reveal Map (bookingId -> codeValue)
  const [revealedPins, setRevealedPins] = React.useState<Record<string, string>>({});

  // P7.2 & P7.7: Cancellation & Refund Evaluation Modal State
  const [cancelTarget, setCancelTarget] = React.useState<{
    booking: BookingRecord;
    evaluation: CancellationEvaluation;
  } | null>(null);
  const [cancelReason, setCancelReason] = React.useState(
    "Thay đổi kế hoạch cá nhân",
  );
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [noticeBanner, setNoticeBanner] = React.useState<string | null>(null);

  const loadBookings = React.useCallback(async () => {
    try {
      const list = await getUserBookings(user?.id);
      setBookings(list);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const handleToggleRevealPin = async (booking: BookingRecord) => {
    if (revealedPins[booking.id]) {
      setRevealedPins((prev) => {
        const next = { ...prev };
        delete next[booking.id];
        return next;
      });
      return;
    }
    const res = await getGuestRoomAccessCode({
      bookingId: booking.id,
      currentUserId: booking.userId,
    });
    if (res.ok) {
      setRevealedPins((prev) => ({
        ...prev,
        [booking.id]: res.data.codeValue,
      }));
    }
  };

  const openCancelDialog = (booking: BookingRecord) => {
    const evaluation = evaluateCancellationPolicy(booking);
    setCancelTarget({ booking, evaluation });
  };

  const handleConfirmCancelWithRefund = async () => {
    if (!cancelTarget || isCancelling) return;
    setIsCancelling(true);
    try {
      const res = await cancelBookingWithRefundPolicy({
        bookingId: cancelTarget.booking.id,
        reason: cancelReason,
        actorRole: "USER",
      });
      if (res.ok) {
        setNoticeBanner(
          res.data.refund && res.data.refund.refundAmount > 0
            ? `Đã hủy đơn #${res.data.booking.bookingCode} và hoàn tiền tự động ${formatVnd(res.data.refund.refundAmount)} (${res.data.refund.policyTierLabel}).`
            : `Đã hủy đơn #${res.data.booking.bookingCode} thành công. Phòng đã được mở lại.`,
        );
        setCancelTarget(null);
        await loadBookings();
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredBookings = React.useMemo(() => {
    if (statusFilter === "ALL") return bookings;
    if (statusFilter === "CONFIRMED") {
      return bookings.filter(
        (b) =>
          b.status === "CONFIRMED" ||
          b.status === "CHECKED_IN" ||
          b.status === "CHECKED_OUT",
      );
    }
    if (statusFilter === "EXPIRED") {
      return bookings.filter(
        (b) => b.status === "EXPIRED" || b.status === "CANCELLED",
      );
    }
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-44 w-full rounded-3xl" />
        <Skeleton className="h-44 w-full rounded-3xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-border/80 bg-surface p-8 sm:p-12 text-center space-y-5 my-8 shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <h1 className="text-heading text-2xl font-medium text-foreground">
            Đăng nhập để xem lịch sử đặt phòng
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Vui lòng đăng nhập tài khoản Lumora để quản lý các đơn đang chờ thanh toán hoặc xem mã đặt phòng đã xác nhận.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => void login("google")}
            size="lg"
            className="rounded-full px-7 w-full sm:w-auto"
          >
            Khách demo: Loi Tran
          </Button>
          <Button
            onClick={openSignInModal}
            variant="outline"
            size="lg"
            className="rounded-full px-7 w-full sm:w-auto"
          >
            Đăng nhập tài khoản khác
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border/60 pb-6">
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            Guest Portal · My Bookings
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-foreground">
            Kỳ nghỉ của{" "}
            <span className="font-script text-4xl sm:text-5xl lg:text-6xl text-[#C48443] font-normal not-italic px-1 inline-block -rotate-1 align-baseline">
              bạn.
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Quản lý các kỳ nghỉ sắp tới, nhận mã khóa thông minh 6 số (P7.11), mã QR Check-in (P7.9) và chính sách hủy/hoàn tiền tự động (P7.2).
          </p>
        </div>

        <Button asChild variant="outline" className="rounded-full self-start sm:self-auto">
          <Link href="/booking">
            <span>+ Đặt thêm phòng mới</span>
          </Link>
        </Button>
      </div>

      {noticeBanner && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-900 flex items-center justify-between gap-3"
        >
          <span>{noticeBanner}</span>
          <button
            type="button"
            onClick={() => setNoticeBanner(null)}
            className="underline text-[11px]"
          >
            Đóng
          </button>
        </div>
      )}

      {/* P7.2 & P7.7: Cancellation & Refund Policy Confirmation Modal */}
      {cancelTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận hủy đặt phòng và hoàn tiền theo chính sách"
          className="rounded-3xl border-2 border-amber-300 bg-amber-50/90 p-6 shadow-lg space-y-4 animate-in fade-in-50"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Badge className="bg-amber-700 text-white border-none text-[10px]">
                Cancellation Policy v1 · P7.2 & P7.7
              </Badge>
              <h2 className="text-heading text-xl font-medium text-amber-950">
                Xác nhận hủy đơn #{cancelTarget.booking.bookingCode} ({cancelTarget.booking.roomName})
              </h2>
              <p className="text-xs text-amber-900">
                {cancelTarget.evaluation.explanation}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 rounded-2xl bg-white/90 border border-amber-200 p-4 text-xs">
            <div>
              <span className="text-[10px] uppercase text-muted-foreground block">
                Mức chính sách áp dụng
              </span>
              <span className="font-semibold text-foreground">
                {cancelTarget.evaluation.policyTierLabel}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-muted-foreground block">
                Số tiền hoàn lại ({cancelTarget.evaluation.eligiblePercent}%)
              </span>
              <span className="text-price text-base font-bold text-emerald-700">
                {formatVnd(cancelTarget.evaluation.refundAmount)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-muted-foreground block">
                Phí hủy phòng
              </span>
              <span className="font-semibold text-red-700">
                {formatVnd(cancelTarget.evaluation.feeAmount)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label
              htmlFor="cancel-reason-input"
              className="font-semibold text-amber-950"
            >
              Lý do hủy phòng:
            </label>
            <input
              id="cancel-reason-input"
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs text-foreground"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelTarget(null)}
              className="rounded-full"
            >
              Giữ lại đơn đặt phòng
            </Button>
            <Button
              size="sm"
              disabled={isCancelling}
              onClick={handleConfirmCancelWithRefund}
              className="rounded-full bg-red-600 hover:bg-red-700 text-white"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              <span>
                {isCancelling
                  ? "Đang xử lý hoàn tiền..."
                  : `Xác nhận hủy & Hoàn ${formatVnd(cancelTarget.evaluation.refundAmount)}`}
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "ALL", label: `Tất cả (${bookings.length})` },
          {
            id: "PENDING_PAYMENT",
            label: `Chờ thanh toán (${bookings.filter((b) => b.status === "PENDING_PAYMENT").length})`,
          },
          {
            id: "CONFIRMED",
            label: `Đã xác nhận / Lưu trú (${bookings.filter((b) => b.status === "CONFIRMED" || b.status === "CHECKED_IN" || b.status === "CHECKED_OUT").length})`,
          },
          {
            id: "EXPIRED",
            label: `Hết hạn / Đã hủy (${bookings.filter((b) => b.status === "EXPIRED" || b.status === "CANCELLED").length})`,
          },
        ].map((tab) => {
          const active = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "border border-border/80 bg-surface text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="rounded-3xl border border-border/70 bg-surface p-10 text-center space-y-4">
          <Sparkles className="h-7 w-7 mx-auto text-primary/70" />
          <div className="space-y-1">
            <h2 className="text-heading text-lg font-medium text-foreground">
              Chưa có đơn đặt phòng nào
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Hãy chọn một không gian ưng ý tại Đà Lạt hoặc Sài Gòn và trải nghiệm 3 chế độ đặt phòng linh hoạt của Lumora.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link href="/booking">
              <span>Khám phá danh sách phòng</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const isEligibleForPin =
              b.status === "CONFIRMED" || b.status === "CHECKED_IN";
            const pinValue = revealedPins[b.id];
            const checkInQr =
              b.checkInQrToken ??
              `LMR-CHK-${b.bookingCode}-${b.id.slice(-4).toUpperCase()}`;

            return (
              <div
                key={b.id}
                className="group rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-md space-y-4"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-4 items-start sm:items-center min-w-0">
                    {b.roomImage && (
                      <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-2xl bg-muted">
                        <Image
                          src={b.roomImage}
                          alt={b.roomName}
                          fill
                          sizes="128px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}

                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(b.status)}
                        <span className="font-mono text-xs font-semibold text-muted-foreground">
                          #{b.bookingCode}
                        </span>
                        {b.refundInfo && (
                          <Badge className="bg-emerald-100 text-emerald-900 border-none text-[10px]">
                            Hoàn tiền {b.refundInfo.eligiblePercent}%:{" "}
                            {formatVnd(b.refundInfo.refundAmount)} ({b.refundInfo.status})
                          </Badge>
                        )}
                      </div>

                      <h2 className="text-lg font-semibold text-foreground truncate">
                        {b.roomName}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          · {b.propertyName}
                        </span>
                      </h2>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span>
                            {b.quoteSnapshot.dateRangeLabel} ({b.quoteSnapshot.timeRangeLabel})
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span>{b.propertyCity}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-3 border-t sm:border-t-0 border-border/60 pt-3 sm:pt-0 shrink-0">
                    <div className="sm:text-right">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                        Tổng tiền
                      </span>
                      <span className="text-price text-lg font-bold text-primary tabular-nums">
                        {formatVnd(b.totalAmount)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(b.status === "CONFIRMED" || b.status === "PENDING_PAYMENT") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCancelDialog(b)}
                          className="rounded-full text-xs border-red-200 text-red-700 hover:bg-red-50"
                        >
                          Hủy / Hoàn tiền
                        </Button>
                      )}

                      <Button
                        asChild
                        size="sm"
                        variant={b.status === "PENDING_PAYMENT" ? "default" : "outline"}
                        className="rounded-full"
                      >
                        <Link href={`/booking/checkout/${b.id}`}>
                          <span>
                            {b.status === "PENDING_PAYMENT"
                              ? "Thanh toán ngay"
                              : "Xem chi tiết"}
                          </span>
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Stage 7 (P7.9 & P7.11): Quick Check-in QR & Smart-Lock PIN bar for CONFIRMED / CHECKED_IN */}
                {isEligibleForPin && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/30 border border-border/60 px-4 py-2.5 text-xs">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                        <QrCode className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Check-in QR:</span>
                        <code className="rounded bg-emerald-100/80 px-1.5 py-0.5 font-mono text-[11px] text-emerald-950">
                          {checkInQr}
                        </code>
                      </span>

                      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                        <KeyRound className="h-3.5 w-3.5 text-primary" />
                        <span>Mã khóa phòng {b.roomNumber}:</span>
                        <strong className="font-mono text-sm tracking-widest text-primary">
                          {pinValue ?? "••••••"}
                        </strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleRevealPin(b)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      {pinValue ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          <span>Ẩn mã PIN</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          <span>Hiện mã PIN 6 số</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

