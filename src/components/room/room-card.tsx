"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import type { PhysicalRoom } from "@/lib/types/inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Bed, Maximize2, Ban, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type RoomCardProps = {
  room: PhysicalRoom;
};

export function RoomCard({ room }: RoomCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const images = room.images.length > 0 ? room.images : ["/placeholder.jpg"];

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

  const formattedPrice = room.roomType
    ? new Intl.NumberFormat("vi-VN").format(room.roomType.basePrice)
    : "299.000";

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 bg-surface",
        "border-border/70 hover:border-border hover:shadow-lg hover:shadow-black/5",
        room.isBlocked && "opacity-75 bg-muted/20 border-dashed",
      )}
    >
      {/* Photography Section */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
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
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={cn(
              "object-cover transition-transform duration-700 ease-out",
              !room.isBlocked && "group-hover:scale-105",
            )}
          />
        </Link>

        {/* Room number & floor tag */}
        <div className="absolute top-3 left-3 flex gap-2 pointer-events-none">
          <Badge className="bg-surface/90 text-foreground font-semibold shadow-xs backdrop-blur-xs">
            {room.roomNumber}
          </Badge>
          <Badge className="bg-surface/80 text-muted-foreground backdrop-blur-xs">
            Tầng {room.floor}
          </Badge>
        </div>

        {/* Blocked Badge Overlay */}
        {room.isBlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-4 text-center backdrop-blur-xs pointer-events-none">
            <div className="flex items-center gap-1.5 rounded-full bg-red-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-md">
              <Ban className="h-3.5 w-3.5" />
              <span>Phòng tạm khóa / Bảo trì</span>
            </div>
            <p className="mt-2 text-xs text-white/90">
              Phòng này hiện không thể đặt
            </p>
          </div>
        )}

        {/* Image Carousel Controls */}
        {images.length > 1 && !room.isBlocked && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous photo"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-surface/85 text-foreground opacity-0 shadow-md backdrop-blur-xs transition-all hover:bg-surface group-hover:opacity-100 focus-visible:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next photo"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-surface/85 text-foreground opacity-0 shadow-md backdrop-blur-xs transition-all hover:bg-surface group-hover:opacity-100 focus-visible:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Dots indicator */}
            <div className="absolute bottom-2.5 inset-x-0 flex justify-center gap-1.5 pointer-events-none">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    idx === currentImageIndex
                      ? "w-4 bg-white"
                      : "w-1.5 bg-white/50",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-6">
        {/* Room type title & Name */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {room.roomType?.name ?? "Standard Room"}
            </p>
            <h3 className="mt-1 text-xl font-medium tracking-tight text-foreground">
              <Link
                href={room.isBlocked ? "#" : `/booking/${room.id}`}
                className={cn(
                  "hover:underline decoration-primary/40 underline-offset-4",
                  room.isBlocked && "cursor-default hover:no-underline",
                )}
              >
                {room.name}
              </Link>
            </h3>
          </div>
        </div>

        {/* Specifications */}
        <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground/80" />
            <span>Tối đa {room.roomType?.maxGuests ?? 2} khách</span>
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <Bed className="h-3.5 w-3.5 text-muted-foreground/80" />
            <span>{room.roomType?.bedType ?? "King bed"}</span>
          </span>
          {room.roomType?.sizeM2 && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Maximize2 className="h-3.5 w-3.5 text-muted-foreground/80" />
                <span>{room.roomType.sizeM2} m²</span>
              </span>
            </>
          )}
        </div>

        {/* Amenities Highlights */}
        {room.roomType?.amenities && room.roomType.amenities.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {room.roomType.amenities.slice(0, 3).map((amenity) => (
              <span
                key={amenity.id}
                className="rounded-md bg-muted/60 px-2.5 py-1 text-[11px] text-muted-foreground"
              >
                {amenity.name}
              </span>
            ))}
            {room.roomType.amenities.length > 3 && (
              <span className="rounded-md bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground">
                +{room.roomType.amenities.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="mt-6 flex items-end justify-between border-t border-border/50 pt-4">
          {/* Price */}
          <div>
            <span className="text-xs text-muted-foreground">Giá từ</span>
            <p className="text-price text-lg font-semibold text-foreground">
              {formattedPrice}₫
              <span className="text-xs font-normal text-muted-foreground"> / slot 3h</span>
            </p>
          </div>

          {/* Action CTA */}
          {room.isBlocked ? (
            <Button
              size="sm"
              disabled
              variant="outline"
              className="rounded-full px-5"
            >
              Unavailable
            </Button>
          ) : (
            <Button
              asChild
              size="sm"
              variant="default"
              className="rounded-full px-5 group/btn"
            >
              <Link href={`/booking/${room.id}`}>
                <span>Chọn phòng</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
