import { getPhysicalRoomsSnapshot } from "./inventory";
import {
  getRoomTypeBookingConfigSync,
  isSlotTouchingNightWindow,
  parseSlotRangeMinutes,
} from "./booking-config";
import { getUserBookings } from "./bookings";
import type { FixedSlot } from "../types/slot";

export async function getFixedSlotsAvailability(
  roomId: string,
  dateStr: string,
): Promise<FixedSlot[]> {
  await new Promise((resolve) => setTimeout(resolve, 80));

  const rooms = getPhysicalRoomsSnapshot();
  const room = rooms.find((r) => r.id === roomId);
  const config = getRoomTypeBookingConfigSync(room?.roomTypeId ?? "default");

  const activeAdminSlots = config.fixedSlots.filter((s) => s.isActive);

  // Check active bookings in local store for this room & date
  const allBookings = await getUserBookings();
  const activeRoomBookings = allBookings.filter(
    (b) =>
      b.roomId === roomId &&
      (b.status === "PENDING_PAYMENT" || b.status === "CONFIRMED"),
  );

  const dayNum = parseInt(dateStr.split("-")[2] || "1", 10);

  return activeAdminSlots.map((slotCfg) => {
    const { startMins, endMins } = parseSlotRangeMinutes(
      slotCfg.startTime,
      slotCfg.endTime,
    );
    const durationMinutes = Math.max(30, endMins - startMins);
    const touchesNight = isSlotTouchingNightWindow(
      slotCfg.startTime,
      slotCfg.endTime,
      config.nightWindowStart,
      config.nightWindowEnd,
    );

    const baseSlotPrice = slotCfg.priceOverride ?? config.fixedBasePrice;
    const surchargeMultiplier =
      touchesNight && slotCfg.priceOverride === null
        ? 1 + config.nightSurchargePercent / 100
        : 1;
    const finalSlotPrice =
      Math.round((baseSlotPrice * surchargeMultiplier) / 1000) * 1000;

    let isBooked = false;
    if (dayNum % 2 === 0 && slotCfg.slotNumber === 2) {
      isBooked = true;
    } else if (dayNum % 3 === 0 && slotCfg.slotNumber === 3) {
      isBooked = true;
    } else if (roomId.includes("no5") && dayNum % 5 === 0 && slotCfg.slotNumber === 4) {
      isBooked = true;
    }

    const slotStartMs = new Date(`${dateStr}T${slotCfg.startTime}:00`).getTime();
    const slotEndMs = new Date(
      `${dateStr}T${slotCfg.endTime === "00:00" ? "23:59" : slotCfg.endTime}:00`,
    ).getTime();

    const heldByUser = activeRoomBookings.some((b) => {
      const bStart = new Date(b.quoteSnapshot.checkInISO).getTime();
      const bEnd = new Date(b.quoteSnapshot.checkOutISO).getTime();
      return slotStartMs < bEnd && slotEndMs > bStart;
    });

    return {
      id: slotCfg.id,
      slotNumber: slotCfg.slotNumber,
      startTime: slotCfg.startTime,
      endTime: slotCfg.endTime,
      durationMinutes,
      cleaningBufferMinutes: config.fixedCleaningBufferMinutes,
      price: finalSlotPrice,
      isNightWindow: touchesNight && config.nightSurchargePercent > 0,
      surchargeNote:
        touchesNight && config.nightSurchargePercent > 0
          ? `Chạm khung đêm ${config.nightWindowStart}–${config.nightWindowEnd} (+${config.nightSurchargePercent}%)`
          : slotCfg.label,
      state: isBooked || heldByUser ? "BOOKED" : "AVAILABLE",
    };
  });
}
