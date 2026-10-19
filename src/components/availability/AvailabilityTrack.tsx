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
}: Props) {
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
  } | null>(null);

  const requestedPos = requestedRange ? getRangePosition(requestedRange) : null;

  return (
    <div className="relative">
      {/* Track background */}
      <div className="relative h-9 overflow-hidden rounded-full bg-muted/60">
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
          />
        )}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute -top-8 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground/90 px-2.5 py-1 text-[10px] font-medium text-background shadow-md"
          style={{ left: `${tooltip.x}%` }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
