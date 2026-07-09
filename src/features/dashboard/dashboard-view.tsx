"use client";

import * as React from "react";
import Link from "next/link";
import {
  Boxes,
  Package,
  Tags,
  Truck,
  Users,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  XCircle,
  ArrowRight,
  PackagePlus,
  PencilRuler,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SalesLineChart,
  PurchasesBarChart,
  BestSellersBar,
} from "@/components/charts/charts";
import { useCollection } from "@/lib/store/hooks";
import { db } from "@/lib/store/db";
import { lineTotal } from "@/features/invoices/invoice-engine";
import { stockLevel } from "@/features/products/product-schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";

function lastMonths(n: number) {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-US", { month: "short" }),
    });
  }
  return out;
}

export function DashboardView() {
  const { t } = useT();
  const products = useCollection(db.products);
  const categories = useCollection(db.categories);
  const suppliers = useCollection(db.suppliers);
  const customers = useCollection(db.customers);
  const sales = useCollection(db.sales);
  const purchases = useCollection(db.purchases);
  const movements = useCollection(db.movements);

  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);

  const inventoryValue = products.reduce((s, p) => s + p.stock * p.purchasePrice, 0);
  const lowStock = products.filter((p) => stockLevel(p.stock, p.minStock) === "low");
  const outOfStock = products.filter((p) => stockLevel(p.stock, p.minStock) === "out");
  const belowMin = products.filter((p) => p.stock < p.minStock);

  const todaysSales = sales.filter((s) => s.date === today).reduce((s, i) => s + i.total, 0);
  const monthlyRevenue = sales.filter((s) => s.date.startsWith(thisMonth)).reduce((s, i) => s + i.total, 0);
  const monthlyPurchases = purchases.filter((p) => p.date.startsWith(thisMonth)).reduce((s, i) => s + i.total, 0);

  const months = React.useMemo(() => lastMonths(6), []);

  const salesByMonth = months.map((m) =>
    sales.filter((s) => s.date.startsWith(m.key)).reduce((s, i) => s + i.total, 0),
  );
  const purchasesByMonth = months.map((m) =>
    purchases.filter((p) => p.date.startsWith(m.key)).reduce((s, i) => s + i.total, 0),
  );
  const revenueTrend = salesByMonth.reduce<number[]>((acc, v, i) => {
    acc.push((acc[i - 1] ?? 0) + v);
    return acc;
  }, []);

  // inventory value trend from movements (cumulative net value change by month)
  const valueByMonth = months.map((m) =>
    movements
      .filter((mv) => mv.date.startsWith(m.key))
      .reduce((sum, mv) => {
        const product = products.find((p) => p.id === mv.productId);
        return sum + mv.quantity * (product?.purchasePrice ?? 0);
      }, 0),
  );
  const baseValue = inventoryValue - valueByMonth.reduce((a, b) => a + b, 0);
  const inventoryTrend = valueByMonth.reduce<number[]>((acc, v, i) => {
    acc.push((acc[i - 1] ?? baseValue) + v);
    return acc;
  }, []);

  const bestSellers = React.useMemo(() => {
    const tally = new Map<string, { name: string; units: number }>();
    for (const s of sales)
      for (const l of s.lines) {
        const cur = tally.get(l.productId) ?? { name: l.productName, units: 0 };
        cur.units += l.quantity;
        tally.set(l.productId, cur);
      }
    return [...tally.values()].sort((a, b) => b.units - a.units).slice(0, 5);
  }, [sales]);

  const byDateDesc = <T extends { date: string }>(a: T, b: T) => (a.date < b.date ? 1 : -1);
  const latestSales = [...sales].sort(byDateDesc).slice(0, 5);
  const latestPurchases = [...purchases].sort(byDateDesc).slice(0, 5);
  const recentlyAdded = [...products].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5);
  const recentlyUpdated = [...products]
    .filter((p) => p.updatedAt)
    .sort((a, b) => (a.updatedAt! < b.updatedAt! ? 1 : -1))
    .slice(0, 5);

  return (
    <>
      <PageHeader title={t("Dashboard")} subtitle={t("Overview of inventory, sales and purchasing activity")} />

      <div className="space-y-5 p-5">
        {/* KPI grid — 11 metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard label={t("Total Products")} value={String(products.length)} icon={<Package className="h-5 w-5" />} tone="primary" />
          <StatCard label={t("Inventory Value")} value={formatCurrency(inventoryValue)} icon={<Boxes className="h-5 w-5" />} tone="info" />
          <StatCard label={t("Categories")} value={String(categories.length)} icon={<Tags className="h-5 w-5" />} tone="primary" />
          <StatCard label={t("Suppliers")} value={String(suppliers.length)} icon={<Truck className="h-5 w-5" />} tone="primary" />
          <StatCard label={t("Customers")} value={String(customers.length)} icon={<Users className="h-5 w-5" />} tone="info" />
          <StatCard label={t("Today's Sales")} value={formatCurrency(todaysSales)} icon={<DollarSign className="h-5 w-5" />} tone="success" />
          <StatCard label={t("Monthly Revenue")} value={formatCurrency(monthlyRevenue)} icon={<TrendingUp className="h-5 w-5" />} tone="success" />
          <StatCard label={t("Monthly Purchases")} value={formatCurrency(monthlyPurchases)} icon={<ShoppingCart className="h-5 w-5" />} tone="info" />
          <StatCard label={t("Low Stock Items")} value={String(lowStock.length)} icon={<AlertTriangle className="h-5 w-5" />} tone="warning" />
          <StatCard label={t("Out of Stock")} value={String(outOfStock.length)} icon={<XCircle className="h-5 w-5" />} tone="danger" />
          <StatCard label={t("Below Minimum")} value={String(belowMin.length)} icon={<AlertTriangle className="h-5 w-5" />} tone="warning" />
        </div>

        {/* Alerts */}
        {(lowStock.length > 0 || outOfStock.length > 0) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <AlertCard tone="danger" icon={<XCircle className="h-5 w-5" />} title={t("Out of Stock")} count={outOfStock.length} note={t("products need restocking")} />
            <AlertCard tone="warning" icon={<AlertTriangle className="h-5 w-5" />} title={t("Low Stock")} count={lowStock.length} note={t("products below threshold")} />
            <AlertCard tone="warning" icon={<AlertTriangle className="h-5 w-5" />} title={t("Below Minimum")} count={belowMin.length} note={t("products under min quantity")} />
          </div>
        )}

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title={t("Monthly Sales")}>
            <SalesLineChart labels={months.map((m) => m.label)} values={salesByMonth} />
          </ChartCard>
          <ChartCard title={t("Monthly Purchases")}>
            <PurchasesBarChart labels={months.map((m) => m.label)} values={purchasesByMonth} />
          </ChartCard>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ChartCard title={t("Revenue Trend")}>
            <SalesLineChart labels={months.map((m) => m.label)} values={revenueTrend} />
          </ChartCard>
          <ChartCard title={t("Inventory Value Trend")}>
            <SalesLineChart labels={months.map((m) => m.label)} values={inventoryTrend} />
          </ChartCard>
          <ChartCard title={t("Best Selling Products")}>
            {bestSellers.length > 0 ? (
              <BestSellersBar labels={bestSellers.map((b) => b.name)} values={bestSellers.map((b) => b.units)} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-content-subtle">
                {t("No sales recorded yet")}
              </div>
            )}
          </ChartCard>
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <InvoiceFeed title={t("Latest Sales")} href="/sales" rows={latestSales} />
          <InvoiceFeed title={t("Latest Purchases")} href="/purchases" rows={latestPurchases} />
          <ProductFeed
            title={t("Recently Added Products")}
            href="/products"
            icon={<PackagePlus className="h-4 w-4" />}
            rows={recentlyAdded.map((p) => ({ id: p.id, name: p.name, sub: p.sku, date: p.createdAt }))}
          />
          <ProductFeed
            title={t("Recently Updated Products")}
            href="/products"
            icon={<PencilRuler className="h-4 w-4" />}
            rows={recentlyUpdated.map((p) => ({ id: p.id, name: p.name, sub: p.sku, date: p.updatedAt! }))}
          />
        </div>
      </div>
    </>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">{children}</div>
      </CardContent>
    </Card>
  );
}

