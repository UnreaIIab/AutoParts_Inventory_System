import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names and resolve Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** The currency symbol used across the app. */
export const CURRENCY = "DH";

/** Format a number as Moroccan Dirham (e.g. "1,234.00 DH"). */
export function formatCurrency(value: number) {
  const amount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${amount} ${CURRENCY}`;
}

/** Format a number with thousands separators. */
export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

/** Format a date in a compact, readable form. */
export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/** Short relative-ish label used in activity feeds. */
export function formatDateTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}
