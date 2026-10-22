"use client";

import * as React from "react";
import type { BookingMode, RoomTypeBookingConfig } from "@/lib/types/booking-config";
import { Badge } from "@/components/ui/badge";
import { Clock, Moon, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type BookingModeTabsProps = {
  roomId: string;
  config: RoomTypeBookingConfig;
  activeMode: BookingMode;
  onChangeMode: (mode: BookingMode) => void;
};

type ModeOption = {
  id: BookingMode;
  label: string;
  tag: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  enabled: boolean;
};

export function BookingModeTabs({
  roomId,
  config,
  activeMode,
  onChangeMode,
}: BookingModeTabsProps) {
  // Define mode options based strictly on backend configuration contract
  const modeOptions: ModeOption[] = React.useMemo(() => {
    return [
      {
        id: "FIXED" as BookingMode,
        label: `Fixed ${config.fixedDurationMinutes / 60}h`,
        tag: "Tiết kiệm",
        icon: Sparkles,
        description: `Mỗi slot ${config.fixedDurationMinutes / 60} giờ định sẵn. Khoảng trống dọn phòng giữa các slot không tính vào thời gian của khách.`,
        enabled: config.fixedEnabled,
      },
      {
        id: "CUSTOM" as BookingMode,
        label: "Custom time",
        tag: `Bước ${config.customStepMinutes}m`,
        icon: Clock,
        description: `Tự chọn giờ nhận và trả phòng với bước nhảy ${config.customStepMinutes} phút, thời gian tối thiểu ${config.customMinDurationMinutes / 60} giờ. Khung đêm (${config.nightWindowStart}–${config.nightWindowEnd}) có phụ phí ${config.nightSurchargePercent}%.`,
        enabled: config.customEnabled,
      },
      {
        id: "OVERNIGHT" as BookingMode,
        label: "Overnight",
        tag: "Qua đêm",
        icon: Moon,
        description: `Nghỉ qua đêm trọn vẹn. Check-in từ ${config.overnightCheckInTime}, check-out trước ${config.overnightCheckOutTime} hôm sau. Áp dụng bảng giá theo đêm riêng biệt.`,
        enabled: config.overnightEnabled,
      },
    ];
  }, [config]);

  // Filter only enabled modes
  const enabledModes = React.useMemo(() => {
    return modeOptions.filter((m) => m.enabled);
  }, [modeOptions]);

  // Persist mode per room in sessionStorage
  const sessionKey = `lumora_mode_${roomId}`;

  // Check saved mode from session on mount / room change
  React.useEffect(() => {
    try {
      const saved = sessionStorage.getItem(sessionKey) as BookingMode | null;
      if (saved && enabledModes.some((m) => m.id === saved) && saved !== activeMode) {
        onChangeMode(saved);
      } else if (!enabledModes.some((m) => m.id === activeMode) && enabledModes.length > 0) {
        // Fallback to first available enabled mode if current mode is disabled for this room
        onChangeMode(enabledModes[0].id);
      }
    } catch {
      // Ignore sessionStorage errors
    }
  }, [roomId, sessionKey, enabledModes, activeMode, onChangeMode]);

  const handleSelectMode = (mode: BookingMode) => {
    if (mode === activeMode) return;
    try {
      sessionStorage.setItem(sessionKey, mode);
    } catch {
      // Ignore
    }
    onChangeMode(mode);
  };

  // Safe Fallback State: If NO modes are enabled by configuration
  if (enabledModes.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Loại phòng này hiện chưa được cấu hình chế độ lưu trú. Vui lòng liên hệ quản lý.</span>
      </div>
    );
  }

  // Single Mode Display: If only 1 mode is enabled, do not display redundant tabs
  if (enabledModes.length === 1) {
    const singleMode = enabledModes[0];
    const Icon = singleMode.icon;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{singleMode.label}</p>
              <p className="text-[11px] text-muted-foreground">Chế độ duy nhất được bật cho loại phòng này</p>
            </div>
          </div>
          <Badge className="bg-primary/10 text-primary text-[10px] font-medium border-none">
            {singleMode.tag}
          </Badge>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground px-1">
          {singleMode.description}
        </p>
      </div>
    );
  }

  // Active Mode Details
  const currentModeInfo = modeOptions.find((m) => m.id === activeMode) ?? enabledModes[0];

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    if (enabledModes.length <= 1) return;
    let nextIndex = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % enabledModes.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + enabledModes.length) % enabledModes.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIndex = enabledModes.length - 1;
    }

    if (nextIndex !== -1) {
      const nextMode = enabledModes[nextIndex].id;
      handleSelectMode(nextMode);
      const nextBtn = document.getElementById(`tab-${nextMode}`);
      nextBtn?.focus();
    }
  };

  return (
    <div className="space-y-3">
      {/* Segmented Tab Control: Responsive Equal-Width Grid */}
      <div
        role="tablist"
        aria-label="Chọn hình thức lưu trú"
        className="grid w-full grid-flow-col auto-cols-fr gap-1 items-center rounded-2xl sm:rounded-full border border-border/60 bg-muted/50 p-1 backdrop-blur-xs"
      >
        {enabledModes.map((mode, idx) => {
          const isSelected = activeMode === mode.id;
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              role="tab"
              type="button"
              id={`tab-${mode.id}`}
              tabIndex={isSelected ? 0 : -1}
              aria-selected={isSelected}
              aria-controls={`panel-${mode.id}`}
              onClick={() => handleSelectMode(mode.id)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              className={cn(
                "group relative flex min-h-[42px] sm:min-h-[44px] w-full min-w-0 items-center justify-center gap-1 sm:gap-1.5 rounded-xl sm:rounded-full py-2 px-1.5 sm:px-2.5 text-[11px] sm:text-xs font-medium transition-all duration-200 outline-none select-none focus-visible:outline-2 focus-visible:outline-ring",
                isSelected
                  ? "bg-surface text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/40",
              )}
            >
              <Icon
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-colors",
                  isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              <span className="truncate">{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contextual Description Banner with Active Mode Badge */}
      <div
        id={`panel-${currentModeInfo.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${currentModeInfo.id}`}
        className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground animate-in fade-in-50 duration-200 space-y-1.5"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <currentModeInfo.icon className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs sm:text-sm">{currentModeInfo.label}</span>
          </div>
          <Badge className="bg-primary/10 text-primary text-[10px] font-semibold border-none shrink-0">
            {currentModeInfo.tag}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{currentModeInfo.description}</p>
      </div>
    </div>
  );
}
