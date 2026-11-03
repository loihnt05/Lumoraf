"use client";

import { addDays, isToday } from "@/lib/availability/utils";
import { MOCK_ROOMS } from "@/lib/availability/mock-rooms";
import { WEEKLY_DENSITY } from "@/lib/availability/mock-rooms";
import { Calendar, HelpCircle, ArrowRight } from "lucide-react";

interface Props {
  baseDate: Date;
  onDayClick: (date: Date) => void;
}

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d;
}

function getDensityBadge(pct: number): { bg: string; text: string; label: string } {
  if (pct >= 80) return { bg: "bg-red-500/20 text-red-900 border-red-500/30", text: "Gần kín", label: `${pct}% kín` };
  if (pct >= 50) return { bg: "bg-amber-500/20 text-amber-900 border-amber-500/30", text: "Nửa kín", label: `${pct}% kín` };
  return { bg: "bg-emerald-500/15 text-emerald-900 border-emerald-500/30", text: "Trống nhiều", label: `${pct}% kín` };
}

export function WeekView({ baseDate, onDayClick }: Props) {
  const monday = getMonday(baseDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <div className="space-y-3">
      {/* Legend for week density */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface p-3.5 sm:px-5 shadow-2xs text-xs">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <HelpCircle className="h-4 w-4 text-primary shrink-0" />
          <span>Chú thích tỷ lệ kín phòng trong tuần:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-emerald-500/20 border border-emerald-500/40" />
            <span>Trống nhiều (&lt; 50% kín)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-amber-500/20 border border-amber-500/40" />
            <span>Kín vừa (50% - 79% kín)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-red-500/20 border border-red-500/40" />
            <span>Gần kín lịch (≥ 80% kín)</span>
          </div>
          <span className="text-[10px] italic text-muted-foreground">
            * Bấm vào bất kỳ ngày nào để xem chi tiết từng giờ.
          </span>
        </div>
      </div>

      {/* Week Grid */}
      <div className="overflow-x-auto rounded-3xl border border-border/80 bg-surface shadow-sm">
        <div className="min-w-[700px]">
          {/* Week header */}
          <div className="grid grid-cols-[11rem_repeat(7,_1fr)] border-b border-border/40 bg-muted/20">
            <div className="px-4 py-3 flex items-center justify-between border-r border-border/40">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Phòng
              </span>
              <span className="text-[10px] text-muted-foreground">7 ngày tới</span>
            </div>

            {weekDays.map((day, i) => {
              const today = isToday(day);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onDayClick(day)}
                  className={`border-r border-border/30 last:border-r-0 py-2.5 text-center transition-colors hover:bg-muted/50 cursor-pointer ${
                    today ? "bg-primary/5" : ""
                  }`}
                >
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      today ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {DAY_LABELS[i]}
                  </p>
                  <p
                    className={`text-sm font-bold tabular-nums mt-0.5 ${
                      today ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {day.getDate()}
                  </p>
                  {today && (
                    <span className="mt-0.5 inline-block rounded-full bg-primary/10 px-1 text-[8px] font-bold text-primary">
                      Hôm nay
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Room rows */}
          {MOCK_ROOMS.map((room) => (
            <div
              key={room.id}
              className="grid grid-cols-[11rem_repeat(7,_1fr)] divide-x divide-border/30 border-t border-border/30 first:border-t-0 hover:bg-muted/10 transition-colors"
            >
              <div className="flex flex-col justify-center px-4 py-3 border-r border-border/40">
                <span className="text-xs font-bold text-foreground">
                  {room.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {room.type} · Tầng {room.floor}
                </span>
              </div>

              {weekDays.map((day, di) => {
                const density = WEEKLY_DENSITY[room.id]?.[di] ?? 45;
                const badge = getDensityBadge(density);
                const today = isToday(day);

                return (
                  <button
                    key={di}
                    type="button"
                    onClick={() => onDayClick(day)}
                    className={`flex flex-col items-center justify-center py-2.5 px-1.5 transition-all hover:bg-muted/50 cursor-pointer ${
                      today ? "bg-primary/5" : ""
                    }`}
                  >
                    <div
                      className={`w-full max-w-[4rem] rounded-lg border py-1 text-center font-bold tabular-nums text-[10px] ${badge.bg}`}
                    >
                      {badge.label}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
