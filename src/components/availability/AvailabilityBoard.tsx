"use client";

import type { RoomAvailabilityResult, StayDuration, TimeRange } from "@/lib/availability/types";
import { TimeHeader } from "./TimeHeader";
import { RoomAvailabilityRow } from "./RoomAvailabilityRow";
import { getNowPosition } from "@/lib/availability/utils";
import { Check, X, Clock, HelpCircle, Sparkles } from "lucide-react";

interface Props {
  results: RoomAvailabilityResult[];
  requestedRange: TimeRange | null;
  duration: StayDuration;
  showNow: boolean;
  now: Date;
  checkOut: string | null;
}

export function AvailabilityBoard({
  results,
  requestedRange,
  duration,
  showNow,
  now,
  checkOut,
}: Props) {
  const nowPct = getNowPosition(now);

  return (
    <div className="space-y-3">
      {/* ── 1. Visual Legend Bar: Giúp người dùng hiểu ngay lập tức ý nghĩa các màu ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface p-3.5 sm:px-5 shadow-2xs text-xs">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <HelpCircle className="h-4 w-4 text-primary shrink-0" />
          <span>Chú thích màu sắc sơ đồ:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] text-muted-foreground">
          {/* Requested range (Available) */}
          <div className="flex items-center gap-1.5">
            <span className="flex h-3.5 w-6 items-center justify-center rounded-sm bg-emerald-500/25 border border-emerald-600">
              <Check className="h-2.5 w-2.5 text-emerald-800 stroke-[3]" />
            </span>
            <span className="font-medium text-foreground">Ca bạn chọn (Trống)</span>
          </div>

          {/* Requested range (Conflict) */}
          <div className="flex items-center gap-1.5">
            <span className="flex h-3.5 w-6 items-center justify-center rounded-sm bg-red-500/20 border border-dashed border-red-500">
              <X className="h-2.5 w-2.5 text-red-700 stroke-[3]" />
            </span>
            <span className="font-medium text-foreground">Ca bạn chọn (Trùng lịch)</span>
          </div>

          {/* Booked Block */}
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-5 rounded-sm bg-slate-700 border border-slate-600" />
            <span>Đã có khách đặt</span>
          </div>

          {/* Cleaning Buffer Block */}
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-5 rounded-sm bg-amber-400/30 border border-amber-500 text-amber-900 flex items-center justify-center text-[8px]">
              🧹
            </span>
            <span>Dọn phòng & Vệ sinh</span>
          </div>

          {/* Realtime Now Needle */}
          {showNow && (
            <div className="flex items-center gap-1.5">
              <span className="h-3.5 w-1 rounded-full bg-red-500 shadow-xs" />
              <span className="text-red-600 font-semibold">Thời điểm hiện tại</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Main Timeline Board Container ── */}
      <div className="overflow-hidden rounded-3xl border border-border/80 bg-surface shadow-sm">
        {/* Column header with time axis */}
        <div className="flex flex-col md:flex-row border-b border-border/60">
          {/* Room info column header */}
          <div className="w-full md:w-64 lg:w-72 shrink-0 px-4 py-3 md:border-r border-border/40 bg-muted/30 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Không gian phòng ({results.length})
            </span>
            <span className="text-[10px] text-muted-foreground">Bảng giá ca</span>
          </div>

          {/* Timeline axis header with horizontal scroll wrapper */}
          <div className="relative min-w-0 flex-1 overflow-x-auto">
            <div className="min-w-[620px]">
              <TimeHeader />
              {showNow && (
                <div
                  className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                  style={{ left: `${nowPct}%` }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Room rows */}
        <div className="divide-y divide-border/30">
          {results.map((result) => (
            <RoomAvailabilityRow
              key={result.room.id}
              result={result}
              requestedRange={requestedRange}
              duration={duration}
              checkOut={checkOut}
              showNow={showNow}
              nowPct={nowPct}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
