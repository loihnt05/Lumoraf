import type {
  AdminFixedSlotConfig,
  RoomTypeBookingConfig,
} from "../types/booking-config";
import {
  DEFAULT_BOOKING_CONFIG,
  DEFAULT_FIXED_SLOTS_TEMPLATE,
} from "../types/booking-config";

const CONFIG_STORAGE_KEY = "lumora_admin_roomtype_configs_v1";

function cloneSlots(slots: AdminFixedSlotConfig[]): AdminFixedSlotConfig[] {
  return slots.map((s) => ({ ...s }));
}

function createInitialConfigs(): Record<string, RoomTypeBookingConfig> {
  return {
    // Deluxe Room (299K base)
    "rt-dl-deluxe": {
      ...DEFAULT_BOOKING_CONFIG,
      roomTypeId: "rt-dl-deluxe",
      fixedBasePrice: 299000,
      customHourlyPrice: 115000,
      overnightPrice: 837000,
      fixedSlots: cloneSlots(DEFAULT_FIXED_SLOTS_TEMPLATE),
    },
    // Luxury Suite (399K base)
    "rt-dl-luxury": {
      ...DEFAULT_BOOKING_CONFIG,
      roomTypeId: "rt-dl-luxury",
      fixedBasePrice: 399000,
      customHourlyPrice: 153000,
      overnightPrice: 1117000,
      fixedSlots: cloneSlots(DEFAULT_FIXED_SLOTS_TEMPLATE),
    },
    // Forest Villa (499K base, Fixed slot disabled initially)
    "rt-dl-villa": {
      ...DEFAULT_BOOKING_CONFIG,
      roomTypeId: "rt-dl-villa",
      fixedEnabled: false,
      customEnabled: true,
      overnightEnabled: true,
      fixedBasePrice: 499000,
      customHourlyPrice: 191000,
      overnightPrice: 1397000,
      fixedSlots: cloneSlots(DEFAULT_FIXED_SLOTS_TEMPLATE),
    },
    // Minimal Studio (249K base, Overnight disabled initially)
    "rt-sg-studio": {
      ...DEFAULT_BOOKING_CONFIG,
      roomTypeId: "rt-sg-studio",
      fixedEnabled: true,
      customEnabled: true,
      overnightEnabled: false,
      fixedBasePrice: 249000,
      customHourlyPrice: 95000,
      overnightPrice: 697000,
      fixedSlots: cloneSlots(DEFAULT_FIXED_SLOTS_TEMPLATE),
    },
    // Courtyard Loft (349K base)
    "rt-sg-loft": {
      ...DEFAULT_BOOKING_CONFIG,
      roomTypeId: "rt-sg-loft",
      fixedBasePrice: 349000,
      customHourlyPrice: 134000,
      overnightPrice: 977000,
      fixedSlots: cloneSlots(DEFAULT_FIXED_SLOTS_TEMPLATE),
    },
  };
}

let memoryConfigs: Record<string, RoomTypeBookingConfig> = createInitialConfigs();

function readConfigsMap(): Record<string, RoomTypeBookingConfig> {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return memoryConfigs;
  }
  try {
    const raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return memoryConfigs;
    const parsed = JSON.parse(raw) as Record<string, RoomTypeBookingConfig>;
    memoryConfigs = { ...createInitialConfigs(), ...parsed };
    return memoryConfigs;
  } catch {
    return memoryConfigs;
  }
}

function writeConfigsMap(map: Record<string, RoomTypeBookingConfig>): void {
  memoryConfigs = { ...map };
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    try {
      window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(map));
      window.dispatchEvent(new Event("lumora_config_change"));
    } catch {
      // Ignore quota errors
    }
  }
}

export function resetAllRoomTypeConfigsForTest(): void {
  memoryConfigs = createInitialConfigs();
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    window.localStorage.removeItem(CONFIG_STORAGE_KEY);
  }
}

