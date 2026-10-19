"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MOCK_PROPERTIES } from "@/lib/mock/inventory-data";
import { getPhysicalRoomsSnapshot } from "@/lib/api/inventory";
import { DEFAULT_BOOKING_CONFIG } from "@/lib/types/booking-config";
import type { BookingMode, RoomTypeBookingConfig } from "@/lib/types/booking-config";
import type { PhysicalRoom } from "@/lib/types/inventory";
import type { FixedSlot } from "@/lib/types/slot";
import type { UnavailableRange, CustomTimeSelection } from "@/lib/types/custom-time";
import type { OvernightStay } from "@/lib/types/overnight";
import type { PricingQuote, PricingQuoteRequest } from "@/lib/types/quote";
import { getRoomTypeBookingConfig } from "@/lib/api/booking-config";
import { getFixedSlotsAvailability } from "@/lib/api/availability";
import { getUnavailableRanges } from "@/lib/api/custom-availability";
import { fetchPricingQuote } from "@/lib/api/quote";
import { createBooking } from "@/lib/api/bookings";
import { BookingModeTabs } from "@/components/booking/booking-mode-tabs";
import { DateSelector } from "@/components/booking/date-selector";
import { FixedSlotPicker } from "@/components/booking/fixed-slot-picker";
import { CustomTimePicker } from "@/components/booking/custom-time-picker";
import { OvernightPicker } from "@/components/booking/overnight-picker";
import {
  BookingSummaryPanel,
  MobileBookingBar,
  type ReserveErrorState,
} from "@/components/booking/booking-summary-panel";
import { StaleAvailabilityWarning } from "@/components/booking/booking-edge-states";
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
} from "lucide-react";

