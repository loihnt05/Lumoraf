"use client";

interface Props {
  left: number;
  width: number;
  isAvailable: boolean;
}

export function RequestedRangeHighlight({ left, width, isAvailable }: Props) {
  return (
    <div
      className={`pointer-events-none absolute inset-y-0 rounded-full transition-all ${
        isAvailable
          ? "bg-primary/25 ring-1 ring-inset ring-primary/40"
          : "bg-destructive/15 ring-1 ring-inset ring-destructive/25"
      }`}
      style={{
        left: `${left}%`,
        width: `${width}%`,
      }}
      aria-hidden="true"
    />
  );
}
