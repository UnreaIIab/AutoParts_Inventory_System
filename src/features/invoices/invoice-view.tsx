"use client";

import * as React from "react";
import {
  Plus,
  Search,
  Trash2,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  DollarSign,
  Receipt,
  ShoppingCart,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Dropdown, DropdownItem, DropdownDivider } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { useCollection } from "@/lib/store/hooks";
import { db } from "@/lib/store/db";
import type {
  Invoice,
  InvoiceLine,
  InvoiceStatus,
  PaymentStatus,
  Supplier,
  Customer,
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  type InvoiceKind,
  applyInvoiceStock,
  reverseInvoiceStock,
  findUnfulfillable,
  nextReference,
  nextInvoiceNumber,
  invoiceTotal,
  lineTotal,
} from "./invoice-engine";

const statusTone: Record<InvoiceStatus, "neutral" | "info" | "success"> = {
  draft: "neutral",
  confirmed: "info",
  paid: "success",
};

const paymentTone: Record<PaymentStatus, "danger" | "warning" | "success"> = {
  unpaid: "danger",
  partial: "warning",
  paid: "success",
};

interface DraftLine {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export function InvoiceView({ kind }: { kind: InvoiceKind }) {
  const toast = useToast();
  const isPurchase = kind === "purchase";
  const collection = isPurchase ? db.purchases : db.sales;
  const invoices = useCollection(collection);
  const suppliers = useCollection(db.suppliers);
  const customers = useCollection(db.customers);
  const parties: (Supplier | Customer)[] = isPurchase ? suppliers : customers;
  const products = useCollection(db.products);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [viewing, setViewing] = React.useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Invoice | null>(null);

