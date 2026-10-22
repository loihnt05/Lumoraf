"use client";

import { useState } from "react";
import { Calendar, Clock, Sparkles, ChevronDown } from "lucide-react";
import type { BookingIntent, StayDuration } from "@/lib/availability/types";
import { cn } from "@/lib/utils";

const DURATION_OPTIONS: { value: StayDuration; label: string; desc: string }[] = [
  { value: "3h", label: "Fixed 3h", desc: "Ca 3 giờ tiết kiệm" },
  { value: "6h", label: "Slot 6h", desc: "Ca 6 giờ nghỉ ngơi" },
  { value: "overnight", label: "Qua đêm", desc: "Check-in tối đến sáng" },
  { value: "custom", label: "Tự chọn", desc: "Tự chọn số giờ" },
];

const TIME_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

interface Props {
  intent: BookingIntent;
  onIntentChange: (intent: BookingIntent) => void;
}

export function BookingIntentBar({ intent, onIntentChange }: Props) {
  const [durationOpen, setDurationOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [customHours, setCustomHours] = useState(intent.customHours ?? 4);

  const update = (patch: Partial<BookingIntent>) =>
    onIntentChange({ ...intent, ...patch });

  const currentDurationObj =
    DURATION_OPTIONS.find((d) => d.value === intent.duration) ?? DURATION_OPTIONS[0];

  const currentDurationLabel =
    intent.duration === "custom"
      ? `${customHours} giờ tự chọn`
      : currentDurationObj.label;

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const selectedDateStr = intent.date.toISOString().split("T")[0];

  // Vietnamese date formatting
  const formattedDate = intent.date.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
  });

  return (
    <div className="rounded-3xl border border-border/80 bg-surface shadow-xs p-2 sm:p-2.5">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/60">
        {/* 1. Ngày nhận phòng */}
        <label className="group flex flex-col justify-center px-4 py-3 cursor-pointer hover:bg-muted/30 rounded-2xl transition-colors">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>Ngày nhận phòng</span>
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <input
              type="date"
              value={selectedDateStr}
              min={todayStr}
              onChange={(e) => {
                const d = new Date(e.target.value + "T00:00:00");
                if (!isNaN(d.getTime())) update({ date: d });
              }}
              className="w-full cursor-pointer bg-transparent text-sm font-semibold text-foreground focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-muted-foreground capitalize mt-0.5">
            {formattedDate}
          </p>
        </label>

        {/* 2. Giờ nhận phòng */}
        <div className="relative flex flex-col justify-center">
          <button
            type="button"
            onClick={() => {
              setTimeOpen((o) => !o);
              setDurationOpen(false);
            }}
            className="group flex w-full flex-col justify-center px-4 py-3 text-left hover:bg-muted/30 rounded-2xl transition-colors"
          >
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Giờ nhận phòng</span>
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {intent.checkIn}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  timeOpen && "rotate-180",
                )}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Bước nhảy 30 phút linh hoạt
            </p>
          </button>

          {/* Time Picker Dropdown */}
          {timeOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setTimeOpen(false)}
              />
              <div className="absolute top-full left-0 z-40 mt-1.5 max-h-60 w-48 overflow-y-auto rounded-2xl border border-border/80 bg-surface p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 mb-1">
                  Chọn giờ check-in
                </div>
                {TIME_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      update({ checkIn: t });
                      setTimeOpen(false);
                    }}
                    className={cn(
                      "w-full px-3 py-1.5 text-left text-xs font-semibold rounded-lg transition-colors tabular-nums flex items-center justify-between",
                      t === intent.checkIn
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    <span>{t}</span>
                    {t >= "23:00" || t <= "06:00" ? (
                      <span className="text-[9px] opacity-75 font-normal">Ca đêm</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 3. Hình thức lưu trú */}
        <div className="relative flex flex-col justify-center">
          <button
            type="button"
            onClick={() => {
              setDurationOpen((o) => !o);
              setTimeOpen(false);
            }}
            className="group flex w-full flex-col justify-center px-4 py-3 text-left hover:bg-muted/30 rounded-2xl transition-colors"
          >
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Hình thức lưu trú</span>
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-semibold text-foreground">
                {currentDurationLabel}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  durationOpen && "rotate-180",
                )}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {currentDurationObj.desc}
            </p>
          </button>

          {/* Duration Dropdown Menu */}
          {durationOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setDurationOpen(false)}
              />
              <div className="absolute top-full right-0 z-40 mt-1.5 w-56 overflow-hidden rounded-2xl border border-border/80 bg-surface p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 mb-1">
                  Chọn gói thời gian
                </div>
                {DURATION_OPTIONS.map((opt) => (
                  <div key={opt.value}>
                    <button
                      type="button"
                      onClick={() => {
                        update({
                          duration: opt.value,
                          customHours:
                            opt.value === "custom" ? customHours : undefined,
                        });
                        if (opt.value !== "custom") setDurationOpen(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left rounded-xl transition-colors",
                        intent.duration === opt.value
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-foreground hover:bg-muted",
                      )}
                    >
                      <p className="text-xs font-semibold leading-tight">{opt.label}</p>
                      <p className={cn("text-[10px] mt-0.5", intent.duration === opt.value ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        {opt.desc}
                      </p>
                    </button>

                    {/* Stepper for custom hours */}
                    {opt.value === "custom" && intent.duration === "custom" && (
                      <div className="border-t border-border/50 px-3 py-2.5 mt-1 bg-muted/30 rounded-xl">
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Số giờ tùy chọn
                        </label>
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              const v = Math.max(1, customHours - 1);
                              setCustomHours(v);
                              update({ duration: "custom", customHours: v });
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-surface border border-border text-sm font-bold shadow-2xs hover:bg-muted"
                          >
                            −
                          </button>
                          <span className="text-xs font-bold tabular-nums">
                            {customHours} giờ
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const v = Math.min(23, customHours + 1);
                              setCustomHours(v);
                              update({ duration: "custom", customHours: v });
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-surface border border-border text-sm font-bold shadow-2xs hover:bg-muted"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
