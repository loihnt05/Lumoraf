"use client";

import type { UnavailableRange } from "@/lib/availability/types";
import { cn } from "@/lib/utils";

interface Props {
  left: number;
  width: number;
  range: UnavailableRange;
  onEnter: (text: string, centerX: number) => void;
  onLeave: () => void;
}

export function UnavailableBlock({ left, width, range, onEnter, onLeave }: Props) {
  const isCleaning = range.reason === "CLEANING";
  const isMaintenance = range.reason === "MAINTENANCE" || range.reason === "BLOCKED";

  const reasonLabel = isCleaning
    ? "Dọn phòng & vệ sinh"
    : isMaintenance
    ? "Khóa bảo trì định kỳ"
    : "Đã có khách đặt trước";

  const tooltipText = `${range.start} – ${range.end} (${reasonLabel})`;
  const centerX = left + width / 2;

  return (
    <div
      className={cn(
        "absolute inset-y-1 rounded-md transition-all duration-150 cursor-pointer flex items-center justify-center overflow-hidden border",
        isCleaning
          ? "bg-amber-500/20 border-amber-500/40 text-amber-900 hover:bg-amber-500/30"
          : isMaintenance
          ? "bg-red-500/20 border-red-500/40 text-red-900 hover:bg-red-500/30"
          : "bg-slate-700/70 border-slate-600 text-white hover:bg-slate-700/85",
      )}
      style={{
        left: `${left}%`,
        width: `${width}%`,
      }}
      onMouseEnter={() => onEnter(tooltipText, centerX)}
      onMouseLeave={onLeave}
      role="img"
      aria-label={`${reasonLabel} từ ${range.start} đến ${range.end}`}
    >
      {/* Pattern stripes for cleaning */}
      {isCleaning && (
        <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,currentColor_4px,currentColor_8px)]" />
      )}

      {/* Label inside if block is wide enough */}
      {width >= 7 && (
        <span className="relative z-10 text-[9px] font-semibold truncate px-1 select-none tabular-nums">
          {isCleaning ? `🧹 ${range.start}` : range.start}
        </span>
      )}
    </div>
  );
}
