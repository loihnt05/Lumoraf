"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type DateSelectorProps = {
  selectedDate: string; // "YYYY-MM-DD"
  onSelectDate: (date: string) => void;
};

type DayItem = {
  dateStr: string;
  dayOfWeek: string;
  dayNumber: number;
  monthStr: string;
  isToday: boolean;
  isPast: boolean;
};

export function DateSelector({ selectedDate, onSelectDate }: DateSelectorProps) {
  // Generate 14 days starting from today in local time
  const days: DayItem[] = React.useMemo(() => {
    const list: DayItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayNames = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      list.push({
        dateStr,
        dayOfWeek: i === 0 ? "Hôm nay" : dayNames[d.getDay()],
        dayNumber: d.getDate(),
        monthStr: `Thg ${d.getMonth() + 1}`,
        isToday: i === 0,
        isPast: false,
      });
    }

    return list;
  }, []);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-3">
      {/* Date Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Chọn ngày lưu trú
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={scrollLeft}
            aria-label="Xem ngày trước"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-surface text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={scrollRight}
            aria-label="Xem ngày tiếp theo"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-surface text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Days Strip (Sonder style) */}
      <div
        ref={scrollContainerRef}
        role="radiogroup"
        aria-label="Danh sách ngày lưu trú"
        className="flex gap-2 overflow-x-auto pb-1 snap-x scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {days.map((item) => {
          const isSelected = item.dateStr === selectedDate;
          return (
            <button
              key={item.dateStr}
              role="radio"
              aria-checked={isSelected}
              type="button"
              onClick={() => onSelectDate(item.dateStr)}
              className={cn(
                "group flex min-w-[72px] shrink-0 snap-start flex-col items-center justify-center rounded-2xl border py-3 px-2 transition-all duration-200 outline-none focus-visible:outline-2 focus-visible:outline-ring",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border/70 bg-surface hover:border-primary/40 hover:bg-muted/40 text-foreground",
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-medium tracking-tight",
                  isSelected
                    ? "text-primary-foreground/90 font-semibold"
                    : item.isToday
                    ? "text-primary font-semibold"
                    : "text-muted-foreground",
                )}
              >
                {item.dayOfWeek}
              </span>
              <span
                className={cn(
                  "mt-1 text-lg font-bold tabular-nums tracking-tight",
                  isSelected ? "text-primary-foreground" : "text-foreground",
                )}
              >
                {item.dayNumber}
              </span>
              <span
                className={cn(
                  "mt-0.5 text-[9px]",
                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
                )}
              >
                {item.monthStr}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
