"use client";

import type { RoomAvailabilityResult, StayDuration, TimeRange } from "@/lib/availability/types";
import { TimeHeader } from "./TimeHeader";
import { RoomAvailabilityRow } from "./RoomAvailabilityRow";
import { NowIndicator } from "./NowIndicator";
import { getNowPosition } from "@/lib/availability/utils";

interface Props {
  results: RoomAvailabilityResult[];
  requestedRange: TimeRange | null;
  duration: StayDuration;
  showNow: boolean;
  now: Date;
  checkOut: string | null;
}

export function AvailabilityBoard({
  results,
  requestedRange,
  duration,
  showNow,
  now,
  checkOut,
}: Props) {
  const nowPct = getNowPosition(now);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-sm">
      {/* Column header with time labels — sticky on desktop, scrollable on mobile */}
      <div className="flex border-b border-border/40">
        {/* Room info column header */}
        <div className="w-44 shrink-0 px-4 py-3 md:w-56">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Room
          </span>
        </div>
        {/* Timeline header */}
        <div className="relative min-w-0 flex-1 overflow-x-auto md:overflow-visible">
          <div className="min-w-[600px]">
            <TimeHeader />
            {showNow && (
              <div
                className="pointer-events-none absolute top-0 h-full w-px bg-primary/30"
                style={{ left: `${nowPct}%` }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Room rows */}
      <div className="relative divide-y divide-border/30">
        {/* Now indicator overlay — spans all rows */}
        {showNow && (
          <NowIndicator nowPct={nowPct} rowCount={results.length} />
        )}

        {results.map((result) => (
          <RoomAvailabilityRow
            key={result.room.id}
            result={result}
            requestedRange={requestedRange}
            duration={duration}
            checkOut={checkOut}
            showNow={showNow}
            nowPct={nowPct}
          />
        ))}
      </div>
    </div>
  );
}
