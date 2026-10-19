"use client";

import { useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import type {
  RoomAvailabilityResult,
  StayDuration,
  TimeRange,
} from "@/lib/availability/types";
import { priceForDuration, formatPrice } from "@/lib/availability/utils";
import { cn } from "@/lib/utils";
import { AvailabilityTrack } from "./AvailabilityTrack";
import { RoomBookingAction } from "./RoomBookingAction";

const TYPE_BADGE: Record<string, string> = {
  Luxury: "text-amber-700 bg-amber-50",
  Deluxe: "text-primary bg-primary/8",
  Standard: "text-muted-foreground bg-muted",
};

interface Props {
  result: RoomAvailabilityResult;
  requestedRange: TimeRange | null;
  duration: StayDuration;
  checkOut: string | null;
  showNow: boolean;
  nowPct: number;
}

export function RoomAvailabilityRow({
  result,
  requestedRange,
  duration,
  checkOut,
  showNow,
  nowPct,
}: Props) {
  const { room, isAvailable } = result;
  const price = priceForDuration(room, duration);
  const [imageError, setImageError] = useState(false);

  const durationLabel =
    duration === "3h"
      ? "3h"
      : duration === "6h"
        ? "6h"
        : duration === "overnight"
          ? "night"
          : "stay";

  return (
    <div
      className={cn(
        "group flex transition-opacity duration-300",
        !isAvailable && requestedRange ? "opacity-50" : "opacity-100",
      )}
    >
      {/* ── Room info panel ────────────────────────────────────────────── */}
      <div className="flex w-44 shrink-0 items-start gap-3 px-4 py-4 md:w-56">
        {/* Thumbnail */}
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
          {!imageError ? (
            <Image
              src={room.image}
              alt={`${room.name} ${room.type}`}
              fill
              sizes="56px"
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
              {room.id}
            </div>
          )}
        </div>

        {/* Room details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-foreground">
              {room.name}
            </span>
            {isAvailable && requestedRange && (
              <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
            )}
          </div>
          <span
            className={cn(
              "mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              TYPE_BADGE[room.type],
            )}
          >
            {room.type}
          </span>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {formatPrice(price)}{" "}
            <span className="font-normal">/ {durationLabel}</span>
          </p>
        </div>
      </div>

      {/* ── Timeline + action ─────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col justify-center overflow-x-auto py-3 pr-4 md:overflow-visible">
        <div className="min-w-[600px]">
          <AvailabilityTrack
            room={room}
            requestedRange={requestedRange}
            isAvailable={isAvailable}
            showNow={showNow}
            nowPct={nowPct}
          />

          {/* Available badge + CTA */}
          {requestedRange && (
            <div className="mt-2 flex items-center justify-between">
              {isAvailable ? (
                <span className="text-[11px] font-medium text-primary">
                  ✓ Available
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  Not available for selected time
                </span>
              )}
              {isAvailable && (
                <RoomBookingAction
                  room={room}
                  duration={duration}
                  checkIn={requestedRange.start}
                  checkOut={checkOut ?? requestedRange.end}
                  price={price}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
