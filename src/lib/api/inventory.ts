import {
  MOCK_PROPERTIES,
  MOCK_PHYSICAL_ROOMS,
  MOCK_ROOM_TYPES,
} from "../mock/inventory-data";
import type { Property, PhysicalRoom, RoomType } from "../types/inventory";
import type { AdminRole } from "../types/booking-config";
import { getRoomTypeBookingConfigSync } from "./booking-config";
import { apiRequest } from "./client";

type BackendPropertySummary = {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
};

type BackendRoom = {
  id: string;
  propertyId: string;
  roomNumber: string;
  name: string;
  floor: string;
  roomType: {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    maxGuests: number;
    bedType: string;
    bedCount: number;
    sizeM2: number;
    images?: Array<{ id: string; imageUrl: string; sortOrder: number; isCover: boolean }>;
    amenities?: Array<{ id: string; name: string; icon: string }>;
  };
  images?: Array<{ id: string; imageUrl: string; sortOrder: number; isCover: boolean }>;
};

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
  try {
    const backendData = await apiRequest<BackendPropertySummary[]>("/api/public/properties");
    if (backendData && Array.isArray(backendData) && backendData.length > 0) {
      return backendData.map((bp) => {
        const local = MOCK_PROPERTIES.find((lp) => lp.slug === bp.slug || lp.id === bp.id);
        return {
          id: bp.id,
          name: bp.name,
          slug: bp.slug,
          description: local?.description ?? `Chi nhánh ${bp.name} tại ${bp.city}`,
          address: bp.address,
          city: bp.city,
          checkInTime: local?.checkInTime ?? "14:00",
          checkOutTime: local?.checkOutTime ?? "11:00",
          status: "ACTIVE" as const,
          images: local?.images ?? [
            "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80",
          ],
        };
      });
    }
  } catch {
    // Graceful fallback to mock data when backend unreachable
  }
  return MOCK_PROPERTIES.filter((p) => p.status === "ACTIVE");
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const all = await getProperties();
  return all.find((p) => (p.id === id || p.slug === id) && p.status === "ACTIVE") ?? null;
}

export async function getRoomsByPropertyId(
  propertyId: string,
): Promise<PhysicalRoom[]> {
  const matchedProp = MOCK_PROPERTIES.find((p) => p.id === propertyId || p.slug === propertyId);
  const targetId = matchedProp ? matchedProp.id : propertyId;

  try {
    const backendRooms = await apiRequest<BackendRoom[]>(`/api/public/properties/${targetId}/rooms`);
    if (backendRooms && Array.isArray(backendRooms) && backendRooms.length > 0) {
      return backendRooms.map((br) => {
        const roomImages =
          br.images && br.images.length > 0
            ? br.images.map((img) => img.imageUrl)
            : MOCK_PHYSICAL_ROOMS.find((mr) => mr.roomNumber === br.roomNumber)?.images ?? [
                "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
              ];
        return {
          id: br.id,
          propertyId: br.propertyId,
          roomTypeId: br.roomType?.id ?? "",
          roomNumber: br.roomNumber,
          name: br.name,
          floor: parseInt(br.floor, 10) || 1,
          status: "ACTIVE" as const,
          isBlocked: false,
          images: roomImages,
          roomType: br.roomType
            ? {
                id: br.roomType.id,
                propertyId: br.propertyId,
                name: br.roomType.name,
                description: br.roomType.description,
                basePrice: Number(br.roomType.basePrice),
                maxGuests: br.roomType.maxGuests,
                bedType: br.roomType.bedType ?? "King bed",
                bedCount: br.roomType.bedCount ?? 1,
                sizeM2: Number(br.roomType.sizeM2) || 30,
                status: "ACTIVE" as const,
                amenities:
                  br.roomType.amenities?.map((a) => ({ id: a.id, name: a.name, icon: a.icon })) ?? [],
              }
            : undefined,
        };
      });
    }
  } catch {
    // Fallback to local snapshot
  }

  return getPhysicalRoomsSnapshot().filter(
    (room) =>
      (room.propertyId === propertyId ||
        (matchedProp && room.propertyId === matchedProp.id)) &&
      room.status === "ACTIVE",
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
