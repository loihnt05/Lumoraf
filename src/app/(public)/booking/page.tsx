"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MOCK_PROPERTIES, MOCK_PHYSICAL_ROOMS } from "@/lib/mock/inventory-data";
import type { Property, PhysicalRoom } from "@/lib/types/inventory";
import { PropertyHeader } from "@/components/property/property-header";
import { PropertyGallery } from "@/components/property/property-gallery";
import { RoomCard } from "@/components/room/room-card";
import { RoomBookingPanel } from "@/components/room/room-booking-panel";
import { HealthStatus } from "@/components/health-status";
import { BedSingle } from "lucide-react";

export default function BookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Selected property state (defaults to Lumora Đà Lạt)
  const [selectedProperty, setSelectedProperty] = React.useState<Property>(
    MOCK_PROPERTIES[0],
  );

  // Local selected room id for instant UI responsiveness
  const [localRoomId, setLocalRoomId] = React.useState<string | null>(null);

  // Filter physical rooms belonging to the selected property
  const propertyRooms = React.useMemo(() => {
    return MOCK_PHYSICAL_ROOMS.filter(
      (room) => room.propertyId === selectedProperty.id && room.status === "ACTIVE",
    );
  }, [selectedProperty.id]);

  // Derived active room: reads from URL ?room= or local selection
  const roomParam = searchParams.get("room");
  const activeRoomId = roomParam ?? localRoomId;

  const selectedRoom = React.useMemo(() => {
    if (!activeRoomId) return null;
    return propertyRooms.find((r) => r.id === activeRoomId) ?? null;
  }, [activeRoomId, propertyRooms]);

  const handleSelectRoom = (room: PhysicalRoom) => {
    if (room.isBlocked) return;
    setLocalRoomId(room.id);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("room", room.id);
    router.replace(`/booking?${newParams.toString()}`, { scroll: false });
  };

  const handleClosePanel = () => {
    setLocalRoomId(null);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete("room");
    router.replace(`/booking?${newParams.toString()}`, { scroll: false });
  };

  const handleSelectProperty = (property: Property) => {
    setSelectedProperty(property);
    setLocalRoomId(null);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete("room");
    router.replace(`/booking?${newParams.toString()}`, { scroll: false });
  };

  const availableRoomsCount = propertyRooms.filter((r) => !r.isBlocked).length;

  return (
    <div className="space-y-12 md:space-y-16">
      {/* 1. Property Header & Location Context (UI-2.1) */}
      <section aria-label="Thông tin chi nhánh homestay">
        <PropertyHeader
          properties={MOCK_PROPERTIES}
          selectedProperty={selectedProperty}
          onSelectProperty={handleSelectProperty}
          hasSelectedRoom={Boolean(selectedRoom)}
        />
      </section>

      {/* 2. Sonder-inspired Hero Photography Gallery (UI-2.1) */}
      <section aria-label="Thư viện ảnh chi nhánh">
        <PropertyGallery
          propertyName={selectedProperty.name}
          images={selectedProperty.images}
        />
      </section>

      {/* 3. Physical Rooms Presentation (UI-2.2) */}
      <section aria-labelledby="rooms-heading" className="space-y-6 pt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
              <BedSingle className="h-4 w-4" />
              <span>Không gian lưu trú</span>
            </div>
            <h2 id="rooms-heading" className="text-display text-2xl md:text-3xl font-medium tracking-tight text-foreground mt-1">
              Danh sách phòng tại {selectedProperty.name}
            </h2>
          </div>

          <p className="text-xs text-muted-foreground">
            Hiển thị <strong>{propertyRooms.length}</strong> phòng vật lý (<strong>{availableRoomsCount}</strong> sẵn sàng đặt)
          </p>
        </div>

        {/* Room Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {propertyRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              isSelected={selectedRoom?.id === room.id}
              onSelect={handleSelectRoom}
            />
          ))}
        </div>
      </section>

      {/* 4. Sonder-style Editorial Quality Banner */}
      <section
        aria-label="Triết lý nghỉ dưỡng Lumora"
        className="rounded-3xl bg-surface border border-border/70 p-8 md:p-12 shadow-xs"
      >
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-2">
            <span className="text-caption uppercase tracking-[0.2em] text-primary">01 / Linh hoạt</span>
            <h3 className="text-lg font-medium text-foreground">3 hình thức lưu trú</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Slot 3h tiết kiệm, Custom time tự chọn từng mốc 30 phút, hoặc nghỉ qua đêm với trải nghiệm trọn vẹn.
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-caption uppercase tracking-[0.2em] text-primary">02 / Minh bạch</span>
            <h3 className="text-lg font-medium text-foreground">Không phí ẩn</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Toàn bộ giá phòng và phụ phí đêm (23:00 - 06:00) được tính toán chính xác và hiển thị chi tiết trước khi xác nhận.
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-caption uppercase tracking-[0.2em] text-primary">03 / Tự do</span>
            <h3 className="text-lg font-medium text-foreground">Không gian tĩnh tại</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Mỗi căn phòng là một không gian riêng tư được chăm chút tỉ mỉ từ ánh sáng, mùi hương đến nội thất gỗ tự nhiên.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Expandable Booking Workspace Panel (UI-2.3) */}
      <RoomBookingPanel
        room={selectedRoom}
        onClose={handleClosePanel}
      />

      {/* Development Backend Connection Status */}
      {process.env.NODE_ENV === "development" && <HealthStatus />}
    </div>
  );
}
