"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MOCK_PHYSICAL_ROOMS, MOCK_PROPERTIES } from "@/lib/mock/inventory-data";
import { DEFAULT_BOOKING_CONFIG } from "@/lib/types/booking-config";
import type { BookingMode, RoomTypeBookingConfig } from "@/lib/types/booking-config";
import type { FixedSlot } from "@/lib/types/slot";
import type { UnavailableRange, CustomTimeSelection } from "@/lib/types/custom-time";
import type { OvernightStay } from "@/lib/types/overnight";
import { getRoomTypeBookingConfig } from "@/lib/api/booking-config";
import { getFixedSlotsAvailability } from "@/lib/api/availability";
import { getUnavailableRanges } from "@/lib/api/custom-availability";
import { BookingModeTabs } from "@/components/booking/booking-mode-tabs";
import { DateSelector } from "@/components/booking/date-selector";
import { FixedSlotPicker } from "@/components/booking/fixed-slot-picker";
import { CustomTimePicker } from "@/components/booking/custom-time-picker";
import { OvernightPicker } from "@/components/booking/overnight-picker";
import { PropertyGallery } from "@/components/property/property-gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import {
  ArrowLeft,
  Users,
  Bed,
  Maximize2,
  MapPin,
  CheckCircle2,
  Clock,
  KeyRound,
  ShieldCheck,
  Ban,
  Lock,
  ArrowRight,
} from "lucide-react";

