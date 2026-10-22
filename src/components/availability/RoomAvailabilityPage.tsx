"use client";

import { useState, useEffect, useMemo } from "react";
import { MOCK_ROOMS } from "@/lib/availability/mock-rooms";
import {
  isRoomAvailable,
  calcCheckOut,
  durationToMinutes,
  durationLabel,
  formatPrice,
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

export function RoomAvailabilityPage() {
  const [intent, setIntent] = useState<BookingIntent>({
    date: new Date(),
    checkIn: "14:30",
    duration: "3h",
  });
  const [sort, setSort] = useState<SortOption>("recommended");
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
        // sort by first available minute (rooms with fewer bookings early in day)
        const firstBookedA =
          a.room.unavailableRanges[0]?.start ?? "24:00";
        const firstBookedB =
          b.room.unavailableRanges[0]?.start ?? "24:00";
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

  const navigateDate = (delta: number) => {
    setIntent((prev) => ({ ...prev, date: addDays(prev.date, delta) }));
  };

  const requestedRange =
    checkOut ? { start: intent.checkIn, end: checkOut } : null;
  const showNow = isToday(intent.date);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-normal tracking-tight text-foreground md:text-3xl">
          Room Availability
        </h1>
        <p className="text-sm text-muted-foreground">
          See every room. See every hour. Choose instantly.
        </p>
      </div>

      {/* Booking intent bar */}
      <BookingIntentBar intent={intent} onIntentChange={setIntent} />

      {/* Summary + sort + view controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AvailabilitySummary
          availableCount={availableCount}
          totalCount={MOCK_ROOMS.length}
          checkIn={intent.checkIn}
          checkOut={checkOut}
          duration={durationLabel(intent.duration, intent.customHours)}
        />
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Sort */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Sort:</span>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { value: "recommended", label: "Recommended" },
                  { value: "price-asc", label: "Lowest price" },
                  { value: "earliest", label: "Earliest" },
                ] as { value: SortOption; label: string }[]
              ).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSort(value)}
                  className={`rounded-full px-2.5 sm:px-3 py-1 text-xs font-medium transition-colors shrink-0 whitespace-nowrap ${
                    sort === value
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:bg-border hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <ViewSwitcher view={view} onViewChange={setView} />
        </div>
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
            aria-label="Previous day"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-foreground">
            {isToday(intent.date)
              ? "Today · " +
                intent.date.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })
              : intent.date.toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
          </span>
          <button
            onClick={() => navigateDate(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
            aria-label="Next day"
          >
            ›
          </button>
        </div>
      </div>

      {/* Main board */}
      {view === "day" ? (
        <AvailabilityBoard
          results={sortedResults}
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
