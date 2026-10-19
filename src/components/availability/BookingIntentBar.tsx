"use client";

import { useState } from "react";
import { Calendar, Clock, ChevronDown } from "lucide-react";
import type { BookingIntent, StayDuration } from "@/lib/availability/types";
import { cn } from "@/lib/utils";

const DURATION_OPTIONS: { value: StayDuration; label: string }[] = [
  { value: "3h", label: "3 hours" },
  { value: "6h", label: "6 hours" },
  { value: "overnight", label: "Overnight" },
  { value: "custom", label: "Custom" },
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

  const currentDurationLabel =
    intent.duration === "custom"
      ? `${customHours}h custom`
      : DURATION_OPTIONS.find((d) => d.value === intent.duration)?.label ?? "";

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  return (
    <div className="rounded-2xl border border-border/60 bg-surface shadow-sm">
      <div className="flex flex-wrap items-stretch divide-x divide-border/60">
        {/* Date picker */}
        <label className="group flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5 px-5 py-3.5">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Date
          </span>
          <input
            type="date"
            value={intent.date.toISOString().split("T")[0]}
            min={todayStr}
            onChange={(e) => {
              const d = new Date(e.target.value + "T00:00:00");
              if (!isNaN(d.getTime())) update({ date: d });
            }}
            className="w-full cursor-pointer bg-transparent text-sm font-medium text-foreground focus:outline-none"
          />
        </label>

        {/* Check-in time picker */}
        <div className="relative flex min-w-0 flex-1">
          <button
            onClick={() => {
              setTimeOpen((o) => !o);
              setDurationOpen(false);
            }}
            className="group flex w-full flex-col gap-0.5 px-5 py-3.5 text-left"
          >
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <Clock className="h-3 w-3" />
              Check-in
            </span>
            <span className="text-sm font-medium text-foreground">
              {intent.checkIn}
            </span>
          </button>
          {timeOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setTimeOpen(false)}
              />
              <div className="absolute top-full left-0 z-30 mt-1.5 max-h-56 w-36 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
                {TIME_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      update({ checkIn: t });
                      setTimeOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2 text-left text-sm transition-colors hover:bg-muted",
                      t === intent.checkIn
                        ? "font-semibold text-primary"
                        : "text-foreground",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Duration picker */}
        <div className="relative flex min-w-0 flex-1">
          <button
            onClick={() => {
              setDurationOpen((o) => !o);
              setTimeOpen(false);
            }}
            className="group flex w-full flex-col gap-0.5 px-5 py-3.5 text-left"
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Stay
            </span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              {currentDurationLabel}
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform",
                  durationOpen && "rotate-180",
                )}
              />
            </span>
          </button>
          {durationOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setDurationOpen(false)}
              />
              <div className="absolute top-full left-0 z-30 mt-1.5 w-44 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
                {DURATION_OPTIONS.map((opt) => (
                  <div key={opt.value}>
                    <button
                      onClick={() => {
                        update({
                          duration: opt.value,
                          customHours:
                            opt.value === "custom" ? customHours : undefined,
                        });
                        if (opt.value !== "custom") setDurationOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                        intent.duration === opt.value
                          ? "font-semibold text-primary"
                          : "text-foreground",
                      )}
                    >
                      {opt.label}
                    </button>
                    {opt.value === "custom" && intent.duration === "custom" && (
                      <div className="border-t border-border/50 px-4 py-3">
                        <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                          Hours
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const v = Math.max(1, customHours - 1);
                              setCustomHours(v);
                              update({ duration: "custom", customHours: v });
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-medium"
                          >
                            −
                          </button>
                          <span className="min-w-[2rem] text-center text-sm font-semibold">
                            {customHours}
                          </span>
                          <button
                            onClick={() => {
                              const v = Math.min(23, customHours + 1);
                              setCustomHours(v);
                              update({ duration: "custom", customHours: v });
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-medium"
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
