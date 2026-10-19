"use client";

interface Props {
  availableCount: number;
  totalCount: number;
  checkIn: string;
  checkOut: string | null;
  duration: string;
}

export function AvailabilitySummary({
  availableCount,
  totalCount,
  checkIn,
  checkOut,
  duration,
}: Props) {
  if (!checkOut) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a check-in time and duration to see availability.
      </p>
    );
  }

  return (
    <div className="flex items-baseline gap-2">
      <span
        className={`text-base font-semibold ${
          availableCount > 0 ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {availableCount} of {totalCount}
      </span>
      <span className="text-sm text-muted-foreground">
        {availableCount === 1 ? "room" : "rooms"} available ·{" "}
        <span className="font-medium text-foreground">
          {checkIn} → {checkOut}
        </span>{" "}
        · {duration}
      </span>
    </div>
  );
}
