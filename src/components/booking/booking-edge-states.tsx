"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CalendarPlus,
  Clock,
  RefreshCw,
  RotateCcw,
  SearchX,
  WifiOff,
} from "lucide-react";

/**
 * UI-10.2: Skeleton loader matching the 4-column Sonder RoomCard grid on /booking
 */
export function RoomCatalogSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="Đang tải danh sách phòng nghỉ"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 pt-2"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-xs space-y-3 pb-4"
        >
          <Skeleton className="aspect-4/3 w-full rounded-none" />
          <div className="px-4 space-y-2.5">
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-5 w-3/4 rounded-md" />
            <Skeleton className="h-3.5 w-1/2 rounded-md" />
            <div className="pt-2 flex items-center justify-between border-t border-border/50">
              <Skeleton className="h-5 w-28 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Đang tải danh sách phòng nghỉ...</span>
    </div>
  );
}

/**
 * UI-10.2: Empty state when no rooms match the selected filter or property
 */
export function EmptyRoomsState({
  filterLabel,
  onResetFilter,
}: {
  filterLabel?: string;
  onResetFilter: () => void;
}) {
  return (
    <div
      role="region"
      aria-label="Không tìm thấy phòng phù hợp"
      className="rounded-3xl border border-border/80 bg-surface p-10 md:p-14 text-center space-y-4 shadow-xs"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="h-6 w-6" />
      </div>
      <div className="space-y-1.5 max-w-md mx-auto">
        <h3 className="text-heading text-xl font-medium text-foreground">
          Chưa có phòng khả dụng trong mục{" "}
          {filterLabel ? `"${filterLabel}"` : "này"}
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Các phòng thuộc bộ lọc này hiện đang bảo trì hoặc chưa mở lịch đón
          khách. Bạn có thể chuyển sang xem toàn bộ phòng tại các chi nhánh của
          Lumora.
        </p>
      </div>
      <div className="pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onResetFilter}
          className="min-h-[44px] rounded-full px-6 text-xs font-semibold"
        >
          <RotateCcw className="mr-2 h-3.5 w-3.5" />
          <span>Xem tất cả phòng khả dụng</span>
        </Button>
      </div>
    </div>
  );
}

/**
 * UI-10.2: Callout banner when all Fixed Slots on the chosen date are booked/unavailable
 */
export function AllSlotsBookedBanner({
  date,
  onSelectNextDay,
  onSwitchToCustom,
}: {
  date?: string;
  onSelectNextDay?: () => void;
  onSwitchToCustom?: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900 space-y-3"
    >
      <div className="flex items-start gap-2.5">
        <Clock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-950">
            Tất cả khung giờ cố định {date ? `ngày ${date}` : "trong ngày"} đã
            kín lịch
          </p>
          <p className="text-[11px] leading-relaxed text-amber-800">
            Mọi ca 3h định sẵn trong ngày này đã có khách đặt hoặc đang khóa.
            Bạn có thể chuyển sang ngày kế tiếp hoặc thử chế độ giờ tùy chỉnh.
          </p>
        </div>
      </div>

      {(onSelectNextDay || onSwitchToCustom) && (
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {onSelectNextDay && (
            <button
              type="button"
              onClick={onSelectNextDay}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-amber-900 px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-950 transition-colors focus-visible:outline-2 focus-visible:outline-ring"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              <span>Chọn ngày tiếp theo</span>
            </button>
          )}
          {onSwitchToCustom && (
            <button
              type="button"
              onClick={onSwitchToCustom}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-amber-300 bg-surface px-3.5 py-1.5 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 transition-colors focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Thử Giờ tùy chỉnh (Custom)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * UI-10.2: Network / API error banner with explicit retry button
 */
export function NetworkErrorRetryBanner({
  message,
  onRetry,
  isRetrying = false,
}: {
  message: string;
  onRetry: () => void;
  isRetrying?: boolean;
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-2xl border border-red-200 bg-red-50/95 p-4 text-xs text-red-800 space-y-3"
    >
      <div className="flex items-start gap-2.5">
        <WifiOff className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-red-900">
            Không thể kết nối hoặc tải dữ liệu lịch trống
          </p>
          <p className="text-[11px] leading-relaxed text-red-700">{message}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-red-300 bg-surface px-4 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
        <span>{isRetrying ? "Đang tải lại..." : "Thử tải lại lịch trống"}</span>
      </button>
    </div>
  );
}

/**
 * UI-10.2: Stale availability / configuration warning banner
 */
export function StaleAvailabilityWarning({
  reason,
  onRefresh,
  isRefreshing = false,
}: {
  reason?: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/90 p-3.5 text-xs text-amber-900 animate-in fade-in-50"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-amber-950">
            Dữ liệu lịch phòng hoặc bảng giá vừa được cập nhật
          </p>
          <p className="text-[11px] text-amber-800">
            {reason ??
              "Phiên xem phòng đã mở khá lâu hoặc Quản trị viên vừa điều chỉnh cấu hình. Vui lòng làm mới để đảm bảo báo giá chính xác nhất."}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="inline-flex min-h-[38px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-amber-900 px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-950 transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <RefreshCw
          className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
        />
        <span>Làm mới ngay</span>
      </button>
    </div>
  );
}
