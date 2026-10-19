"use client";

import * as React from "react";
import type { OvernightStay } from "@/lib/types/overnight";
import {
  formatDateToLocal,
  getOvernightQuote,
} from "@/lib/api/overnight-availability";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar as CalendarIcon,
  Moon,
  Clock,
  AlertTriangle,
} from "lucide-react";

type OvernightPickerProps = {
  roomId: string;
  overnightBasePrice?: number;
  onQuoteChange: (quote: OvernightStay | null) => void;
};

// Generate default check-in (today) and check-out (tomorrow)
function getDefaultDates() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return {
    todayStr: formatDateToLocal(today),
    tomorrowStr: formatDateToLocal(tomorrow),
  };
}

const PRESET_NIGHTS = [
  { label: "1 đêm", nights: 1 },
  { label: "2 đêm", nights: 2 },
  { label: "3 đêm", nights: 3 },
  { label: "5 đêm", nights: 5 },
  { label: "1 tuần", nights: 7 },
];

export function OvernightPicker({
  roomId,
  overnightBasePrice = 850000,
  onQuoteChange,
}: OvernightPickerProps) {
  const defaults = React.useMemo(() => getDefaultDates(), []);

  const [checkInDate, setCheckInDate] = React.useState<string>(defaults.todayStr);
  const [checkOutDate, setCheckOutDate] = React.useState<string>(defaults.tomorrowStr);

  const [quote, setQuote] = React.useState<OvernightStay | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = React.useState(true);

  // Fetch Authoritative Overnight Quote from backend service
  React.useEffect(() => {
    let isSubscribed = true;

    async function loadQuote() {
      try {
        const res = await getOvernightQuote(roomId, checkInDate, checkOutDate, overnightBasePrice);
        if (isSubscribed) {
          setQuote(res);
          setIsLoadingQuote(false);
          if (res.isValid && res.isAvailable) {
            onQuoteChange(res);
          } else {
            onQuoteChange(null);
          }
        }
      } catch {
        if (isSubscribed) {
          setIsLoadingQuote(false);
          onQuoteChange(null);
        }
      }
    }

    void loadQuote();

    return () => {
      isSubscribed = false;
    };
  }, [roomId, checkInDate, checkOutDate, overnightBasePrice, onQuoteChange]);

  // Quick preset stay duration handler
  const handleSelectPreset = (nights: number) => {
    setIsLoadingQuote(true);
    const start = new Date(checkInDate);
    const end = new Date(start);
    end.setDate(start.getDate() + nights);
    setCheckOutDate(formatDateToLocal(end));
  };

  return (
    <div className="space-y-5">
      {/* 1. Date Range Input Boxes */}
      <div className="grid grid-cols-2 gap-3">
        {/* Check-in Date */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-primary" />
            <span>Ngày nhận phòng</span>
          </label>
          <input
            type="date"
            min={defaults.todayStr}
            value={checkInDate}
            onChange={(e) => {
              setIsLoadingQuote(true);
              const newCheckIn = e.target.value;
              setCheckInDate(newCheckIn);
              // Ensure checkout stays after checkin
              if (checkOutDate <= newCheckIn) {
                const nextDay = new Date(newCheckIn);
                nextDay.setDate(nextDay.getDate() + 1);
                setCheckOutDate(formatDateToLocal(nextDay));
              }
            }}
            className="w-full rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 text-sm font-semibold text-foreground shadow-xs transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-[10px] text-muted-foreground">Nhận phòng từ 14:00</p>
        </div>

        {/* Check-out Date */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-primary" />
            <span>Ngày trả phòng</span>
          </label>
          <input
            type="date"
            min={checkInDate}
            value={checkOutDate}
            onChange={(e) => {
              setIsLoadingQuote(true);
              setCheckOutDate(e.target.value);
            }}
            className="w-full rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 text-sm font-semibold text-foreground shadow-xs transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-[10px] text-muted-foreground">Trả phòng trước 11:00</p>
        </div>
      </div>

      {/* 2. Quick Duration Pills (1 đêm, 2 đêm, 3 đêm...) */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Chọn nhanh số đêm
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_NIGHTS.map((preset) => {
            const isActive = quote?.numberOfNights === preset.nights;
            return (
              <button
                key={preset.nights}
                type="button"
                onClick={() => handleSelectPreset(preset.nights)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border border-border/80 bg-surface hover:border-primary/50 hover:bg-muted/40 text-foreground"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Realtime Duration Banner */}
      {quote && quote.numberOfNights > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3.5 text-xs">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">Kỳ nghỉ qua đêm:</span>
            <span className="font-bold text-foreground">
              {quote.numberOfNights} đêm
            </span>
          </div>

          <Badge className="bg-primary/10 text-primary border-none font-semibold text-xs">
            {quote.checkInDate} → {quote.checkOutDate}
          </Badge>
        </div>
      )}

      {/* 4. Error / Validation Message */}
      {quote?.errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 space-y-1 animate-in fade-in-50">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>Thời gian chưa hợp lệ</span>
          </div>
          <p className="leading-relaxed">{quote.errorMessage}</p>
        </div>
      )}

      {/* 5. Authoritative Overnight Pricing Quote Breakdown (UI-6.2) */}
      <div className="rounded-2xl border border-border/70 bg-surface p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/50">
          <span>Chi tiết bảng giá lưu trú</span>
          <span className="text-[10px] font-normal text-primary">Overnight Model</span>
        </div>

        {isLoadingQuote ? (
          <div className="space-y-2 py-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : quote && quote.isValid && quote.isAvailable ? (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>
                {new Intl.NumberFormat("vi-VN").format(quote.pricePerNight)}₫ × {quote.numberOfNights} đêm
              </span>
              <span className="font-medium text-foreground tabular-nums">
                {new Intl.NumberFormat("vi-VN").format(quote.subtotal)}₫
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>Dọn dẹp & Vệ sinh tiêu chuẩn</span>
              <span className="text-emerald-700 font-medium">Đã bao gồm</span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>Mã khóa số điện tử</span>
              <span className="text-emerald-700 font-medium">Tự động kích hoạt</span>
            </div>

            <div className="pt-2 border-t border-border/50 flex justify-between items-baseline font-bold text-sm text-foreground">
              <span>Tổng cộng (tạm tính)</span>
              <span className="text-price text-base text-primary">
                {new Intl.NumberFormat("vi-VN").format(quote.total)}₫
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-1">
            Vui lòng chọn ngày nhận và trả phòng hợp lệ để tính giá.
          </p>
        )}
      </div>

      {/* Check-in Guidance Note */}
      <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed">
        <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p>
          Thời gian nhận phòng từ <strong>14:00</strong> và trả phòng trước <strong>11:00</strong> ngày hôm sau. Sau giờ trả phòng, hệ thống tự động dành 60 phút để nhân viên dọn dẹp vệ sinh buồng phòng.
        </p>
      </div>
    </div>
  );
}
