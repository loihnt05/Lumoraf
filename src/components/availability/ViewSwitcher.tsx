"use client";

import type { ViewMode } from "@/lib/availability/types";
import { cn } from "@/lib/utils";
import { CalendarDays, LayoutGrid } from "lucide-react";

interface Props {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
}

export function ViewSwitcher({ view, onViewChange }: Props) {
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-border/80 bg-muted/50 p-1 shadow-2xs">
      {(["day", "week"] as ViewMode[]).map((v) => {
        const isSelected = view === v;
        const Icon = v === "day" ? LayoutGrid : CalendarDays;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onViewChange(v)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 outline-none",
              isSelected
                ? "bg-surface text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{v === "day" ? "Theo ngày (Timeline)" : "Theo tuần (7 ngày)"}</span>
          </button>
        );
      })}
    </div>
  );
}
