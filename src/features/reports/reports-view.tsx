"use client";

import * as React from "react";
import {
  Printer,
  Download,
  Boxes,
  TrendingUp,
  ShoppingCart,
  Layers,
  Trophy,
  AlertTriangle,
  Search,
  Coins,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { useCollection } from "@/lib/store/hooks";
import { db } from "@/lib/store/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toCSV, downloadFile } from "@/lib/csv";
import { stockLevel } from "@/features/products/product-schema";
import { lineTotal } from "@/features/invoices/invoice-engine";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

type ReportId =
  | "inventory"
  | "stock-value"
  | "best-sellers"
  | "low-stock"
  | "sales"
  | "purchases"
  | "profit";

const reportMeta: Record<ReportId, { label: string; icon: React.ReactNode; desc: string; dated?: boolean }> = {
  inventory: { label: "Inventory Report", icon: <Boxes className="h-5 w-5" />, desc: "Full stock listing with valuation" },
  "stock-value": { label: "Inventory Value", icon: <Layers className="h-5 w-5" />, desc: "Inventory value by category" },
  "best-sellers": { label: "Best Sellers", icon: <Trophy className="h-5 w-5" />, desc: "Top products by units sold", dated: true },
  "low-stock": { label: "Low Stock", icon: <AlertTriangle className="h-5 w-5" />, desc: "Items at or below minimum" },
  sales: { label: "Sales Report", icon: <TrendingUp className="h-5 w-5" />, desc: "Sales invoices and revenue", dated: true },
  purchases: { label: "Purchase Report", icon: <ShoppingCart className="h-5 w-5" />, desc: "Purchase invoices and spend", dated: true },
  profit: { label: "Profit Report", icon: <Coins className="h-5 w-5" />, desc: "Revenue, cost and margin by product", dated: true },
};

export function ReportsView() {
  const { t } = useT();
  const products = useCollection(db.products);
  const allSales = useCollection(db.sales);
  const allPurchases = useCollection(db.purchases);
  const categories = useCollection(db.categories);
  const [report, setReport] = React.useState<ReportId>("inventory");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [search, setSearch] = React.useState("");

  const inRange = React.useCallback(
    (date: string) => (!from || date >= from) && (!to || date <= to),
    [from, to],
  );
  const matchesSearch = React.useCallback(
    (text: string) => !search.trim() || text.toLowerCase().includes(search.trim().toLowerCase()),
    [search],
  );

  const sales = allSales.filter((s) => inRange(s.date) && matchesSearch(`${s.reference} ${s.partyName}`));
  const purchases = allPurchases.filter((p) => inRange(p.date) && matchesSearch(`${p.reference} ${p.partyName}`));
  const searchedProducts = products.filter((p) => matchesSearch(`${p.name} ${p.sku} ${p.category}`));

  const data = React.useMemo(() => {
    switch (report) {
      case "inventory":
        return {
          columns: ["Product", "SKU", "Stock", "Unit Cost", "Value"],
          rows: searchedProducts.map((p) => [
            p.name, p.sku, String(p.stock),
            formatCurrency(p.purchasePrice), formatCurrency(p.stock * p.purchasePrice),
          ]),
          footer: ["Total", "", "", "", formatCurrency(searchedProducts.reduce((s, p) => s + p.stock * p.purchasePrice, 0))],
          csv: () => toCSV(searchedProducts, ["name", "sku", "stock", "purchasePrice", "sellingPrice"]),
        };
      case "stock-value": {
        const byCat = categories.map((c) => {
          const items = searchedProducts.filter((p) => p.category === c.name);
          const value = items.reduce((s, p) => s + p.stock * p.purchasePrice, 0);
          return { category: c.name, count: items.length, value };
        }).filter((r) => r.count > 0);
        return {
          columns: ["Category", "Products", "Stock Value"],
          rows: byCat.map((r) => [r.category, String(r.count), formatCurrency(r.value)]),
          footer: ["Total", String(searchedProducts.length), formatCurrency(byCat.reduce((s, r) => s + r.value, 0))],
          csv: () => toCSV(byCat, ["category", "count", "value"]),
        };
      }
      case "best-sellers": {
        const tally = new Map<string, { name: string; units: number; revenue: number }>();
        for (const s of sales) {
          for (const l of s.lines) {
            const cur = tally.get(l.productId) ?? { name: l.productName, units: 0, revenue: 0 };
            cur.units += l.quantity;
            cur.revenue += lineTotal(l);
            tally.set(l.productId, cur);
          }
        }
        const ranked = [...tally.values()].sort((a, b) => b.units - a.units);
        return {
          columns: ["Rank", "Product", "Units Sold", "Revenue"],
          rows: ranked.map((r, i) => [String(i + 1), r.name, String(r.units), formatCurrency(r.revenue)]),
          footer: ["", "Total", String(ranked.reduce((s, r) => s + r.units, 0)), formatCurrency(ranked.reduce((s, r) => s + r.revenue, 0))],
          csv: () => toCSV(ranked, ["name", "units", "revenue"]),
          empty: "No sales recorded yet — confirm some sales to populate this report.",
        };
      }
      case "low-stock": {
        const low = searchedProducts.filter((p) => stockLevel(p.stock, p.minStock) !== "in");
        return {
          columns: ["Product", "SKU", "On Hand", "Minimum", "Status"],
          rows: low.map((p) => [p.name, p.sku, String(p.stock), String(p.minStock), stockLevel(p.stock, p.minStock) === "out" ? "Out of stock" : "Low"]),
          footer: ["Items", String(low.length), "", "", ""],
          csv: () => toCSV(low, ["name", "sku", "stock", "minStock"]),
          empty: "All products are above their minimum stock. 🎉",
        };
      }
      case "sales":
        return {
          columns: ["Reference", "Customer", "Date", "Status", "Total"],
          rows: sales.map((s) => [s.reference, s.partyName, formatDate(s.date), s.status, formatCurrency(s.total)]),
          footer: ["Total", "", "", "", formatCurrency(sales.reduce((s, i) => s + i.total, 0))],
          csv: () => toCSV(sales, ["reference", "partyName", "date", "status", "total"]),
        };
      case "purchases":
        return {
          columns: ["Reference", "Supplier", "Date", "Status", "Total"],
          rows: purchases.map((s) => [s.reference, s.partyName, formatDate(s.date), s.status, formatCurrency(s.total)]),
          footer: ["Total", "", "", "", formatCurrency(purchases.reduce((s, i) => s + i.total, 0))],
          csv: () => toCSV(purchases, ["reference", "partyName", "date", "status", "total"]),
        };
      case "profit": {
        const tally = new Map<string, { name: string; units: number; revenue: number; cost: number }>();
        for (const s of sales) {
          for (const l of s.lines) {
            const product = products.find((p) => p.id === l.productId);
            const cur = tally.get(l.productId) ?? { name: l.productName, units: 0, revenue: 0, cost: 0 };
            cur.units += l.quantity;
            cur.revenue += lineTotal(l);
            cur.cost += l.quantity * (product?.purchasePrice ?? 0);
            tally.set(l.productId, cur);
          }
        }
        const ranked = [...tally.values()]
          .map((r) => ({ ...r, profit: r.revenue - r.cost }))
          .filter((r) => matchesSearch(r.name))
          .sort((a, b) => b.profit - a.profit);
        const totRev = ranked.reduce((s, r) => s + r.revenue, 0);
        const totCost = ranked.reduce((s, r) => s + r.cost, 0);
        return {
          columns: ["Product", "Units", "Revenue", "Cost", "Profit"],
          rows: ranked.map((r) => [
            r.name, String(r.units), formatCurrency(r.revenue),
            formatCurrency(r.cost), formatCurrency(r.profit),
          ]),
          footer: ["Total", String(ranked.reduce((s, r) => s + r.units, 0)), formatCurrency(totRev), formatCurrency(totCost), formatCurrency(totRev - totCost)],
          csv: () => toCSV(ranked, ["name", "units", "revenue", "cost", "profit"]),
          empty: "No sales in this period — confirm sales to see profit.",
        };
      }
    }
  }, [report, products, searchedProducts, sales, purchases, categories, matchesSearch]);

  const meta = reportMeta[report];

  return (
    <>
      <PageHeader
        title={t("Reports")}
        subtitle={t("Inventory, sales and purchasing analytics")}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={() => downloadFile(`${report}-report.csv`, data.csv())}
            >
              {t("Export CSV")}
            </Button>
            <Button icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
              {t("Print")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[260px_1fr]">
        {/* Report selector */}
        <div className="print-hidden space-y-2">
          {(Object.keys(reportMeta) as ReportId[]).map((id) => {
            const m = reportMeta[id];
            const active = report === id;
            return (
              <button
                key={id}
                onClick={() => setReport(id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors",
                  active
                    ? "border-primary/40 bg-primary-soft"
                    : "border-border bg-surface hover:bg-surface-muted",
                )}
              >
                <span className={cn("mt-0.5", active ? "text-primary" : "text-content-muted")}>
                  {m.icon}
                </span>
                <div className="min-w-0">
                  <p className={cn("text-sm font-medium", active ? "text-primary" : "text-content")}>
                    {t(m.label)}
                  </p>
                  <p className="text-xs text-content-muted">{t(m.desc)}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Report surface */}
        <Card id="report-print" className="p-0">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-content">{t(meta.label)}</h2>
              <p className="text-sm text-content-muted">
                {t("Generated")} {formatDate(new Date())} · AutoParts Inventory System
              </p>
            </div>
            <span className="text-primary print-hidden">{meta.icon}</span>
          </div>

          {/* Filter toolbar */}
          <div className="print-hidden flex flex-wrap items-end gap-3 border-b border-border bg-surface-muted px-6 py-3">
            <div className="min-w-[180px] flex-1">
              <Label className="mb-1">{t("Search")}</Label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Filter rows…")}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            {meta.dated && (
              <>
                <div>
                  <Label className="mb-1">{t("From")}</Label>
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
                </div>
                <div>
                  <Label className="mb-1">{t("To")}</Label>
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
                </div>
              </>
            )}
            {(search || from || to) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setFrom("");
                  setTo("");
                }}
              >
                {t("Clear")}
              </Button>
            )}
          </div>

          <div className="overflow-x-auto p-6">
            {data.rows.length === 0 ? (
              <p className="py-10 text-center text-sm text-content-muted">
                {("empty" in data && data.empty ? t(data.empty as string) : t("No data available."))}
              </p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-border-strong">
                    {data.columns.map((c, i) => (
                      <th
                        key={c}
                        className={cn(
                          "py-2 pr-4 text-xs font-semibold uppercase tracking-wide text-content-muted",
                          i === 0 ? "text-left" : "text-right",
                        )}
                      >
                        {t(c)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-border">
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className={cn(
                            "py-2 pr-4 tabular-nums",
                            ci === 0 ? "text-left font-medium text-content" : "text-right text-content-muted",
                          )}
                        >
                          {ci === row.length - 1 && report === "low-stock" ? (
                            <Badge tone={cell === "Out of stock" ? "danger" : "warning"}>{t(cell)}</Badge>
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                {data.footer && (
                  <tfoot>
                    <tr className="border-t-2 border-border-strong font-semibold text-content">
                      {data.footer.map((cell, ci) => (
                        <td key={ci} className={cn("py-2.5 pr-4 tabular-nums", ci === 0 ? "text-left" : "text-right")}>
                          {t(cell)}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
