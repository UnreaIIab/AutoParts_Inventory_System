"use client";

import * as React from "react";
import {
  Search,
  Boxes,
  AlertTriangle,
  XCircle,
  Warehouse,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Settings2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Tabs, EmptyState } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { useCollection } from "@/lib/store/hooks";
import { db } from "@/lib/store/db";
import type { Product, StockMovement, MovementType } from "@/lib/types";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { stockLevel } from "@/features/products/product-schema";
import { useT } from "@/lib/i18n";

const stockTone = { in: "success", low: "warning", out: "danger" } as const;
const stockText = { in: "In stock", low: "Low", out: "Out" };

interface StockRow extends Product {
  reserved: number;
  available: number;
  value: number;
}

export function InventoryView() {
  const toast = useToast();
  const { t } = useT();
  const products = useCollection(db.products);
  const sales = useCollection(db.sales);
  const movements = useCollection(db.movements);

  const [tab, setTab] = React.useState("stock");
  const [search, setSearch] = React.useState("");
  const [levelFilter, setLevelFilter] = React.useState("");
  const [adjust, setAdjust] = React.useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = React.useState(0);
  const [adjustReason, setAdjustReason] = React.useState("");

  // reserved = quantities committed to draft sales (not yet deducted)
  const reservedByProduct = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sales) {
      if (s.status !== "draft") continue;
      for (const l of s.lines) {
        map.set(l.productId, (map.get(l.productId) ?? 0) + l.quantity);
      }
    }
    return map;
  }, [sales]);

  const rows: StockRow[] = React.useMemo(() => {
    return products.map((p) => {
      const reserved = reservedByProduct.get(p.id) ?? 0;
      return {
        ...p,
        reserved,
        available: p.stock - reserved,
        value: p.stock * p.purchasePrice,
      };
    });
  }, [products, reservedByProduct]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !`${r.name} ${r.sku}`.toLowerCase().includes(q)) return false;
      if (levelFilter && stockLevel(r.stock, r.minStock) !== levelFilter) return false;
      return true;
    });
  }, [rows, search, levelFilter]);

  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const lowCount = rows.filter((r) => stockLevel(r.stock, r.minStock) === "low").length;
  const outCount = rows.filter((r) => stockLevel(r.stock, r.minStock) === "out").length;

  const openAdjust = (p: Product) => {
    setAdjust(p);
    setAdjustQty(0);
    setAdjustReason("");
  };

  const saveAdjustment = () => {
    if (!adjust || adjustQty === 0) return;
    const next = Math.max(0, adjust.stock + adjustQty);
    db.products.update(adjust.id, { stock: next });
    db.movements.create({
      productId: adjust.id,
      productName: adjust.name,
      type: "adjustment",
      quantity: adjustQty,
      reference: `ADJ-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().slice(0, 10),
      note: adjustReason || undefined,
    });
    toast.success(t("Stock adjusted"), `${adjust.name}: ${adjustQty > 0 ? "+" : ""}${adjustQty}`);
    setAdjust(null);
  };

  const stockColumns: Column<StockRow>[] = [
    {
      key: "name", header: t("Product"), sortable: true, accessor: (r) => r.name,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-content">{r.name}</p>
          <p className="text-xs text-content-muted">{r.sku}</p>
        </div>
      ),
    },
    { key: "category", header: t("Category"), sortable: true, accessor: (r) => r.category,
      cell: (r) => <Badge tone="neutral">{r.category}</Badge> },
    { key: "stock", header: t("Current"), align: "right", sortable: true, accessor: (r) => r.stock,
      cell: (r) => <span className="font-medium tabular-nums">{r.stock}</span> },
    { key: "available", header: t("Available"), align: "right", sortable: true, accessor: (r) => r.available,
      cell: (r) => <span className="tabular-nums">{r.available}</span> },
    { key: "minStock", header: t("Min"), align: "right", accessor: (r) => r.minStock,
      cell: (r) => <span className="tabular-nums text-content-muted">{r.minStock}</span> },
    { key: "purchasePrice", header: t("Cost"), align: "right", sortable: true, accessor: (r) => r.purchasePrice,
      cell: (r) => <span className="tabular-nums text-content-muted">{formatCurrency(r.purchasePrice)}</span> },
    { key: "sellingPrice", header: t("Price"), align: "right", sortable: true, accessor: (r) => r.sellingPrice,
      cell: (r) => <span className="tabular-nums">{formatCurrency(r.sellingPrice)}</span> },
    { key: "value", header: t("Value"), align: "right", sortable: true, accessor: (r) => r.value,
      cell: (r) => <span className="font-medium tabular-nums">{formatCurrency(r.value)}</span> },
    {
      key: "level", header: t("Status"), align: "center", accessor: (r) => stockLevel(r.stock, r.minStock),
      cell: (r) => {
        const level = stockLevel(r.stock, r.minStock);
        return <Badge tone={stockTone[level]} dot>{t(stockText[level])}</Badge>;
      },
    },
  ];

  const movementRows = React.useMemo(
    () => [...movements].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [movements],
  );

  const moveTypeTone: Record<MovementType, "success" | "info" | "warning"> = {
    purchase: "success",
    sale: "info",
    adjustment: "warning",
  };

  const movementColumns: Column<StockMovement>[] = [
    { key: "date", header: t("Date"), sortable: true, accessor: (m) => m.date, cell: (m) => formatDate(m.date) },
    { key: "productName", header: t("Product"), sortable: true, accessor: (m) => m.productName },
    {
      key: "type", header: t("Type"), align: "center", accessor: (m) => m.type,
      cell: (m) => <Badge tone={moveTypeTone[m.type]}>{t(m.type)}</Badge>,
    },
    {
      key: "quantity", header: t("Change"), align: "right", sortable: true, accessor: (m) => m.quantity,
      cell: (m) => (
        <span className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${m.quantity >= 0 ? "text-success" : "text-danger"}`}>
          {m.quantity >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {m.quantity > 0 ? "+" : ""}{m.quantity}
        </span>
      ),
    },
    { key: "reference", header: t("Reference"), accessor: (m) => m.reference },
    { key: "note", header: t("Note"), accessor: (m) => m.note ?? "—", cell: (m) => m.note || "—" },
  ];

  return (
    <>
      <PageHeader
        title={t("Inventory")}
        subtitle={t("Stock levels, adjustments and movement history")}
      />

      <div className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t("Inventory Value")} value={formatCurrency(totalValue)} icon={<Boxes className="h-5 w-5" />} tone="primary" />
          <StatCard label={t("Total SKUs")} value={formatNumber(products.length)} icon={<Warehouse className="h-5 w-5" />} tone="info" />
          <StatCard label={t("Low Stock")} value={String(lowCount)} icon={<AlertTriangle className="h-5 w-5" />} tone="warning" />
          <StatCard label={t("Out of Stock")} value={String(outCount)} icon={<XCircle className="h-5 w-5" />} tone="danger" />
        </div>

        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            { id: "stock", label: t("Stock Levels"), count: products.length },
            { id: "movements", label: t("Movements"), count: movements.length },
            { id: "valuation", label: t("Valuation") },
          ]}
        />

        {tab === "stock" && (
          <>
            <Card className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[220px] flex-1">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("Search by name or SKU…")}
                    leftIcon={<Search className="h-4 w-4" />}
                  />
                </div>
                <Select className="w-44" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
                  <option value="">{t("Any stock level")}</option>
                  <option value="in">{t("In stock")}</option>
                  <option value="low">{t("Low stock")}</option>
                  <option value="out">{t("Out of stock")}</option>
                </Select>
              </div>
            </Card>

            <Card className="overflow-hidden p-0">
              <DataTable
                columns={stockColumns}
                data={filtered}
                rowKey={(r) => r.id}
                rowActions={(r) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Settings2 className="h-4 w-4" />}
                    onClick={() => openAdjust(r)}
                  >
                    {t("Adjust")}
                  </Button>
                )}
                emptyState={
                  <EmptyState
                    icon={<Warehouse className="h-6 w-6" />}
                    title={t("No products found")}
                    description={t("Adjust your search or filters.")}
                  />
                }
              />
            </Card>
          </>
        )}

        {tab === "movements" && (
          <Card className="overflow-hidden p-0">
            <DataTable
              columns={movementColumns}
              data={movementRows}
              rowKey={(m) => m.id}
              emptyState={
                <EmptyState
                  icon={<SlidersHorizontal className="h-6 w-6" />}
                  title={t("No movements yet")}
                  description={t("Stock movements from purchases, sales and adjustments will appear here.")}
                />
              }
            />
          </Card>
        )}

        {tab === "valuation" && <ValuationPanel rows={rows} />}
      </div>

      {/* Adjustment dialog */}
      <Dialog
        open={!!adjust}
        onClose={() => setAdjust(null)}
        title={t("Stock adjustment")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdjust(null)}>{t("Cancel")}</Button>
            <Button onClick={saveAdjustment} disabled={adjustQty === 0}>{t("Apply adjustment")}</Button>
          </>
        }
      >
        {adjust && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border border-border bg-surface-muted p-3">
              <div>
                <p className="text-sm font-medium text-content">{adjust.name}</p>
                <p className="text-xs text-content-muted">{adjust.sku}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-content-muted">{t("Current")}</p>
                <p className="text-lg font-semibold text-content">{adjust.stock}</p>
              </div>
            </div>
            <div>
              <Label required>{t("Adjustment (use negative to remove)")}</Label>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="icon" onClick={() => setAdjustQty((q) => q - 1)}>−</Button>
                <Input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value) || 0)}
                  className="text-center"
                />
                <Button variant="secondary" size="icon" onClick={() => setAdjustQty((q) => q + 1)}>+</Button>
              </div>
              <p className="mt-1.5 text-xs text-content-muted">
                {t("New quantity")}: <span className="font-medium text-content">{Math.max(0, adjust.stock + adjustQty)}</span>
              </p>
            </div>
            <div>
              <Label>{t("Reason")}</Label>
              <Textarea
                rows={2}
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder={t("e.g. Damaged stock, stock count correction…")}
              />
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}

