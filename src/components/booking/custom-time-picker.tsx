"use client";

import * as React from "react";
import type { UnavailableRange, CustomTimeSelection } from "@/lib/types/custom-time";
import {
  timeToMinutes,
  minutesToTime,
  checkRangeConflict,
  calculateNightHours,
  calculateCustomQuote,
} from "@/lib/api/custom-availability";
import { AvailabilityTimeline } from "./availability-timeline";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, CheckCircle, Moon, AlertTriangle, ArrowRight } from "lucide-react";

type CustomTimePickerProps = {
  date: string;
  unavailableRanges: UnavailableRange[];
  basePrice?: number;
  onSelectionChange: (selection: CustomTimeSelection | null) => void;
};

// Generate 30-minute time options across 24h
function generate30MinSlots(): string[] {
  const slots: string[] = [];
  for (let h = 6; h <= 23; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}

// Generate end time options (allowing cross-midnight into next day)
type EndTimeOption = {
  timeStr: string;
  minutes: number;
  label: string;
  isNextDay: boolean;
};

function generateEndOptions(startMinutes: number): EndTimeOption[] {
  const options: EndTimeOption[] = [];
  // Min duration is 3h = 180m
  const minEnd = startMinutes + 30; // generate from 30m up to next day noon
  const maxEnd = startMinutes + 1440; // up to 24h later

  for (let m = minEnd; m <= maxEnd; m += 30) {
    const isNextDay = m >= 1440;
    const timeStr = minutesToTime(m);
    const durationMins = m - startMinutes;
    const durHours = (durationMins / 60).toFixed(1).replace(".0", "");

    options.push({
      timeStr,
      minutes: m,
      label: isNextDay ? `${timeStr} (Hôm sau · ${durHours}h)` : `${timeStr} (${durHours}h)`,
      isNextDay,
    });
  }
  return options;
}

export function CustomTimePicker({
  date,
  unavailableRanges,
  basePrice = 299000,
  onSelectionChange,
}: CustomTimePickerProps) {
  const startOptions = React.useMemo(() => generate30MinSlots(), []);

  // Default start at 10:30, end at 15:00 (4.5h) as in the design document
  const [startTime, setStartTime] = React.useState<string>("10:30");
  const [endTime, setEndTime] = React.useState<string>("15:00");

  const startMinutes = timeToMinutes(startTime);

  const endOptions = React.useMemo(() => {
    return generateEndOptions(startMinutes);
  }, [startMinutes]);

  // Derive total end minutes (including cross-midnight offset if applicable)
  const endMinutes = React.useMemo(() => {
    const rawEnd = timeToMinutes(endTime);
    if (rawEnd <= startMinutes) {
      return rawEnd + 1440; // cross midnight
    }
    return rawEnd;
  }, [endTime, startMinutes]);

  const durationMinutes = endMinutes - startMinutes;
  const isValidDuration = durationMinutes >= 180; // Minimum 3 hours

  // Conflict detection (UI-5.3)
  const { hasConflict, conflictingRange } = React.useMemo(() => {
    return checkRangeConflict(startMinutes, endMinutes, unavailableRanges);
  }, [startMinutes, endMinutes, unavailableRanges]);

  // Night hours detection (23:00 - 06:00)
  const nightHours = React.useMemo(() => {
    return calculateNightHours(startMinutes, endMinutes);
  }, [startMinutes, endMinutes]);

  // Estimated custom quote
  const estimatedPrice = React.useMemo(() => {
    return calculateCustomQuote(durationMinutes, nightHours, basePrice);
  }, [durationMinutes, nightHours, basePrice]);

  // Propagate valid selection to parent
  React.useEffect(() => {
    if (isValidDuration && !hasConflict) {
      onSelectionChange({
        startDate: date,
        startTime,
        endDate: endMinutes >= 1440 ? "Ngày hôm sau" : date,
        endTime,
        durationMinutes,
        isValidDuration,
        hasConflict: false,
        nightHours,
        estimatedPrice,
      });
    } else {
      onSelectionChange(null);
    }
  }, [
    date,
    startTime,
    endTime,
    durationMinutes,
    isValidDuration,
    hasConflict,
    nightHours,
    estimatedPrice,
    endMinutes,
    onSelectionChange,
  ]);

  const durationDisplayHours = Math.floor(durationMinutes / 60);
  const durationDisplayMinutes = durationMinutes % 60;
  const durationText =
    durationDisplayMinutes > 0
      ? `${durationDisplayHours} giờ ${durationDisplayMinutes} phút`
      : `${durationDisplayHours} giờ`;

  return (
    <div className="space-y-5">
      {/* 1. Time Selectors (Start & End with 30-min step) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Check-in Time */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Giờ nhận phòng
          </label>
          <div className="relative">
            <select
              value={startTime}
              onChange={(e) => {
                const newStart = e.target.value;
                setStartTime(newStart);
                // Ensure end time stays at least 3h ahead
                const newStartMins = timeToMinutes(newStart);
                const currentEndMins = timeToMinutes(endTime);
                if (currentEndMins < newStartMins + 180) {
                  setEndTime(minutesToTime(newStartMins + 180));
                }
              }}
              className="w-full appearance-none rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 text-sm font-semibold text-foreground shadow-xs transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {startOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <Clock className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Check-out Time */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Giờ trả phòng
          </label>
          <div className="relative">
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 text-sm font-semibold text-foreground shadow-xs transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {endOptions.map((opt) => (
                <option key={opt.timeStr} value={opt.timeStr}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Clock className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* 2. Duration & Realtime Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/40 p-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">Thời lượng:</span>
          <span className="font-bold tabular-nums text-foreground">{durationText}</span>
        </div>

        {/* Validation Status Badges */}
        {!isValidDuration ? (
          <Badge className="bg-amber-100 text-amber-900 border-none flex items-center gap-1 font-medium">
            <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
            <span>Tối thiểu 3 giờ (180 phút)</span>
          </Badge>
        ) : hasConflict ? (
          <Badge className="bg-red-100 text-red-900 border-none flex items-center gap-1 font-medium">
            <AlertTriangle className="h-3.5 w-3.5 text-red-700" />
            <span>Trùng lịch đã đặt</span>
          </Badge>
        ) : (
          <Badge className="bg-emerald-100 text-emerald-900 border-none flex items-center gap-1 font-medium">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-700" />
            <span>Khung giờ hợp lệ</span>
          </Badge>
        )}
      </div>

      {/* Cross-Midnight Display (UI-5.1) */}
      {endMinutes >= 1440 && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-primary font-medium">
          <ArrowRight className="h-4 w-4 shrink-0" />
          <span>
            Khung giờ xuyên đêm: trả phòng vào <strong>{endTime}</strong> ngày hôm sau.
          </span>
        </div>
      )}

      {/* Night Window Surcharge Info (23:00 - 06:00) */}
      {nightHours > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-medium">
            <Moon className="h-4 w-4 text-amber-700 shrink-0" />
            <span>Bao gồm {nightHours}h khung đêm (23:00 – 06:00)</span>
          </div>
          <Badge className="bg-amber-200 text-amber-900 border-none font-semibold text-[10px]">
            +20% phụ phí
          </Badge>
        </div>
      )}

      {/* 3. Conflict Alert Banner (UI-5.3) */}
      {hasConflict && conflictingRange && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 space-y-1 animate-in fade-in-50">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>Phát hiện xung đột lịch đặt</span>
          </div>
          <p className="leading-relaxed">
            Khung giờ bạn chọn bị trùng với khoảng thời gian đã bận hoặc đang dọn phòng (
            <strong>{conflictingRange.startTime} – {conflictingRange.endTime}</strong>). Vui lòng điều chỉnh lại giờ nhận hoặc trả phòng.
          </p>
        </div>
      )}

      {/* 4. Availability Timeline Bar (UI-5.2) */}
      <AvailabilityTimeline
        date={date}
        unavailableRanges={unavailableRanges}
        selectedStartMinutes={startMinutes}
        selectedEndMinutes={endMinutes}
        hasConflict={hasConflict}
      />
    </div>
  );
}
