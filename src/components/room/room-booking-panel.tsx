"use client";

import * as React from "react";
import Image from "next/image";
import type { PhysicalRoom } from "@/lib/types/inventory";
import type { BookingMode, RoomTypeBookingConfig } from "@/lib/types/booking-config";
import { DEFAULT_BOOKING_CONFIG } from "@/lib/types/booking-config";
import { getRoomTypeBookingConfig } from "@/lib/api/booking-config";
import { BookingModeTabs } from "@/components/booking/booking-mode-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import {
  X,
  Users,
  Bed,
  Maximize2,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
} from "lucide-react";

type RoomBookingPanelProps = {
  room: PhysicalRoom | null;
  onClose: () => void;
};

export function RoomBookingPanel({ room, onClose }: RoomBookingPanelProps) {
  const { isAuthenticated, openSignInModal } = useAuth();
  const [activeMode, setActiveMode] = React.useState<BookingMode>("FIXED");
  const [config, setConfig] = React.useState<RoomTypeBookingConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = React.useState(true);

  // Load backend booking configuration for the room's roomType
  React.useEffect(() => {
    let isSubscribed = true;

    async function loadConfig() {
      try {
        if (!room?.roomTypeId) {
          if (isSubscribed) {
            setConfig(null);
            setIsLoadingConfig(false);
          }
          return;
        }

        const cfg = await getRoomTypeBookingConfig(room.roomTypeId);
        if (isSubscribed) {
          setConfig(cfg);
          setIsLoadingConfig(false);
        }
      } catch {
        if (isSubscribed) {
          // Fallback safe state: use defaults
          setConfig(DEFAULT_BOOKING_CONFIG);
          setIsLoadingConfig(false);
        }
      }
    }

    void loadConfig();

    return () => {
      isSubscribed = false;
    };
  }, [room?.roomTypeId]);

  const handleModeChange = (newMode: BookingMode) => {
    setActiveMode(newMode);
    // UI-3.1: Reset incompatible transient selections when changing mode
    // (e.g. fixed slot index, custom time start/end, overnight dates)
  };

  if (!room) return null;

  const basePriceFormatted = room.roomType
    ? new Intl.NumberFormat("vi-VN").format(room.roomType.basePrice)
    : "299.000";

  // Price estimate label based on mode
  const priceUnitLabel =
    activeMode === "OVERNIGHT"
      ? " / đêm (giá theo đêm)"
      : activeMode === "CUSTOM"
      ? " / 3h (tính theo giờ)"
      : " / slot 3h (giá ưu đãi)";

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-surface shadow-2xl backdrop-blur-md transition-transform duration-300 ease-in-out animate-in slide-in-from-right sm:max-w-xl">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-border/80 p-5 md:px-7">
        <div>
          <span className="text-caption uppercase tracking-[0.2em] text-primary">
            Đặt phòng trực tuyến
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
        <div className="relative aspect-16/9 w-full overflow-hidden rounded-2xl border border-border/60 bg-muted">
          <Image
            src={room.images[0] || "/placeholder.jpg"}
            alt={room.name}
            fill
            sizes="500px"
            className="object-cover"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="bg-surface/90 text-foreground font-semibold shadow-xs">
              {room.roomNumber}
            </Badge>
            <Badge className="bg-surface/80 text-muted-foreground">
              Tầng {room.floor}
            </Badge>
          </div>
        </div>

        {/* Room Specifications Context */}
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

        {/* STAGE UI-3: Booking Mode Selector with Dynamic Config Contract */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Hình thức lưu trú
            </label>
            <span className="text-[11px] text-muted-foreground">
              Cấu hình theo loại phòng
            </span>
          </div>

          {isLoadingConfig ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-full" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : config ? (
            <BookingModeTabs
              roomId={room.id}
              config={config}
              activeMode={activeMode}
              onChangeMode={handleModeChange}
            />
          ) : (
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
              Không tải được cấu hình đặt phòng.
            </div>
          )}
        </div>

        {/* Stage Roadmap Linkage Note */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs leading-relaxed text-primary">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>Sẵn sàng cho Time Selection (Stage UI-4 to UI-6)</span>
          </div>
          <p className="mt-1.5 text-muted-foreground">
            Chế độ <strong>{activeMode}</strong> đã được xác định. Bước tiếp theo sẽ kết nối bộ chọn slot cố định (Fixed Slot Picker), timeline thời gian linh hoạt (Custom Time timeline) và lịch qua đêm (Overnight calendar).
          </p>
        </div>

        {/* Room Amenities Highlights */}
        {room.roomType?.amenities && room.roomType.amenities.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tiện nghi & Dịch vụ đi kèm
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
          <span className="text-xs text-muted-foreground">Giá tham khảo</span>
          <p className="text-price text-xl font-bold text-foreground">
            {basePriceFormatted}₫
            <span className="text-xs font-normal text-muted-foreground">
              {priceUnitLabel}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="lg"
            disabled={isLoadingConfig}
            onClick={() => {
              if (!isAuthenticated) {
                openSignInModal();
              } else {
                alert(
                  `Bạn đã chọn ${room.name} theo hình thức ${activeMode}.\nSẵn sàng bước vào Stage UI-4 (Fixed Slot Picker) & Stage UI-5 (Custom Time)!`,
                );
              }
            }}
            className="rounded-full px-7 font-medium shadow-md"
          >
            {!isAuthenticated ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Sign in to Reserve
              </>
            ) : (
              <>
                <span>Chọn thời gian</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
