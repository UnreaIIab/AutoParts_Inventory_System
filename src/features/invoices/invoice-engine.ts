import { db } from "@/lib/store/db";
import type { Invoice, InvoiceLine } from "@/lib/types";

export type InvoiceKind = "purchase" | "sale";

/** Stock direction: purchases add, sales subtract. */
function direction(kind: InvoiceKind) {
  return kind === "purchase" ? 1 : -1;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Net cost of one unit on a line, after its discount. */
function unitCost(line: InvoiceLine) {
  return line.quantity > 0 ? lineTotal(line) / line.quantity : 0;
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

/**
 * Apply an invoice's stock effect and record a movement per line.
 *
 * Purchases also update the product's cost using the **Weighted Average Cost**
 * (moving average) method: the on-hand value and the newly received value are
 * blended, so `purchasePrice` always reflects the average cost of stock on hand.
 * Sales do NOT change the cost (selling doesn't alter unit cost under WAC).
 */
export function applyInvoiceStock(kind: InvoiceKind, invoice: Invoice) {
  const dir = direction(kind);
  for (const line of invoice.lines) {
    const product = db.products.getById(line.productId);
    if (!product) continue;

    const patch: { stock: number; purchasePrice?: number } = {
      stock: product.stock + dir * line.quantity,
    };

    if (kind === "purchase") {
      const onHand = Math.max(0, product.stock);
      const received = line.quantity;
      const newQty = onHand + received;
      const cost = unitCost(line);
      const newAvg =
        newQty > 0
          ? (onHand * product.purchasePrice + received * cost) / newQty
          : cost;
      patch.purchasePrice = round2(newAvg);
    }

    db.products.update(product.id, patch);

    db.movements.create({
      productId: line.productId,
      productName: line.productName,
      type: kind,
      quantity: dir * line.quantity,
      reference: invoice.reference,
      date: invoice.date,
      note:
        kind === "purchase"
          ? `Received @ ${round2(unitCost(line))} DH · avg cost ${patch.purchasePrice} DH`
          : undefined,
    });
  }
  updateParty(kind, invoice, 1);
}

/**
 * Reverse a previously applied invoice (used when deleting a confirmed one).
 * For purchases we also un-blend the weighted-average cost as a best effort
 * (exact when it was the most recent movement).
 */
export function reverseInvoiceStock(kind: InvoiceKind, invoice: Invoice) {
  const dir = direction(kind);
  for (const line of invoice.lines) {
    const product = db.products.getById(line.productId);
    if (!product) continue;

    const patch: { stock: number; purchasePrice?: number } = {
      stock: product.stock - dir * line.quantity,
    };

    if (kind === "purchase") {
      const curQty = product.stock;
      const remaining = curQty - line.quantity;
      if (remaining > 0) {
        const cost = unitCost(line);
        const newAvg =
          (curQty * product.purchasePrice - line.quantity * cost) / remaining;
        patch.purchasePrice = round2(Math.max(0, newAvg));
      }
    }

    db.products.update(product.id, patch);
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