function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getNextDateString(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;
  const { user, isAuthenticated, openSignInModal } = useAuth();

  const [allRooms, setAllRooms] = React.useState<PhysicalRoom[]>(() =>
    getPhysicalRoomsSnapshot(),
  );
  const [isDataStale, setIsDataStale] = React.useState(false);

  React.useEffect(() => {
    const syncRooms = () => {
      setAllRooms(getPhysicalRoomsSnapshot());
      setIsDataStale(true);
    };
    const idleTimer = window.setTimeout(() => {
      setIsDataStale(true);
    }, 180_000);

    window.addEventListener("lumora_inventory_change", syncRooms);
    window.addEventListener("lumora_config_change", syncRooms);
    window.addEventListener("storage", syncRooms);
    return () => {
      window.clearTimeout(idleTimer);
      window.removeEventListener("lumora_inventory_change", syncRooms);
      window.removeEventListener("lumora_config_change", syncRooms);
      window.removeEventListener("storage", syncRooms);
    };
  }, []);

  // Find room and associated property
  const room = React.useMemo(() => {
    return allRooms.find((r) => r.id === roomId) ?? null;
  }, [allRooms, roomId]);

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

  // STAGE UI-7: Authoritative PricingQuote state
  const [authoritativeQuote, setAuthoritativeQuote] = React.useState<PricingQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = React.useState(false);

  // STAGE UI-8: Reserve submission & error state
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [reserveError, setReserveError] = React.useState<ReserveErrorState>(null);
  const submittingLockRef = React.useRef(false);

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
      const [data, ranges] = await Promise.all([
        getFixedSlotsAvailability(roomId, selectedDate),
        getUnavailableRanges(roomId, selectedDate),
      ]);
      setFixedSlots(data);
      setUnavailableRanges(ranges);
    } catch {
      setSlotsError("Không thể tải lịch slot cho ngày này. Vui lòng thử lại.");
    } finally {
      setIsLoadingSlots(false);
    }
  }, [roomId, selectedDate]);

  // STAGE UI-7.1: Build quote request from current valid selection
  const quoteRequest = React.useMemo<PricingQuoteRequest | null>(() => {
    if (!room || !property) return null;

    if (activeMode === "FIXED") {
      if (!selectedSlot) return null;
      return {
        roomId: room.id,
        propertyId: property.id,
        mode: "FIXED",
        date: selectedDate,
        slotId: selectedSlot.id,
        slotStartTime: selectedSlot.startTime,
        slotEndTime: selectedSlot.endTime,
        slotPrice: selectedSlot.price,
        basePrice: room.roomType?.basePrice,
      };
    }

    if (activeMode === "CUSTOM") {
      if (!customSelection || !customSelection.isValidDuration || customSelection.hasConflict) {
        return null;
      }
      return {
        roomId: room.id,
        propertyId: property.id,
        mode: "CUSTOM",
        date: selectedDate,
        customStartTime: customSelection.startTime,
        customEndTime: customSelection.endTime,
        customDurationMinutes: customSelection.durationMinutes,
        customNightHours: customSelection.nightHours,
        basePrice: room.roomType?.basePrice,
      };
    }

    if (activeMode === "OVERNIGHT") {
      if (!overnightStay || !overnightStay.isValid || !overnightStay.isAvailable) {
        return null;
      }
      return {
        roomId: room.id,
        propertyId: property.id,
        mode: "OVERNIGHT",
        checkInDate: overnightStay.checkInDate,
        checkOutDate: overnightStay.checkOutDate,
        numberOfNights: overnightStay.numberOfNights,
        basePrice: room.roomType?.basePrice,
      };
    }

    return null;
  }, [room, property, activeMode, selectedDate, selectedSlot, customSelection, overnightStay]);

  // STAGE UI-7.1: Debounced authoritative quote fetch (250ms for CUSTOM, 50ms for FIXED/OVERNIGHT)
  React.useEffect(() => {
    const controller = new AbortController();
    const delayMs = activeMode === "CUSTOM" ? 250 : 40;

    const timer = setTimeout(async () => {
      if (!quoteRequest) {
        setAuthoritativeQuote(null);
        setIsLoadingQuote(false);
        return;
      }

      setIsLoadingQuote(true);
      try {
        const result = await fetchPricingQuote(quoteRequest, controller.signal);
        if (!controller.signal.aborted) {
          setAuthoritativeQuote(result);
          setIsLoadingQuote(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setIsLoadingQuote(false);
        }
      }
    }, delayMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [quoteRequest, activeMode]);

  // UI-4.1 & UI-5.1: Changing date cancels/resets previous selections
  const handleSelectDate = (newDate: string) => {
    setSelectedDate(newDate);
    setSelectedSlot(null);
    setCustomSelection(null);
    setAuthoritativeQuote(null);
    setReserveError(null);
    setIsLoadingSlots(true);
  };

  const handleSelectSlot = (slot: FixedSlot) => {
    setSelectedSlot(slot);
    setReserveError(null);
  };

  const handleModeChange = (newMode: BookingMode) => {
    setActiveMode(newMode);
    // UI-3.1 & UI-7.2: Reset incompatible transient selections & summary when changing mode
    setSelectedSlot(null);
    setCustomSelection(null);
    setOvernightStay(null);
    setAuthoritativeQuote(null);
    setReserveError(null);
  };

  // STAGE UI-8.1: Reserve Action (Auth guard + anti-double-click + 409/price-change handling)
  const handleReserve = React.useCallback(
    async (options?: { simulateConflict?: boolean; simulatePriceChange?: boolean }) => {
      if (!isAuthenticated || !user) {
        openSignInModal();
        return;
      }

      if (!authoritativeQuote || submittingLockRef.current) {
        return;
      }

      submittingLockRef.current = true;
      setIsSubmitting(true);
      setReserveError(null);

      try {
        const result = await createBooking({
          userId: user.id,
          guestName: user.name,
          guestEmail: user.email,
          quote: authoritativeQuote,
          simulateConflict: options?.simulateConflict,
          simulatePriceChange: options?.simulatePriceChange,
        });

        if (!result.ok) {
          setReserveError({
            code: result.errorCode,
            message: result.message,
          });

          if (result.errorCode === "BOOKING_CONFLICT") {
            setSelectedSlot(null);
            await handleRefreshSlots();
          } else if (result.errorCode === "PRICE_CHANGED" && result.refreshedQuote) {
            setAuthoritativeQuote(result.refreshedQuote);
          }
          return;
        }

        // Navigate to Pending Booking & Mock Payment Screen (UI-8.2 & UI-8.3)
        router.push(`/booking/checkout/${result.booking.id}`);
      } finally {
        submittingLockRef.current = false;
        setIsSubmitting(false);
      }
    },
    [isAuthenticated, user, authoritativeQuote, openSignInModal, handleRefreshSlots, router],
  );

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

  // Price calculations based on authoritative quote or starting price
  let displayPrice = room.roomType
    ? new Intl.NumberFormat("vi-VN").format(room.roomType.basePrice)
    : "299.000";
  let priceUnitLabel = " / slot 3h";

  if (authoritativeQuote) {
    displayPrice = new Intl.NumberFormat("vi-VN").format(authoritativeQuote.total);
    priceUnitLabel = ` (${authoritativeQuote.durationLabel})`;
  } else if (activeMode === "CUSTOM") {
    priceUnitLabel = " / từ 3h (linh hoạt)";
  } else if (activeMode === "OVERNIGHT") {
    const overnightBase = room.roomType ? Math.round((room.roomType.basePrice * 2.8) / 1000) * 1000 : 850000;
    displayPrice = new Intl.NumberFormat("vi-VN").format(overnightBase);
    priceUnitLabel = " / đêm";
  }

  // Reserve button validation status & dynamic label
  const isReserveDisabled = isLoadingConfig || !authoritativeQuote;

  const reserveButtonLabel = !authoritativeQuote
    ? activeMode === "FIXED"
      ? "Vui lòng chọn 1 khung giờ"
      : activeMode === "CUSTOM"
      ? "Vui lòng chọn giờ hợp lệ (min 3h)"
      : "Vui lòng chọn ngày nhận & trả phòng"
    : activeMode === "FIXED" && selectedSlot
    ? `Đặt slot ${selectedSlot.startTime}–${selectedSlot.endTime}`
    : activeMode === "CUSTOM" && customSelection
    ? `Đặt khung giờ ${customSelection.startTime}–${customSelection.endTime}`
    : activeMode === "OVERNIGHT" && overnightStay
    ? `Đặt ${overnightStay.numberOfNights} đêm lưu trú`
    : "Tiếp tục đặt phòng";

  return (
    <div className="space-y-10 pb-24 md:space-y-14 lg:pb-6">
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
          <div className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-7 shadow-xl shadow-black/5 space-y-6">
            {/* 1. Card Header: Price & Transparency Badge */}
            <div className="flex items-baseline justify-between border-b border-border/60 pb-5">
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
                {/* UI-10.2: Stale Availability / Config Warning */}
                {isDataStale && (
                  <StaleAvailabilityWarning
                    isRefreshing={isLoadingSlots}
                    onRefresh={() => {
                      setIsDataStale(false);
                      if (roomTypeId) {
                        void getRoomTypeBookingConfig(roomTypeId).then((cfg) =>
                          setConfig(cfg),
                        );
                      }
                      void handleRefreshSlots();
                    }}
                  />
                )}

                {/* 2. STAGE UI-3: Booking Mode Selector Tabs */}
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

                {/* 3. STAGE UI-4: FIXED SLOT EXPERIENCE (When activeMode === 'FIXED') */}
                {activeMode === "FIXED" && (
                  <div className="space-y-5 pt-1 border-t border-border/60">
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
                      date={selectedDate}
                      onSelectNextDay={() =>
                        handleSelectDate(getNextDateString(selectedDate))
                      }
                      onSwitchToCustom={
                        config?.customEnabled
                          ? () => handleModeChange("CUSTOM")
                          : undefined
                      }
                    />
                  </div>
                )}

                {/* 4. STAGE UI-5: CUSTOM TIME EXPERIENCE (When activeMode === 'CUSTOM') */}
                {activeMode === "CUSTOM" && (
                  <div className="space-y-5 pt-1 border-t border-border/60">
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

                {/* 5. STAGE UI-6: OVERNIGHT EXPERIENCE (When activeMode === 'OVERNIGHT') */}
                {activeMode === "OVERNIGHT" && (
                  <div className="space-y-5 pt-1 border-t border-border/60">
                    <OvernightPicker
                      roomId={roomId}
                      overnightBasePrice={
                        config?.overnightPrice ??
                        (room.roomType ? Math.round(room.roomType.basePrice * 2.8) : 850000)
                      }
                      onQuoteChange={setOvernightStay}
                    />
                  </div>
                )}


                {/* 6. STAGE UI-7 & UI-8: Authoritative Quote Summary & Reserve Action */}
                <BookingSummaryPanel
                  roomName={room.name}
                  propertyName={property.name}
                  quote={authoritativeQuote}
                  isLoadingQuote={isLoadingQuote}
                  isAuthenticated={isAuthenticated}
                  isSubmitting={isSubmitting}
                  isReserveDisabled={isReserveDisabled}
                  reserveButtonLabel={reserveButtonLabel}
                  reserveError={reserveError}
                  onReserve={handleReserve}
                />
              </>
            )}
          </div>
        </aside>
      </div>

      {/* 7. Mobile Sticky Bottom Bar + Review Sheet (UI-7.2) */}
      {!room.isBlocked && (
        <MobileBookingBar
          roomName={room.name}
          propertyName={property.name}
          quote={authoritativeQuote}
          isLoadingQuote={isLoadingQuote}
          isAuthenticated={isAuthenticated}
          isSubmitting={isSubmitting}
          isReserveDisabled={isReserveDisabled}
          reserveButtonLabel={reserveButtonLabel}
          reserveError={reserveError}
          onReserve={handleReserve}
        />
      )}
    </div>
  );
}

