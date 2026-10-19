"use client";

import { addDays, isToday } from "@/lib/availability/utils";
import { MOCK_ROOMS } from "@/lib/availability/mock-rooms";
import { WEEKLY_DENSITY } from "@/lib/availability/mock-rooms";

interface Props {
  baseDate: Date;
  onDayClick: (date: Date) => void;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d;
}

function getDensityColor(pct: number): string {
  if (pct >= 80) return "bg-foreground/80 text-background";
  if (pct >= 60) return "bg-foreground/50 text-background";
  if (pct >= 40) return "bg-foreground/25 text-foreground";
  return "bg-foreground/10 text-muted-foreground";
}

export function WeekView({ baseDate, onDayClick }: Props) {
  const monday = getMonday(baseDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-sm">
      {/* Week header */}
      <div className="grid grid-cols-[9rem_repeat(7,_1fr)] border-b border-border/40">
        <div className="px-4 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Room
          </span>
        </div>
        {weekDays.map((day, i) => {
          const today = isToday(day);
          return (
            <button
              key={i}
              onClick={() => onDayClick(day)}
              className={`border-l border-border/40 py-3 text-center transition-colors hover:bg-muted/60 ${
                today ? "bg-primary/5" : ""
              }`}
            >
              <p
                className={`text-[10px] font-semibold uppercase tracking-widest ${
                  today ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {DAY_LABELS[i]}
              </p>
              <p
                className={`text-sm font-medium ${
                  today ? "text-primary" : "text-foreground"
                }`}
              >
                {day.getDate()}
              </p>
            </button>
          );
        })}
      </div>

      {/* Room rows */}
      {MOCK_ROOMS.map((room, ri) => (
        <div
          key={room.id}
          className="grid grid-cols-[9rem_repeat(7,_1fr)] divide-x divide-border/30 border-t border-border/30 first:border-t-0"
        >
          <div className="flex items-center gap-2 px-4 py-3">
            <span className="text-xs font-semibold text-foreground">
              {room.name}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {room.type.slice(0, 3)}
            </span>
          </div>
          {weekDays.map((day, di) => {
            const density = WEEKLY_DENSITY[room.id]?.[di] ?? 50;
            const today = isToday(day);
            return (
              <button
                key={di}
                onClick={() => onDayClick(day)}
                className={`flex flex-col items-center justify-center py-3 transition-colors hover:bg-muted/40 ${
                  today ? "bg-primary/5" : ""
                }`}
              >
                <div
                  className={`w-10 rounded-md px-1 py-0.5 text-center text-[10px] font-semibold tabular-nums ${getDensityColor(density)}`}
                >
                  {density}%
                </div>
              </button>
            );
          })}
        </div>
      ))}

      <div className="border-t border-border/40 px-4 py-3 text-xs text-muted-foreground">
        Percentage indicates daily occupancy. Click any day to view the 24-hour timeline.
      </div>
    </div>
  );
}
