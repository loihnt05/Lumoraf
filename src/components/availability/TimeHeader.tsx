"use client";

import { Sun, Moon, Sunrise, Sunset } from "lucide-react";

const HOUR_LABELS = [
  { label: "00:00", pct: 0, showSmall: true },
  { label: "03:00", pct: 12.5, showSmall: false },
  { label: "06:00", pct: 25, showSmall: true, icon: Sunrise, iconLabel: "Sáng" },
  { label: "09:00", pct: 37.5, showSmall: false },
  { label: "12:00", pct: 50, showSmall: true, icon: Sun, iconLabel: "Trưa" },
  { label: "15:00", pct: 62.5, showSmall: false },
  { label: "18:00", pct: 75, showSmall: true, icon: Sunset, iconLabel: "Tối" },
  { label: "21:00", pct: 87.5, showSmall: false },
  { label: "24:00", pct: 100, showSmall: true, icon: Moon, iconLabel: "Đêm" },
];

export function TimeHeader() {
  return (
    <div className="relative h-11 select-none border-b border-border/40 bg-muted/20">
      {/* Night window indicator background (23:00 to 06:00) */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 bg-amber-500/5 border-r border-amber-500/10"
        style={{ width: "25%" }} // 00:00 to 06:00
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 bg-amber-500/5 border-l border-amber-500/10"
        style={{ width: "4.17%" }} // 23:00 to 24:00 (1 hour = 1/24 = 4.17%)
      />

      {/* Time marks and labels */}
      {HOUR_LABELS.map(({ label, pct, showSmall, icon: Icon, iconLabel }) => (
        <div
          key={label}
          className={`absolute top-0 flex flex-col items-center -translate-x-1/2 pt-1.5 ${
            !showSmall ? "hidden md:flex" : "flex"
          }`}
          style={{ left: `${pct}%` }}
        >
          <div className="flex items-center gap-1">
            {Icon && (
              <Icon className="h-3 w-3 text-muted-foreground/70 hidden lg:inline" />
            )}
            <span className="text-[10px] font-semibold tabular-nums text-foreground/80">
              {label}
            </span>
          </div>
          {iconLabel && (
            <span className="text-[9px] text-muted-foreground/60 hidden xl:inline">
              {iconLabel}
            </span>
          )}
          {/* Tick mark */}
          <span className="absolute bottom-0 h-2 w-px bg-border/80" />
        </div>
      ))}
    </div>
  );
}
