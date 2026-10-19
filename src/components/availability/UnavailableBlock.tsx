"use client";

import type { UnavailableRange } from "@/lib/availability/types";

interface Props {
  left: number;
  width: number;
  range: UnavailableRange;
  onEnter: (text: string, centerX: number) => void;
  onLeave: () => void;
}

export function UnavailableBlock({ left, width, range, onEnter, onLeave }: Props) {
  const tooltipText = `${range.start} – ${range.end}`;
  const centerX = left + width / 2;

  return (
    <div
      className="absolute inset-y-0 rounded-full bg-foreground/20 transition-colors hover:bg-foreground/30"
      style={{
        left: `${left}%`,
        width: `${width}%`,
      }}
      onMouseEnter={() => onEnter(tooltipText, centerX)}
      onMouseLeave={onLeave}
      role="img"
      aria-label={`Unavailable from ${range.start} to ${range.end}`}
    />
  );
}
