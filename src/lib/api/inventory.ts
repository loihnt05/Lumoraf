import {
  MOCK_PROPERTIES,
  MOCK_PHYSICAL_ROOMS,
  MOCK_ROOM_TYPES,
} from "../mock/inventory-data";
import type { Property, PhysicalRoom, RoomType } from "../types/inventory";
import type { AdminRole } from "../types/booking-config";
import { getRoomTypeBookingConfigSync } from "./booking-config";

const BLOCKED_ROOMS_STORAGE_KEY = "lumora_admin_room_blocks_v1";

function createInitialBlockMap(): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const room of MOCK_PHYSICAL_ROOMS) {
    map[room.id] = room.isBlocked;
  }
  return map;
}

let memoryRoomBlockMap: Record<string, boolean> = createInitialBlockMap();

function readRoomBlockMap(): Record<string, boolean> {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return memoryRoomBlockMap;
  }
  try {
    const raw = window.localStorage.getItem(BLOCKED_ROOMS_STORAGE_KEY);
    if (!raw) return memoryRoomBlockMap;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    memoryRoomBlockMap = { ...createInitialBlockMap(), ...parsed };
    return memoryRoomBlockMap;
  } catch {
    return memoryRoomBlockMap;
  }
}

function writeRoomBlockMap(map: Record<string, boolean>): void {
  memoryRoomBlockMap = { ...map };
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    try {
      window.localStorage.setItem(BLOCKED_ROOMS_STORAGE_KEY, JSON.stringify(map));
      window.dispatchEvent(new Event("lumora_inventory_change"));
    } catch {
      // Ignore storage quota errors
    }
  }
}

export function resetRoomBlocksForTest(): void {
  memoryRoomBlockMap = createInitialBlockMap();
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    window.localStorage.removeItem(BLOCKED_ROOMS_STORAGE_KEY);
  }
}

export function getAllRoomTypes(): RoomType[] {
  return Object.values(MOCK_ROOM_TYPES).map((rt) => {
    const cfg = getRoomTypeBookingConfigSync(rt.id);
    return {
      ...rt,
      basePrice: cfg.fixedBasePrice,
    };
  });
}

export function getPhysicalRoomsSnapshot(): PhysicalRoom[] {
  const blockMap = readRoomBlockMap();
  return MOCK_PHYSICAL_ROOMS.map((room) => {
    const cfg = getRoomTypeBookingConfigSync(room.roomTypeId);
    const updatedRoomType: RoomType | undefined = room.roomType
      ? {
          ...room.roomType,
          basePrice: cfg.fixedBasePrice,
        }
      : undefined;

    return {
      ...room,
      isBlocked: blockMap[room.id] ?? room.isBlocked,
      roomType: updatedRoomType,
    };
  });
}

export async function getProperties(): Promise<Property[]> {
  await new Promise((resolve) => setTimeout(resolve, 60));
  return MOCK_PROPERTIES.filter((p) => p.status === "ACTIVE");
}

export async function getPropertyById(id: string): Promise<Property | null> {
  await new Promise((resolve) => setTimeout(resolve, 40));
  return MOCK_PROPERTIES.find((p) => p.id === id && p.status === "ACTIVE") ?? null;
}

export async function getRoomsByPropertyId(
  propertyId: string,
): Promise<PhysicalRoom[]> {
  await new Promise((resolve) => setTimeout(resolve, 60));
  return getPhysicalRoomsSnapshot().filter(
    (room) => room.propertyId === propertyId && room.status === "ACTIVE",
  );
}

export async function getRoomById(roomId: string): Promise<PhysicalRoom | null> {
  await new Promise((resolve) => setTimeout(resolve, 40));
  return (
    getPhysicalRoomsSnapshot().find(
      (room) => room.id === roomId && room.status === "ACTIVE",
    ) ?? null
  );
}

export async function setRoomBlockedStatus(
  roomId: string,
  isBlocked: boolean,
  actorRole: AdminRole = "ADMIN",
): Promise<
  | { ok: true; room: PhysicalRoom }
  | { ok: false; status: 403 | 404; message: string }
> {
  await new Promise((resolve) => setTimeout(resolve, 80));

  // Business Rule P2.6 / UI-9.4: Only ADMIN can change rooms.is_blocked
  if (actorRole !== "ADMIN") {
    return {
      ok: false,
      status: 403,
      message: "403 Forbidden: Chỉ ADMIN mới có quyền khóa hoặc mở khóa phòng vật lý.",
    };
  }

  const baseRoom = MOCK_PHYSICAL_ROOMS.find((r) => r.id === roomId);
  if (!baseRoom) {
    return {
      ok: false,
      status: 404,
      message: "Không tìm thấy phòng vật lý.",
    };
  }

  const map = readRoomBlockMap();
  map[roomId] = isBlocked;
  writeRoomBlockMap(map);

  const updated = getPhysicalRoomsSnapshot().find((r) => r.id === roomId)!;
  return {
    ok: true,
    room: updated,
  };
}
