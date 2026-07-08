import { db } from "@/lib/store/db";
import type { Invoice, InvoiceLine } from "@/lib/types";

export type InvoiceKind = "purchase" | "sale";

/** Stock direction: purchases add, sales subtract. */
function direction(kind: InvoiceKind) {
  return kind === "purchase" ? 1 : -1;
}

/**
 * For a sale, verify every line can be fulfilled from available stock.
 * Returns the name of the first product that can't, or null if all OK.
 */
export function findUnfulfillable(lines: InvoiceLine[]): string | null {
  for (const line of lines) {
    const product = db.products.getById(line.productId);
    if (!product || product.stock < line.quantity) {
      return product?.name ?? "Unknown product";
    }
  }
  return null;
}

/** Apply an invoice's stock effect and record a movement per line. */
export function applyInvoiceStock(kind: InvoiceKind, invoice: Invoice) {
  const dir = direction(kind);
  for (const line of invoice.lines) {
    const product = db.products.getById(line.productId);
    if (!product) continue;
    db.products.update(product.id, {
      stock: product.stock + dir * line.quantity,
    });
    db.movements.create({
      productId: line.productId,
      productName: line.productName,
      type: kind,
      quantity: dir * line.quantity,
      reference: invoice.reference,
      date: invoice.date,
    });
  }
  updateParty(kind, invoice, 1);
}

/** Reverse a previously applied invoice (used when deleting a confirmed one). */
export function reverseInvoiceStock(kind: InvoiceKind, invoice: Invoice) {
  const dir = direction(kind);
  for (const line of invoice.lines) {
    const product = db.products.getById(line.productId);
    if (!product) continue;
    db.products.update(product.id, {
      stock: product.stock - dir * line.quantity,
    });
  }
  db.movements
    .list()
    .filter((m) => m.reference === invoice.reference)
    .forEach((m) => db.movements.remove(m.id));
  updateParty(kind, invoice, -1);
}

/** Update supplier/customer aggregate totals. */
function updateParty(kind: InvoiceKind, invoice: Invoice, sign: 1 | -1) {
  if (kind === "purchase") {
    const supplier = db.suppliers.getById(invoice.partyId);
    if (supplier) {
      db.suppliers.update(supplier.id, {
        totalPurchased: Math.max(0, supplier.totalPurchased + sign * invoice.total),
      });
    }
  } else {
    const customer = db.customers.getById(invoice.partyId);
    if (customer) {
      db.customers.update(customer.id, {
        totalSpent: Math.max(0, customer.totalSpent + sign * invoice.total),
        totalOrders: Math.max(0, customer.totalOrders + sign),
      });
    }
  }
}

/** Generate the next sequential reference, e.g. PO-2026-0075. */
export function nextReference(kind: InvoiceKind, existing: Invoice[]): string {
  const prefix = kind === "purchase" ? "PO" : "SO";
  const year = new Date().getFullYear();
  const nums = existing
    .map((i) => {
      const m = i.reference.match(/(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${year}-${String(next).padStart(4, "0")}`;
}

/** Generate the next sequential bill/invoice number, e.g. BILL-3391 / INV-8842. */
export function nextInvoiceNumber(kind: InvoiceKind, existing: Invoice[]): string {
  const prefix = kind === "purchase" ? "BILL" : "INV";
  const nums = existing
    .map((i) => {
      const m = i.invoiceNumber?.match(/(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => !Number.isNaN(n));
  const base = kind === "purchase" ? 3390 : 8840;
  const next = Math.max(base, ...(nums.length ? nums : [base])) + 1;
  return `${prefix}-${next}`;
}

export function lineTotal(line: InvoiceLine): number {
  const gross = line.quantity * line.unitPrice;
  const discount = gross * ((line.discount ?? 0) / 100);
  return gross - discount;
}

export function invoiceTotal(lines: InvoiceLine[]): number {
  return lines.reduce((sum, l) => sum + lineTotal(l), 0);
}
