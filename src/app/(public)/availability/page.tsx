import type { Metadata } from "next";
import { RoomAvailabilityPage } from "@/components/availability/RoomAvailabilityPage";

export const metadata: Metadata = {
  title: "Room Availability",
  description:
    "See every room, see every hour. Find the perfect space for your stay at Lumora.",
};

export default function Page() {
  return <RoomAvailabilityPage />;
}
