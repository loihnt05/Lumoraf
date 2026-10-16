"use client";

import * as React from "react";
import Link from "next/link";
import { MOCK_PROPERTIES, MOCK_PHYSICAL_ROOMS } from "@/lib/mock/inventory-data";
import type { Property } from "@/lib/types/inventory";
import { PropertyHeader } from "@/components/property/property-header";
import { PropertyGallery } from "@/components/property/property-gallery";
import { RoomCard } from "@/components/room/room-card";
import { HealthStatus } from "@/components/health-status";
import { ArrowRight } from "lucide-react";

export default function BookingPage() {
  // Selected property state (defaults to Lumora Đà Lạt)
  const [selectedProperty, setSelectedProperty] = React.useState<Property>(
    MOCK_PROPERTIES[0],
  );

  // Active filter tab (matching user screenshot destinations / categories)
  const [activeFilter, setActiveFilter] = React.useState<string>("all");

  const filterTabs = [
    { id: "all", label: "Tất cả phòng" },
    { id: "prop-da-lat", label: "Đà Lạt" },
    { id: "prop-sai-gon", label: "Sài Gòn" },
    { id: "rt-dl-deluxe", label: "Deluxe Room" },
    { id: "rt-dl-luxury", label: "Luxury Suite" },
    { id: "rt-dl-villa", label: "Forest Villa" },
  ];

  // Filtered rooms based on active tab
  const displayedRooms = React.useMemo(() => {
    if (activeFilter === "all") {
      return MOCK_PHYSICAL_ROOMS.filter((room) => room.status === "ACTIVE");
    }
    if (activeFilter === "prop-da-lat" || activeFilter === "prop-sai-gon") {
      return MOCK_PHYSICAL_ROOMS.filter(
        (room) => room.propertyId === activeFilter && room.status === "ACTIVE",
      );
    }
    return MOCK_PHYSICAL_ROOMS.filter(
      (room) => room.roomTypeId === activeFilter && room.status === "ACTIVE",
    );
  }, [activeFilter]);

  const handleSelectProperty = (property: Property) => {
    setSelectedProperty(property);
    setActiveFilter(property.id);
  };

  const handleTabClick = (tabId: string) => {
    setActiveFilter(tabId);
    if (tabId === "prop-da-lat") {
      setSelectedProperty(MOCK_PROPERTIES[0]);
    } else if (tabId === "prop-sai-gon") {
      setSelectedProperty(MOCK_PROPERTIES[1]);
    }
  };

  return (
    <div className="space-y-12 md:space-y-16">
      {/* 1. Property Header & Location Context (UI-2.1) */}
      <section aria-label="Thông tin chi nhánh homestay">
        <PropertyHeader
          properties={MOCK_PROPERTIES}
          selectedProperty={selectedProperty}
          onSelectProperty={handleSelectProperty}
          hasSelectedRoom={false}
        />
      </section>

      {/* 2. Hero Photography Gallery (UI-2.1) */}
      <section aria-label="Thư viện ảnh chi nhánh">
        <PropertyGallery
          propertyName={selectedProperty.name}
          images={selectedProperty.images}
        />
      </section>

      {/* 3. Editorial Stays Section matching exact screenshot layout */}
      <section aria-labelledby="editorial-heading" className="space-y-6 pt-4">
        {/* Editorial Eyebrow & Headline */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B4823A]">
            HOT THIS WEEK
          </span>
          <h2
            id="editorial-heading"
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#132238] tracking-tight leading-tight"
          >
            Boutique hotel stays worth the{" "}
            <span className="italic font-serif text-[#C48443]">weekend.</span>
          </h2>
        </div>

        {/* Filter Tabs & View All Link Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all shadow-2xs whitespace-nowrap ${
                    isActive
                      ? "bg-[#132238] text-white shadow-sm"
                      : "bg-white border border-gray-200/90 text-gray-700 hover:border-gray-400 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <Link
            href="/booking"
            onClick={() => setActiveFilter("all")}
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-gray-800 hover:text-black whitespace-nowrap self-start sm:self-auto transition-colors"
          >
            <span>View all stays</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* 4-Column Room Cards Grid matching screenshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 pt-2">
          {displayedRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </section>

      {/* 4. Boutique Quality Banner */}
      <section
        aria-label="Triết lý nghỉ dưỡng Lumora"
        className="rounded-3xl bg-surface border border-border/70 p-8 md:p-12 shadow-xs"
      >
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-2">
            <span className="text-caption uppercase tracking-[0.2em] text-primary">
              01 / Linh hoạt
            </span>
            <h3 className="text-lg font-medium text-foreground">
              3 hình thức lưu trú
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Slot 3h tiết kiệm, Custom time tự chọn từng mốc 30 phút, hoặc nghỉ
              qua đêm với trải nghiệm trọn vẹn.
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-caption uppercase tracking-[0.2em] text-primary">
              02 / Minh bạch
            </span>
            <h3 className="text-lg font-medium text-foreground">Không phí ẩn</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Toàn bộ giá phòng và phụ phí đêm (23:00 - 06:00) được tính toán
              chính xác và hiển thị chi tiết trước khi xác nhận.
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-caption uppercase tracking-[0.2em] text-primary">
              03 / Tự do
            </span>
            <h3 className="text-lg font-medium text-foreground">
              Không gian tĩnh tại
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Mỗi căn phòng là một không gian riêng tư được chăm chút tỉ mỉ từ
              ánh sáng, mùi hương đến nội thất gỗ tự nhiên.
            </p>
          </div>
        </div>
      </section>

      {/* Development Backend Connection Status */}
      {process.env.NODE_ENV === "development" && <HealthStatus />}
    </div>
  );
}
