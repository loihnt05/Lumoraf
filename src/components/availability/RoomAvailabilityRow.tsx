"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Users, Bed, Layers, AlertCircle, ArrowUpRight } from "lucide-react";
import type {
  RoomAvailabilityResult,
  StayDuration,
  TimeRange,
} from "@/lib/availability/types";
import { priceForDuration } from "@/lib/availability/utils";
import { cn } from "@/lib/utils";
import { AvailabilityTrack } from "./AvailabilityTrack";
import { RoomBookingAction } from "./RoomBookingAction";

const TYPE_BADGE: Record<string, { label: string; class: string }> = {
  Luxury: { label: "Hạng Luxury Suite", class: "text-amber-800 bg-amber-100/80" },
  Deluxe: { label: "Hạng Deluxe", class: "text-primary bg-primary/10" },
  Standard: { label: "Hạng Tiêu chuẩn", class: "text-muted-foreground bg-muted" },
};

const ROOM_SLUG_MAP: Record<string, string> = {
  "01": "room-dl-no5",
  "02": "room-dl-no6",
  "03": "room-dl-no7",
  "04": "room-dl-no8",
  "05": "room-hn-no1",
  "06": "room-hn-no2",
  "07": "room-dl-no5",
  "08": "room-dl-no6",
  "09": "room-dl-no7",
  "10": "room-dl-no8",
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
      ? "3 giờ"
      : duration === "6h"
      ? "6 giờ"
      : duration === "overnight"
      ? "qua đêm"
      : "ca đặt";

  const formattedPrice = `${new Intl.NumberFormat("vi-VN").format(price * 1000)}₫`;
  const roomSlug = ROOM_SLUG_MAP[room.id] || "room-dl-no5";

  return (
    <div
      className={cn(
        "group flex flex-col md:flex-row transition-all duration-200 border-b border-border/40 last:border-b-0",
        !isAvailable && requestedRange
          ? "bg-muted/10 opacity-90"
          : "bg-surface hover:bg-muted/15",
      )}
    >
      {/* ── Left Column: Room info panel ────────────────────────────────────────────── */}
      <div className="flex w-full md:w-64 lg:w-72 shrink-0 items-start gap-3.5 p-4 md:border-r border-border/40">
        {/* Thumbnail */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted border border-border/60 shadow-2xs">
          {!imageError ? (
            <Image
              src={room.image}
              alt={`${room.name} ${room.type}`}
              fill
              sizes="64px"
              className="object-cover transition-transform group-hover:scale-105 duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
              {room.id}
            </div>
          )}
        </div>

        {/* Room details */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-1">
            <Link
              href={`/booking/${roomSlug}`}
              className="truncate text-sm font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <span>{room.name}</span>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
            </Link>
            {isAvailable && requestedRange && (
              <span className="flex h-5 items-center gap-1 rounded-full bg-emerald-100 px-1.5 text-[10px] font-bold text-emerald-800 shrink-0">
                <Check className="h-3 w-3 stroke-[3]" />
                <span className="hidden sm:inline">Trống</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                TYPE_BADGE[room.type]?.class ?? "text-muted-foreground bg-muted",
              )}
            >
              {TYPE_BADGE[room.type]?.label ?? room.type}
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
              <Layers className="h-3 w-3 text-muted-foreground/70" />
              Tầng {room.floor ?? 2}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <p className="text-xs font-bold text-foreground">
              {formattedPrice}{" "}
              <span className="text-[10px] font-normal text-muted-foreground">/ {durationLabel}</span>
            </p>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {room.maxGuests ?? 2} khách
            </span>
          </div>
        </div>
      </div>

      {/* ── Right Column: Timeline + Action strip ─────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col justify-center overflow-x-auto p-4">
        <div className="min-w-[620px] space-y-2">
          {/* Timeline Bar */}
          <AvailabilityTrack
            room={room}
            requestedRange={requestedRange}
            isAvailable={isAvailable}
            showNow={showNow}
            nowPct={nowPct}
          />

          {/* Contextual Status Banner & Action */}
          {requestedRange && (
            <div className="flex items-center justify-between gap-3 pt-1 text-xs">
              {isAvailable ? (
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  <span>
                    Phòng trống hoàn toàn từ <strong>{requestedRange.start}</strong> đến <strong>{requestedRange.end}</strong>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-red-700/90 font-medium text-[11px]">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Bị trùng lịch trong khung giờ này (vui lòng chọn ca khác hoặc phòng khác)
                  </span>
                </div>
              )}

              {isAvailable ? (
                <RoomBookingAction
                  room={room}
                  duration={duration}
                  checkIn={requestedRange.start}
                  checkOut={checkOut ?? requestedRange.end}
                  price={price}
                />
              ) : (
                <Link
                  href={`/booking/${roomSlug}`}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <span>Xem các ca khác của phòng này</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
