"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Search,
  Package,
  Users,
  Truck,
  Receipt,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollection } from "@/lib/store/hooks";
import { db } from "@/lib/store/db";
import type { Product, Customer, Supplier, Invoice } from "@/lib/types";

interface Result {
  id: string;
  label: string;
  sublabel: string;
  group: string;
  href: string;
  icon: React.ReactNode;
}

function buildIndex(
  products: Product[],
  customers: Customer[],
  suppliers: Supplier[],
  sales: Invoice[],
  purchases: Invoice[],
): Result[] {
  return [
    ...products.map((p) => ({
      id: p.id,
      label: p.name,
      sublabel: `${p.sku} · ${p.barcode}`,
      group: "Products",
      href: `/products?highlight=${p.id}`,
      icon: <Package className="h-4 w-4" />,
    })),
    ...customers.map((c) => ({
      id: c.id,
      label: c.name,
      sublabel: c.email,
      group: "Customers",
      href: `/customers?highlight=${c.id}`,
      icon: <Users className="h-4 w-4" />,
    })),
    ...suppliers.map((s) => ({
      id: s.id,
      label: s.name,
      sublabel: s.email,
      group: "Suppliers",
      href: `/suppliers?highlight=${s.id}`,
      icon: <Truck className="h-4 w-4" />,
    })),
    ...sales.map((s) => ({
      id: s.id,
      label: s.reference,
      sublabel: s.partyName,
      group: "Sales",
      href: `/sales?highlight=${s.id}`,
      icon: <Receipt className="h-4 w-4" />,
    })),
    ...purchases.map((p) => ({
      id: p.id,
      label: p.reference,
      sublabel: p.partyName,
      group: "Purchases",
      href: `/purchases?highlight=${p.id}`,
      icon: <ShoppingCart className="h-4 w-4" />,
    })),
  ];
}

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [mounted, setMounted] = React.useState(false);

  const products = useCollection(db.products);
  const customers = useCollection(db.customers);
  const suppliers = useCollection(db.suppliers);
  const sales = useCollection(db.sales);
  const purchases = useCollection(db.purchases);
  const index = React.useMemo(
    () => buildIndex(products, customers, suppliers, sales, purchases),
    [products, customers, suppliers, sales, purchases],
  );

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const results = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return index
      .filter(
        (r) =>
          r.label.toLowerCase().includes(q) ||
          r.sublabel.toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [query, index]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, Result[]>();
    for (const r of results) {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group)!.push(r);
    }
    return Array.from(map.entries());
  }, [results]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-md items-center gap-2 rounded-md border border-border bg-surface-muted px-3 text-sm text-content-subtle transition-colors hover:border-content-subtle"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search anything…</span>
        <kbd className="hidden rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-content-muted sm:inline">
          ⌘K
        </kbd>
      </button>

      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[12vh]">
            <div
              className="absolute inset-0 bg-content/40 animate-fade-in"
              onClick={() => setOpen(false)}
            />
            <div className="relative w-full max-w-xl overflow-hidden rounded-lg border border-border bg-surface shadow-dropdown animate-fade-in">
              <div className="flex items-center gap-3 border-b border-border px-4">
                <Search className="h-5 w-5 text-content-subtle" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products, customers, invoices, SKU, barcode…"
                  className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-content-subtle"
                />
              </div>
              <div className="max-h-[50vh] overflow-y-auto p-2">
                {query.trim() === "" ? (
                  <p className="px-3 py-8 text-center text-sm text-content-subtle">
                    Start typing to search across the system.
                  </p>
                ) : results.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-content-subtle">
                    No results for “{query}”.
                  </p>
                ) : (
                  grouped.map(([group, items]) => (
                    <div key={group} className="mb-1">
                      <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-content-subtle">
                        {group}
                      </p>
                      {items.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => go(r.href)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-primary-soft",
                          )}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-surface-muted text-content-muted">
                            {r.icon}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-content">
                              {r.label}
                            </p>
                            <p className="truncate text-xs text-content-muted">
                              {r.sublabel}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
