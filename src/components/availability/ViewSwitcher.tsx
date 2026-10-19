"use client";

import type { ViewMode } from "@/lib/availability/types";
import { cn } from "@/lib/utils";

interface Props {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
}

export function ViewSwitcher({ view, onViewChange }: Props) {
  return (
    <div className="flex overflow-hidden rounded-full border border-border bg-muted p-0.5">
      {(["day", "week"] as ViewMode[]).map((v) => (
        <button
          key={v}
          onClick={() => onViewChange(v)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
            view === v
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {v === "day" ? "Day" : "7 Days"}
        </button>
      ))}
    </div>
  );
}
