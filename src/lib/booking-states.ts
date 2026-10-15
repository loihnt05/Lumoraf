// Presentation vocabulary only. Availability and pricing come from the API.
export type SlotState = "AVAILABLE" | "SELECTED" | "BOOKED" | "UNAVAILABLE";
export const slotLabels: Record<SlotState, string> = {
  AVAILABLE: "Available",
  SELECTED: "Selected",
  BOOKED: "Booked",
  UNAVAILABLE: "Unavailable",
};
