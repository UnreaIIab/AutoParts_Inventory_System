"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "warning" | "info";
interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const toneConfig: Record<
  ToastTone,
  { icon: React.ReactNode; accent: string }
> = {
  success: {
    icon: <CheckCircle2 className="h-5 w-5 text-success" />,
    accent: "border-l-success",
  },
  error: {
    icon: <XCircle className="h-5 w-5 text-danger" />,
    accent: "border-l-danger",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 text-warning" />,
    accent: "border-l-warning",
  },
  info: {
    icon: <Info className="h-5 w-5 text-info" />,
    accent: "border-l-info",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const remove = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (t: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove],
  );

  const value = React.useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) =>
        toast({ tone: "success", title, description }),
      error: (title, description) =>
        toast({ tone: "error", title, description }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
            {toasts.map((t) => (
              <div
                key={t.id}
                role="alert"
                className={cn(
                  "flex items-start gap-3 rounded-md border border-l-4 border-border bg-surface p-3.5 shadow-dropdown animate-fade-in",
                  toneConfig[t.tone].accent,
                )}
              >
                <span className="mt-0.5 shrink-0">
                  {toneConfig[t.tone].icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-content">{t.title}</p>
                  {t.description && (
                    <p className="mt-0.5 text-xs text-content-muted">
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => remove(t.id)}
                  className="shrink-0 rounded p-0.5 text-content-subtle hover:bg-surface-muted hover:text-content"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
