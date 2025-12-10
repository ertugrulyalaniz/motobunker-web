"use client";

import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "error";
  dot?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", dot = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs",
          "border border-border bg-background text-muted",
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              {
                "bg-error": variant === "default" || variant === "error",
                "bg-success": variant === "success",
              }
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
