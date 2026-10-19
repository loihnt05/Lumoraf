import { MOCK_PROPERTIES } from "../mock/inventory-data";
import { getPhysicalRoomsSnapshot } from "./inventory";
import {
  getRoomTypeBookingConfigSync,
  isSlotTouchingNightWindow,
  parseSlotRangeMinutes,
} from "./booking-config";
import type { PricingQuote, PricingQuoteRequest, QuoteSurcharge } from "../types/quote";

function formatShortViDate(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export async function fetchPricingQuote(
  req: PricingQuoteRequest,
  signal?: AbortSignal,
): Promise<PricingQuote> {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, 80);
    if (signal) {
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          reject(new DOMException("Aborted", "AbortError"));
        },
        { once: true },
      );
    }
  });

  const rooms = getPhysicalRoomsSnapshot();
  const room = rooms.find((r) => r.id === req.roomId);
  const property = MOCK_PROPERTIES.find(
    (p) => p.id === (room?.propertyId ?? req.propertyId),
  );
  const config = getRoomTypeBookingConfigSync(room?.roomTypeId ?? "default");

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
  const quoteId = `qt_${req.mode.toLowerCase()}_${Date.now().toString(36)}`;

  const roomNumber = room?.roomNumber ?? "No5";
  const roomName = room?.name ?? "No5 Deluxe Room";
  const roomTypeName = room?.roomType?.name ?? "Deluxe Room";
  const propertyId = property?.id ?? req.propertyId;
  const propertyName = property?.name ?? "Lumora Đà Lạt";
  const propertyAddress = property?.address ?? "Đà Lạt, Lâm Đồng";

  if (req.mode === "FIXED") {
    const dateStr = req.date ?? now.toISOString().slice(0, 10);
    const startTime = req.slotStartTime ?? "07:00";
    const endTime = req.slotEndTime ?? "10:00";

    const matchingAdminSlot = config.fixedSlots.find(
      (s) => s.id === req.slotId || (s.startTime === startTime && s.endTime === endTime),
    );
    const { startMins, endMins } = parseSlotRangeMinutes(startTime, endTime);
    const durationMinutes = Math.max(30, endMins - startMins);
    const durationHours = durationMinutes / 60;

    const touchesNight = isSlotTouchingNightWindow(
      startTime,
      endTime,
      config.nightWindowStart,
      config.nightWindowEnd,
    );

    const baseAmount = matchingAdminSlot?.priceOverride ?? config.fixedBasePrice;
    const nightHours = touchesNight ? 1 : 0;
    const nightSurchargeAmount =
      touchesNight &&
      matchingAdminSlot?.priceOverride == null &&
      config.nightSurchargePercent > 0
        ? Math.round(
            (baseAmount * (config.nightSurchargePercent / 100)) / 1000,
          ) * 1000
        : 0;

    const surcharges: QuoteSurcharge[] = [];
    if (nightSurchargeAmount > 0) {
      surcharges.push({
        code: "NIGHT_SURCHARGE",
        label: `Phụ phí khung đêm (${config.nightWindowStart}–${config.nightWindowEnd} · +${config.nightSurchargePercent}%)`,
        amount: nightSurchargeAmount,
        description: `Áp dụng cho khung giờ chạm mốc ${config.nightWindowStart} – ${config.nightWindowEnd}`,
      });
    }

    const subtotal = baseAmount + nightSurchargeAmount;

    return {
      quoteId,
      roomId: req.roomId,
      roomNumber,
      roomName,
      roomTypeName,
      propertyId,
      propertyName,
      propertyAddress,
      mode: "FIXED",
      modeLabel: `Fixed Slot · ${durationHours} giờ`,
      dateRangeLabel: formatShortViDate(dateStr),
      timeRangeLabel: `${startTime} → ${endTime}`,
      durationLabel: `${durationHours} giờ cố định`,
      durationMinutes,
      checkInISO: `${dateStr}T${startTime}:00`,
      checkOutISO: `${dateStr}T${endTime === "00:00" ? "23:59" : endTime}:00`,
      baseLabel: `Giá gói Fixed Slot (${durationHours}h)`,
      baseAmount,
      nightHours,
      nightSurchargeAmount,
      surcharges,
      discounts: [],
      subtotal,
      total: subtotal,
      currency: config.currency,
      cleaningBufferMinutes: config.fixedCleaningBufferMinutes,
      cancellationPolicy: {
        summary:
          "Miễn phí hủy phòng trước 24 giờ so với giờ nhận phòng. Hủy trong vòng 24 giờ áp dụng phí 50% giá trị slot.",
        freeCancelHoursBefore: 24,
        lateCancelFeePercent: 50,
      },
      generatedAt: now.toISOString(),
      expiresAt,
    };
  }

  if (req.mode === "CUSTOM") {
    const dateStr = req.date ?? now.toISOString().slice(0, 10);
    const startTime = req.customStartTime ?? "10:30";
    const endTime = req.customEndTime ?? "15:00";
    const durationMinutes = req.customDurationMinutes ?? config.customMinDurationMinutes;
    const nightHours = req.customNightHours ?? 0;
    const totalHours = durationMinutes / 60;

    const customHourlyRate = config.customHourlyPrice;
    const baseAmount = Math.round((totalHours * customHourlyRate) / 1000) * 1000;
    const nightSurchargeAmount =
      nightHours > 0 && config.nightSurchargePercent > 0
        ? Math.round(
            (nightHours *
              customHourlyRate *
              (config.nightSurchargePercent / 100)) /
              1000,
          ) * 1000
        : 0;

    const surcharges: QuoteSurcharge[] = [];
    if (nightSurchargeAmount > 0) {
      surcharges.push({
        code: "NIGHT_SURCHARGE",
        label: `Phụ phí khung đêm (${nightHours}h trong ${config.nightWindowStart}–${config.nightWindowEnd} · +${config.nightSurchargePercent}%)`,
        amount: nightSurchargeAmount,
        description: `Phụ phí +${config.nightSurchargePercent}% tính trên số giờ nằm trong khoảng ${config.nightWindowStart} – ${config.nightWindowEnd}`,
      });
    }

    const subtotal = baseAmount + nightSurchargeAmount;
    const hoursInt = Math.floor(durationMinutes / 60);
    const minsRem = durationMinutes % 60;
    const durationLabel =
      minsRem > 0 ? `${hoursInt} giờ ${minsRem} phút` : `${hoursInt} giờ`;

    return {
      quoteId,
      roomId: req.roomId,
      roomNumber,
      roomName,
      roomTypeName,
      propertyId,
      propertyName,
      propertyAddress,
      mode: "CUSTOM",
      modeLabel: `Custom Time · ${durationLabel}`,
      dateRangeLabel: formatShortViDate(dateStr),
      timeRangeLabel: `${startTime} → ${endTime}`,
      durationLabel,
      durationMinutes,
      checkInISO: `${dateStr}T${startTime}:00`,
      checkOutISO: `${dateStr}T${endTime}:00`,
      baseLabel: `Giá linh hoạt theo giờ (${new Intl.NumberFormat("vi-VN").format(customHourlyRate)}₫/h × ${totalHours}h)`,
      baseAmount,
      nightHours,
      nightSurchargeAmount,
      surcharges,
      discounts: [],
      subtotal,
      total: subtotal,
      currency: config.currency,
      cleaningBufferMinutes: config.customCleaningBufferMinutes,
      cancellationPolicy: {
        summary:
          "Miễn phí hủy phòng trước 24 giờ nhận phòng. Sau thời điểm này áp dụng phí 50% tổng giá trị khung giờ.",
        freeCancelHoursBefore: 24,
        lateCancelFeePercent: 50,
      },
      generatedAt: now.toISOString(),
      expiresAt,
    };
  }

  // OVERNIGHT mode
  const checkInDate = req.checkInDate ?? now.toISOString().slice(0, 10);
  const checkOutDate = req.checkOutDate ?? now.toISOString().slice(0, 10);
  const numberOfNights = Math.max(1, req.numberOfNights ?? 1);
  const overnightRate = config.overnightPrice;
  const baseAmount = overnightRate * numberOfNights;

  return {
    quoteId,
    roomId: req.roomId,
    roomNumber,
    roomName,
    roomTypeName,
    propertyId,
    propertyName,
    propertyAddress,
    mode: "OVERNIGHT",
    modeLabel: `Overnight · ${numberOfNights} đêm`,
    dateRangeLabel: `${formatShortViDate(checkInDate)} → ${formatShortViDate(checkOutDate)}`,
    timeRangeLabel: `Nhận ${config.overnightCheckInTime} → Trả ${config.overnightCheckOutTime}`,
    durationLabel: `${numberOfNights} đêm lưu trú`,
    durationMinutes: numberOfNights * 21 * 60,
    checkInISO: `${checkInDate}T${config.overnightCheckInTime}:00`,
    checkOutISO: `${checkOutDate}T${config.overnightCheckOutTime}:00`,
    baseLabel: `${new Intl.NumberFormat("vi-VN").format(overnightRate)}₫ × ${numberOfNights} đêm`,
    baseAmount,
    nightHours: 0,
    nightSurchargeAmount: 0,
    surcharges: [],
    discounts: [],
    subtotal: baseAmount,
    total: baseAmount,
    currency: config.currency,
    cleaningBufferMinutes: config.overnightCleaningBufferMinutes,
    cancellationPolicy: {
      summary:
        "Miễn phí hủy phòng trước 48 giờ so với giờ nhận phòng. Hủy muộn hơn áp dụng phí 1 đêm lưu trú đầu tiên.",
      freeCancelHoursBefore: 48,
      lateCancelFeePercent: 100,
    },
    generatedAt: now.toISOString(),
    expiresAt,
  };
}
