"use client";

interface Props {
  nowPct: number;
  rowCount: number;
}

export function NowIndicator({ nowPct, rowCount }: Props) {
  if (rowCount === 0) return null;

  return (
    <div
      className="pointer-events-none absolute top-0 z-10 flex flex-col items-center"
      style={{ left: `calc(${nowPct}% + 11rem)` }} // offset by room info column (w-44)
    >
      {/* "Now" label */}
      <div
        className="mb-0.5 -translate-x-1/2 rounded-full bg-primary/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-primary-foreground"
      >
        Now
      </div>
      {/* Vertical line */}
      <div className="w-px flex-1 bg-primary/25" style={{ height: `${rowCount * 76}px` }} />
    </div>
  );
}
