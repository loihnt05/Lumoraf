"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { MOCK_ROOMS } from "@/lib/availability/mock-rooms";
import {
  isRoomAvailable,
  calcCheckOut,
  durationToMinutes,
  durationLabel,
  priceForDuration,
  addDays,
  isToday,
} from "@/lib/availability/utils";
import type {
  BookingIntent,
  RoomAvailabilityResult,
  SortOption,
  ViewMode,
} from "@/lib/availability/types";
import { BookingIntentBar } from "./BookingIntentBar";
import { AvailabilitySummary } from "./AvailabilitySummary";
import { AvailabilityBoard } from "./AvailabilityBoard";
import { ViewSwitcher } from "./ViewSwitcher";
import { WeekView } from "./WeekView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Sparkles,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  SlidersHorizontal,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function RoomAvailabilityPage() {
  const [intent, setIntent] = useState<BookingIntent>({
    date: new Date(),
    checkIn: "14:30",
    duration: "3h",
  });
  const [sort, setSort] = useState<SortOption>("recommended");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "unavailable">("all");
  const [view, setView] = useState<ViewMode>("day");
  const [now, setNow] = useState(new Date());

  // Keep "now" marker fresh
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const durationMinutes = durationToMinutes(intent.duration, intent.customHours);
  const checkOut = calcCheckOut(intent.checkIn, durationMinutes);

  const results: RoomAvailabilityResult[] = useMemo(() => {
    const requested = checkOut
      ? { start: intent.checkIn, end: checkOut }
      : null;

    return MOCK_ROOMS.map((room) => ({
      room,
      isAvailable: requested
        ? isRoomAvailable(room.unavailableRanges, requested)
        : true,
      checkOut,
    }));
  }, [intent.checkIn, checkOut]);

  const sortedResults = useMemo(() => {
    const available = results.filter((r) => r.isAvailable);
    const unavailable = results.filter((r) => !r.isAvailable);

    const sortFn = (a: RoomAvailabilityResult, b: RoomAvailabilityResult) => {
      if (sort === "price-asc") {
        return (
          priceForDuration(a.room, intent.duration) -
          priceForDuration(b.room, intent.duration)
        );
      }
      if (sort === "earliest") {
        const firstBookedA = a.room.unavailableRanges[0]?.start ?? "24:00";
        const firstBookedB = b.room.unavailableRanges[0]?.start ?? "24:00";
        return firstBookedA < firstBookedB ? 1 : -1;
      }
      // recommended: by type then price
      const typeOrder = { Luxury: 0, Deluxe: 1, Standard: 2 };
      const tA = typeOrder[a.room.type];
      const tB = typeOrder[b.room.type];
      if (tA !== tB) return tA - tB;
      return (
        priceForDuration(a.room, intent.duration) -
        priceForDuration(b.room, intent.duration)
      );
    };

    return [...available.sort(sortFn), ...unavailable.sort(sortFn)];
  }, [results, sort, intent.duration]);

  const availableCount = results.filter((r) => r.isAvailable).length;
  const unavailableCount = results.length - availableCount;

  // Filtered by available / unavailable tab
  const displayResults = useMemo(() => {
    if (statusFilter === "available") {
      return sortedResults.filter((r) => r.isAvailable);
    }
    if (statusFilter === "unavailable") {
      return sortedResults.filter((r) => !r.isAvailable);
    }
    return sortedResults;
  }, [sortedResults, statusFilter]);

  const navigateDate = (delta: number) => {
    setIntent((prev) => ({ ...prev, date: addDays(prev.date, delta) }));
  };

  const handleResetToToday = () => {
    setIntent((prev) => ({ ...prev, date: new Date() }));
  };

  const requestedRange = checkOut ? { start: intent.checkIn, end: checkOut } : null;
  const showNow = isToday(intent.date);

  // Vietnamese formatted date
  const dateFormattedVi = intent.date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-7 pb-20">
      {/* ── 1. Page Header with Keyword Accent ── */}
      <div className="space-y-3 border-b border-border/70 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/booking"
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Quay lại Danh sách phòng</span>
          </Link>

          <Badge className="bg-primary/10 text-primary border-none text-xs font-semibold px-3 py-1">
            Realtime Room Track
          </Badge>
        </div>

        <div className="space-y-1.5">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-foreground leading-tight">
            Sơ đồ{" "}
            <span className="font-script text-4xl sm:text-5xl lg:text-6xl text-[#C48443] font-normal not-italic px-1 inline-block -rotate-1 align-baseline">
              lịch trống
            </span>{" "}
            theo thời gian thực.
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Xem trực quan trạng thái từng căn phòng theo từng khung giờ trong ngày, đối chiếu thời gian khả dụng và đặt phòng tức thì mà không cần chờ xác nhận.
          </p>
        </div>
      </div>

      {/* ── 2. Booking Intent Filter Bar ── */}
      <section aria-label="Bộ lọc nhu cầu đặt phòng" className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Thiết lập thời gian bạn muốn tìm
          </span>
          <span className="text-[11px] text-muted-foreground">
            Bấm chọn để điều chỉnh tức thì
          </span>
        </div>
        <BookingIntentBar intent={intent} onIntentChange={setIntent} />
      </section>

      {/* ── 3. Controls & Filter Bar: Summary + Status Filter Tabs + Sort + View Switcher ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-surface p-4 sm:p-5 shadow-xs">
        {/* Top line: Summary & Quick Status Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-border/60 pb-3.5">
          <AvailabilitySummary
            availableCount={availableCount}
            totalCount={MOCK_ROOMS.length}
            checkIn={intent.checkIn}
            checkOut={checkOut}
            duration={durationLabel(intent.duration, intent.customHours)}
          />

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground text-[11px] font-medium mr-1 hidden sm:inline">
              Lọc theo:
            </span>
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "rounded-full px-3 py-1 font-semibold transition-all",
                statusFilter === "all"
                  ? "bg-foreground text-background shadow-2xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              Tất cả ({results.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("available")}
              className={cn(
                "rounded-full px-3 py-1 font-semibold transition-all flex items-center gap-1",
                statusFilter === "available"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20",
              )}
            >
              <Check className="h-3 w-3 stroke-[3]" />
              <span>Chỉ phòng trống ({availableCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("unavailable")}
              className={cn(
                "rounded-full px-3 py-1 font-semibold transition-all flex items-center gap-1",
                statusFilter === "unavailable"
                  ? "bg-red-700 text-white shadow-2xs"
                  : "bg-red-500/10 text-red-800 hover:bg-red-500/20",
              )}
            >
              <X className="h-3 w-3 stroke-[3]" />
              <span>Phòng đã kín ({unavailableCount})</span>
            </button>
          </div>
        </div>

        {/* Bottom line: Date Navigator + Sort + View Mode */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Date Navigator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border border-border/80 bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => navigateDate(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface hover:text-foreground text-muted-foreground transition-all cursor-pointer"
                title="Xem ngày hôm trước"
                aria-label="Ngày hôm trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="px-3 text-xs font-bold capitalize text-foreground tabular-nums select-none">
                {isToday(intent.date) ? `Hôm nay · ${dateFormattedVi}` : dateFormattedVi}
              </span>

              <button
                type="button"
                onClick={() => navigateDate(1)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface hover:text-foreground text-muted-foreground transition-all cursor-pointer"
                title="Xem ngày kế tiếp"
                aria-label="Ngày kế tiếp"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {!isToday(intent.date) && (
              <button
                type="button"
                onClick={handleResetToToday}
                className="text-[11px] font-semibold text-primary hover:underline px-2 py-1 flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Về hôm nay</span>
              </button>
            )}
          </div>

          {/* Sort & View Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Dropdown / Pills */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground text-[11px] font-medium hidden md:inline">
                Sắp xếp:
              </span>
              <div className="flex rounded-full border border-border/80 bg-muted/40 p-0.5">
                {[
                  { value: "recommended" as SortOption, label: "Đề xuất" },
                  { value: "price-asc" as SortOption, label: "Giá thấp nhất" },
                  { value: "earliest" as SortOption, label: "Trống sớm nhất" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSort(value)}
                    className={cn(
                      "rounded-full px-2.5 sm:px-3 py-1 text-xs font-semibold transition-all",
                      sort === value
                        ? "bg-surface text-foreground shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* View Switcher: Day vs Week */}
            <ViewSwitcher view={view} onViewChange={setView} />
          </div>
        </div>
      </div>

      {/* ── 4. Main Board or Week View ── */}
      {view === "day" ? (
        <AvailabilityBoard
          results={displayResults}
          requestedRange={requestedRange}
          duration={intent.duration}
          showNow={showNow}
          now={now}
          checkOut={checkOut}
        />
      ) : (
        <WeekView
          baseDate={intent.date}
          onDayClick={(date) => {
            setIntent((prev) => ({ ...prev, date }));
            setView("day");
          }}
        />
      )}
    </div>
  );
}
