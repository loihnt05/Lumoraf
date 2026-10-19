"use client";

import * as React from "react";
import type { PricingQuote } from "@/lib/types/quote";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Moon,
  ShieldCheck,
  Lock,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Info,
  ReceiptText,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ReserveErrorState = {
  code: "BOOKING_CONFLICT" | "PRICE_CHANGED" | "ROOM_BLOCKED" | "VALIDATION_ERROR";
  message: string;
} | null;

type BookingSummaryPanelProps = {
  roomName: string;
  propertyName: string;
  quote: PricingQuote | null;
  isLoadingQuote: boolean;
  isAuthenticated: boolean;
  isSubmitting: boolean;
  isReserveDisabled: boolean;
  reserveButtonLabel: string;
  reserveError: ReserveErrorState;
  onReserve: (options?: {
    simulateConflict?: boolean;
    simulatePriceChange?: boolean;
  }) => void;
};

function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}₫`;
}

export function BookingSummaryPanel({
  roomName,
  propertyName,
  quote,
  isLoadingQuote,
  isAuthenticated,
  isSubmitting,
  isReserveDisabled,
  reserveButtonLabel,
  reserveError,
  onReserve,
}: BookingSummaryPanelProps) {
  return (
    <div className="space-y-4 pt-2 border-t border-border/60">
      {/* 1. Authoritative "Your stay" Summary Card (UI-7.1 & UI-7.2) */}
      <div
        aria-live="polite"
        className="rounded-2xl border border-border/80 bg-muted/25 p-4 sm:p-5 space-y-4 transition-opacity"
      >
        <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                Your stay · Chi tiết đặt chỗ
              </span>
              {isLoadingQuote && (
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
              )}
            </div>
            <p className="text-sm font-semibold text-foreground">
              {roomName} · <span className="font-normal text-muted-foreground">{propertyName}</span>
            </p>
          </div>

          {quote && (
            <Badge className="bg-primary/10 text-primary border-none text-[10px] font-semibold shrink-0">
              {quote.modeLabel}
            </Badge>
          )}
        </div>

        {/* Selected Stay Time & Breakdown */}
        {quote ? (
          <div className="space-y-3.5 text-xs">
            {/* Date & Time Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface px-3.5 py-2.5 border border-border/60">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Thời gian lưu trú
                </p>
                <p className="font-semibold text-foreground mt-0.5">
                  {quote.dateRangeLabel} · {quote.timeRangeLabel}
                </p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground">
                {quote.durationLabel}
              </span>
            </div>

            {/* Authoritative Price Lines */}
            <div
              className={cn(
                "space-y-2 transition-opacity duration-150",
                isLoadingQuote ? "opacity-60" : "opacity-100",
              )}
            >
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{quote.baseLabel}</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {formatVnd(quote.baseAmount)}
                </span>
              </div>

              {/* Night window surcharge line (23:00 - 06:00) */}
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Moon className="h-3.5 w-3.5 text-amber-700" />
                  <span>Phụ phí đêm (23:00–06:00)</span>
                  {quote.nightSurchargeAmount > 0 && (
                    <Badge className="bg-amber-100 text-amber-900 border-none text-[9px] px-1.5 py-0 font-semibold">
                      +20%
                    </Badge>
                  )}
                </span>
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    quote.nightSurchargeAmount > 0
                      ? "text-amber-800"
                      : "text-muted-foreground",
                  )}
                >
                  {quote.nightSurchargeAmount > 0
                    ? `+${formatVnd(quote.nightSurchargeAmount)}`
                    : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between text-muted-foreground">
                <span>Vệ sinh chuẩn & Khóa số tự động</span>
                <span className="text-emerald-700 font-medium">Đã bao gồm</span>
              </div>

              {/* Total Line */}
              <div className="flex items-baseline justify-between border-t border-border/70 pt-3 mt-1">
                <div>
                  <span className="text-sm font-bold text-foreground">
                    Tổng cộng
                  </span>
                  <p className="text-[10px] text-muted-foreground">
                    Giá chính thức từ hệ thống (đã gồm thuế)
                  </p>
                </div>
                <span className="text-price text-xl font-bold text-primary tabular-nums">
                  {formatVnd(quote.total)}
                </span>
              </div>
            </div>

            {/* Cancellation Policy Summary (UI-7.2) */}
            {quote.cancellationPolicy && (
              <div className="flex items-start gap-2 rounded-xl bg-surface/80 border border-border/50 p-2.5 text-[11px] text-muted-foreground leading-relaxed">
                <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>{quote.cancellationPolicy.summary}</span>
              </div>
            )}
          </div>
        ) : isLoadingQuote ? (
          <div className="space-y-2.5 py-1">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : (
          <div className="py-3 text-center text-xs text-muted-foreground">
            Vui lòng chọn khung giờ hoặc ngày lưu trú hợp lệ ở trên để nhận báo giá chi tiết.
          </div>
        )}
      </div>

      {/* 2. Server Conflict / Price Change Alert (UI-8.1) */}
      {reserveError && (
        <div
          role="alert"
          className={cn(
            "rounded-2xl border p-4 text-xs space-y-1.5 animate-in fade-in-50",
            reserveError.code === "PRICE_CHANGED"
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {reserveError.code === "PRICE_CHANGED"
                ? "Báo giá vừa được cập nhật"
                : reserveError.code === "BOOKING_CONFLICT"
                ? "Khung giờ vừa có người đặt (409 Conflict)"
                : "Không thể hoàn tất giữ phòng"}
            </span>
          </div>
          <p className="leading-relaxed">{reserveError.message}</p>
        </div>
      )}

      {/* 3. Primary Reserve Action CTA (UI-8.1) */}
      <div className="space-y-2.5">
        <Button
          size="lg"
          disabled={isReserveDisabled || isSubmitting || isLoadingQuote}
          onClick={() => onReserve()}
          className="w-full justify-center rounded-full text-base font-medium shadow-md"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Đang kiểm tra & giữ phòng...</span>
            </>
          ) : !isAuthenticated ? (
            <>
              <Lock className="mr-2 h-4 w-4" />
              <span>Sign in to Reserve</span>
            </>
          ) : reserveError?.code === "PRICE_CHANGED" ? (
            <>
              <span>
                Xác nhận giá mới ({quote ? formatVnd(quote.total) : ""}) & Đặt phòng
              </span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              <span>{reserveButtonLabel}</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        <p className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>Chưa trừ tiền ngay · Giữ phòng an toàn trong 15 phút</span>
        </p>

        {/* Dev-only edge-case simulation buttons for UI-8.1 QA verification */}
        {process.env.NODE_ENV === "development" && quote && isAuthenticated && (
          <div className="pt-2 border-t border-dashed border-border/60 flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-muted-foreground">
            <span className="font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>Dev QA Test:</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onReserve({ simulateConflict: true })}
                className="rounded-md border border-border bg-surface px-2 py-1 hover:border-red-300 hover:text-red-700 transition-colors"
              >
                Test 409 Conflict
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onReserve({ simulatePriceChange: true })}
                className="rounded-md border border-border bg-surface px-2 py-1 hover:border-amber-300 hover:text-amber-800 transition-colors"
              >
                Test Đổi giá
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type MobileBookingBarProps = BookingSummaryPanelProps;

export function MobileBookingBar(props: MobileBookingBarProps) {
  const {
    roomName,
    propertyName,
    quote,
    isLoadingQuote,
    isAuthenticated,
    isSubmitting,
    isReserveDisabled,
    onReserve,
  } = props;

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/90 bg-surface/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div className="min-w-0">
            {quote ? (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-price text-lg font-bold text-primary tabular-nums">
                    {formatVnd(quote.total)}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate">
                    · {quote.durationLabel}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSheetOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-foreground underline underline-offset-2"
                >
                  <ReceiptText className="h-3 w-3 text-primary" />
                  <span>
                    {quote.dateRangeLabel} ({quote.timeRangeLabel}) · Chi tiết
                  </span>
                </button>
              </>
            ) : (
              <div>
                <p className="text-xs font-semibold text-foreground">{roomName}</p>
                <p className="text-[11px] text-muted-foreground">
                  Chọn khung giờ để xem tổng giá
                </p>
              </div>
            )}
          </div>

          <Button
            size="default"
            disabled={isReserveDisabled || isSubmitting || isLoadingQuote}
            onClick={() => onReserve()}
            className="rounded-full px-5 font-medium shrink-0 shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : !isAuthenticated ? (
              <>
                <Lock className="mr-1.5 h-3.5 w-3.5" />
                <span>Sign in</span>
              </>
            ) : (
              <>
                <span>Reserve</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Full Review Sheet Dialog */}
      <Dialog open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle>Chi tiết báo giá & Đặt phòng</DialogTitle>
            <DialogDescription>
              {roomName} · {propertyName}
            </DialogDescription>
          </DialogHeader>
          <BookingSummaryPanel
            {...props}
            onReserve={(opts) => {
              setIsSheetOpen(false);
              onReserve(opts);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
