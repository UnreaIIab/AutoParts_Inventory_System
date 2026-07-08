import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
  trend?: { value: string; direction: "up" | "down"; positive?: boolean };
  hint?: string;
}

const toneClasses: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning-text",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export function StatCard({
  label,
  value,
  icon,
  tone = "primary",
  trend,
  hint,
}: StatCardProps) {
  return (
    <div className="rounded-md border border-border bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-content-subtle">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-content">{value}</p>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
            toneClasses[tone],
          )}
        >
          {icon}
        </span>
      </div>
      {(trend || hint) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                (trend.positive ?? trend.direction === "up")
                  ? "text-success"
                  : "text-danger",
              )}
            >
              {trend.direction === "up" ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {trend.value}
            </span>
          )}
          {hint && <span className="text-content-subtle">{hint}</span>}
        </div>
      )}
    </div>
  );
}
