"use client";

import { useState } from "react";
import type { Room, TimeRange } from "@/lib/availability/types";
import { getRangePosition } from "@/lib/availability/utils";
import { UnavailableBlock } from "./UnavailableBlock";
import { RequestedRangeHighlight } from "./RequestedRangeHighlight";

interface Props {
  room: Room;
  requestedRange: TimeRange | null;
  isAvailable: boolean;
  showNow: boolean;
  nowPct: number;
}

export function AvailabilityTrack({
  room,
  requestedRange,
  isAvailable,
  showNow,
  nowPct,
}: Props) {
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
  } | null>(null);

  const requestedPos = requestedRange ? getRangePosition(requestedRange) : null;
  const requestedLabel = requestedRange
    ? `${requestedRange.start} – ${requestedRange.end}`
    : undefined;

  return (
    <div className="relative py-1">
      {/* Track container */}
      <div className="relative h-10 w-full overflow-hidden rounded-xl border border-border/70 bg-muted/40 shadow-2xs">
        {/* Subtle grid lines for quarters of the day */}
        <div className="absolute inset-0 pointer-events-none flex divide-x divide-border/30">
          <div className="w-1/4 h-full" />
          <div className="w-1/4 h-full" />
          <div className="w-1/4 h-full" />
          <div className="w-1/4 h-full" />
        </div>

        {/* Unavailable blocks */}
        {room.unavailableRanges.map((range, i) => {
          const pos = getRangePosition(range);
          return (
            <UnavailableBlock
              key={i}
              left={pos.left}
              width={pos.width}
              range={range}
              onEnter={(text, x) => setTooltip({ text, x })}
              onLeave={() => setTooltip(null)}
            />
          );
        })}

        {/* Requested range highlight */}
        {requestedPos && (
          <RequestedRangeHighlight
            left={requestedPos.left}
            width={requestedPos.width}
            isAvailable={isAvailable}
            label={requestedLabel}
          />
        )}

        {/* Current Time ("Now") Needle Indicator within track */}
        {showNow && (
          <div
            className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
            style={{ left: `${nowPct}%` }}
          />
        )}
      </div>

      {/* Floating Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute -top-8 z-30 -translate-x-1/2 rounded-lg bg-foreground px-2.5 py-1 text-[11px] font-semibold text-background shadow-lg whitespace-nowrap animate-in fade-in-50 zoom-in-95"
          style={{ left: `${tooltip.x}%` }}
        >
          {tooltip.text}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-foreground" />
        </div>
      )}
    </div>
  );
}
