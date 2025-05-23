import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, max = 100, className, indicatorClassName, label, showPercentage = false, size = "md", ...props }, ref) => {
    const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
    
    const sizeClasses = {
      sm: "h-2",
      md: "h-4",
      lg: "h-6"
    };
    
    return (
      <div className="space-y-1.5">
        {(label || showPercentage) && (
          <div className="flex items-center justify-between">
            {label && <p className="text-sm text-neutral-600 dark:text-neutral-400">{label}</p>}
            {showPercentage && <p className="text-sm text-neutral-600 dark:text-neutral-400">{Math.round(percentage)}%</p>}
          </div>
        )}
        <div
          ref={ref}
          className={cn(
            "overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700",
            sizeClasses[size],
            className
          )}
          {...props}
        >
          <div
            className={cn(
              "h-full bg-primary rounded-full transition-all duration-300 ease-in-out",
              indicatorClassName
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

export { ProgressBar };
