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
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}₫`;
}

export default function AdminBookingConfigPage() {
  const roomTypeList = React.useMemo(() => Object.values(MOCK_ROOM_TYPES), []);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = React.useState<string>(
    roomTypeList[0]?.id ?? "rt-dl-deluxe",
  );

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

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Admin Top Header & Role Simulator */}
      <div className="flex flex-col gap-4 border-b border-border/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-widest text-primary">
              Stage UI-9 · Admin Configuration
            </span>
            <span>/</span>
            <span>Room Types</span>
            <span>/</span>
            <span className="font-semibold text-foreground">
              {selectedRoomType?.name}
            </span>
          </div>
          <h1 className="text-display text-3xl sm:text-4xl font-normal tracking-tight text-foreground">
            Cấu hình Thời gian, Bảng giá & Khóa phòng
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            Điều chỉnh quy tắc đặt phòng theo từng hạng phòng (`RoomType`) và quản lý trạng thái khóa bảo trì (`is_blocked`) của từng phòng vật lý mà không cần deploy lại giao diện.
          </p>
        </div>

        {/* Role Switcher (ADMIN vs MANAGER) & Actions */}
        <div className="flex flex-wrap items-center gap-3">
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
                "rounded-full px-3.5 py-1.5 font-semibold transition-colors",
                actorRole === "ADMIN"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Quyền: ADMIN
            </button>
            <button
              type="button"
              onClick={() => {
                setActorRole("MANAGER");
                setBlockError(null);
              }}
              className={cn(
                "rounded-full px-3.5 py-1.5 font-semibold transition-colors",
                actorRole === "MANAGER"
                  ? "bg-amber-700 text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Quyền: MANAGER (Xem)
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetAllDefaults}
            className="rounded-full"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            <span>Reset mặc định</span>
          </Button>

          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href={`/booking/${sampleRoomId}`}>
              <span>Xem trang khách hàng</span>
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. RoomType Selector Tabs */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Chọn Hạng phòng (RoomType) cần cấu hình
        </label>
        <div className="flex flex-wrap gap-2">
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
                  "flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-left text-xs transition-all",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/80 bg-surface text-foreground hover:border-primary/50",
                )}
              >
                <div>
                  <p className="font-semibold">{rt.name}</p>
                  <p
                    className={cn(
                      "text-[10px]",
                      isSelected
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground",
                    )}
                  >
                    {prop?.city} · Tối đa {rt.maxGuests} khách · {rt.sizeM2}m²
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Feedback & Validation Banner */}
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

      {isLoading || !draftConfig ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 w-full rounded-3xl" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr] items-start">
          {/* LEFT COLUMN: UI-9.1 Mode/Time Config & UI-9.2 Fixed Slot Editor */}
          <div className="space-y-8">
            {/* SECTION UI-9.1: Booking Mode Toggles & Time Rules */}
            <section className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <Settings2 className="h-5 w-5 text-primary" />
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                      UI-9.1 · Feature & Time Rules
                    </span>
                    <h2 className="text-heading text-xl font-medium text-foreground">
                      Chế độ lưu trú & Quy chuẩn thời gian
                    </h2>
                  </div>
                </div>
                <Badge className="bg-muted text-foreground border-none text-xs">
                  {selectedProperty.name}
                </Badge>
              </div>

              {/* 1. Fixed Slot Mode Config */}
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      1. Fixed Slot (Khung giờ cố định)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Chia sẵn các ca trong ngày (mặc định 3 giờ/slot) kèm thời gian dọn phòng.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftConfig.fixedEnabled}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          fixedEnabled: e.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-[#334A40] rounded"
                    />
                    <span className="text-xs font-semibold text-foreground">
                      {draftConfig.fixedEnabled ? "Đang BẬT (ON)" : "Đang TẮT (OFF)"}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Thời lượng chuẩn (phút)
                    </label>
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
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
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
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Custom Time Mode Config */}
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      2. Custom Time (Giờ tự chọn linh hoạt)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Khách tự chọn giờ nhận & trả phòng theo bước nhảy cố định.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftConfig.customEnabled}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          customEnabled: e.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-[#334A40] rounded"
                    />
                    <span className="text-xs font-semibold text-foreground">
                      {draftConfig.customEnabled ? "Đang BẬT (ON)" : "Đang TẮT (OFF)"}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
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
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
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
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
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
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Cleaning buffer (phút)
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
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Overnight Mode & Night Window Config */}
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      3. Overnight & Khung giờ đêm (Night Window)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Cấu hình lưu trú qua đêm và khung giờ áp dụng phụ phí đêm.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftConfig.overnightEnabled}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          overnightEnabled: e.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-[#334A40] rounded"
                    />
                    <span className="text-xs font-semibold text-foreground">
                      {draftConfig.overnightEnabled ? "Đang BẬT (ON)" : "Đang TẮT (OFF)"}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
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
                      className="w-full rounded-xl border border-border bg-surface px-2.5 py-2 text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
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
                      className="w-full rounded-xl border border-border bg-surface px-2.5 py-2 text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Buffer qua đêm (p)
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
                      className="w-full rounded-xl border border-border bg-surface px-2.5 py-2 text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
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
                      className="w-full rounded-xl border border-border bg-surface px-2.5 py-2 text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
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
                      className="w-full rounded-xl border border-border bg-surface px-2.5 py-2 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION UI-9.2: Fixed Slot Schedule Editor */}
            <section className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                      UI-9.2 · Fixed Slot Editor
                    </span>
                    <h2 className="text-heading text-xl font-medium text-foreground">
                      Danh sách khung giờ cố định & Preview lịch
                    </h2>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSlot}
                  className="rounded-full"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  <span>Thêm slot mới</span>
                </Button>
              </div>

              {/* Slots Table / Rows */}
              <div className="space-y-3">
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
                        "rounded-2xl border p-4 transition-colors space-y-3",
                        slot.isActive
                          ? "border-border/90 bg-surface"
                          : "border-border/50 bg-muted/30 opacity-70",
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={slot.isActive}
                            onChange={(e) =>
                              handleUpdateSlot(slot.id, {
                                isActive: e.target.checked,
                              })
                            }
                            className="h-4 w-4 accent-[#334A40] rounded"
                          />
                          <Badge className="bg-primary/10 text-primary border-none text-xs font-semibold">
                            Slot #{slot.slotNumber}
                          </Badge>
                          <input
                            type="text"
                            value={slot.label ?? ""}
                            placeholder="Nhãn hiển thị (tùy chọn)"
                            onChange={(e) =>
                              handleUpdateSlot(slot.id, { label: e.target.value })
                            }
                            className="rounded-lg border border-border/70 bg-muted/20 px-2.5 py-1 text-xs font-medium text-foreground"
                          />
                          {touchesNight && (
                            <Badge className="bg-amber-100 text-amber-900 border-none text-[10px] flex items-center gap-1">
                              <Moon className="h-3 w-3" />
                              <span>Chạm giờ đêm (+{draftConfig.nightSurchargePercent}%)</span>
                            </Badge>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteSlot(slot.id)}
                          title="Xóa slot này"
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                            Giờ bắt đầu
                          </label>
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) =>
                              handleUpdateSlot(slot.id, {
                                startTime: e.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                            Giờ kết thúc
                          </label>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) =>
                              handleUpdateSlot(slot.id, {
                                endTime: e.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                            Giá ghi đè (Trống = Giá chuẩn)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={10000}
                            placeholder={`Mặc định (${formatVnd(draftConfig.fixedBasePrice)})`}
                            value={slot.priceOverride ?? ""}
                            onChange={(e) =>
                              handleUpdateSlot(slot.id, {
                                priceOverride:
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value),
                              })
                            }
                            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Daily Schedule & Cleaning Buffer Preview Strip */}
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    Preview lịch hoạt động & Cleaning Buffer trong ngày
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Buffer chuẩn: {draftConfig.fixedCleaningBufferMinutes} phút
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                          <div className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs">
                            <p className="font-bold text-primary tabular-nums">
                              {s.startTime} – {s.endTime}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Slot #{s.slotNumber}
                            </p>
                          </div>

                          {gapMins !== null && (
                            <div
                              className={cn(
                                "rounded-lg border border-dashed px-2.5 py-1.5 text-[10px] font-medium",
                                gapMins < 0
                                  ? "border-red-400 bg-red-100 text-red-800"
                                  : gapMins < draftConfig.fixedCleaningBufferMinutes
                                  ? "border-amber-400 bg-amber-100 text-amber-900"
                                  : "border-border bg-surface text-muted-foreground",
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
            </section>
          </div>

          {/* RIGHT COLUMN: UI-9.3 Pricing Editor & UI-9.4 Room Blocking Control */}
          <div className="space-y-8">
            {/* SECTION UI-9.3: Authoritative Pricing Editor */}
            <section className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                      UI-9.3 · Authoritative Pricing Engine
                    </span>
                    <h2 className="text-heading text-xl font-medium text-foreground">
                      Bảng giá & Phụ phí đêm ({draftConfig.currency})
                    </h2>
                  </div>
                </div>
                <Badge className="bg-primary/10 text-primary border-none text-xs font-semibold">
                  {draftConfig.currency}
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Giá gói Fixed Slot chuẩn (VND / 3h)
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
                    className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-bold text-foreground"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Áp dụng cho mọi slot cố định không có giá ghi đè.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Đơn giá Custom Time (VND / 1 giờ)
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
                    className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-bold text-foreground"
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
                    className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-bold text-foreground"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Mô hình tính giá riêng biệt theo số đêm lưu trú.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Phụ phí khung giờ đêm (%)
                  </label>
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
                    className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-bold text-foreground"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Áp dụng cho khung giờ {draftConfig.nightWindowStart} –{" "}
                    {draftConfig.nightWindowEnd}.
                  </p>
                </div>
              </div>

              {/* Live Quote Preview Card */}
              <div className="rounded-2xl border border-border/70 bg-muted/25 p-4 space-y-2.5 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Preview Báo giá Khách hàng (Quote API Output)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-xl bg-surface p-2.5 border border-border/60">
                    <span className="text-[10px] text-muted-foreground block">
                      Fixed 3h (Ban ngày)
                    </span>
                    <span className="font-bold text-foreground">
                      {formatVnd(draftConfig.fixedBasePrice)}
                    </span>
                  </div>
                  <div className="rounded-xl bg-surface p-2.5 border border-border/60">
                    <span className="text-[10px] text-muted-foreground block">
                      Fixed 3h (Ca đêm +{draftConfig.nightSurchargePercent}%)
                    </span>
                    <span className="font-bold text-amber-800">
                      {formatVnd(
                        Math.round(
                          (draftConfig.fixedBasePrice *
                            (1 + draftConfig.nightSurchargePercent / 100)) /
                            1000,
                        ) * 1000,
                      )}
                    </span>
                  </div>
                  <div className="rounded-xl bg-surface p-2.5 border border-border/60">
                    <span className="text-[10px] text-muted-foreground block">
                      Custom 3h (Linh hoạt)
                    </span>
                    <span className="font-bold text-foreground">
                      {formatVnd(draftConfig.customHourlyPrice * 3)}
                    </span>
                  </div>
                  <div className="rounded-xl bg-surface p-2.5 border border-border/60">
                    <span className="text-[10px] text-muted-foreground block">
                      Overnight (1 đêm)
                    </span>
                    <span className="font-bold text-foreground">
                      {formatVnd(draftConfig.overnightPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Validation Errors / Warnings before Save */}
              {(!liveValidation.isValid || liveValidation.warnings.length > 0) && (
                <div className="space-y-2 text-xs">
                  {liveValidation.errors.map((err, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700"
                    >
                      <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{err}</span>
                    </div>
                  ))}
                  {liveValidation.warnings.map((warn, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900"
                    >
                      <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Save Configuration Button */}
              <Button
                size="lg"
                disabled={!liveValidation.isValid || isSaving}
                onClick={handleSaveConfig}
                className="w-full justify-center rounded-full text-base font-medium shadow-md"
              >
                <Save className="mr-2 h-4 w-4" />
                <span>
                  {isSaving
                    ? "Đang lưu cấu hình..."
                    : `Lưu cấu hình cho ${selectedRoomType?.name}`}
                </span>
              </Button>
            </section>

            {/* SECTION UI-9.4: Physical Room Blocking Control (rooms.is_blocked) */}
            <section className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                      UI-9.4 · Room Blocking Control (rooms.is_blocked)
                    </span>
                    <h2 className="text-heading text-xl font-medium text-foreground">
                      Quản lý Khóa phòng vật lý ({roomsForSelectedType.length} phòng)
                    </h2>
                  </div>
                </div>

                <Badge
                  className={cn(
                    "border-none text-[10px] font-semibold",
                    actorRole === "ADMIN"
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-amber-100 text-amber-900",
                  )}
                >
                  {actorRole === "ADMIN" ? "ADMIN: Toàn quyền" : "MANAGER: Chỉ xem"}
                </Badge>
              </div>

              {actorRole !== "ADMIN" && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
                  <Lock className="h-4 w-4 text-amber-700 shrink-0" />
                  <span>
                    Bạn đang ở chế độ <strong>MANAGER</strong>. Theo quy tắc bảo mật P2.6 / UI-9.4, Manager chỉ được xem trạng thái phòng chứ không thể tự ý Block/Unblock.
                  </span>
                </div>
              )}

              {blockError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {blockError}
                </div>
              )}

              <div className="space-y-3">
                {roomsForSelectedType.map((room) => (
                  <div
                    key={room.id}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 transition-colors",
                      room.isBlocked
                        ? "border-red-200 bg-red-50/40"
                        : "border-border/80 bg-muted/20",
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/10 text-primary border-none text-xs font-semibold">
                          {room.roomNumber}
                        </Badge>
                        <span className="text-sm font-semibold text-foreground">
                          {room.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          · Tầng {room.floor}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        {room.isBlocked ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                            <Ban className="h-3.5 w-3.5" />
                            <span>BLOCKED (is_blocked = true · Đang khóa bảo trì)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>AVAILABLE (is_blocked = false · Đang mở bán)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Admin-Only Action vs Manager Read-Only Badge */}
                    {actorRole === "ADMIN" ? (
                      room.isBlocked ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void handleConfirmRoomBlockToggle(room, false)
                          }
                          className="rounded-full border-emerald-300 text-emerald-800 hover:bg-emerald-50"
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
                          className="rounded-full border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <Ban className="mr-1.5 h-3.5 w-3.5" />
                          <span>Khóa phòng (Block)</span>
                        </Button>
                      )
                    ) : (
                      <Badge className="bg-muted text-muted-foreground border-none text-[11px]">
                        Chỉ ADMIN được thao tác
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

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
