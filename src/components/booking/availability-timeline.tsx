"use client";

import * as React from "react";
import type { UnavailableRange } from "@/lib/types/custom-time";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type AvailabilityTimelineProps = {
  date: string;
  unavailableRanges: UnavailableRange[];
  selectedStartMinutes: number | null;
  selectedEndMinutes: number | null;
  hasConflict: boolean;
};

// Timeline spans from 06:00 (360m) to 24:00 (1440m) = 18 hours (1080m)
const TIMELINE_START = 360; // 06:00
const TIMELINE_END = 1440; // 24:00
const TOTAL_MINUTES = TIMELINE_END - TIMELINE_START; // 1080m

const HOUR_TICKS = [6, 8, 10, 12, 14, 16, 18, 20, 22, 24];

export function AvailabilityTimeline({
  date,
  unavailableRanges,
  selectedStartMinutes,
  selectedEndMinutes,
  hasConflict,
}: AvailabilityTimelineProps) {
  // Convert minutes into percentage relative to 06:00 - 24:00 window
  const getPercent = (minutes: number) => {
    const clamped = Math.max(TIMELINE_START, Math.min(TIMELINE_END, minutes));
    return ((clamped - TIMELINE_START) / TOTAL_MINUTES) * 100;
  };

  return (
    <div className="space-y-3">
      {/* Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span>Biểu đồ thời gian trong ngày ({date})</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-xs bg-muted border border-border" />
            <span>Trống</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-xs bg-neutral-400" />
            <span>Đã bận</span>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-xs",
                hasConflict ? "bg-red-500" : "bg-primary",
              )}
            />
            <span>Bạn chọn</span>
          </div>
        </div>
      </div>

      {/* Visual Timeline Bar */}
      <div className="relative rounded-xl border border-border/70 bg-surface p-3 shadow-xs">
        {/* Hours ticks on top */}
        <div className="relative mb-1.5 h-4 w-full">
          {HOUR_TICKS.map((hour) => {
            const minutes = hour * 60;
            const leftPercent = getPercent(minutes);
            return (
              <span
                key={hour}
                style={{ left: `${leftPercent}%` }}
                className="absolute -translate-x-1/2 text-[10px] font-medium text-muted-foreground tabular-nums"
              >
                {hour === 24 ? "00:00" : `${String(hour).padStart(2, "0")}:00`}
              </span>
            );
          })}
        </div>

        {/* Main timeline track */}
        <div className="relative h-9 w-full overflow-hidden rounded-lg bg-muted/60 border border-border/50">
          {/* Subtle grid lines for each 2 hours */}
          {HOUR_TICKS.map((hour) => {
            const leftPercent = getPercent(hour * 60);
            return (
              <div
                key={hour}
                style={{ left: `${leftPercent}%` }}
                className="absolute inset-y-0 w-px bg-border/40"
              />
            );
          })}

          {/* Render Unavailable (Booked / Cleaning) Ranges */}
          {unavailableRanges.map((range) => {
            const left = getPercent(range.startMinutes);
            const right = getPercent(range.endMinutes);
            const width = Math.max(0, right - left);

            return (
              <div
                key={range.id}
                style={{ left: `${left}%`, width: `${width}%` }}
                title={`${range.label}: ${range.startTime} - ${range.endTime}`}
                className="group absolute inset-y-0 flex items-center justify-center bg-neutral-400/80 hover:bg-neutral-500 transition-colors cursor-help"
              >
                <span className="hidden sm:inline-block truncate px-1 text-[9px] font-medium text-white select-none">
                  Đã bận ({range.startTime}–{range.endTime})
                </span>
              </div>
            );
          })}

          {/* Render Customer's Selected Custom Range */}
          {selectedStartMinutes !== null && selectedEndMinutes !== null && (
            (() => {
              const left = getPercent(selectedStartMinutes);
              const right = getPercent(selectedEndMinutes);
              const width = Math.max(0, right - left);

              return (
                <div
                  style={{ left: `${left}%`, width: `${width}%` }}
                  className={cn(
                    "absolute inset-y-0 flex items-center justify-center shadow-md transition-all duration-300 z-10",
                    hasConflict
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  <span className="truncate px-1.5 text-[10px] font-bold tracking-tight">
                    {hasConflict ? "Bị trùng lịch!" : "Đang chọn"}
                  </span>
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* Screen-reader Accessible Text List (UI-5.2) */}
      <div className="sr-only" aria-live="polite">
        <p>Danh sách các khoảng thời gian không khả dụng cho ngày {date}:</p>
        <ul>
          {unavailableRanges.length === 0 ? (
            <li>Cả ngày đều còn phòng trống.</li>
          ) : (
            unavailableRanges.map((r) => (
              <li key={r.id}>
                Khoảng từ {r.startTime} đến {r.endTime} hiện không khả dụng.
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
