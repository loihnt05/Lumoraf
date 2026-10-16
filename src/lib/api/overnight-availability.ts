import type { OvernightStay } from "@/lib/types/overnight";

export function getDaysDifference(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function formatDateToLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getOvernightBookedDates(roomId: string): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, 60));

  // Simulate a few dates booked for overnight stay
  const today = new Date();
  const bookedDates: string[] = [];

  // Book out 5 days from now for room-dl-no5 to demonstrate occupied dates
  if (roomId.includes("no5")) {
    const d = new Date(today);
    d.setDate(today.getDate() + 4);
    bookedDates.push(formatDateToLocal(d));
    const d2 = new Date(today);
    d2.setDate(today.getDate() + 5);
    bookedDates.push(formatDateToLocal(d2));
  }

  return bookedDates;
}

export async function getOvernightQuote(
  roomId: string,
  checkInDate: string,
  checkOutDate: string,
  overnightBasePrice: number = 850000,
): Promise<OvernightStay> {
  await new Promise((resolve) => setTimeout(resolve, 80));

  const numberOfNights = getDaysDifference(checkInDate, checkOutDate);

  // Validation 1: checkOut must be strictly after checkIn
  if (numberOfNights <= 0) {
    return {
      checkInDate,
      checkOutDate,
      checkInTime: "14:00",
      checkOutTime: "11:00",
      numberOfNights: 0,
      pricePerNight: overnightBasePrice,
      subtotal: 0,
      total: 0,
      isValid: false,
      isAvailable: false,
      errorMessage: "Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.",
    };
  }

  // Validation 2: Check booked dates overlap
  const bookedDates = await getOvernightBookedDates(roomId);
  const hasBookedDate = bookedDates.some((bDate) => {
    return bDate >= checkInDate && bDate < checkOutDate;
  });

  if (hasBookedDate) {
    return {
      checkInDate,
      checkOutDate,
      checkInTime: "14:00",
      checkOutTime: "11:00",
      numberOfNights,
      pricePerNight: overnightBasePrice,
      subtotal: 0,
      total: 0,
      isValid: false,
      isAvailable: false,
      errorMessage: "Khoảng ngày bạn chọn có đêm đã kín phòng. Vui lòng chọn khoảng ngày khác.",
    };
  }

  const subtotal = numberOfNights * overnightBasePrice;

  return {
    checkInDate,
    checkOutDate,
    checkInTime: "14:00",
    checkOutTime: "11:00",
    numberOfNights,
    pricePerNight: overnightBasePrice,
    subtotal,
    total: subtotal,
    isValid: true,
    isAvailable: true,
  };
}
