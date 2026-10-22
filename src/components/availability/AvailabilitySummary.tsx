"use client";

import { CheckCircle2, Clock, Sparkles } from "lucide-react";

interface Props {
  availableCount: number;
  totalCount: number;
  checkIn: string;
  checkOut: string | null;
  duration: string;
}

export function AvailabilitySummary({
  availableCount,
  totalCount,
  checkIn,
  checkOut,
  duration,
}: Props) {
  if (!checkOut) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-4 w-4 text-primary shrink-0" />
        <span>Vui lòng chọn giờ nhận phòng để tra cứu danh sách phòng trống.</span>
      </div>
    );
  }

  const isAnyAvailable = availableCount > 0;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-bold ${
            isAnyAvailable
              ? "bg-emerald-100 text-emerald-900"
              : "bg-red-100 text-red-900"
          }`}
        >
          {isAnyAvailable ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
          ) : null}
          <span>
            {availableCount} / {totalCount} phòng trống
          </span>
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Khung giờ:</span>
        <span className="font-bold text-foreground tabular-nums">
          {checkIn} → {checkOut}
        </span>
        <span className="text-muted-foreground/60">({duration})</span>
      </div>
    </div>
  );
}