function AlertCard({
  tone,
  icon,
  title,
  count,
  note,
}: {
  tone: "danger" | "warning";
  icon: React.ReactNode;
  title: string;
  count: number;
  note: string;
}) {
  const cls = tone === "danger" ? "border-danger/30 bg-danger-soft text-danger" : "border-warning/30 bg-warning-soft text-warning-text";
  return (
    <Link href="/inventory" className={`flex items-center gap-3 rounded-md border p-4 transition-opacity hover:opacity-90 ${cls}`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface/60">{icon}</span>
      <div>
        <p className="text-2xl font-semibold leading-tight">{count}</p>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs opacity-80">{note}</p>
      </div>
    </Link>
  );
}

const statusTone = { draft: "neutral", confirmed: "info", paid: "success" } as const;

function InvoiceFeed({
  title,
  href,
  rows,
}: {
  title: string;
  href: string;
  rows: { id: string; reference: string; partyName: string; date: string; total: number; status: "draft" | "confirmed" | "paid" }[];
}) {
  const { t } = useT();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <Link href={href} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          {t("View all")} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-content-muted">{t("Nothing yet.")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-content">{r.reference}</p>
                  <p className="truncate text-xs text-content-muted">{r.partyName} · {formatDate(r.date)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-semibold text-content">{formatCurrency(r.total)}</span>
                  <Badge tone={statusTone[r.status]}>{t(r.status)}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ProductFeed({
  title,
  href,
  icon,
  rows,
}: {
  title: string;
  href: string;
  icon: React.ReactNode;
  rows: { id: string; name: string; sub: string; date: string }[];
}) {
  const { t } = useT();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <Link href={href} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          {t("View all")} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-content-muted">{t("Nothing yet.")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary-soft text-primary">{icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-content">{r.name}</p>
                  <p className="truncate text-xs text-content-muted">{r.sub}</p>
                </div>
                <span className="text-xs text-content-subtle">{formatDate(r.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
