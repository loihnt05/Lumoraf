"use client";

const HOUR_LABELS = [
  { label: "00", pct: 0 },
  { label: "06", pct: 25 },
  { label: "12", pct: 50 },
  { label: "18", pct: 75 },
  { label: "24", pct: 100 },
];

export function TimeHeader() {
  return (
    <div className="relative h-8 select-none">
      {HOUR_LABELS.map(({ label, pct }) => (
        <span
          key={label}
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-medium tabular-nums text-muted-foreground"
          style={{ left: `${pct}%` }}
        >
          {label}
        </span>
      ))}
      {/* Tick marks */}
      {HOUR_LABELS.map(({ label, pct }) => (
        <span
          key={`tick-${label}`}
          className="absolute bottom-0 h-1.5 w-px bg-border/60"
          style={{ left: `${pct}%` }}
        />
      ))}
    </div>
  );
}
