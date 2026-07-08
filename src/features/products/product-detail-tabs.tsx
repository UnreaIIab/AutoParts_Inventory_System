"use client";

import * as React from "react";
import { Package, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, EmptyState } from "@/components/ui/misc";
import { useCollection } from "@/lib/store/hooks";
import { db } from "@/lib/store/db";
import type { Product, Invoice, MovementType } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { stockLevel } from "./product-schema";
import { lineTotal } from "@/features/invoices/invoice-engine";

const stockTone = { in: "success", low: "warning", out: "danger" } as const;
const stockText = { in: "In stock", low: "Low stock", out: "Out of stock" };

export function ProductDetailTabs({ product }: { product: Product }) {
  const sales = useCollection(db.sales);
  const purchases = useCollection(db.purchases);
  const movements = useCollection(db.movements);
  const [tab, setTab] = React.useState("general");

  const level = stockLevel(product.stock, product.minStock);
  const margin =
    product.sellingPrice > 0
      ? ((product.sellingPrice - product.purchasePrice) / product.sellingPrice) * 100
      : 0;

  const productSales = sales.filter((i) => i.lines.some((l) => l.productId === product.id));
  const productPurchases = purchases.filter((i) => i.lines.some((l) => l.productId === product.id));
  const productMovements = movements
    .filter((m) => m.productId === product.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="flex items-center gap-4 rounded-md border border-border bg-surface-muted p-4">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-16 w-16 rounded-md border border-border object-cover" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-md bg-primary-soft text-primary">
            <Package className="h-7 w-7" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-content">{product.stock} {product.unit}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge tone={stockTone[level]} dot>{stockText[level]}</Badge>
            <Badge tone={product.status === "active" ? "success" : "neutral"}>{product.status}</Badge>
          </div>
        </div>
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "general", label: "General" },
          { id: "inventory", label: "Inventory" },
          { id: "purchases", label: "Purchases", count: productPurchases.length },
          { id: "sales", label: "Sales", count: productSales.length },
          { id: "movements", label: "Movements", count: productMovements.length },
        ]}
      />

      {tab === "general" && (
        <DefList
          rows={[
            ["SKU", product.sku],
            ["Barcode", product.barcode || "—"],
            ["Category", product.category],
            ["Brand", product.brand],
            ["Supplier", product.supplier],
            ["Unit", product.unit],
            ["Purchase price", formatCurrency(product.purchasePrice)],
            ["Selling price", formatCurrency(product.sellingPrice)],
            ["Margin", `${margin.toFixed(1)}%`],
            ["Created", formatDate(product.createdAt)],
            ...(product.updatedAt ? [["Last updated", formatDate(product.updatedAt)] as [string, string]] : []),
          ]}
          footer={product.description}
        />
      )}

      {tab === "inventory" && (
        <DefList
          rows={[
            ["On hand", `${product.stock} ${product.unit}`],
            ["Minimum stock", `${product.minStock} ${product.unit}`],
            ["Stock status", stockText[level]],
            ["Unit cost", formatCurrency(product.purchasePrice)],
            ["Inventory value", formatCurrency(product.stock * product.purchasePrice)],
          ]}
        />
      )}

      {tab === "purchases" && <InvoiceList invoices={productPurchases} productId={product.id} empty="No purchases for this product yet." />}
      {tab === "sales" && <InvoiceList invoices={productSales} productId={product.id} empty="No sales for this product yet." />}

      {tab === "movements" && (
        productMovements.length === 0 ? (
          <EmptyState title="No stock movements" description="Purchases, sales and adjustments will appear here." />
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-xs uppercase tracking-wide text-content-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Date</th>
                  <th className="px-3 py-2 text-left font-semibold">Type</th>
                  <th className="px-3 py-2 text-right font-semibold">Change</th>
                  <th className="px-3 py-2 text-left font-semibold">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {productMovements.map((m) => (
                  <tr key={m.id}>
                    <td className="px-3 py-2">{formatDate(m.date)}</td>
                    <td className="px-3 py-2"><MovementBadge type={m.type} /></td>
                    <td className={`px-3 py-2 text-right font-medium tabular-nums ${m.quantity >= 0 ? "text-success" : "text-danger"}`}>
                      <span className="inline-flex items-center gap-0.5">
                        {m.quantity >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                        {m.quantity > 0 ? "+" : ""}{m.quantity}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-content-muted">{m.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

function MovementBadge({ type }: { type: MovementType }) {
  const tone = { purchase: "success", sale: "info", adjustment: "warning" } as const;
  return <Badge tone={tone[type]}>{type}</Badge>;
}

function DefList({ rows, footer }: { rows: [string, React.ReactNode][]; footer?: string }) {
  return (
    <div className="space-y-4">
      <dl className="divide-y divide-border rounded-md border border-border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <dt className="text-content-muted">{label}</dt>
            <dd className="font-medium text-content">{value}</dd>
          </div>
        ))}
      </dl>
      {footer && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-content-subtle">Description</p>
          <p className="text-sm text-content-muted">{footer}</p>
        </div>
      )}
    </div>
  );
}

function InvoiceList({ invoices, productId, empty }: { invoices: Invoice[]; productId: string; empty: string }) {
  if (invoices.length === 0) {
    return <EmptyState title="Nothing here yet" description={empty} />;
  }
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-muted text-xs uppercase tracking-wide text-content-muted">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Reference</th>
            <th className="px-3 py-2 text-left font-semibold">Party</th>
            <th className="px-3 py-2 text-right font-semibold">Qty</th>
            <th className="px-3 py-2 text-right font-semibold">Line total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {invoices.map((inv) => {
            const line = inv.lines.find((l) => l.productId === productId)!;
            return (
              <tr key={inv.id}>
                <td className="px-3 py-2 font-medium">{inv.reference}</td>
                <td className="px-3 py-2 text-content-muted">{inv.partyName}</td>
                <td className="px-3 py-2 text-right tabular-nums">{line.quantity}</td>
                <td className="px-3 py-2 text-right font-medium tabular-nums">{formatCurrency(lineTotal(line))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
