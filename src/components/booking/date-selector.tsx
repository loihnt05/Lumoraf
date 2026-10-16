"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type DateSelectorProps = {
  selectedDate: string; // "YYYY-MM-DD"
  onSelectDate: (date: string) => void;
};

// Helper: Format Date to YYYY-MM-DD in local time
function toDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Helper: Parse YYYY-MM-DD into local Date
function parseDateStr(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

// Helper: Get Monday of the week containing a date
function getMondayOfWeek(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date;
}

export function DateSelector({ selectedDate, onSelectDate }: DateSelectorProps) {
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayStr = React.useMemo(() => toDateStr(today), [today]);
  const currentWeekMonday = React.useMemo(() => getMondayOfWeek(today), [today]);

  // Derived Monday of the selected date
  const selectedMonday = React.useMemo(() => {
    return getMondayOfWeek(parseDateStr(selectedDate));
  }, [selectedDate]);

  // Week offset from selectedMonday (0 = current selected week)
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [prevSelectedDate, setPrevSelectedDate] = React.useState(selectedDate);

  // Sync state with prop during rendering (React 19 recommended pattern without useEffect)
  if (selectedDate !== prevSelectedDate) {
    setPrevSelectedDate(selectedDate);
    setWeekOffset(0);
  }

  // Active week start date
  const weekStart = React.useMemo(() => {
    const d = new Date(selectedMonday);
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [selectedMonday, weekOffset]);

  // Generate 7 days for the current week view (Monday to Sunday)
  const weekDays = React.useMemo(() => {
    const dayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    const list = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      d.setHours(0, 0, 0, 0);

      const dateStr = toDateStr(d);
      const isPast = d.getTime() < today.getTime();
      const isToday = d.getTime() === today.getTime();
      const isSelected = dateStr === selectedDate;

      list.push({
        dateStr,
        dayOfWeek: dayLabels[i],
        dayNumber: d.getDate(),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        isPast,
        isToday,
        isSelected,
      });
    }

    return list;
  }, [weekStart, today, selectedDate]);

  // Header month/year display (e.g. "Tháng 10, 2026")
  const headerMonthText = React.useMemo(() => {
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];
    if (firstDay.month === lastDay.month) {
      return `Tháng ${firstDay.month}, ${firstDay.year}`;
    }
    return `Thg ${firstDay.month} - Thg ${lastDay.month}, ${lastDay.year}`;
  }, [weekDays]);

  const canGoBack = weekStart.getTime() > currentWeekMonday.getTime();

  const handlePrevWeek = () => {
    if (!canGoBack) return;
    setWeekOffset((prev) => prev - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset((prev) => prev + 1);
  };

  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    onSelectDate(val);
  };

  const handleOpenCalendar = () => {
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch {
        dateInputRef.current.focus();
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Header: Month title, Calendar picker trigger, and Week navigation */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground tracking-tight">
            {headerMonthText}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Calendar Picker Trigger (Cuốn lịch) */}
          <div className="relative">
            <button
              type="button"
              onClick={handleOpenCalendar}
              title="Mở cuốn lịch chọn ngày bất kỳ"
              aria-label="Mở cuốn lịch chọn ngày bất kỳ"
              className="flex h-7 items-center gap-1.5 rounded-lg border border-border/80 bg-surface px-2 text-[11px] font-medium text-foreground hover:bg-muted/60 transition-colors shadow-2xs"
            >
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Chọn ngày</span>
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              min={todayStr}
              onChange={handleCalendarChange}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>

          {/* Week Back Button */}
          <button
            type="button"
            onClick={handlePrevWeek}
            disabled={!canGoBack}
            aria-label="Tuần trước"
            title={canGoBack ? "Tuần trước" : "Không thể chọn ngày trong quá khứ"}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-surface text-muted-foreground transition-colors shadow-2xs",
              canGoBack
                ? "hover:bg-muted hover:text-foreground cursor-pointer"
                : "opacity-40 cursor-not-allowed",
            )}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {/* Week Next Button */}
          <button
            type="button"
            onClick={handleNextWeek}
            aria-label="Tuần kế tiếp"
            title="Tuần kế tiếp"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-surface text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shadow-2xs cursor-pointer"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 7-Day Week Grid (Vừa khít 100% độ rộng thẻ, không tràn, không cuộn) */}
      <div
        role="radiogroup"
        aria-label="7 ngày trong tuần"
        className="grid grid-cols-7 gap-1 sm:gap-1.5 w-full"
      >
        {weekDays.map((item) => (
          <button
            key={item.dateStr}
            role="radio"
            aria-checked={item.isSelected}
            aria-disabled={item.isPast}
            disabled={item.isPast}
            type="button"
            onClick={() => onSelectDate(item.dateStr)}
            className={cn(
              "group relative flex h-14 sm:h-15 flex-col items-center justify-center rounded-xl p-1 transition-all duration-200 outline-none w-full min-w-0",
              item.isPast
                ? "opacity-35 cursor-not-allowed bg-muted/20 border border-border/40 text-muted-foreground"
                : item.isSelected
                ? "border-primary bg-primary text-primary-foreground shadow-sm font-semibold ring-2 ring-primary/20"
                : "border border-border/70 bg-surface hover:border-primary/50 hover:bg-muted/40 text-foreground cursor-pointer focus-visible:outline-2 focus-visible:outline-ring",
            )}
          >
            <span
              className={cn(
                "text-[10px] sm:text-[11px] font-medium leading-none",
                item.isSelected
                  ? "text-primary-foreground/90 font-semibold"
                  : item.isToday
                  ? "text-primary font-bold"
                  : "text-muted-foreground",
              )}
            >
              {item.dayOfWeek}
            </span>

            <span
              className={cn(
                "mt-1 text-sm sm:text-base font-bold tabular-nums leading-none",
                item.isSelected ? "text-primary-foreground" : "text-foreground",
              )}
            >
              {item.dayNumber}
            </span>

            {/* Absolute indicator for today - never shifts button height or text alignment */}
            {item.isToday && (
              <span
                className={cn(
                  "absolute bottom-1 h-1 w-1 rounded-full",
                  item.isSelected ? "bg-primary-foreground" : "bg-primary",
                )}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
