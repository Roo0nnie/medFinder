import React from "react";
import { cn } from "@/core/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-6 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium flex items-center gap-1",
              trend.isPositive ? "text-emerald-500" : "text-red-500"
            )}
          >
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            <span className="text-muted-foreground ml-1 font-normal">{trend.label}</span>
          </span>
        )}
      </div>
    </div>
  );
}
