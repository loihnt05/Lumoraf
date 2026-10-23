"use client";

import { Check, X } from "lucide-react";

interface Props {
  left: number;
  width: number;
  isAvailable: boolean;
  label?: string;
}

export function RequestedRangeHighlight({ left, width, isAvailable, label }: Props) {
  return (
    <div
      className={`absolute inset-y-0.5 rounded-lg transition-all duration-200 z-10 flex items-center justify-center overflow-hidden shadow-xs ${
        isAvailable
          ? "bg-emerald-500/20 border-2 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/20"
          : "bg-red-500/15 border-2 border-dashed border-red-500 text-red-800"
      }`}
      style={{
        left: `${left}%`,
        width: `${width}%`,
      }}
      aria-hidden="true"
    >
      <div className="flex items-center gap-1 px-1.5 truncate">
        {isAvailable ? (
          <Check className="h-3.5 w-3.5 text-emerald-700 shrink-0 stroke-[3]" />
        ) : (
          <X className="h-3.5 w-3.5 text-red-600 shrink-0 stroke-[3]" />
        )}
        {width >= 10 && (
          <span className="text-[10px] font-bold truncate select-none tracking-tight">
            {isAvailable ? (label || "Khả dụng") : "Trùng lịch"}
          </span>
        )}
      </div>
    </div>
  );
}
