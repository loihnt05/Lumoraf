import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl bg-surface p-6 shadow-sm md:p-8", className)}
      {...props}
    />
  );
}