function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;
  const { isAuthenticated, openSignInModal } = useAuth();

  // Find room and associated property
  const room = React.useMemo(() => {
    return MOCK_PHYSICAL_ROOMS.find((r) => r.id === roomId) ?? null;
  }, [roomId]);

  const property = React.useMemo(() => {
    if (!room) return null;
    return MOCK_PROPERTIES.find((p) => p.id === room.propertyId) ?? null;
  }, [room]);

  // Booking mode state
  const [activeMode, setActiveMode] = React.useState<BookingMode>("FIXED");
  const [config, setConfig] = React.useState<RoomTypeBookingConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = React.useState(true);

  // Common selected date for both Fixed & Custom
  const [selectedDate, setSelectedDate] = React.useState<string>(getTodayString);

  // STAGE UI-4: Fixed slot selection & availability state
  const [selectedSlot, setSelectedSlot] = React.useState<FixedSlot | null>(null);
  const [fixedSlots, setFixedSlots] = React.useState<FixedSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = React.useState(true);
  const [slotsError, setSlotsError] = React.useState<string | null>(null);

  // STAGE UI-5: Custom time selection & unavailable ranges state
  const [unavailableRanges, setUnavailableRanges] = React.useState<UnavailableRange[]>([]);
  const [customSelection, setCustomSelection] = React.useState<CustomTimeSelection | null>(null);

  // STAGE UI-6: Overnight stay state
  const [overnightStay, setOvernightStay] = React.useState<OvernightStay | null>(null);

  const roomTypeId = room?.roomTypeId;

  // Load RoomType booking configuration contract
  React.useEffect(() => {
    if (!roomTypeId) return;

    let isSubscribed = true;

    async function loadConfig() {
      try {
        const cfg = await getRoomTypeBookingConfig(roomTypeId!);
        if (isSubscribed) {
          setConfig(cfg);
          setIsLoadingConfig(false);
        }
      } catch {
        if (isSubscribed) {
          setConfig({ ...DEFAULT_BOOKING_CONFIG, roomTypeId: roomTypeId! });
          setIsLoadingConfig(false);
        }
      }
    }

    void loadConfig();

    return () => {
      isSubscribed = false;
    };
  }, [roomTypeId]);

  // Fetch Fixed Slots availability when date or room changes (UI-4.1 & UI-4.3)
  React.useEffect(() => {
    if (!roomId) return;

    let isSubscribed = true;

    async function loadSlots() {
      try {
        const data = await getFixedSlotsAvailability(roomId, selectedDate);
        if (isSubscribed) {
          setFixedSlots(data);
          setIsLoadingSlots(false);
        }
      } catch {
        if (isSubscribed) {
          setSlotsError("Không thể tải lịch slot cho ngày này. Vui lòng thử lại.");
          setIsLoadingSlots(false);
        }
      }
    }

    void loadSlots();

    return () => {
      isSubscribed = false;
    };
  }, [roomId, selectedDate]);

  // Fetch Unavailable Ranges for Custom Time (UI-5.2 & UI-5.3)
  React.useEffect(() => {
    if (!roomId) return;

    let isSubscribed = true;

    async function loadUnavailable() {
      try {
        const ranges = await getUnavailableRanges(roomId, selectedDate);
        if (isSubscribed) {
          setUnavailableRanges(ranges);
        }
      } catch {
        // Fallback gracefully
      }
    }

    void loadUnavailable();

    return () => {
      isSubscribed = false;
    };
  }, [roomId, selectedDate]);

  const handleRefreshSlots = React.useCallback(async () => {
    if (!roomId) return;
    setIsLoadingSlots(true);
    setSlotsError(null);
    try {
      const data = await getFixedSlotsAvailability(roomId, selectedDate);
      setFixedSlots(data);
    } catch {
      setSlotsError("Không thể tải lịch slot cho ngày này. Vui lòng thử lại.");
    } finally {
      setIsLoadingSlots(false);
    }
  }, [roomId, selectedDate]);

  // UI-4.1 & UI-5.1: Changing date cancels/resets previous selections
  const handleSelectDate = (newDate: string) => {
    setSelectedDate(newDate);
    setSelectedSlot(null);
    setCustomSelection(null);
    setIsLoadingSlots(true);
  };

  const handleSelectSlot = (slot: FixedSlot) => {
    setSelectedSlot(slot);
  };

  const handleModeChange = (newMode: BookingMode) => {
    setActiveMode(newMode);
    // UI-3.1: Reset incompatible transient selections when changing mode
    setSelectedSlot(null);
    setCustomSelection(null);
    setOvernightStay(null);
  };

  // Handle missing room (404 state)
  if (!room || !property) {
    return (
      <div className="space-y-6 py-16 text-center">
        <p className="text-caption uppercase tracking-widest text-primary">404 · Không tìm thấy phòng</p>
        <h1 className="text-heading text-3xl font-medium">Không tìm thấy không gian bạn yêu cầu</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Phòng này có thể chưa được kích hoạt hoặc đường dẫn không chính xác.
        </p>
        <Button asChild className="rounded-full">
          <Link href="/booking">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span>Quay lại danh sách phòng</span>
          </Link>
        </Button>
      </div>
    );
  }

  // Price calculations based on mode
  let displayPrice = room.roomType
    ? new Intl.NumberFormat("vi-VN").format(room.roomType.basePrice)
    : "299.000";
  let priceUnitLabel = " / slot 3h";

  if (activeMode === "FIXED") {
    if (selectedSlot) {
      displayPrice = new Intl.NumberFormat("vi-VN").format(selectedSlot.price);
      priceUnitLabel = ` (Slot ${selectedSlot.startTime}–${selectedSlot.endTime})`;
    } else {
      priceUnitLabel = " / slot 3h";
    }
  } else if (activeMode === "CUSTOM") {
    if (customSelection) {
      displayPrice = new Intl.NumberFormat("vi-VN").format(customSelection.estimatedPrice);
      priceUnitLabel = ` (${customSelection.startTime} – ${customSelection.endTime})`;
    } else {
      priceUnitLabel = " / 3h (tính theo giờ)";
    }
  } else if (activeMode === "OVERNIGHT") {
    if (overnightStay && overnightStay.isValid) {
      displayPrice = new Intl.NumberFormat("vi-VN").format(overnightStay.total);
      priceUnitLabel = ` (${overnightStay.numberOfNights} đêm)`;
    } else {
      const overnightBase = room.roomType ? Math.round(room.roomType.basePrice * 2.8) : 850000;
      displayPrice = new Intl.NumberFormat("vi-VN").format(overnightBase);
      priceUnitLabel = " / đêm";
    }
  }

  // Reserve button validation status
  const isReserveDisabled =
    isLoadingConfig ||
    (activeMode === "FIXED" && !selectedSlot) ||
    (activeMode === "CUSTOM" && !customSelection) ||
    (activeMode === "OVERNIGHT" && (!overnightStay || !overnightStay.isValid || !overnightStay.isAvailable));

  return (
    <div className="space-y-10 md:space-y-14">
      {/* 1. Navigation Breadcrumb & Back Link */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
        <Link
          href="/booking"
          className="group inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Tất cả phòng tại {property.name}</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{property.city}</span>
          <span>/</span>
          <span className="text-foreground font-medium">{room.name}</span>
        </div>
      </div>

      {/* 2. Room Title Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="bg-primary/10 text-primary border-none text-xs font-semibold px-3 py-1">
            {room.roomNumber}
          </Badge>
          <Badge className="bg-muted text-foreground text-xs font-medium px-3 py-1">
            {room.roomType?.name ?? "Standard"}
          </Badge>
          <span className="text-xs text-muted-foreground">Tầng {room.floor}</span>

          {room.isBlocked && (
            <Badge className="bg-red-600 text-white border-none text-xs font-medium flex items-center gap-1.5 px-3 py-1">
              <Ban className="h-3.5 w-3.5" />
              <span>Phòng tạm khóa / Đang bảo trì</span>
            </Badge>
          )}
        </div>

        <h1 className="text-display text-3xl md:text-5xl font-normal tracking-tight text-foreground">
          {room.name}
        </h1>

        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span>{property.address}</span>
        </p>
      </div>

      {/* 3. Sonder-style Editorial Photography Gallery */}
      <section aria-label="Thư viện ảnh phòng">
        <PropertyGallery propertyName={room.name} images={room.images} />
      </section>

      {/* 4. Two-Column Layout (Desktop) */}
      <div className="grid gap-10 lg:grid-cols-[1.45fr_1fr] lg:gap-14 items-start min-w-0">
        {/* Left Column: Room Presentation */}
        <div className="space-y-10 min-w-0">
          {/* Room Specs Highlights */}
          <div className="grid grid-cols-3 gap-4 rounded-2xl bg-surface border border-border/70 p-5 md:p-6 shadow-xs text-center">
            <div className="space-y-1">
              <div className="flex justify-center text-primary">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">Sức chứa</p>
              <p className="text-xs text-muted-foreground">Tối đa {room.roomType?.maxGuests ?? 2} khách</p>
            </div>
            <div className="space-y-1 border-x border-border/60">
              <div className="flex justify-center text-primary">
                <Bed className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">Loại giường</p>
              <p className="text-xs text-muted-foreground">{room.roomType?.bedType ?? "King bed"}</p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-center text-primary">
                <Maximize2 className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">Diện tích</p>
              <p className="text-xs text-muted-foreground">{room.roomType?.sizeM2 ?? 32} m²</p>
            </div>
          </div>

          {/* Room Description */}
          <div className="space-y-4">
            <h2 className="text-heading text-2xl font-medium tracking-tight text-foreground">
              Về không gian này
            </h2>
            <p className="text-body text-sm leading-relaxed text-muted-foreground">
              {room.roomType?.description}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Được bài trí theo phong cách tối giản boutique, không gian đón trọn ánh sáng tự nhiên qua ô cửa kính lớn, sử dụng sàn gỗ cao cấp và nội thất thiết kế riêng mang đến cảm giác thư thái và riêng tư trọn vẹn.
            </p>
          </div>

          {/* Full Amenities Grid */}
          {room.roomType?.amenities && room.roomType.amenities.length > 0 && (
            <div className="space-y-5 border-t border-border/60 pt-8">
              <h2 className="text-heading text-2xl font-medium tracking-tight text-foreground">
                Tiện nghi phòng
              </h2>
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2">
                {room.roomType.amenities.map((amenity) => (
                  <div
                    key={amenity.id}
                    className="flex items-center gap-3 rounded-xl bg-surface border border-border/70 p-4 text-xs font-medium text-foreground transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>{amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stay Policies & Digital Room Code Information */}
          <div className="space-y-5 border-t border-border/60 pt-8">
            <h2 className="text-heading text-2xl font-medium tracking-tight text-foreground">
              Quy tắc lưu trú & Hướng dẫn nhận phòng
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-surface p-5 space-y-2">
                <div className="flex items-center gap-2 text-primary font-medium text-sm">
                  <KeyRound className="h-4 w-4" />
                  <span>Mã số phòng tự động</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Mỗi phòng được trang bị khóa số thông minh. Mã số truy cập phòng an toàn sẽ được cấp trực tiếp sau khi đặt phòng thành công.
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-surface p-5 space-y-2">
                <div className="flex items-center gap-2 text-primary font-medium text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Quy chuẩn vệ sinh & dọn phòng</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Giữa các lượt khách luôn có khoảng thời gian dọn phòng (cleaning buffer) để đảm bảo không gian sạch sẽ, thơm mát và an toàn.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Sonder-style Booking Workspace Card */}
        <aside className="lg:sticky lg:top-24 min-w-0 w-full">
          <div className="rounded-3xl border border-border/80 bg-surface shadow-xl shadow-black/5 flex flex-col max-h-[calc(100vh-7rem)] overflow-hidden">
            {/* 1. Fixed Card Header: Price & Transparency Badge */}
            <div className="p-5 sm:p-6 pb-4 border-b border-border/60 shrink-0 bg-surface">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">
                    {selectedSlot || customSelection || overnightStay ? "Tổng tiền ước tính" : "Bắt đầu từ"}
                  </span>
                  <p className="text-price text-2xl font-bold text-foreground">
                    {displayPrice}₫
                    <span className="text-xs font-normal text-muted-foreground">
                      {priceUnitLabel}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Giá minh bạch</span>
                </div>
              </div>
            </div>

            {/* 2. Scrollable Middle Body: Selections & Config */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 py-4 space-y-5">
              {/* Blocked Room Warning */}
              {room.isBlocked ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 space-y-2 text-center text-red-700">
                  <Ban className="h-6 w-6 mx-auto text-red-600" />
                  <p className="text-sm font-semibold">Phòng đang tạm khóa</p>
                  <p className="text-xs leading-relaxed text-red-600">
                    Phòng này đang trong lịch bảo dưỡng định kỳ và tạm thời không thể tiếp nhận lượt đặt mới. Vui lòng chọn một phòng khác.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/booking")}
                    className="mt-3 rounded-full border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Chọn phòng khác
                  </Button>
                </div>
              ) : (
                <>
                  {/* STAGE UI-3: Booking Mode Selector Tabs */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Hình thức lưu trú
                      </label>
                      <span className="text-[11px] text-muted-foreground">Tùy chọn</span>
                    </div>

                    {isLoadingConfig ? (
                      <div className="space-y-2">
                        <Skeleton className="h-12 w-full rounded-full" />
                        <Skeleton className="h-14 w-full rounded-xl" />
                      </div>
                    ) : config ? (
                      <BookingModeTabs
                        roomId={room.id}
                        config={config}
                        activeMode={activeMode}
                        onChangeMode={handleModeChange}
                      />
                    ) : (
                      <div className="rounded-xl border border-border p-3 text-xs text-muted-foreground">
                        Không tải được cấu hình.
                      </div>
                    )}
                  </div>

                  {/* STAGE UI-4: FIXED SLOT EXPERIENCE (When activeMode === 'FIXED') */}
                  {activeMode === "FIXED" && (
                    <div className="space-y-4 pt-1 border-t border-border/60">
                      <DateSelector
                        selectedDate={selectedDate}
                        onSelectDate={handleSelectDate}
                      />

                      <FixedSlotPicker
                        slots={fixedSlots}
                        selectedSlotId={selectedSlot?.id ?? null}
                        onSelectSlot={handleSelectSlot}
                        isLoading={isLoadingSlots}
                        onRefresh={handleRefreshSlots}
                        errorMessage={slotsError}
                      />
                    </div>
                  )}

                  {/* STAGE UI-5: CUSTOM TIME EXPERIENCE (When activeMode === 'CUSTOM') */}
                  {activeMode === "CUSTOM" && (
                    <div className="space-y-4 pt-1 border-t border-border/60">
                      <DateSelector
                        selectedDate={selectedDate}
                        onSelectDate={handleSelectDate}
                      />

                      <CustomTimePicker
                        date={selectedDate}
                        unavailableRanges={unavailableRanges}
                        basePrice={room.roomType?.basePrice}
                        onSelectionChange={setCustomSelection}
                      />
                    </div>
                  )}

                  {/* STAGE UI-6: OVERNIGHT EXPERIENCE (When activeMode === 'OVERNIGHT') */}
                  {activeMode === "OVERNIGHT" && (
                    <div className="space-y-4 pt-1 border-t border-border/60">
                      <OvernightPicker
                        roomId={roomId}
                        overnightBasePrice={room.roomType ? Math.round(room.roomType.basePrice * 2.8) : 850000}
                        onQuoteChange={setOvernightStay}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 3. Fixed Bottom Action Area (Always visible on screen!) */}
            {!room.isBlocked && (
              <div className="p-5 sm:p-6 pt-3 border-t border-border/60 shrink-0 bg-surface space-y-2">
                <Button
                  size="lg"
                  disabled={isReserveDisabled}
                  onClick={() => {
                    if (!isAuthenticated) {
                      openSignInModal();
                    } else if (activeMode === "FIXED" && selectedSlot) {
                      alert(
                        `Đặt phòng thành công (Mô phỏng Fixed Slot)!\nPhòng: ${room.name}\nNgày: ${selectedDate}\nKhung giờ: ${selectedSlot.startTime} - ${selectedSlot.endTime}\nGiá: ${displayPrice}₫`,
                      );
                    } else if (activeMode === "CUSTOM" && customSelection) {
                      alert(
                        `Đặt phòng thành công (Mô phỏng Custom Time)!\nPhòng: ${room.name}\nNgày bắt đầu: ${customSelection.startDate}\nGiờ nhận: ${customSelection.startTime}\nGiờ trả: ${customSelection.endTime} (${customSelection.endDate})\nThời lượng: ${customSelection.durationMinutes / 60}h\nGiá: ${displayPrice}₫`,
                      );
                    } else if (activeMode === "OVERNIGHT" && overnightStay) {
                      alert(
                        `Đặt phòng thành công (Mô phỏng Overnight)!\nPhòng: ${room.name}\nNhận phòng: ${overnightStay.checkInDate} (từ 14:00)\nTrả phòng: ${overnightStay.checkOutDate} (trước 11:00)\nSố đêm: ${overnightStay.numberOfNights} đêm\nTổng giá: ${displayPrice}₫`,
                      );
                    }
                  }}
                  className="w-full justify-center rounded-full text-base font-medium shadow-md"
                >
                  {!isAuthenticated ? (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      <span>Sign in to Reserve</span>
                    </>
                  ) : activeMode === "FIXED" && !selectedSlot ? (
                    "Vui lòng chọn 1 khung giờ"
                  ) : activeMode === "CUSTOM" && !customSelection ? (
                    "Vui lòng chọn giờ hợp lệ (min 3h)"
                  ) : activeMode === "OVERNIGHT" && !overnightStay ? (
                    "Vui lòng chọn ngày nhận & trả phòng"
                  ) : (
                    <>
                      <span>
                        {activeMode === "FIXED" && selectedSlot
                          ? `Đặt slot ${selectedSlot.startTime}–${selectedSlot.endTime}`
                          : activeMode === "CUSTOM" && customSelection
                          ? `Đặt ${customSelection.startTime}–${customSelection.endTime}`
                          : activeMode === "OVERNIGHT" && overnightStay
                          ? `Đặt ${overnightStay.numberOfNights} đêm (${overnightStay.checkInDate} → ${overnightStay.checkOutDate})`
                          : "Tiếp tục đặt phòng"}
                      </span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-[11px] text-muted-foreground">
                  Chưa trừ tiền ngay. Giữ phòng trong 15 phút để hoàn tất thanh toán.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
