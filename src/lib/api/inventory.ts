import { MOCK_PROPERTIES, MOCK_PHYSICAL_ROOMS } from "@/lib/mock/inventory-data";
import type { Property, PhysicalRoom } from "@/lib/types/inventory";

export async function getProperties(): Promise<Property[]> {
  // Simulates network latency
  await new Promise((resolve) => setTimeout(resolve, 80));
  return MOCK_PROPERTIES.filter((p) => p.status === "ACTIVE");
}

export async function getPropertyById(id: string): Promise<Property | null> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return MOCK_PROPERTIES.find((p) => p.id === id && p.status === "ACTIVE") ?? null;
}

export async function getRoomsByPropertyId(propertyId: string): Promise<PhysicalRoom[]> {
  await new Promise((resolve) => setTimeout(resolve, 80));
  return MOCK_PHYSICAL_ROOMS.filter(
    (room) => room.propertyId === propertyId && room.status === "ACTIVE",
  );
}

export async function getRoomById(roomId: string): Promise<PhysicalRoom | null> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return MOCK_PHYSICAL_ROOMS.find((room) => room.id === roomId && room.status === "ACTIVE") ?? null;
}
