"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Room, StayDuration } from "@/lib/availability/types";

interface Props {
  room: Room;
  duration: StayDuration;
  checkIn: string;
  checkOut: string;
  price: number;
}

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

export function RoomBookingAction({ room, duration, checkIn, checkOut, price }: Props) {
  const targetSlug = ROOM_SLUG_MAP[room.id] || "room-dl-no5";
  const bookingUrl = `/booking/${targetSlug}?checkIn=${checkIn}&checkOut=${checkOut}&duration=${duration}`;

  const formattedPrice = `${new Intl.NumberFormat("vi-VN").format(price * 1000)}₫`;

  return (
    <Link
      href={bookingUrl}
      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 hover:shadow-sm active:scale-98 shrink-0"
    >
      <span>Đặt ca này ({formattedPrice})</span>
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}
