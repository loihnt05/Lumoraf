import type { FixedSlot } from "@/lib/types/slot";

export async function getFixedSlotsAvailability(
  roomId: string,
  dateStr: string,
): Promise<FixedSlot[]> {
  // Simulate network roundtrip latency
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Base schedule from FE Document approved rules
  const baseSlots: Omit<FixedSlot, "state">[] = [
    {
      id: "slot-1",
      slotNumber: 1,
      startTime: "07:00",
      endTime: "10:00",
      durationMinutes: 180,
      cleaningBufferMinutes: 30,
      price: 299000,
      isNightWindow: false,
    },
    {
      id: "slot-2",
      slotNumber: 2,
      startTime: "10:30",
      endTime: "13:30",
      durationMinutes: 180,
      cleaningBufferMinutes: 30,
      price: 299000,
      isNightWindow: false,
    },
    {
      id: "slot-3",
      slotNumber: 3,
      startTime: "14:00",
      endTime: "17:00",
      durationMinutes: 180,
      cleaningBufferMinutes: 30,
      price: 299000,
      isNightWindow: false,
    },
    {
      id: "slot-4",
      slotNumber: 4,
      startTime: "17:30",
      endTime: "20:30",
      durationMinutes: 180,
      cleaningBufferMinutes: 30,
      price: 299000,
      isNightWindow: false,
    },
    {
      id: "slot-5",
      slotNumber: 5,
      startTime: "21:00",
      endTime: "00:00",
      durationMinutes: 180,
      cleaningBufferMinutes: 30,
      // Night window 23:00 - 06:00: Mock surcharge +20%
      price: 359000,
      isNightWindow: true,
      surchargeNote: "Chạm khung đêm 23:00–06:00 (+20%)",
    },
  ];

  // Derive realistic booked slots based on date and roomId to demonstrate occupied state
  const dayNum = parseInt(dateStr.split("-")[2] || "1", 10);

  return baseSlots.map((slot) => {
    let isBooked = false;

    // Simulate booked slots for realistic testing
    if (dayNum % 2 === 0 && slot.slotNumber === 2) {
      isBooked = true;
    } else if (dayNum % 3 === 0 && slot.slotNumber === 3) {
      isBooked = true;
    } else if (roomId.includes("no5") && dayNum % 5 === 0 && slot.slotNumber === 4) {
      isBooked = true;
    }

    return {
      ...slot,
      state: isBooked ? "BOOKED" : "AVAILABLE",
    };
  });
}
