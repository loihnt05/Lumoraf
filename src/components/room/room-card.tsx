"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import type { PhysicalRoom } from "@/lib/types/inventory";
import {
  Heart,
  Star,
  MapPin,
  ThumbsUp,
  Eye,
  TrendingDown,
  Bath,
  Coffee,
  Wind,
  Sparkles,
  Wifi,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RoomCardProps = {
  room: PhysicalRoom;
};

// Rich metadata mapping matching the exact card design in the user screenshot
type RoomMeta = {
  propertyType: string;
  stars?: number;
  badge?: {
    text: string;
    type: "viewed" | "dropped";
  };
  location: string;
  ratingScore: string;
  ratingLabel: string;
  reviewsCount: number;
  specs: string;
  provider: "Booking.com" | "Expedia" | "Lumora Direct";
};

const ROOM_METADATA: Record<string, RoomMeta> = {
  "room-dl-no5": {
    propertyType: "Hotel",
    stars: 5,
    badge: { text: "Frequently Viewed", type: "viewed" },
    location: "Đà Lạt · Phường 10",
    ratingScore: "8.8",
    ratingLabel: "Fabulous",
    reviewsCount: 210,
    specs: "1 Bedroom · 2 Guests",
    provider: "Booking.com",
  },
  "room-dl-no6": {
    propertyType: "Apartment",
    badge: { text: "Frequently Viewed", type: "viewed" },
    location: "Đà Lạt · Phường 10",
    ratingScore: "8.0",
    ratingLabel: "Excellent",
    reviewsCount: 48,
    specs: "1 Bedroom · 2 Guests",
    provider: "Expedia",
  },
  "room-dl-no7": {
    propertyType: "Hotel",
    stars: 3,
    badge: { text: "Frequently Viewed", type: "viewed" },
    location: "Đà Lạt · Đồi Thông",
    ratingScore: "8.2",
    ratingLabel: "Excellent",
    reviewsCount: 2439,
    specs: "1 Bedroom · 2 Guests",
    provider: "Booking.com",
  },
  "room-dl-no8": {
    propertyType: "Apartment",
    badge: { text: "Frequently Viewed", type: "viewed" },
    location: "Đà Lạt · Rừng Thông",
    ratingScore: "10.0",
    ratingLabel: "Exceptional",
    reviewsCount: 1,
    specs: "1 Bedroom · 2 Guests",
    provider: "Expedia",
  },
  "room-sg-no1": {
    propertyType: "Hotel",
    stars: 4,
    badge: { text: "Price Dropped", type: "dropped" },
    location: "Sài Gòn · Quận 1",
    ratingScore: "8.6",
    ratingLabel: "Fabulous",
    reviewsCount: 120,
    specs: "1 Bedroom · 2 Guests",
    provider: "Booking.com",
  },
  "room-sg-no2": {
    propertyType: "Apartment",
    badge: { text: "Frequently Viewed", type: "viewed" },
    location: "Sài Gòn · Đa Kao",
    ratingScore: "9.2",
    ratingLabel: "Exceptional",
    reviewsCount: 64,
    specs: "1 Bedroom · 2 Guests",
    provider: "Expedia",
  },
};

function getAmenityIcon(id: string) {
  switch (id) {
    case "bathtub":
      return <Bath className="h-3 w-3" />;
    case "espresso":
      return <Coffee className="h-3 w-3" />;
    case "balcony":
      return <Wind className="h-3 w-3" />;
    case "wifi":
      return <Wifi className="h-3 w-3" />;
    default:
      return <Sparkles className="h-3 w-3" />;
  }
}

export function RoomCard({ room }: RoomCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [isSaved, setIsSaved] = React.useState(false);
  const images = room.images.length > 0 ? room.images : ["/placeholder.jpg"];

  // Resolve metadata or fallback gracefully
  const meta: RoomMeta = ROOM_METADATA[room.id] ?? {
    propertyType: room.roomType?.name?.includes("Villa")
      ? "Villa"
      : room.roomType?.name?.includes("Suite")
        ? "Hotel"
        : "Apartment",
    stars: 5,
    badge: { text: "Frequently Viewed", type: "viewed" },
    location: room.propertyId === "prop-da-lat" ? "Đà Lạt · Phường 10" : "Sài Gòn · Quận 1",
    ratingScore: "8.8",
    ratingLabel: "Fabulous",
    reviewsCount: 150,
    specs: `1 Bedroom · ${room.roomType?.maxGuests ?? 2} Guests`,
    provider: "Booking.com",
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved((prev) => !prev);
  };

  const formattedPrice = room.roomType
    ? new Intl.NumberFormat("vi-VN").format(room.roomType.basePrice)
    : "299.000";

  const amenities = room.roomType?.amenities ?? [];

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300",
        "border border-gray-200/90 shadow-2xs hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1",
        room.isBlocked && "opacity-85 hover:translate-y-0 hover:shadow-2xs",
      )}
    >
      {/* 1. Photo Section */}
      <div className="relative aspect-16/11 w-full overflow-hidden bg-gray-100">
        <Link
          href={room.isBlocked ? "#" : `/booking/${room.id}`}
          tabIndex={room.isBlocked ? -1 : 0}
          className="relative block h-full w-full"
          aria-label={`Xem chi tiết ${room.name}`}
        >
          <Image
            src={images[currentImageIndex]}
            alt={room.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={cn(
              "object-cover transition-transform duration-700 ease-out",
              !room.isBlocked && "group-hover:scale-105",
            )}
            priority={false}
          />
        </Link>

        {/* Top-Left Pill Badge (Frequently Viewed / Price Dropped) */}
        {!room.isBlocked && meta.badge && (
          <div
            className={cn(
              "absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-2xs backdrop-blur-xs pointer-events-none",
              meta.badge.type === "viewed"
                ? "bg-[#FEF6E9] text-[#8B5E14] border border-[#F4E3C7]"
                : "bg-[#EBF7F5] text-[#1B7065] border border-[#C6EAE3]",
            )}
          >
            {meta.badge.type === "viewed" ? (
              <Eye className="h-3 w-3 shrink-0" />
            ) : (
              <TrendingDown className="h-3 w-3 shrink-0" />
            )}
            <span className="whitespace-nowrap font-medium">{meta.badge.text}</span>
          </div>
        )}

        {/* Top-Right Heart Button */}
        {!room.isBlocked && (
          <button
            type="button"
            onClick={handleToggleSave}
            aria-label={isSaved ? "Bỏ lưu phòng" : "Lưu vào danh sách yêu thích"}
            className={cn(
              "absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 backdrop-blur-md active:scale-90",
              isSaved
                ? "bg-white text-red-500 shadow-md"
                : "bg-black/35 hover:bg-black/55 text-white",
            )}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-transform",
                isSaved && "fill-current text-red-500 scale-110",
              )}
            />
          </button>
        )}

        {/* Blocked / Maintenance Overlay */}
        {room.isBlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4 text-center backdrop-blur-xs pointer-events-none">
            <div className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-md">
              <Ban className="h-3.5 w-3.5" />
              <span>Tạm ngưng phục vụ</span>
            </div>
            <p className="mt-1.5 text-xs text-white/90 font-normal">
              Đang bảo trì định kỳ
            </p>
          </div>
        )}

        {/* Image Carousel Controls */}
        {images.length > 1 && !room.isBlocked && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Ảnh trước"
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-800 opacity-0 shadow-md backdrop-blur-xs transition-all duration-200 hover:bg-white hover:scale-105 group-hover:opacity-100 focus-visible:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Ảnh kế tiếp"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-800 opacity-0 shadow-md backdrop-blur-xs transition-all duration-200 hover:bg-white hover:scale-105 group-hover:opacity-100 focus-visible:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* 2. Content Section matching user screenshot */}
      <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4 gap-2.5">
        <div className="space-y-1.5">
          {/* Row 1: Property Type & Star Rating */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="font-medium text-gray-600">{meta.propertyType}</span>
            {meta.stars && (
              <div className="flex items-center gap-0.5 ml-1">
                {Array.from({ length: meta.stars }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
            )}
          </div>

          {/* Row 2: Title */}
          <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem]">
            <Link
              href={room.isBlocked ? "#" : `/booking/${room.id}`}
              className={cn(
                "hover:text-[#132238] transition-colors",
                room.isBlocked && "cursor-default text-gray-400 hover:text-gray-400",
              )}
            >
              {room.name}
            </Link>
          </h3>

          {/* Row 3: Location with Blue MapPin */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{meta.location}</span>
          </div>

          {/* Row 4: Guest Rating Pill & Reviews */}
          <div className="flex items-center gap-1.5 pt-0.5 text-xs min-w-0">
            <span className="inline-flex items-center gap-1 rounded bg-[#132238] px-1.5 py-0.5 text-[11px] font-bold text-white leading-none shrink-0">
              <ThumbsUp className="h-2.5 w-2.5 fill-white" />
              <span>{meta.ratingScore}</span>
            </span>
            <span className="font-bold text-gray-900 shrink-0">{meta.ratingLabel}</span>
            <span className="text-gray-400 truncate text-[11px] sm:text-xs">
              ({meta.reviewsCount.toLocaleString()} {meta.reviewsCount === 1 ? "Review" : "Reviews"})
            </span>
          </div>

          {/* Row 5: Specs Line */}
          <div className="text-xs text-gray-500 font-normal truncate">
            {meta.specs}
          </div>

          {/* Row 6: Amenity Badges */}
          <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden pt-0.5">
            {amenities.slice(0, 2).map((amenity) => (
              <span
                key={amenity.id}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50/70 px-2 py-0.5 text-[11px] text-gray-600 font-normal shrink-0"
              >
                {getAmenityIcon(amenity.id)}
                <span>{amenity.name}</span>
              </span>
            ))}
            <span className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-gray-50/70 h-5 w-6 text-gray-400 shrink-0">
              <MoreHorizontal className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* Row 7: Bottom Row (Price & View Deal button) */}
        <div className="mt-2.5 flex items-end justify-between gap-2 border-t border-gray-100 pt-2.5">
          <div className="flex items-baseline gap-1 whitespace-nowrap shrink-0 pb-0.5">
            <span className="font-sans text-[15px] sm:text-base font-bold tracking-tight text-[#132238] tabular-nums">
              {formattedPrice}₫
            </span>
            <span className="text-[11px] text-gray-500 font-normal whitespace-nowrap">
              / 3h slot
            </span>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <span className="text-[10px] font-bold text-[#14233c] mb-1 leading-tight">
              {meta.provider}
            </span>
            {room.isBlocked ? (
              <span className="rounded-md bg-gray-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 cursor-not-allowed whitespace-nowrap">
                Tạm khóa
              </span>
            ) : (
              <Link
                href={`/booking/${room.id}`}
                className="rounded-md bg-[#14233c] hover:bg-[#1f375a] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs transition-colors text-center whitespace-nowrap"
              >
                VIEW DEAL
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
