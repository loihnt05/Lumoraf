"use client";

import * as React from "react";
import Image from "next/image";
import type { PhysicalRoom } from "@/lib/types/inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import {
  X,
  Users,
  Bed,
  Maximize2,
  Sparkles,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RoomBookingPanelProps = {
  room: PhysicalRoom | null;
  onClose: () => void;
};

export function RoomBookingPanel({ room, onClose }: RoomBookingPanelProps) {
  const { isAuthenticated, openSignInModal } = useAuth();
  const [selectedMode, setSelectedMode] = React.useState<"FIXED" | "CUSTOM" | "OVERNIGHT">("FIXED");

  if (!room) return null;

  const formattedPrice = room.roomType
    ? new Intl.NumberFormat("vi-VN").format(room.roomType.basePrice)
    : "299.000";

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-surface shadow-2xl backdrop-blur-md transition-transform duration-300 ease-in-out animate-in slide-in-from-right sm:max-w-xl">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-border/80 p-5 md:px-7">
        <div>
          <span className="text-caption uppercase tracking-[0.2em] text-primary">
            Booking Workspace
          </span>
          <h2 className="text-heading text-xl font-medium tracking-tight text-foreground">
            {room.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng bảng đặt phòng"
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 md:p-7 space-y-6">
        {/* Room Photography Context */}
        <div className="relative aspect-16/9 w-full overflow-hidden rounded-xl border border-border/60 bg-muted">
          <Image
            src={room.images[0] || "/placeholder.jpg"}
            alt={room.name}
            fill
            sizes="500px"
            className="object-cover"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="bg-surface/90 text-foreground font-semibold">
              {room.roomNumber}
            </Badge>
            <Badge className="bg-surface/80 text-muted-foreground">
              Tầng {room.floor}
            </Badge>
          </div>
        </div>

        {/* Room Key Specs */}
        <div className="flex items-center justify-between rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" />
            <span>Tối đa {room.roomType?.maxGuests ?? 2} khách</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bed className="h-4 w-4 text-primary" />
            <span>{room.roomType?.bedType ?? "King bed"}</span>
          </div>
          {room.roomType?.sizeM2 && (
            <div className="flex items-center gap-1.5">
              <Maximize2 className="h-4 w-4 text-primary" />
              <span>{room.roomType.sizeM2} m²</span>
            </div>
          )}
        </div>

        {/* Room Description */}
        {room.roomType?.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {room.roomType.description}
          </p>
        )}

        {/* Booking Modes Selection Preview (Preparation for Stage UI-3) */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            1. Chọn kiểu lưu trú (Stay mode)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "FIXED", label: "Fixed 3h", desc: "Tiết kiệm nhất" },
              { id: "CUSTOM", label: "Custom time", desc: "Bước 30m, min 3h" },
              { id: "OVERNIGHT", label: "Overnight", desc: "Nghỉ qua đêm" },
            ].map((mode) => {
              const isSelected = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedMode(mode.id as typeof selectedMode)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                      : "border-border/80 bg-surface hover:bg-muted/50 text-foreground",
                  )}
                >
                  <span className="text-xs font-semibold">{mode.label}</span>
                  <span className="mt-1 text-[10px] text-muted-foreground">{mode.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stage Notice */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-primary leading-relaxed">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>Chế độ tương tác đặt phòng</span>
          </div>
          <p className="mt-1.5 text-muted-foreground">
            Bạn đang chọn <strong>{room.name}</strong> theo chế độ <strong>{selectedMode}</strong>. Lịch chọn slot cố định 3h, timeline thời gian linh hoạt và báo giá từ backend sẽ được kết nối ở Stage UI-3 & UI-4.
          </p>
        </div>

        {/* Amenities Full List */}
        {room.roomType?.amenities && room.roomType.amenities.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tiện nghi phòng
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              {room.roomType.amenities.map((amenity) => (
                <div
                  key={amenity.id}
                  className="flex items-center gap-2 rounded-lg bg-surface border border-border/60 p-2.5 text-xs text-foreground"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  <span>{amenity.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Panel Bottom Footer with Reserve Action */}
      <div className="border-t border-border/80 bg-surface/90 p-5 md:px-7 backdrop-blur-xs flex items-center justify-between gap-4">
        <div>
          <span className="text-xs text-muted-foreground">Giá ước tính</span>
          <p className="text-price text-xl font-bold text-foreground">
            {formattedPrice}₫
            <span className="text-xs font-normal text-muted-foreground">
              {selectedMode === "OVERNIGHT" ? " / đêm" : " / 3h"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="lg"
            onClick={() => {
              if (!isAuthenticated) {
                openSignInModal();
              } else {
                alert(`Đang chuẩn bị đặt ${room.name} (${selectedMode}). Sẵn sàng cho Stage UI-3/UI-4!`);
              }
            }}
            className="rounded-full px-8 font-medium shadow-md"
          >
            {!isAuthenticated ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Sign in to Reserve
              </>
            ) : (
              "Tiếp tục chọn giờ"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