  // create form state
  const [partyId, setPartyId] = React.useState("");
  const [invoiceNumber, setInvoiceNumber] = React.useState("");
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatus>("unpaid");
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [lines, setLines] = React.useState<DraftLine[]>([{ productId: "", quantity: 1, unitPrice: 0, discount: 0 }]);
  const [notes, setNotes] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (q && !`${inv.reference} ${inv.partyName}`.toLowerCase().includes(q)) return false;
      if (statusFilter && inv.status !== statusFilter) return false;
      return true;
    });
  }, [invoices, search, statusFilter]);

  const openCreate = () => {
    setPartyId("");
    setInvoiceNumber(nextInvoiceNumber(kind, invoices));
    setPaymentStatus("unpaid");
    setDate(new Date().toISOString().slice(0, 10));
    setLines([{ productId: "", quantity: 1, unitPrice: 0, discount: 0 }]);
    setNotes("");
    setCreating(true);
  };

  const setLine = (i: number, patch: Partial<DraftLine>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const onProductChange = (i: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    const price = product ? (isPurchase ? product.purchasePrice : product.sellingPrice) : 0;
    setLine(i, { productId, unitPrice: price });
  };

  const addLine = () => setLines((prev) => [...prev, { productId: "", quantity: 1, unitPrice: 0, discount: 0 }]);
  const removeLine = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i));

  const draftLines: InvoiceLine[] = lines
    .filter((l) => l.productId && l.quantity > 0)
    .map((l) => {
      const product = products.find((p) => p.id === l.productId)!;
      return {
        productId: l.productId,
        productName: product.name,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discount: l.discount,
      };
    });

  const total = invoiceTotal(draftLines);

  const buildInvoice = (status: InvoiceStatus): Invoice | null => {
    const party = parties.find((p) => p.id === partyId);
    if (!party) {
      toast.error("Missing " + (isPurchase ? "supplier" : "customer"), "Please select one.");
      return null;
    }
    if (draftLines.length === 0) {
      toast.error("No line items", "Add at least one product.");
      return null;
    }
    return {
      id: crypto.randomUUID(),
      reference: nextReference(kind, invoices),
      invoiceNumber: invoiceNumber.trim() || undefined,
      partyId: party.id,
      partyName: party.name,
      date,
      status,
      paymentStatus,
      lines: draftLines,
      total,
      notes,
    };
  };

  const saveDraft = () => {
    const invoice = buildInvoice("draft");
    if (!invoice) return;
    collection.create(invoice);
    toast.success("Draft saved", invoice.reference);
    setCreating(false);
  };

  const saveConfirmed = () => {
    const invoice = buildInvoice("confirmed");
    if (!invoice) return;
    if (!isPurchase) {
      const blocker = findUnfulfillable(invoice.lines);
      if (blocker) {
        toast.error("Insufficient stock", `Not enough stock for “${blocker}”.`);
        return;
      }
    }
    collection.create(invoice);
    applyInvoiceStock(kind, invoice);
    toast.success(
      isPurchase ? "Purchase received" : "Sale confirmed",
      `${invoice.reference} · stock updated`,
    );
    setCreating(false);
  };

  const confirmExisting = (inv: Invoice) => {
    if (!isPurchase) {
      const blocker = findUnfulfillable(inv.lines);
      if (blocker) {
        toast.error("Insufficient stock", `Not enough stock for “${blocker}”.`);
        return;
      }
    }
    collection.update(inv.id, { status: "confirmed" });
    applyInvoiceStock(kind, { ...inv, status: "confirmed" });
    toast.success("Confirmed", `${inv.reference} · stock updated`);
    setViewing(null);
  };

  const markPaid = (inv: Invoice) => {
    collection.update(inv.id, { status: "paid", paymentStatus: "paid" });
    toast.success("Marked as paid", inv.reference);
    setViewing((v) =>
      v && v.id === inv.id ? { ...v, status: "paid", paymentStatus: "paid" } : v,
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.status !== "draft") {
      reverseInvoiceStock(kind, deleteTarget);
    }
    collection.remove(deleteTarget.id);
    toast.success("Deleted", `${deleteTarget.reference}${deleteTarget.status !== "draft" ? " · stock reversed" : ""}`);
    setDeleteTarget(null);
    setViewing(null);
  };

  const columns: Column<Invoice>[] = [
    {
      key: "reference", header: "Reference", sortable: true, accessor: (i) => i.reference,
      cell: (i) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary-soft text-primary">
            {isPurchase ? <ShoppingCart className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
          </span>
          <div>
            <p className="font-medium text-content">{i.reference}</p>
            <p className="text-xs text-content-muted">{i.lines.length} items</p>
          </div>
        </div>
      ),
    },
    { key: "partyName", header: isPurchase ? "Supplier" : "Customer", sortable: true, accessor: (i) => i.partyName },
    { key: "date", header: "Date", sortable: true, accessor: (i) => i.date, cell: (i) => formatDate(i.date) },
    {
      key: "total", header: "Total", align: "right", sortable: true, accessor: (i) => i.total,
      cell: (i) => <span className="font-medium">{formatCurrency(i.total)}</span>,
    },
    {
      key: "payment", header: "Payment", align: "center", accessor: (i) => i.paymentStatus,
      cell: (i) => <Badge tone={paymentTone[i.paymentStatus]}>{i.paymentStatus}</Badge>,
    },
    {
      key: "status", header: "Status", align: "center", sortable: true, accessor: (i) => i.status,
      cell: (i) => <Badge tone={statusTone[i.status]} dot>{i.status}</Badge>,
    },
  ];

  const noun = isPurchase ? "Purchase" : "Sale";

  return (
    <>
      <PageHeader
        title={isPurchase ? "Purchases" : "Sales"}
        subtitle={`${invoices.length} ${isPurchase ? "purchase" : "sales"} invoices`}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            New {noun}
          </Button>
        }
      />

      <div className="space-y-4 p-5">
        <Card className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[220px] flex-1">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by reference or name…"
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select
              className="w-44"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Any status</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="paid">Paid</option>
            </Select>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(i) => i.id}
            onRowClick={(i) => setViewing(i)}
            rowActions={(i) => (
              <Dropdown
                trigger={<Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>}
              >
                <DropdownItem icon={<Eye className="h-4 w-4" />} onClick={() => setViewing(i)}>
                  View
                </DropdownItem>
                {i.status === "draft" && (
                  <DropdownItem icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => confirmExisting(i)}>
                    Confirm
                  </DropdownItem>
                )}
                {i.status === "confirmed" && (
                  <DropdownItem icon={<DollarSign className="h-4 w-4" />} onClick={() => markPaid(i)}>
                    Mark as paid
                  </DropdownItem>
                )}
                <DropdownDivider />
                <DropdownItem tone="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteTarget(i)}>
                  Delete
                </DropdownItem>
              </Dropdown>
            )}
            emptyState={
              <EmptyState
                icon={isPurchase ? <ShoppingCart className="h-6 w-6" /> : <Receipt className="h-6 w-6" />}
                title={`No ${isPurchase ? "purchases" : "sales"} yet`}
                description={`Create a ${noun.toLowerCase()} invoice to ${isPurchase ? "receive stock" : "sell products"}.`}
                action={<Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>New {noun}</Button>}
              />
            }
          />
        </Card>
      </div>

      {/* Create drawer */}
      <Drawer
        open={creating}
        onClose={() => setCreating(false)}
        width="lg"
        title={`New ${noun.toLowerCase()} invoice`}
        description={isPurchase ? "Receiving will increase stock" : "Confirming will decrease stock"}
        footer={
          <>
            <div className="mr-auto text-sm">
              <span className="text-content-muted">Total:&nbsp;</span>
              <span className="text-base font-semibold text-content">{formatCurrency(total)}</span>
            </div>
            <Button variant="secondary" onClick={saveDraft}>Save draft</Button>
            <Button icon={<CheckCircle2 className="h-4 w-4" />} onClick={saveConfirmed}>
              {isPurchase ? "Receive" : "Confirm"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label required>{isPurchase ? "Supplier" : "Customer"}</Label>
              <Select value={partyId} onChange={(e) => setPartyId(e.target.value)}>
                <option value="">Select {isPurchase ? "supplier" : "customer"}…</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>{isPurchase ? "Bill number" : "Invoice number"}</Label>
              <Input value={invoiceNumber} disabled readOnly />
              <p className="mt-1 text-xs text-content-subtle">Generated automatically</p>
            </div>
            <div>
              <Label required>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Payment status</Label>
              <Select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
              >
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </Select>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="mb-0">Line items</Label>
              <Button size="sm" variant="ghost" icon={<Plus className="h-4 w-4" />} onClick={addLine}>
                Add line
              </Button>
            </div>
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-muted text-xs uppercase tracking-wide text-content-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Product</th>
                    <th className="w-20 px-2 py-2 text-right font-semibold">Qty</th>
                    <th className="w-24 px-2 py-2 text-right font-semibold">Price</th>
                    <th className="w-20 px-2 py-2 text-right font-semibold">Disc %</th>
                    <th className="w-28 px-2 py-2 text-right font-semibold">Total</th>
                    <th className="w-10 px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lines.map((line, i) => {
                    const product = products.find((p) => p.id === line.productId);
                    return (
                      <tr key={i}>
                        <td className="px-3 py-2">
                          <Select
                            value={line.productId}
                            onChange={(e) => onProductChange(i, e.target.value)}
                            className="h-8"
                          >
                            <option value="">Select product…</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} {!isPurchase ? `(${p.stock} in stock)` : ""}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            min={1}
                            value={line.quantity}
                            onChange={(e) => setLine(i, { quantity: Math.max(1, Number(e.target.value) || 0) })}
                            className="no-spin h-8 px-2 text-right"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={line.unitPrice}
                            onChange={(e) => setLine(i, { unitPrice: Number(e.target.value) || 0 })}
                            className="no-spin h-8 px-2 text-right"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={line.discount}
                            onChange={(e) =>
                              setLine(i, {
                                discount: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                              })
                            }
                            className="no-spin h-8 px-2 text-right"
                          />
                        </td>
                        <td className="px-2 py-2 text-right font-medium tabular-nums">
                          {formatCurrency(lineTotal({ ...line, productName: "" }))}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {lines.length > 1 && (
                            <button
                              onClick={() => removeLine(i)}
                              className="rounded p-1 text-content-subtle hover:bg-danger-soft hover:text-danger"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                          {product && !isPurchase && line.quantity > product.stock && (
                            <p className="mt-0.5 text-[10px] text-danger">low</p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional…" />
          </div>
        </div>
      </Drawer>

      {/* View drawer */}
      <Drawer
        open={!!viewing}
        onClose={() => setViewing(null)}
        width="md"
        title={viewing?.reference}
        description={viewing ? `${viewing.partyName} · ${formatDate(viewing.date)}` : ""}
        footer={
          viewing && (
            <>
              <Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>
              {viewing.status === "draft" && (
                <Button icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => confirmExisting(viewing)}>
                  {isPurchase ? "Receive" : "Confirm"}
                </Button>
              )}
              {viewing.status === "confirmed" && (
                <Button icon={<DollarSign className="h-4 w-4" />} onClick={() => markPaid(viewing)}>
                  Mark as paid
                </Button>
              )}
            </>
          )
        }
      >
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge tone={statusTone[viewing.status]} dot>{viewing.status}</Badge>
                <Badge tone={paymentTone[viewing.paymentStatus]}>{viewing.paymentStatus}</Badge>
              </div>
              <span className="text-lg font-semibold text-content">{formatCurrency(viewing.total)}</span>
            </div>
            {viewing.invoiceNumber && (
              <p className="text-sm text-content-muted">
                {isPurchase ? "Bill" : "Invoice"} #: <span className="font-medium text-content">{viewing.invoiceNumber}</span>
              </p>
            )}
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-muted text-xs uppercase tracking-wide text-content-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Product</th>
                    <th className="px-3 py-2 text-right font-semibold">Qty</th>
                    <th className="px-3 py-2 text-right font-semibold">Price</th>
                    <th className="px-3 py-2 text-right font-semibold">Disc</th>
                    <th className="px-3 py-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {viewing.lines.map((l, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{l.productName}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{l.quantity}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(l.unitPrice)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-content-muted">
                        {l.discount ? `${l.discount}%` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums">
                        {formatCurrency(lineTotal(l))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {viewing.notes && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-content-subtle">Notes</p>
                <p className="text-sm text-content-muted">{viewing.notes}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 className="h-4 w-4" />}
              className="text-danger hover:bg-danger-soft"
              onClick={() => setDeleteTarget(viewing)}
            >
              Delete invoice
            </Button>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete invoice"
        message={
          deleteTarget && deleteTarget.status !== "draft"
            ? `This will remove ${deleteTarget.reference} and reverse its stock movements.`
            : `This will permanently remove ${deleteTarget?.reference}.`
        }
      />
    </>
  );
}