function ValuationPanel({ rows }: { rows: StockRow[] }) {
  const { t } = useT();
  const costValue = rows.reduce((s, r) => s + r.stock * r.purchasePrice, 0);
  const retailValue = rows.reduce((s, r) => s + r.stock * r.sellingPrice, 0);
  const potentialProfit = retailValue - costValue;
  const margin = retailValue > 0 ? (potentialProfit / retailValue) * 100 : 0;

  const byCategory = React.useMemo(() => {
    const map = new Map<string, { cost: number; retail: number; units: number }>();
    for (const r of rows) {
      const cur = map.get(r.category) ?? { cost: 0, retail: 0, units: 0 };
      cur.cost += r.stock * r.purchasePrice;
      cur.retail += r.stock * r.sellingPrice;
      cur.units += r.stock;
      map.set(r.category, cur);
    }
    return [...map.entries()]
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.cost - a.cost);
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("Stock Cost Value")} value={formatCurrency(costValue)} icon={<Boxes className="h-5 w-5" />} tone="primary" />
        <StatCard label={t("Retail Value")} value={formatCurrency(retailValue)} icon={<Warehouse className="h-5 w-5" />} tone="info" />
        <StatCard label={t("Potential Profit")} value={formatCurrency(potentialProfit)} icon={<AlertTriangle className="h-5 w-5" />} tone="success" />
        <StatCard label={t("Avg. Margin")} value={`${margin.toFixed(1)}%`} icon={<XCircle className="h-5 w-5" />} tone="warning" />
      </div>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-xs uppercase tracking-wide text-content-muted">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">{t("Category")}</th>
              <th className="px-4 py-2.5 text-right font-semibold">{t("Units")}</th>
              <th className="px-4 py-2.5 text-right font-semibold">{t("Cost Value")}</th>
              <th className="px-4 py-2.5 text-right font-semibold">{t("Retail Value")}</th>
              <th className="px-4 py-2.5 text-right font-semibold">{t("Profit")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {byCategory.map((c) => (
              <tr key={c.category} className="hover:bg-surface-muted">
                <td className="px-4 py-2.5 font-medium text-content">{c.category}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{c.units}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(c.cost)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(c.retail)}</td>
                <td className="px-4 py-2.5 text-right font-medium tabular-nums text-success">
                  {formatCurrency(c.retail - c.cost)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border-strong bg-surface-muted font-semibold text-content">
              <td className="px-4 py-2.5">{t("Total")}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{rows.reduce((s, r) => s + r.stock, 0)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(costValue)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(retailValue)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-success">{formatCurrency(potentialProfit)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  );
}