export function parseSlotRangeMinutes(
  startTime: string,
  endTime: string,
): { startMins: number; endMins: number } {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMins = (sh || 0) * 60 + (sm || 0);
  let endMins = (eh || 0) * 60 + (em || 0);
  // Treat 00:00 or end <= start as crossing into midnight (1440+)
  if (endMins <= startMins) {
    endMins += 1440;
  }
  return { startMins, endMins };
}

export function isSlotTouchingNightWindow(
  startTime: string,
  endTime: string,
  nightStart: string = "23:00",
  nightEnd: string = "06:00",
): boolean {
  const { startMins, endMins } = parseSlotRangeMinutes(startTime, endTime);
  const [nsh, nsm] = nightStart.split(":").map(Number);
  const [neh, nem] = nightEnd.split(":").map(Number);
  const nightStartMins = (nsh || 23) * 60 + (nsm || 0);
  const nightEndMins = (neh || 6) * 60 + (nem || 0);

  for (let m = startMins; m < endMins; m += 15) {
    const tod = m % 1440;
    if (tod >= nightStartMins || tod < nightEndMins) {
      return true;
    }
  }
  return false;
}

export type ConfigValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

export function validateAdminBookingConfig(
  config: RoomTypeBookingConfig,
): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.fixedEnabled && !config.customEnabled && !config.overnightEnabled) {
    errors.push("Phải bật ít nhất 1 hình thức lưu trú (Fixed, Custom hoặc Overnight).");
  }

  // 1. Duration & Buffer validations (UI-9.1)
  if (config.fixedDurationMinutes <= 0) {
    errors.push("Thời lượng Fixed Slot phải lớn hơn 0 phút.");
  }
  if (config.fixedCleaningBufferMinutes < 0) {
    errors.push("Cleaning buffer của Fixed Slot không được âm.");
  }
  if (config.customStepMinutes <= 0) {
    errors.push("Bước nhảy thời gian Custom Time phải lớn hơn 0 phút.");
  }
  if (config.customMinDurationMinutes <= 0) {
    errors.push("Thời lượng tối thiểu Custom Time phải lớn hơn 0 phút.");
  }
  if (
    config.customStepMinutes > 0 &&
    config.customMinDurationMinutes % config.customStepMinutes !== 0
  ) {
    errors.push(
      `Thời lượng tối thiểu Custom (${config.customMinDurationMinutes} phút) phải chia hết cho bước nhảy (${config.customStepMinutes} phút).`,
    );
  }
  if (
    config.customMaxDurationMinutes !== null &&
    config.customMaxDurationMinutes < config.customMinDurationMinutes
  ) {
    errors.push("Thời lượng tối đa Custom không được nhỏ hơn thời lượng tối thiểu.");
  }
  if (config.customCleaningBufferMinutes < 0) {
    errors.push("Cleaning buffer của Custom Time không được âm.");
  }
  if (config.overnightCleaningBufferMinutes < 0) {
    errors.push("Cleaning buffer của Overnight không được âm.");
  }

  // 2. Pricing validations (UI-9.3)
  if (config.fixedBasePrice < 0) {
    errors.push("Giá cơ bản Fixed Slot không được âm.");
  }
  if (config.customHourlyPrice < 0) {
    errors.push("Đơn giá theo giờ Custom Time không được âm.");
  }
  if (config.overnightPrice < 0) {
    errors.push("Giá qua đêm Overnight không được âm.");
  }
  if (config.nightSurchargePercent < 0 || config.nightSurchargePercent > 200) {
    errors.push("Phần trăm phụ phí đêm phải nằm trong khoảng 0% – 200%.");
  }

  // 3. Fixed Slot Overlap & Cleaning Buffer Schedule validations (UI-9.2)
  const activeSlots = config.fixedSlots.filter((s) => s.isActive);
  if (config.fixedEnabled && activeSlots.length === 0) {
    errors.push("Chế độ Fixed Slot đang bật nhưng chưa có slot nào được kích hoạt.");
  }

  for (const s of config.fixedSlots) {
    if (s.priceOverride !== null && s.priceOverride < 0) {
      errors.push(`Giá ghi đè của ${s.label || `Slot ${s.slotNumber}`} không được âm.`);
    }
  }

  const parsedActive = activeSlots
    .map((slot) => ({
      slot,
      ...parseSlotRangeMinutes(slot.startTime, slot.endTime),
    }))
    .sort((a, b) => a.startMins - b.startMins);

  for (let i = 0; i < parsedActive.length; i++) {
    const curr = parsedActive[i];
    if (curr.endMins - curr.startMins <= 0) {
      errors.push(
        `Slot ${curr.slot.slotNumber} (${curr.slot.startTime}–${curr.slot.endTime}) có thời lượng không hợp lệ.`,
      );
    }

    for (let j = i + 1; j < parsedActive.length; j++) {
      const next = parsedActive[j];
      // Direct time overlap between two active slots -> blocking error!
      if (curr.startMins < next.endMins && curr.endMins > next.startMins) {
        errors.push(
          `Hai slot đang bật bị trùng giờ nhau: Slot ${curr.slot.slotNumber} (${curr.slot.startTime}–${curr.slot.endTime}) và Slot ${next.slot.slotNumber} (${next.slot.startTime}–${next.slot.endTime}).`,
        );
      } else if (next.startMins - curr.endMins < config.fixedCleaningBufferMinutes) {
        // Insufficient cleaning buffer gap between consecutive active slots -> warning!
        const gap = next.startMins - curr.endMins;
        warnings.push(
          `Khoảng nghỉ giữa Slot ${curr.slot.slotNumber} (kết thúc ${curr.slot.endTime}) và Slot ${next.slot.slotNumber} (bắt đầu ${next.slot.startTime}) là ${gap} phút — nhỏ hơn chuẩn Cleaning Buffer (${config.fixedCleaningBufferMinutes} phút).`,
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export async function getRoomTypeBookingConfig(
  roomTypeId: string,
): Promise<RoomTypeBookingConfig> {
  await new Promise((resolve) => setTimeout(resolve, 40));
  const map = readConfigsMap();
  const found = map[roomTypeId];
  if (found) {
    return {
      ...found,
      fixedSlots: cloneSlots(found.fixedSlots ?? DEFAULT_FIXED_SLOTS_TEMPLATE),
    };
  }
  return {
    ...DEFAULT_BOOKING_CONFIG,
    roomTypeId,
    fixedSlots: cloneSlots(DEFAULT_FIXED_SLOTS_TEMPLATE),
  };
}

export function getRoomTypeBookingConfigSync(
  roomTypeId: string,
): RoomTypeBookingConfig {
  const map = readConfigsMap();
  const found = map[roomTypeId];
  if (found) {
    return {
      ...found,
      fixedSlots: cloneSlots(found.fixedSlots ?? DEFAULT_FIXED_SLOTS_TEMPLATE),
    };
  }
  return {
    ...DEFAULT_BOOKING_CONFIG,
    roomTypeId,
    fixedSlots: cloneSlots(DEFAULT_FIXED_SLOTS_TEMPLATE),
  };
}

export async function updateRoomTypeBookingConfig(
  config: RoomTypeBookingConfig,
): Promise<
  | { ok: true; config: RoomTypeBookingConfig; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[] }
> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const validation = validateAdminBookingConfig(config);
  if (!validation.isValid) {
    return {
      ok: false,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  const map = readConfigsMap();
  const saved: RoomTypeBookingConfig = {
    ...config,
    fixedSlots: cloneSlots(config.fixedSlots),
  };
  map[config.roomTypeId] = saved;
  writeConfigsMap(map);

  return {
    ok: true,
    config: saved,
    warnings: validation.warnings,
  };
}
