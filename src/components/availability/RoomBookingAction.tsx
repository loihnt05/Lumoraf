"use client";

import type { Room, StayDuration } from "@/lib/availability/types";
import { formatPrice } from "@/lib/availability/utils";

interface Props {
  room: Room;
  duration: StayDuration;
  checkIn: string;
  checkOut: string;
  price: number;
}

const DURATION_SHORT: Record<StayDuration, string> = {
  "3h": "3h",
  "6h": "6h",
  overnight: "night",
  custom: "stay",
};

export function RoomBookingAction({ duration, checkIn, checkOut, price }: Props) {
  // In a real app this would navigate to /booking/[roomId]
  const handleBook = () => {
    alert(`Booking flow would open here.\nCheck-in: ${checkIn}\nCheck-out: ${checkOut}`);
  };

  return (
    <button
      onClick={handleBook}
      className="group flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
    >
      Book {DURATION_SHORT[duration]} · {formatPrice(price)}
    </button>
  );
}
