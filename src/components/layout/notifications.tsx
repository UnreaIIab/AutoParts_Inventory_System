"use client";

import * as React from "react";
import {
  Bell,
  AlertTriangle,
  XCircle,
  Receipt,
  ShoppingCart,
  CheckCheck,
  BellOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollection } from "@/lib/store/hooks";
import { db } from "@/lib/store/db";
import { stockLevel } from "@/features/products/product-schema";
import { formatDate } from "@/lib/utils";

interface Notice {
  id: string;
  tone: "danger" | "warning" | "info";
  icon: React.ReactNode;
  title: string;
  message: string;
  date?: string;
}

export function Notifications() {
  const products = useCollection(db.products);
  const sales = useCollection(db.sales);
  const purchases = useCollection(db.purchases);

  const [open, setOpen] = React.useState(false);
  const [read, setRead] = React.useState<Set<string>>(new Set());
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("notif-read");
      if (raw) setRead(new Set(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const notices: Notice[] = React.useMemo(() => {
    const list: Notice[] = [];
    for (const p of products) {
      const level = stockLevel(p.stock, p.minStock);
      if (level === "out") {
        list.push({
          id: `oos-${p.id}`,
          tone: "danger",
          icon: <XCircle className="h-4 w-4" />,
          title: "Out of stock",
          message: `${p.name} (${p.sku}) is out of stock`,
        });
      } else if (level === "low") {
        list.push({
          id: `low-${p.id}`,
          tone: "warning",
          icon: <AlertTriangle className="h-4 w-4" />,
          title: "Low stock",
          message: `${p.name} is below minimum (${p.stock}/${p.minStock})`,
        });
      }
    }
    for (const s of [...sales].slice(0, 4)) {
      list.push({
        id: `sale-${s.id}`,
        tone: "info",
        icon: <Receipt className="h-4 w-4" />,
        title: "New sale",
        message: `${s.reference} · ${s.partyName}`,
        date: s.date,
      });
    }
    for (const p of [...purchases].slice(0, 3)) {
      list.push({
        id: `pur-${p.id}`,
        tone: "info",
        icon: <ShoppingCart className="h-4 w-4" />,
        title: "New purchase",
        message: `${p.reference} · ${p.partyName}`,
        date: p.date,
      });
    }
    return list;
  }, [products, sales, purchases]);

  const unread = notices.filter((n) => !read.has(n.id));

  const markAll = () => {
    const all = new Set(notices.map((n) => n.id));
    setRead(all);
    localStorage.setItem("notif-read", JSON.stringify([...all]));
  };

  const toneClass = {
    danger: "bg-danger-soft text-danger",
    warning: "bg-warning-soft text-warning-text",
    info: "bg-info-soft text-info",
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded p-2 text-content-muted hover:bg-surface-muted"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white ring-2 ring-surface">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-md border border-border bg-surface shadow-dropdown animate-fade-in">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="text-sm font-semibold text-content">
              Notifications
              {unread.length > 0 && (
                <span className="ml-1.5 text-xs font-normal text-content-muted">
                  {unread.length} new
                </span>
              )}
            </p>
            {notices.length > 0 && (
              <button
                onClick={markAll}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notices.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                <BellOff className="mb-2 h-8 w-8 text-content-subtle" />
                <p className="text-sm font-medium text-content">All caught up</p>
                <p className="text-xs text-content-muted">No notifications right now.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {notices.map((n) => {
                  const isUnread = !read.has(n.id);
                  return (
                    <li
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3",
                        isUnread && "bg-primary-soft/40",
                      )}
                    >
                      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", toneClass[n.tone])}>
                        {n.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-content">{n.title}</p>
                        <p className="text-xs text-content-muted">{n.message}</p>
                        {n.date && (
                          <p className="mt-0.5 text-[11px] text-content-subtle">{formatDate(n.date)}</p>
                        )}
                      </div>
                      {isUnread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
