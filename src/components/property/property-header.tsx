"use client";

import * as React from "react";
import type { Property } from "@/lib/types/inventory";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapPin, Clock, ChevronDown, Check } from "lucide-react";

type PropertyHeaderProps = {
  properties: Property[];
  selectedProperty: Property;
  onSelectProperty: (property: Property) => void;
  hasSelectedRoom: boolean;
};

export function PropertyHeader({
  properties,
  selectedProperty,
  onSelectProperty,
  hasSelectedRoom,
}: PropertyHeaderProps) {
  const handlePropertyChange = (property: Property) => {
    if (property.id === selectedProperty.id) return;
    if (hasSelectedRoom) {
      const confirmChange = window.confirm(
        "Đổi chi nhánh sẽ đặt lại phòng bạn đang chọn. Bạn có chắc muốn tiếp tục?",
      );
      if (!confirmChange) return;
    }
    onSelectProperty(property);
  };

  return (
    <div className="space-y-6">
      {/* Branch selector & City Pill */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge className="bg-primary/10 text-primary border-none font-medium px-3.5 py-1 text-xs">
            {selectedProperty.city}
          </Badge>

          {/* Property Selector Dropdown */}
          {properties.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Chọn chi nhánh homestay"
                  className="flex items-center gap-2 rounded-full border border-border/80 bg-surface px-3.5 py-1.5 text-xs font-medium text-foreground transition-all hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span>Đổi chi nhánh ({properties.length})</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Chi nhánh Lumora</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {properties.map((prop) => {
                  const isSelected = prop.id === selectedProperty.id;
                  return (
                    <DropdownMenuItem
                      key={prop.id}
                      onClick={() => handlePropertyChange(prop)}
                      className="flex items-center justify-between py-2.5"
                    >
                      <div>
                        <p className="font-medium text-sm text-foreground">{prop.name}</p>
                        <p className="text-xs text-muted-foreground">{prop.city}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Operating Hours / Check-in info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-muted-foreground/80" />
          <span>Check-in: {selectedProperty.checkInTime} · Check-out: {selectedProperty.checkOutTime}</span>
        </div>
      </div>

      {/* Title & Address */}
      <div className="grid gap-3 md:grid-cols-[1.8fr_1fr] md:items-end">
        <div>
          <h1 className="text-display text-3xl md:text-5xl font-normal tracking-tight text-foreground">
            {selectedProperty.name}
          </h1>
          <p className="mt-2.5 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span>{selectedProperty.address}</span>
          </p>
        </div>

        <div>
          <p className="text-sm leading-relaxed text-muted-foreground md:text-right">
            {selectedProperty.description}
          </p>
        </div>
      </div>
    </div>
  );
}
