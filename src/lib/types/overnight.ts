export type OvernightStay = {
  checkInDate: string; // "YYYY-MM-DD"
  checkOutDate: string; // "YYYY-MM-DD"
  checkInTime: string; // "14:00"
  checkOutTime: string; // "11:00"
  numberOfNights: number; // e.g. 1, 2, 3...
  pricePerNight: number; // e.g. 850000 VND
  subtotal: number;
  total: number;
  isValid: boolean;
  isAvailable: boolean;
  errorMessage?: string;
};
