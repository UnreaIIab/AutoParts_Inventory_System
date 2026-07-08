"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  width?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const widthMap = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-2xl" };

export function Drawer({
  open,
  onClose,
  title,
  description,
  footer,
  width = "md",
  children,
}: DrawerProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-content/30 animate-fade-in"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "absolute right-0 top-0 flex h-full w-full flex-col bg-surface shadow-drawer animate-slide-in-right",
          widthMap[width],
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="min-w-0">
            {title && (
              <h2 className="truncate text-base font-semibold text-content">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-content-muted">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded p-1.5 text-content-muted hover:bg-surface-muted hover:text-content focus-ring"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-border bg-surface-muted px-6 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
