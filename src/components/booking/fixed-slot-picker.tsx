"use client";

import * as React from "react";
import type { FixedSlot } from "@/lib/types/slot";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Check, Moon, RotateCw } from "lucide-react";
import {
  AllSlotsBookedBanner,
  NetworkErrorRetryBanner,
} from "./booking-edge-states";
import { cn } from "@/lib/utils";

type FixedSlotPickerProps = {
  slots: FixedSlot[];
  selectedSlotId: string | null;
  onSelectSlot: (slot: FixedSlot) => void;
  isLoading: boolean;
  onRefresh: () => void;
  errorMessage?: string | null;
  date?: string;
  onSelectNextDay?: () => void;
  onSwitchToCustom?: () => void;
};

export function FixedSlotPicker({
  slots,
  selectedSlotId,
  onSelectSlot,
  isLoading,
  onRefresh,
  errorMessage,
  date,
  onSelectNextDay,
  onSwitchToCustom,
}: FixedSlotPickerProps) {
  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Đang tải các khung giờ cố định"
        className="space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <div className="grid gap-2.5">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
        <span className="sr-only">Đang tải danh sách khung giờ...</span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <NetworkErrorRetryBanner
        message={errorMessage}
        onRetry={onRefresh}
        isRetrying={isLoading}
      />
    );
  }

  if (slots.length === 0) {
    return (
      <AllSlotsBookedBanner
        date={date}
        onSelectNextDay={onSelectNextDay}
        onSwitchToCustom={onSwitchToCustom}
      />
    );
  }

  const allSlotsBooked = slots.every(
    (s) => s.state === "BOOKED" || s.state === "UNAVAILABLE",
  );

  const handleSlotKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    const availableIndices = slots
      .map((s, i) =>
        s.state !== "BOOKED" && s.state !== "UNAVAILABLE" ? i : -1,
      )
      .filter((i) => i !== -1);

    if (availableIndices.length === 0) return;
    const pos = availableIndices.indexOf(currentIndex);
    let nextIdx = -1;

    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      nextIdx = availableIndices[(pos + 1) % availableIndices.length];
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      nextIdx =
        availableIndices[
          (pos - 1 + availableIndices.length) % availableIndices.length
        ];
    }

    if (nextIdx !== -1) {
      const nextSlot = slots[nextIdx];
      onSelectSlot(nextSlot);
      const el = document.getElementById(`fixed-slot-btn-${nextSlot.id}`);
      el?.focus();
    }
  };

  return (
    <div className="space-y-3">
      {/* Header with Slot Count and Refresh Trigger */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Chọn khung giờ 3h
          </span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          title="Làm mới lịch trống"
          aria-label="Làm mới danh sách khung giờ trống"
          className="flex min-h-[32px] items-center gap-1 rounded-full px-2 text-[11px] text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-ring"
        >
          <RotateCw className="h-3 w-3" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* UI-10.2: All slots booked recovery banner */}
      {allSlotsBooked && (
        <AllSlotsBookedBanner
          date={date}
          onSelectNextDay={onSelectNextDay}
          onSwitchToCustom={onSwitchToCustom}
        />
      )}

      {/* Slots List (Sonder-style tactile cards) */}
      <div
        role="radiogroup"
        aria-label="Danh sách khung giờ cố định"
        className="grid gap-2.5"
      >
        {slots.map((slot, idx) => {
          const isSelected = slot.id === selectedSlotId;
          const isBooked = slot.state === "BOOKED";
          const isUnavailable = slot.state === "UNAVAILABLE";
          const isDisabled = isBooked || isUnavailable;

          const formattedPrice = new Intl.NumberFormat("vi-VN").format(
            slot.price,
          );

          return (
            <button
              key={slot.id}
              id={`fixed-slot-btn-${slot.id}`}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={isDisabled}
              aria-label={`Khung giờ ${slot.startTime} đến ${slot.endTime}, thời lượng ${slot.durationMinutes / 60} giờ, giá ${formattedPrice} đồng${slot.isNightWindow ? ", có phụ phí khung giờ đêm" : ""}${isDisabled ? ", đã có khách đặt" : isSelected ? ", đang chọn" : ", còn trống"}`}
              disabled={isDisabled}
              type="button"
              onClick={() => {
                if (!isDisabled) {
                  onSelectSlot(slot);
                }
              }}
              onKeyDown={(e) => handleSlotKeyDown(e, idx)}
              className={cn(
                "group relative flex min-h-[56px] sm:min-h-[60px] items-center justify-between gap-2 sm:gap-3 rounded-xl border p-2.5 sm:p-3 text-left transition-all duration-200 outline-none",
                isDisabled
                  ? "border-border/40 bg-muted/30 opacity-60 cursor-not-allowed text-muted-foreground"
                  : isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs text-foreground"
                  : "border-border/80 bg-surface hover:border-primary/50 hover:bg-muted/30 text-foreground cursor-pointer focus-visible:outline-2 focus-visible:outline-ring",
              )}
            >
              {/* Left Info: Start-End time & Duration */}
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span
                    className={cn(
                      "text-xs sm:text-base font-bold tabular-nums tracking-tight whitespace-nowrap",
                      isSelected
                        ? "text-primary"
                        : isDisabled
                        ? "text-muted-foreground"
                        : "text-foreground",
                    )}
                  >
                    {slot.startTime} – {slot.endTime}
                  </span>

                  <span className="text-[10px] rounded-full bg-muted/80 px-2 py-0.5 text-muted-foreground font-medium shrink-0">
                    {slot.durationMinutes / 60}h
                  </span>

                  {slot.isNightWindow && (
                    <Badge className="bg-amber-100 text-amber-800 border-none text-[9px] font-medium flex items-center gap-1 py-0 px-1.5 shrink-0">
                      <Moon className="h-2.5 w-2.5" />
                      <span>Đêm +20%</span>
                    </Badge>
                  )}
                </div>

                {isBooked ? (
                  <p className="text-[10px] text-red-600 font-medium">
                    Đã có khách đặt
                  </p>
                ) : slot.surchargeNote ? (
                  <p className="text-[10px] text-amber-700 font-medium truncate">
                    {slot.surchargeNote}
                  </p>
                ) : null}
              </div>

              {/* Right Info: Price and Checkbox/State indicator */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="text-right">
                  <span
                    className={cn(
                      "text-price text-sm sm:text-base font-bold tabular-nums",
                      isSelected
                        ? "text-primary"
                        : isDisabled
                        ? "text-muted-foreground line-through"
                        : "text-foreground",
                    )}
                  >
                    {formattedPrice}₫
                  </span>
                </div>

                {/* Radio selection circle / Checkmark */}
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border transition-all",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : isDisabled
                      ? "border-border bg-muted/50 text-transparent"
                      : "border-border/80 bg-surface group-hover:border-primary/60 text-transparent",
                  )}
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
