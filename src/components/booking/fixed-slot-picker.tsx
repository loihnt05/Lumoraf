"use client";

import * as React from "react";
import type { FixedSlot } from "@/lib/types/slot";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Check, Moon, RotateCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type FixedSlotPickerProps = {
  slots: FixedSlot[];
  selectedSlotId: string | null;
  onSelectSlot: (slot: FixedSlot) => void;
  isLoading: boolean;
  onRefresh: () => void;
  errorMessage?: string | null;
};

export function FixedSlotPicker({
  slots,
  selectedSlotId,
  onSelectSlot,
  isLoading,
  onRefresh,
  errorMessage,
}: FixedSlotPickerProps) {
  if (isLoading) {
    return (
      <div className="space-y-2.5">
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
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 space-y-3">
        <div className="flex items-center gap-2 font-medium">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-surface px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
        >
          <RotateCw className="h-3 w-3" />
          <span>Tải lại lịch trống</span>
        </button>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-border/80 bg-muted/30 p-5 text-center text-xs text-muted-foreground space-y-2">
        <Clock className="h-5 w-5 mx-auto text-muted-foreground/80" />
        <p className="font-medium text-foreground">Không có slot khả dụng cho ngày này</p>
        <p>Vui lòng chọn một ngày khác trong thanh lịch bên trên.</p>
      </div>
    );
  }

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
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCw className="h-3 w-3" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Slots List (Sonder-style tactile cards) */}
      <div
        role="radiogroup"
        aria-label="Danh sách khung giờ 3h"
        className="grid gap-2 max-h-60 overflow-y-auto pr-1"
      >
        {slots.map((slot) => {
          const isSelected = slot.id === selectedSlotId;
          const isBooked = slot.state === "BOOKED";
          const isUnavailable = slot.state === "UNAVAILABLE";
          const isDisabled = isBooked || isUnavailable;

          const formattedPrice = new Intl.NumberFormat("vi-VN").format(slot.price);

          return (
            <button
              key={slot.id}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              type="button"
              onClick={() => {
                if (!isDisabled) {
                  onSelectSlot(slot);
                }
              }}
              className={cn(
                "group relative flex items-center justify-between rounded-xl border p-3 text-left transition-all duration-200 outline-none",
                isDisabled
                  ? "border-border/40 bg-muted/30 opacity-60 cursor-not-allowed text-muted-foreground"
                  : isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs text-foreground"
                  : "border-border/80 bg-surface hover:border-primary/50 hover:bg-muted/30 text-foreground cursor-pointer focus-visible:outline-2 focus-visible:outline-ring",
              )}
            >
              {/* Left Info: Start-End time & Duration */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm sm:text-base font-bold tabular-nums tracking-tight",
                      isSelected ? "text-primary" : isDisabled ? "text-muted-foreground" : "text-foreground",
                    )}
                  >
                    {slot.startTime} – {slot.endTime}
                  </span>

                  <span className="text-[10px] rounded-full bg-muted/80 px-2 py-0.5 text-muted-foreground font-medium">
                    {slot.durationMinutes / 60}h
                  </span>

                  {slot.isNightWindow && (
                    <Badge className="bg-amber-100 text-amber-800 border-none text-[9px] font-medium flex items-center gap-1 py-0 px-1.5">
                      <Moon className="h-2.5 w-2.5" />
                      <span>Đêm +20%</span>
                    </Badge>
                  )}
                </div>

                {isBooked ? (
                  <p className="text-[10px] text-red-600 font-medium">Đã có khách đặt</p>
                ) : slot.surchargeNote ? (
                  <p className="text-[10px] text-amber-700 font-medium">{slot.surchargeNote}</p>
                ) : null}
              </div>

              {/* Right Info: Price and Checkbox/State indicator */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span
                    className={cn(
                      "text-price text-base font-bold tabular-nums",
                      isSelected ? "text-primary" : isDisabled ? "text-muted-foreground line-through" : "text-foreground",
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
