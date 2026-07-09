"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { useT } from "@/lib/i18n";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const sizeMap = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

export function Dialog({
  open,
  onClose,
  title,
  footer,
  size = "md",
  children,
}: DialogProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-content/40 animate-fade-in"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative flex max-h-[85vh] w-full flex-col rounded-lg bg-surface shadow-dropdown animate-fade-in",
          sizeMap[size],
        )}
      >
        {title && (
          <header className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="text-base font-semibold text-content">{title}</h2>
            <button
              onClick={onClose}
              className="rounded p-1 text-content-muted hover:bg-surface-muted hover:text-content focus-ring"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  loading,
}: ConfirmDialogProps) {
  const { t } = useT();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t("Cancel")}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel ?? t("Delete")}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-soft">
          <AlertTriangle className="h-5 w-5 text-danger" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-content">{title}</h3>
          <p className="mt-1 text-sm text-content-muted">{message}</p>
        </div>
      </div>
    </Dialog>
  );
}
