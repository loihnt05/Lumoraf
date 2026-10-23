"use client";

import * as React from "react";
import Link from "next/link";
import { MOCK_PROPERTIES, MOCK_ROOM_TYPES } from "@/lib/mock/inventory-data";
import type {
  AdminFixedSlotConfig,
  AdminRole,
  RoomTypeBookingConfig,
} from "@/lib/types/booking-config";
import type { PhysicalRoom } from "@/lib/types/inventory";
import {
  getRoomTypeBookingConfig,
  isSlotTouchingNightWindow,
  parseSlotRangeMinutes,
  resetAllRoomTypeConfigsForTest,
  updateRoomTypeBookingConfig,
  validateAdminBookingConfig,
} from "@/lib/api/booking-config";
import {
  getPhysicalRoomsSnapshot,
  resetRoomBlocksForTest,
  setRoomBlockedStatus,
} from "@/lib/api/inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings2,
  Clock,
  DollarSign,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  ExternalLink,
  Ban,
  Unlock,
  Moon,
  Sparkles,
  Lock,
  BedDouble,
  SlidersHorizontal,
  ChevronRight,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}₫`;
}

type ConfigTab = "modes" | "slots" | "pricing" | "rooms";

export default function AdminBookingConfigPage() {
  const roomTypeList = React.useMemo(() => Object.values(MOCK_ROOM_TYPES), []);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = React.useState<string>(
    roomTypeList[0]?.id ?? "rt-dl-deluxe",
  );

  // Active configuration section tab
  const [activeTab, setActiveTab] = React.useState<ConfigTab>("modes");

  // Role switcher to verify ADMIN vs MANAGER permissions (UI-9.4)
  const [actorRole, setActorRole] = React.useState<AdminRole>("ADMIN");

  // Form config state for selected RoomType
  const [draftConfig, setDraftConfig] =
    React.useState<RoomTypeBookingConfig | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveFeedback, setSaveFeedback] = React.useState<{
    type: "success" | "error";
    messages: string[];
    warnings?: string[];
  } | null>(null);

  // Physical rooms state for UI-9.4 Room Blocking
  const [rooms, setRooms] = React.useState<PhysicalRoom[]>(() =>
    getPhysicalRoomsSnapshot(),
  );
  const [pendingBlockRoom, setPendingBlockRoom] =
    React.useState<PhysicalRoom | null>(null);
  const [blockError, setBlockError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    getRoomTypeBookingConfig(selectedRoomTypeId)
      .then((cfg) => {
        if (!active) return;
        setDraftConfig(cfg);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedRoomTypeId]);

  const selectedRoomType = React.useMemo(
    () => MOCK_ROOM_TYPES[selectedRoomTypeId],
    [selectedRoomTypeId],
  );

  const selectedProperty = React.useMemo(
    () =>
      MOCK_PROPERTIES.find((p) => p.id === selectedRoomType?.propertyId) ??
      MOCK_PROPERTIES[0],
    [selectedRoomType],
  );

  const roomsForSelectedType = React.useMemo(
    () => rooms.filter((r) => r.roomTypeId === selectedRoomTypeId),
    [rooms, selectedRoomTypeId],
  );

  // Realtime validation of current draftConfig (UI-9.1, UI-9.2, UI-9.3)
  const liveValidation = React.useMemo(() => {
    if (!draftConfig) return { isValid: true, errors: [], warnings: [] };
    return validateAdminBookingConfig(draftConfig);
  }, [draftConfig]);

  const handleSaveConfig = async () => {
    if (!draftConfig || isSaving) return;
    setIsSaving(true);
    setSaveFeedback(null);

    try {
      const res = await updateRoomTypeBookingConfig(draftConfig);
      if (!res.ok) {
        setSaveFeedback({
          type: "error",
          messages: res.errors,
          warnings: res.warnings,
        });
        return;
      }

      setDraftConfig(res.config);
      setRooms(getPhysicalRoomsSnapshot());
      setSaveFeedback({
        type: "success",
        messages: [
          `Đã lưu cấu hình cho hạng phòng "${selectedRoomType?.name}". Dữ liệu báo giá và khung giờ bên trang khách hàng đã được cập nhật tức thì!`,
        ],
        warnings: res.warnings,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAllDefaults = async () => {
    resetAllRoomTypeConfigsForTest();
    resetRoomBlocksForTest();
    setRooms(getPhysicalRoomsSnapshot());
    setIsLoading(true);
    try {
      const cfg = await getRoomTypeBookingConfig(selectedRoomTypeId);
      setDraftConfig(cfg);
    } finally {
      setIsLoading(false);
    }
    setSaveFeedback({
      type: "success",
      messages: [
        "Đã khôi phục toàn bộ cấu hình thời gian, bảng giá và trạng thái khóa phòng về mặc định ban đầu.",
      ],
    });
  };

  const handleUpdateSlot = (
    slotId: string,
    patch: Partial<AdminFixedSlotConfig>,
  ) => {
    if (!draftConfig) return;
    setDraftConfig({
      ...draftConfig,
      fixedSlots: draftConfig.fixedSlots.map((s) =>
        s.id === slotId ? { ...s, ...patch } : s,
      ),
    });
    setSaveFeedback(null);
  };

  const handleAddSlot = () => {
    if (!draftConfig) return;
    const nextNum =
      draftConfig.fixedSlots.reduce(
        (max, s) => Math.max(max, s.slotNumber),
        0,
      ) + 1;
    const newSlot: AdminFixedSlotConfig = {
      id: `slot-${Date.now().toString(36)}`,
      slotNumber: nextNum,
      label: `Slot ${nextNum} · Khung giờ mới`,
      startTime: "21:00",
      endTime: "00:00",
      priceOverride: null,
      isActive: true,
    };
    setDraftConfig({
      ...draftConfig,
      fixedSlots: [...draftConfig.fixedSlots, newSlot],
    });
    setSaveFeedback(null);
  };

  const handleDeleteSlot = (slotId: string) => {
    if (!draftConfig) return;
    setDraftConfig({
      ...draftConfig,
      fixedSlots: draftConfig.fixedSlots.filter((s) => s.id !== slotId),
    });
    setSaveFeedback(null);
  };

  const handleConfirmRoomBlockToggle = async (
    room: PhysicalRoom,
    nextBlocked: boolean,
  ) => {
    setBlockError(null);
    const res = await setRoomBlockedStatus(room.id, nextBlocked, actorRole);
    if (!res.ok) {
      setBlockError(res.message);
      setPendingBlockRoom(null);
      return;
    }
    setRooms(getPhysicalRoomsSnapshot());
    setPendingBlockRoom(null);
  };

  const sampleRoomId = roomsForSelectedType[0]?.id ?? "room-dl-no5";

  // Tab definitions with counts/badges
  const tabs = React.useMemo(() => {
    return [
      {
        id: "modes" as ConfigTab,
        label: "Chế độ & Thời gian",
        icon: Settings2,
        badge: draftConfig
          ? [
              draftConfig.fixedEnabled && "Fixed",
              draftConfig.customEnabled && "Custom",
              draftConfig.overnightEnabled && "Overnight",
            ]
              .filter(Boolean)
              .join(" · ")
          : undefined,
      },
      {
        id: "slots" as ConfigTab,
        label: "Khung giờ cố định",
        icon: Clock,
        count: draftConfig?.fixedSlots.length ?? 0,
      },
      {
        id: "pricing" as ConfigTab,
        label: "Bảng giá & Báo giá",
        icon: DollarSign,
        badge: draftConfig ? formatVnd(draftConfig.fixedBasePrice) : undefined,
      },
      {
        id: "rooms" as ConfigTab,
        label: "Khóa phòng vật lý",
        icon: ShieldAlert,
        count: roomsForSelectedType.length,
      },
    ];
  }, [draftConfig, roomsForSelectedType]);

  return (
    <div className="space-y-8 pb-24">
      {/* 1. Header with Stylized Keyword Titles */}
      <div className="flex flex-col gap-5 border-b border-border/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-widest text-primary">
              Stage UI-9 · Quản trị hệ thống
            </span>
            <span>/</span>
            <span>Hạng phòng</span>
            <span>/</span>
            <span className="font-semibold text-foreground">
              {selectedRoomType?.name} ({selectedProperty.name})
            </span>
          </div>

          {/* Main Title with Special Keyword Stylization: "thời gian" & "bảng giá." */}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-foreground leading-tight">
            Cấu hình{" "}
            <span className="font-script text-4xl sm:text-5xl lg:text-6xl text-[#C48443] font-normal not-italic px-1 inline-block -rotate-1 align-baseline">
              thời gian
            </span>{" "}
            &{" "}
            <span className="font-script text-4xl sm:text-5xl lg:text-6xl text-[#C48443] font-normal not-italic px-1 inline-block -rotate-1 align-baseline">
              bảng giá.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Thiết lập linh hoạt quy tắc đặt phòng theo từng hạng phòng và quản lý trạng thái bảo trì phòng vật lý với trải nghiệm trực quan, tức thì.
          </p>
        </div>

        {/* Top Action Toolbar: Role Switcher & Utilities */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Role Switcher Pill */}
          <div
            role="group"
            aria-label="Chế độ phân quyền kiểm thử"
            className="inline-flex items-center rounded-full border border-border bg-surface p-1 text-xs shadow-2xs"
          >
            <button
              type="button"
              onClick={() => {
                setActorRole("ADMIN");
                setBlockError(null);
              }}
              className={cn(
                "rounded-full px-3 py-1.5 font-semibold transition-all",
                actorRole === "ADMIN"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              ADMIN
            </button>
            <button
              type="button"
              onClick={() => {
                setActorRole("MANAGER");
                setBlockError(null);
              }}
              className={cn(
                "rounded-full px-3 py-1.5 font-semibold transition-all",
                actorRole === "MANAGER"
                  ? "bg-amber-700 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              MANAGER (Xem)
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetAllDefaults}
            className="rounded-full h-9 px-3.5 text-xs"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            <span>Reset</span>
          </Button>

          <Button asChild variant="outline" size="sm" className="rounded-full h-9 px-3.5 text-xs">
            <Link href={`/booking/${sampleRoomId}`}>
              <span>Xem phòng khách</span>
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>

          {/* Quick Save Trigger */}
          <Button
            size="sm"
            disabled={!liveValidation.isValid || isSaving || isLoading}
            onClick={handleSaveConfig}
            className="rounded-full h-9 px-4 text-xs font-semibold shadow-xs"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            <span>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
          </Button>
        </div>
      </div>

      {/* 2. RoomType Selector Strip: Clean Boutique Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Chọn Hạng phòng (RoomType) cần cấu hình
          </label>
          <span className="text-[11px] text-muted-foreground">
            {roomTypeList.length} hạng phòng đang hoạt động
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {roomTypeList.map((rt) => {
            const prop = MOCK_PROPERTIES.find((p) => p.id === rt.propertyId);
            const isSelected = rt.id === selectedRoomTypeId;
            return (
              <button
                key={rt.id}
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setSaveFeedback(null);
                  setSelectedRoomTypeId(rt.id);
                }}
                className={cn(
                  "group relative flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all duration-200 outline-none focus-visible:outline-2 focus-visible:outline-ring",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm ring-1 ring-primary"
                    : "border-border/80 bg-surface text-foreground hover:border-primary/50 hover:bg-muted/30",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-sm leading-tight">{rt.name}</p>
                    <p
                      className={cn(
                        "text-[11px]",
                        isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
                      )}
                    >
                      {prop?.name} · {prop?.city}
                    </p>
                  </div>
                  <BedDouble
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                      isSelected ? "text-primary-foreground" : "text-muted-foreground",
                    )}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-current/15 text-[11px]">
                  <span className={isSelected ? "text-primary-foreground/90 font-medium" : "text-muted-foreground"}>
                    Tối đa {rt.maxGuests} khách · {rt.sizeM2}m²
                  </span>
                  <span className={cn("font-bold tabular-nums", isSelected ? "text-primary-foreground" : "text-primary")}>
                    {formatVnd(rt.basePrice)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Feedback Banner: Validation & Save Status */}
      {saveFeedback && (
        <div
          role="alert"
          className={cn(
            "rounded-2xl border p-4 text-xs space-y-2 animate-in fade-in-50",
            saveFeedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800",
          )}
        >
          <div className="flex items-center gap-2 font-semibold">
            {saveFeedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span>
              {saveFeedback.type === "success"
                ? "Lưu cấu hình thành công"
                : "Không thể lưu cấu hình — Vui lòng kiểm tra lỗi bên dưới"}
            </span>
          </div>
          <ul className="list-disc pl-5 space-y-1">
            {saveFeedback.messages.map((m, idx) => (
              <li key={idx}>{m}</li>
            ))}
          </ul>
          {saveFeedback.warnings && saveFeedback.warnings.length > 0 && (
            <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900">
              <p className="font-semibold">Lưu ý về Cleaning Buffer:</p>
              <ul className="list-disc pl-5 mt-1 space-y-0.5">
                {saveFeedback.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 4. Tab Navigation: 4 Clean Focused Categories */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/70 pb-1">
          <div
            role="tablist"
            aria-label="Phân loại cài đặt cấu hình"
            className="flex flex-wrap items-center gap-1.5 sm:gap-2"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  id={`config-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`config-panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "group flex min-h-[40px] items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 outline-none focus-visible:outline-2 focus-visible:outline-ring",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-surface border border-border/80 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums",
                        isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                  {tab.badge && (
                    <span
                      className={cn(
                        "hidden md:inline-block rounded-full px-1.5 py-0.2 text-[10px] font-medium",
                        isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <span className="hidden sm:inline-block text-xs text-muted-foreground">
            {selectedProperty.city} · {selectedRoomType?.name}
          </span>
        </div>

        {/* Loading Skeleton */}
        {isLoading || !draftConfig ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* ========================================================================= */}
            {/* TAB 1: CHẾ ĐỘ & QUY CHUẨN THỜI GIAN */}
            {/* ========================================================================= */}
            {activeTab === "modes" && (
              <div
                id="config-panel-modes"
                role="tabpanel"
                aria-labelledby="config-tab-modes"
                className="space-y-6 animate-in fade-in-50 duration-200"
              >
                {/* Section Header with Keyword Accent */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-normal text-foreground tracking-tight">
                      Quy chuẩn{" "}
                      <span className="font-script text-3xl sm:text-4xl text-[#C48443] font-normal not-italic px-1 inline-block -rotate-1 align-baseline">
                        thời gian
                      </span>{" "}
                      & Chế độ lưu trú
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Kích hoạt hoặc ngắt tạm thời 3 phương thức đặt phòng và thiết lập thời lượng bước nhảy (Step minutes).
                    </p>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-none text-xs font-semibold px-3 py-1">
                    UI-9.1 · Feature Rules
                  </Badge>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                  {/* 1. Fixed Slot Card */}
                  <div className={cn(
                    "flex flex-col justify-between rounded-3xl border p-5 sm:p-6 transition-all duration-200 bg-surface shadow-xs",
                    draftConfig.fixedEnabled ? "border-primary/40 ring-1 ring-primary/20" : "border-border/60 opacity-80",
                  )}>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                            Chế độ 01
                          </span>
                          <h3 className="font-serif text-lg font-normal text-foreground">
                            Khung giờ{" "}
                            <span className="font-script text-xl text-[#C48443] font-normal not-italic px-0.5 inline-block -rotate-1 align-baseline">
                              cố định
                            </span>{" "}
                            (Fixed Slot)
                          </h3>
                        </div>

                        {/* Modern Toggle Switch */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={draftConfig.fixedEnabled}
                          aria-label="Bật tắt Fixed Slot"
                          onClick={() =>
                            setDraftConfig({
                              ...draftConfig,
                              fixedEnabled: !draftConfig.fixedEnabled,
                            })
                          }
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus-visible:outline-2 focus-visible:outline-ring",
                            draftConfig.fixedEnabled ? "bg-primary" : "bg-muted-foreground/30",
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                              draftConfig.fixedEnabled ? "translate-x-5" : "translate-x-0",
                            )}
                          />
                        </button>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Phân chia các ca đặt phòng cố định (mặc định 3h) có khoảng dọn phòng tiêu chuẩn xen giữa.
                      </p>

                      <div className="space-y-3 pt-2 border-t border-border/50 text-xs">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-foreground">
                            Thời lượng ca chuẩn (phút)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min={30}
                              step={30}
                              value={draftConfig.fixedDurationMinutes}
                              onChange={(e) =>
                                setDraftConfig({
                                  ...draftConfig,
                                  fixedDurationMinutes: Number(e.target.value),
                                })
                              }
                              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              {draftConfig.fixedDurationMinutes / 60} giờ
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-foreground">
                            Cleaning buffer giữa các slot (phút)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={15}
                            value={draftConfig.fixedCleaningBufferMinutes}
                            onChange={(e) =>
                              setDraftConfig({
                                ...draftConfig,
                                fixedCleaningBufferMinutes: Number(e.target.value),
                              })
                            }
                            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Trạng thái:</span>
                      <span className={draftConfig.fixedEnabled ? "font-bold text-emerald-700" : "text-muted-foreground"}>
                        {draftConfig.fixedEnabled ? "Đang BẬT (ON)" : "Đang TẮT (OFF)"}
                      </span>
                    </div>
                  </div>

                  {/* 2. Custom Time Card */}
                  <div className={cn(
                    "flex flex-col justify-between rounded-3xl border p-5 sm:p-6 transition-all duration-200 bg-surface shadow-xs",
                    draftConfig.customEnabled ? "border-primary/40 ring-1 ring-primary/20" : "border-border/60 opacity-80",
                  )}>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                            Chế độ 02
                          </span>
                          <h3 className="font-serif text-lg font-normal text-foreground">
                            Tự chọn{" "}
                            <span className="font-script text-xl text-[#C48443] font-normal not-italic px-0.5 inline-block -rotate-1 align-baseline">
                              linh hoạt
                            </span>{" "}
                            (Custom Time)
                          </h3>
                        </div>

                        {/* Modern Toggle Switch */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={draftConfig.customEnabled}
                          aria-label="Bật tắt Custom Time"
                          onClick={() =>
                            setDraftConfig({
                              ...draftConfig,
                              customEnabled: !draftConfig.customEnabled,
                            })
                          }
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus-visible:outline-2 focus-visible:outline-ring",
                            draftConfig.customEnabled ? "bg-primary" : "bg-muted-foreground/30",
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                              draftConfig.customEnabled ? "translate-x-5" : "translate-x-0",
                            )}
                          />
                        </button>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Khách hàng tự chọn giờ nhận và trả phòng với bước nhảy linh hoạt và giới hạn giờ đặt.
                      </p>

                      <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-border/50 text-xs">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-foreground">
                            Bước nhảy (phút)
                          </label>
                          <input
                            type="number"
                            min={15}
                            step={15}
                            value={draftConfig.customStepMinutes}
                            onChange={(e) =>
                              setDraftConfig({
                                ...draftConfig,
                                customStepMinutes: Number(e.target.value),
                              })
                            }
                            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-foreground">
                            Tối thiểu (phút)
                          </label>
                          <input
                            type="number"
                            min={30}
                            step={30}
                            value={draftConfig.customMinDurationMinutes}
                            onChange={(e) =>
                              setDraftConfig({
                                ...draftConfig,
                                customMinDurationMinutes: Number(e.target.value),
                              })
                            }
                            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-foreground">
                            Tối đa (để trống = ∞)
                          </label>
                          <input
                            type="number"
                            min={60}
                            step={30}
                            placeholder="Không giới hạn"
                            value={draftConfig.customMaxDurationMinutes ?? ""}
                            onChange={(e) =>
                              setDraftConfig({
                                ...draftConfig,
                                customMaxDurationMinutes:
                                  e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-foreground">
                            Buffer dọn phòng (phút)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={15}
                            value={draftConfig.customCleaningBufferMinutes}
                            onChange={(e) =>
                              setDraftConfig({
                                ...draftConfig,
                                customCleaningBufferMinutes: Number(e.target.value),
                              })
                            }
                            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Trạng thái:</span>
                      <span className={draftConfig.customEnabled ? "font-bold text-emerald-700" : "text-muted-foreground"}>
                        {draftConfig.customEnabled ? "Đang BẬT (ON)" : "Đang TẮT (OFF)"}
                      </span>
                    </div>
                  </div>

                  {/* 3. Overnight Card */}
                  <div className={cn(
                    "flex flex-col justify-between rounded-3xl border p-5 sm:p-6 transition-all duration-200 bg-surface shadow-xs",
                    draftConfig.overnightEnabled ? "border-primary/40 ring-1 ring-primary/20" : "border-border/60 opacity-80",
                  )}>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                            Chế độ 03
                          </span>
                          <h3 className="font-serif text-lg font-normal text-foreground">
                            Lưu trú{" "}
                            <span className="font-script text-xl text-[#C48443] font-normal not-italic px-0.5 inline-block -rotate-1 align-baseline">
                              qua đêm
                            </span>{" "}
                            (Overnight)
                          </h3>
                        </div>

                        {/* Modern Toggle Switch */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={draftConfig.overnightEnabled}
                          aria-label="Bật tắt Overnight"
                          onClick={() =>
                            setDraftConfig({
                              ...draftConfig,
                              overnightEnabled: !draftConfig.overnightEnabled,
                            })
                          }
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus-visible:outline-2 focus-visible:outline-ring",
                            draftConfig.overnightEnabled ? "bg-primary" : "bg-muted-foreground/30",
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                              draftConfig.overnightEnabled ? "translate-x-5" : "translate-x-0",
                            )}
                          />
                        </button>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Thời gian nhận/trả phòng qua đêm và khung giờ kích hoạt phụ phí đêm (+{draftConfig.nightSurchargePercent}%).
                      </p>

                      <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-border/50 text-xs">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-foreground">
                            Check-in qua đêm
                          </label>
                          <input
                            type="time"
                            value={draftConfig.overnightCheckInTime}
                            onChange={(e) =>
                              setDraftConfig({
                                ...draftConfig,
                                overnightCheckInTime: e.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-foreground">
                            Check-out qua đêm
                          </label>
                          <input
                            type="time"
                            value={draftConfig.overnightCheckOutTime}
                            onChange={(e) =>
                              setDraftConfig({
                                ...draftConfig,
                                overnightCheckOutTime: e.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-foreground">
                            Bắt đầu giờ đêm
                          </label>
                          <input
                            type="time"
                            value={draftConfig.nightWindowStart}
                            onChange={(e) =>
                              setDraftConfig({
                                ...draftConfig,
                                nightWindowStart: e.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-foreground">
                            Kết thúc giờ đêm
                          </label>
                          <input
                            type="time"
                            value={draftConfig.nightWindowEnd}
                            onChange={(e) =>
                              setDraftConfig({
                                ...draftConfig,
                                nightWindowEnd: e.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div className="col-span-2 space-y-1">
                          <label className="text-[11px] font-semibold text-foreground">
                            Buffer dọn phòng qua đêm (phút)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={15}
                            value={draftConfig.overnightCleaningBufferMinutes}
                            onChange={(e) =>
                              setDraftConfig({
                                ...draftConfig,
                                overnightCleaningBufferMinutes: Number(e.target.value),
                              })
                            }
                            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Trạng thái:</span>
                      <span className={draftConfig.overnightEnabled ? "font-bold text-emerald-700" : "text-muted-foreground"}>
                        {draftConfig.overnightEnabled ? "Đang BẬT (ON)" : "Đang TẮT (OFF)"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: KHUNG GIỜ CỐ ĐỊNH & PREVIEW LỊCH */}
            {/* ========================================================================= */}
            {activeTab === "slots" && (
              <div
                id="config-panel-slots"
                role="tabpanel"
                aria-labelledby="config-tab-slots"
                className="space-y-6 animate-in fade-in-50 duration-200"
              >
                {/* Section Header with Keyword Accent */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-normal text-foreground tracking-tight">
                      Khung giờ{" "}
                      <span className="font-script text-3xl sm:text-4xl text-[#C48443] font-normal not-italic px-1 inline-block -rotate-1 align-baseline">
                        cố định
                      </span>{" "}
                      & Lịch dọn phòng
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Danh sách các ca trong ngày, giá ghi đè theo ca và trực quan hóa khoảng cách dọn phòng (cleaning buffer).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddSlot}
                      className="rounded-full h-9 px-4 text-xs font-semibold shadow-xs"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      <span>Thêm ca mới</span>
                    </Button>
                  </div>
                </div>

                {/* Slots Grid */}
                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {draftConfig.fixedSlots.map((slot) => {
                    const touchesNight = isSlotTouchingNightWindow(
                      slot.startTime,
                      slot.endTime,
                      draftConfig.nightWindowStart,
                      draftConfig.nightWindowEnd,
                    );

                    return (
                      <div
                        key={slot.id}
                        className={cn(
                          "flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 shadow-2xs",
                          slot.isActive
                            ? "border-border/90 bg-surface"
                            : "border-border/50 bg-muted/20 opacity-70",
                        )}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={slot.isActive}
                                onChange={(e) =>
                                  handleUpdateSlot(slot.id, {
                                    isActive: e.target.checked,
                                  })
                                }
                                className="h-4 w-4 accent-[#334A40] rounded cursor-pointer"
                              />
                              <Badge className="bg-primary/10 text-primary border-none text-[11px] font-semibold">
                                Slot #{slot.slotNumber}
                              </Badge>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteSlot(slot.id)}
                              title="Xóa ca này"
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Tên hiển thị
                            </label>
                            <input
                              type="text"
                              value={slot.label ?? ""}
                              placeholder="Nhãn hiển thị ca"
                              onChange={(e) =>
                                handleUpdateSlot(slot.id, { label: e.target.value })
                              }
                              className="w-full rounded-xl border border-border/70 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                                Bắt đầu
                              </label>
                              <input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) =>
                                  handleUpdateSlot(slot.id, {
                                    startTime: e.target.value,
                                  })
                                }
                                className="w-full rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold tabular-nums focus:border-primary focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                                Kết thúc
                              </label>
                              <input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) =>
                                  handleUpdateSlot(slot.id, {
                                    endTime: e.target.value,
                                  })
                                }
                                className="w-full rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold tabular-nums focus:border-primary focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-1 text-xs">
                            <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                              Giá riêng (trống = {formatVnd(draftConfig.fixedBasePrice)})
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={10000}
                              placeholder={`Giá chuẩn (${formatVnd(draftConfig.fixedBasePrice)})`}
                              value={slot.priceOverride ?? ""}
                              onChange={(e) =>
                                handleUpdateSlot(slot.id, {
                                  priceOverride:
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value),
                                })
                              }
                              className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold tabular-nums text-foreground focus:border-primary focus:outline-none"
                            />
                          </div>
                        </div>

                        {touchesNight && (
                          <div className="mt-3 pt-2 border-t border-border/40">
                            <Badge className="bg-amber-100 text-amber-900 border-none text-[10px] flex items-center gap-1 w-full justify-center">
                              <Moon className="h-3 w-3" />
                              <span>Ca đêm (+{draftConfig.nightSurchargePercent}% phụ phí)</span>
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Daily Schedule & Cleaning Buffer Preview Strip */}
                <div className="rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 space-y-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <h3 className="font-serif text-lg font-normal text-foreground">
                        Preview{" "}
                        <span className="font-script text-xl text-[#C48443] font-normal not-italic px-0.5 inline-block -rotate-1 align-baseline">
                          lịch hoạt động
                        </span>{" "}
                        & Thời gian dọn phòng
                      </h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Chuẩn cleaning buffer: <strong>{draftConfig.fixedCleaningBufferMinutes} phút</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {draftConfig.fixedSlots
                      .filter((s) => s.isActive)
                      .sort(
                        (a, b) =>
                          parseSlotRangeMinutes(a.startTime, a.endTime).startMins -
                          parseSlotRangeMinutes(b.startTime, b.endTime).startMins,
                      )
                      .map((s, idx, arr) => {
                        const currRange = parseSlotRangeMinutes(
                          s.startTime,
                          s.endTime,
                        );
                        const nextSlot = arr[idx + 1];
                        const nextRange = nextSlot
                          ? parseSlotRangeMinutes(
                              nextSlot.startTime,
                              nextSlot.endTime,
                            )
                          : null;
                        const gapMins = nextRange
                          ? nextRange.startMins - currRange.endMins
                          : null;

                        return (
                          <React.Fragment key={s.id}>
                            <div className="rounded-2xl border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-xs shadow-2xs">
                              <p className="font-bold text-primary tabular-nums text-sm">
                                {s.startTime} – {s.endTime}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                #{s.slotNumber} · {s.label || "Ca hoạt động"}
                              </p>
                            </div>

                            {gapMins !== null && (
                              <div
                                className={cn(
                                  "rounded-xl border px-3 py-1.5 text-[11px] font-semibold shrink-0 shadow-2xs",
                                  gapMins < 0
                                    ? "border-red-400 bg-red-100 text-red-800"
                                    : gapMins < draftConfig.fixedCleaningBufferMinutes
                                    ? "border-amber-400 bg-amber-100 text-amber-900"
                                    : "border-border bg-muted/40 text-muted-foreground",
                                )}
                              >
                                {gapMins < 0
                                  ? `Trùng ${Math.abs(gapMins)}p!`
                                  : `🧹 Dọn ${gapMins}p`}
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: BẢNG GIÁ & MÔ PHỎNG BÁO GIÁ */}
            {/* ========================================================================= */}
            {activeTab === "pricing" && (
              <div
                id="config-panel-pricing"
                role="tabpanel"
                aria-labelledby="config-tab-pricing"
                className="space-y-6 animate-in fade-in-50 duration-200"
              >
                {/* Section Header with Keyword Accent */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-normal text-foreground tracking-tight">
                      Thiết lập{" "}
                      <span className="font-script text-3xl sm:text-4xl text-[#C48443] font-normal not-italic px-1 inline-block -rotate-1 align-baseline">
                        bảng giá
                      </span>{" "}
                      & Phụ phí đêm
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Công thức báo giá Authoritative Pricing Engine đồng bộ trực tiếp tới Client API ({draftConfig.currency}).
                    </p>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-none text-xs font-semibold px-3 py-1">
                    UI-9.3 · Pricing Engine
                  </Badge>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] items-start">
                  {/* Left: 4 Core Pricing Inputs */}
                  <div className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-7 shadow-xs space-y-5">
                    <h3 className="font-serif text-lg font-normal text-foreground border-b border-border/60 pb-3">
                      Đơn giá cơ sở theo chế độ
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                          Giá gói Fixed Slot (VND / 3h)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={10000}
                          value={draftConfig.fixedBasePrice}
                          onChange={(e) =>
                            setDraftConfig({
                              ...draftConfig,
                              fixedBasePrice: Number(e.target.value),
                            })
                          }
                          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-base font-bold text-foreground tabular-nums focus:border-primary focus:outline-none"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Áp dụng cho mọi slot cố định không có giá riêng.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                          Đơn giá Custom Time (VND / 1h)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={5000}
                          value={draftConfig.customHourlyPrice}
                          onChange={(e) =>
                            setDraftConfig({
                              ...draftConfig,
                              customHourlyPrice: Number(e.target.value),
                            })
                          }
                          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-base font-bold text-foreground tabular-nums focus:border-primary focus:outline-none"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          3 giờ Custom = {formatVnd(draftConfig.customHourlyPrice * 3)}.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                          Giá lưu trú Qua đêm (VND / 1 đêm)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={20000}
                          value={draftConfig.overnightPrice}
                          onChange={(e) =>
                            setDraftConfig({
                              ...draftConfig,
                              overnightPrice: Number(e.target.value),
                            })
                          }
                          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-base font-bold text-foreground tabular-nums focus:border-primary focus:outline-none"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Bảng giá theo đêm độc lập (Overnight model).
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                          Phụ phí khung giờ đêm (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={200}
                            step={5}
                            value={draftConfig.nightSurchargePercent}
                            onChange={(e) =>
                              setDraftConfig({
                                ...draftConfig,
                                nightSurchargePercent: Number(e.target.value),
                              })
                            }
                            className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-base font-bold text-foreground tabular-nums focus:border-primary focus:outline-none pr-8"
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                            %
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Áp dụng từ {draftConfig.nightWindowStart} đến {draftConfig.nightWindowEnd}.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Live Quote Simulator */}
                  <div className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-7 shadow-xs space-y-5">
                    <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h3 className="font-serif text-lg font-normal text-foreground">
                        Mô phỏng{" "}
                        <span className="font-script text-xl text-[#C48443] font-normal not-italic px-0.5 inline-block -rotate-1 align-baseline">
                          báo giá
                        </span>{" "}
                        khách hàng
                      </h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-2xl bg-muted/30 p-3.5 text-xs">
                        <div>
                          <p className="font-semibold text-foreground">Fixed Slot (3h Ban ngày)</p>
                          <p className="text-[11px] text-muted-foreground">Giá gói tiêu chuẩn</p>
                        </div>
                        <span className="font-bold text-base text-foreground tabular-nums">
                          {formatVnd(draftConfig.fixedBasePrice)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs">
                        <div>
                          <p className="font-semibold text-amber-900">Fixed Slot (Ca đêm +{draftConfig.nightSurchargePercent}%)</p>
                          <p className="text-[11px] text-amber-800">Đã cộng phụ phí đêm</p>
                        </div>
                        <span className="font-bold text-base text-amber-900 tabular-nums">
                          {formatVnd(
                            Math.round(
                              (draftConfig.fixedBasePrice *
                                (1 + draftConfig.nightSurchargePercent / 100)) /
                                1000,
                            ) * 1000,
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl bg-muted/30 p-3.5 text-xs">
                        <div>
                          <p className="font-semibold text-foreground">Custom Time (3h Linh hoạt)</p>
                          <p className="text-[11px] text-muted-foreground">3h × {formatVnd(draftConfig.customHourlyPrice)}</p>
                        </div>
                        <span className="font-bold text-base text-foreground tabular-nums">
                          {formatVnd(draftConfig.customHourlyPrice * 3)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl bg-muted/30 p-3.5 text-xs">
                        <div>
                          <p className="font-semibold text-foreground">Overnight (1 đêm lưu trú)</p>
                          <p className="text-[11px] text-muted-foreground">Bao gồm vệ sinh buồng phòng</p>
                        </div>
                        <span className="font-bold text-base text-primary tabular-nums">
                          {formatVnd(draftConfig.overnightPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: KHÓA PHÒNG VẬT LÝ */}
            {/* ========================================================================= */}
            {activeTab === "rooms" && (
              <div
                id="config-panel-rooms"
                role="tabpanel"
                aria-labelledby="config-tab-rooms"
                className="space-y-6 animate-in fade-in-50 duration-200"
              >
                {/* Section Header with Keyword Accent */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-normal text-foreground tracking-tight">
                      Quản lý{" "}
                      <span className="font-script text-3xl sm:text-4xl text-[#C48443] font-normal not-italic px-1 inline-block -rotate-1 align-baseline">
                        khóa phòng
                      </span>{" "}
                      vật lý ({roomsForSelectedType.length} phòng)
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Điều khiển trạng thái bảo trì (is_blocked) của từng phòng vật lý thuộc hạng {selectedRoomType?.name}.
                    </p>
                  </div>

                  <Badge
                    className={cn(
                      "border-none text-xs font-semibold px-3 py-1",
                      actorRole === "ADMIN"
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-amber-100 text-amber-900",
                    )}
                  >
                    {actorRole === "ADMIN" ? "ADMIN: Toàn quyền thao tác" : "MANAGER: Chế độ chỉ xem"}
                  </Badge>
                </div>

                {actorRole !== "ADMIN" && (
                  <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                    <Lock className="h-4 w-4 text-amber-700 shrink-0" />
                    <span>
                      Bạn đang thao tác với quyền <strong>MANAGER</strong>. Theo quy chuẩn bảo mật Stage 6 / UI-9.4, Manager chỉ được xem trạng thái phòng. Để Khóa hoặc Mở khóa, vui lòng đổi quyền sang <strong>ADMIN</strong> ở thanh tiêu đề.
                    </span>
                  </div>
                )}

                {blockError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                    {blockError}
                  </div>
                )}

                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {roomsForSelectedType.map((room) => (
                    <div
                      key={room.id}
                      className={cn(
                        "flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all duration-200 shadow-2xs",
                        room.isBlocked
                          ? "border-red-200 bg-red-50/40"
                          : "border-border/80 bg-surface",
                      )}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <Badge className="bg-primary/10 text-primary border-none text-xs font-bold px-2.5 py-0.5">
                            Phòng {room.roomNumber}
                          </Badge>
                          <span className="text-xs text-muted-foreground">Tầng {room.floor}</span>
                        </div>

                        <div>
                          <p className="font-semibold text-sm text-foreground">{room.name}</p>
                          <p className="text-[11px] text-muted-foreground">{selectedProperty.name}</p>
                        </div>

                        <div className="pt-2 border-t border-border/50">
                          {room.isBlocked ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                              <Ban className="h-3.5 w-3.5" />
                              <span>BLOCKED (Đang khóa bảo trì)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>AVAILABLE (Đang mở bán)</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/40">
                        {actorRole === "ADMIN" ? (
                          room.isBlocked ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void handleConfirmRoomBlockToggle(room, false)}
                              className="w-full rounded-full border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold"
                            >
                              <Unlock className="mr-1.5 h-3.5 w-3.5" />
                              <span>Mở khóa phòng</span>
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setPendingBlockRoom(room)}
                              className="w-full rounded-full border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold"
                            >
                              <Ban className="mr-1.5 h-3.5 w-3.5" />
                              <span>Khóa phòng (Block)</span>
                            </Button>
                          )
                        ) : (
                          <div className="text-center py-1 text-[11px] text-muted-foreground italic">
                            Chỉ ADMIN được khóa/mở
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Errors & Warnings Notice */}
            {(!liveValidation.isValid || liveValidation.warnings.length > 0) && (
              <div className="space-y-2 text-xs pt-2">
                {liveValidation.errors.map((err, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-red-700"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{err}</span>
                  </div>
                ))}
                {liveValidation.warnings.map((warn, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-amber-900"
                  >
                    <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Sticky Bottom Save Action Bar */}
            <div className="sticky bottom-4 z-20 rounded-2xl border border-border/80 bg-surface/95 backdrop-blur-md p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-4 w-4 text-primary shrink-0" />
                <span>
                  {liveValidation.isValid
                    ? `Dữ liệu cấu hình cho ${selectedRoomType?.name} hợp lệ. Nhấn Lưu để cập nhật tức thì toàn hệ thống.`
                    : "Phát hiện quy chuẩn chưa hợp lệ. Vui lòng kiểm tra các cảnh báo đỏ phía trên."}
                </span>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Button
                  size="default"
                  disabled={!liveValidation.isValid || isSaving}
                  onClick={handleSaveConfig}
                  className="rounded-full px-7 font-semibold text-xs shadow-md"
                >
                  <Save className="mr-1.5 h-4 w-4" />
                  <span>
                    {isSaving ? "Đang lưu cấu hình..." : `Lưu cấu hình (${selectedRoomType?.name})`}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog when ADMIN blocks a physical room (UI-9.4) */}
      <Dialog
        open={Boolean(pendingBlockRoom)}
        onOpenChange={(open) => {
          if (!open) setPendingBlockRoom(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận khóa phòng vật lý</DialogTitle>
            <DialogDescription>
              Bạn đang chuẩn bị chuyển trạng thái <code>rooms.is_blocked = true</code> cho phòng{" "}
              <strong>{pendingBlockRoom?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-1.5 leading-relaxed">
            <p className="font-semibold">Tác động nghiệp vụ tức thì:</p>
            <p>
              • Phòng này sẽ bị vô hiệu hóa nút đặt chỗ trên danh sách phòng của khách hàng.
            </p>
            <p>
              • Mọi yêu cầu tạo đặt phòng mới cho phòng này sẽ bị chặn cho đến khi ADMIN mở khóa lại.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingBlockRoom(null)}
              className="rounded-full"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (pendingBlockRoom) {
                  void handleConfirmRoomBlockToggle(pendingBlockRoom, true);
                }
              }}
              className="rounded-full bg-red-600 hover:bg-red-700 text-white"
            >
              <Ban className="mr-1.5 h-4 w-4" />
              <span>Xác nhận Khóa phòng</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
