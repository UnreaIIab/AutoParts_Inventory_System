"use client";

import * as React from "react";
import {
  Plus,
  Search,
  Truck,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Trash2,
  MoreHorizontal,
  Eye,
  Package,
  Receipt,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Drawer } from "@/components/ui/drawer";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { Dropdown, DropdownItem, DropdownDivider } from "@/components/ui/dropdown";
import { EmptyState, Tabs } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { useCollection } from "@/lib/store/hooks";
import { db } from "@/lib/store/db";
import type { Supplier } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";

/* --------- shared contact form shape (used by Suppliers & Customers) -------- */
export interface ContactFormValues {
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  contactPerson: string;
  taxNumber: string;
  notes: string;
}

export const emptyContact: ContactFormValues = {
  name: "",
  email: "",
  phone: "",
  city: "",
  address: "",
  contactPerson: "",
  taxNumber: "",
  notes: "",
};

type DialogState =
  | { type: "create" }
  | { type: "edit"; supplier: Supplier }
  | null;

export function SuppliersView() {
  const toast = useToast();
  const { t } = useT();
  const suppliers = useCollection(db.suppliers);
  const products = useCollection(db.products);
  const purchases = useCollection(db.purchases);

  const [search, setSearch] = React.useState("");
  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [viewing, setViewing] = React.useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Supplier | null>(null);
  const [form, setForm] = React.useState<ContactFormValues>(emptyContact);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) =>
      `${s.name} ${s.email} ${s.city} ${s.contactPerson ?? ""}`.toLowerCase().includes(q),
    );
  }, [suppliers, search]);

  const openCreate = () => {
    setForm(emptyContact);
    setErrors({});
    setDialog({ type: "create" });
  };
  const openEdit = (s: Supplier) => {
    setForm({
      name: s.name, email: s.email, phone: s.phone, city: s.city,
      address: s.address ?? "", contactPerson: s.contactPerson ?? "",
      taxNumber: s.taxNumber ?? "", notes: s.notes ?? "",
    });
    setErrors({});
    setDialog({ type: "edit", supplier: s });
  };

  const save = () => {
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = t("Name is required");
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email))
      errs.email = t("Enter a valid email");
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (dialog?.type === "edit") {
      db.suppliers.update(dialog.supplier.id, form);
      toast.success(t("Supplier updated"), form.name);
    } else {
      db.suppliers.create({
        ...form,
        productsSupplied: 0,
        totalPurchased: 0,
        createdAt: new Date().toISOString(),
      });
      toast.success(t("Supplier created"), form.name);
    }
    setDialog(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    db.suppliers.remove(deleteTarget.id);
    toast.success(t("Supplier deleted"), deleteTarget.name);
    setDeleteTarget(null);
  };

  const columns: Column<Supplier>[] = [
    {
      key: "name", header: t("Supplier"), sortable: true, accessor: (s) => s.name,
      cell: (s) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary-soft text-primary">
            <Truck className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-content">{s.name}</p>
            <p className="truncate text-xs text-content-muted">{s.email}</p>
          </div>
        </div>
      ),
    },
    { key: "contactPerson", header: t("Contact"), accessor: (s) => s.contactPerson ?? "—",
      cell: (s) => s.contactPerson || "—" },
    { key: "city", header: t("City"), sortable: true, accessor: (s) => s.city },
    { key: "phone", header: t("Phone"), accessor: (s) => s.phone },
    {
      key: "totalPurchased", header: t("Total Purchased"), align: "right", sortable: true,
      accessor: (s) => s.totalPurchased,
      cell: (s) => <span className="font-medium">{formatCurrency(s.totalPurchased)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title={t("Suppliers")}
        subtitle={t("{n} suppliers", { n: suppliers.length })}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            {t("New Supplier")}
          </Button>
        }
      />

      <div className="space-y-4 p-5">
        <Card className="p-3">
          <div className="max-w-md">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Search suppliers…")}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(s) => s.id}
            onRowClick={(s) => setViewing(s)}
            rowActions={(s) => (
              <Dropdown
                trigger={
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                }
              >
                <DropdownItem icon={<Eye className="h-4 w-4" />} onClick={() => setViewing(s)}>
                  {t("View details")}
                </DropdownItem>
                <DropdownItem icon={<Pencil className="h-4 w-4" />} onClick={() => openEdit(s)}>
                  {t("Edit")}
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem tone="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteTarget(s)}>
                  {t("Delete")}
                </DropdownItem>
              </Dropdown>
            )}
            emptyState={
              <EmptyState
                icon={<Truck className="h-6 w-6" />}
                title={t("No suppliers found")}
                description={t("Add suppliers to track purchases and sourcing.")}
                action={<Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>{t("New Supplier")}</Button>}
              />
            }
          />
        </Card>
      </div>

      {/* Create / edit dialog */}
      <Dialog
        open={!!dialog}
        onClose={() => setDialog(null)}
        title={dialog?.type === "edit" ? t("Edit supplier") : t("New supplier")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>{t("Cancel")}</Button>
            <Button onClick={save}>{dialog?.type === "edit" ? t("Save changes") : t("Create")}</Button>
          </>
        }
      >
        <ContactForm form={form} setForm={setForm} errors={errors} showContact showTax showNotes />
      </Dialog>

      {/* Detail drawer with tabs */}
      <Drawer
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.name}
        description={viewing ? t("Supplier since {date}", { date: formatDate(viewing.createdAt) }) : ""}
        footer={
          viewing && (
            <>
              <Button variant="secondary" onClick={() => setViewing(null)}>{t("Close")}</Button>
              <Button icon={<Pencil className="h-4 w-4" />} onClick={() => { openEdit(viewing); setViewing(null); }}>{t("Edit")}</Button>
            </>
          )
        }
      >
        {viewing && (
          <SupplierDetailTabs
            supplier={viewing}
            products={products.filter((p) => p.supplier === viewing.name)}
            purchases={purchases.filter((p) => p.partyId === viewing.id || p.partyName === viewing.name)}
          />
        )}
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={t("Delete supplier")}
        message={t('This will permanently remove “{name}”.', { name: deleteTarget?.name ?? "" })}
      />
    </>
  );
}

/* --------------------------- shared contact form -------------------------- */
export function ContactForm({
  form,
  setForm,
  errors,
  showContact,
  showTax,
  showNotes,
}: {
  form: ContactFormValues;
  setForm: React.Dispatch<React.SetStateAction<ContactFormValues>>;
  errors: Record<string, string>;
  showContact?: boolean;
  showTax?: boolean;
  showNotes?: boolean;
}) {
  const { t } = useT();
  const set =
    (k: keyof ContactFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label required>{t("Name")}</Label>
        <Input value={form.name} onChange={set("name")} invalid={!!errors.name} autoFocus />
        {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
      </div>
      <div>
        <Label>{t("Email")}</Label>
        <Input value={form.email} onChange={set("email")} invalid={!!errors.email} />
        {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
      </div>
      <div>
        <Label>{t("Phone")}</Label>
        <Input value={form.phone} onChange={set("phone")} />
      </div>
      {showContact && (
        <div>
          <Label>{t("Contact person")}</Label>
          <Input value={form.contactPerson} onChange={set("contactPerson")} />
        </div>
      )}
      {showTax && (
        <div>
          <Label>{t("Tax number")}</Label>
          <Input value={form.taxNumber} onChange={set("taxNumber")} />
        </div>
      )}
      <div>
        <Label>{t("City")}</Label>
        <Input value={form.city} onChange={set("city")} />
      </div>
      <div className="sm:col-span-2">
        <Label>{t("Address")}</Label>
        <Input value={form.address} onChange={set("address")} />
      </div>
      {showNotes && (
        <div className="sm:col-span-2">
          <Label>{t("Notes")}</Label>
          <Textarea rows={2} value={form.notes} onChange={set("notes")} placeholder={t("Optional notes…")} />
        </div>
      )}
    </div>
  );
}

/* ----------------------------- supplier detail ---------------------------- */
function SupplierDetailTabs({
  supplier,
  products,
  purchases,
}: {
  supplier: Supplier;
  products: { id: string; name: string; stock: number; unit: string }[];
  purchases: { id: string; reference: string; date: string; total: number; paymentStatus: string }[];
}) {
  const { t } = useT();
  const [tab, setTab] = React.useState("general");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <InfoTile icon={<Package className="h-4 w-4" />} label={t("Products")} value={String(products.length)} />
        <InfoTile icon={<Truck className="h-4 w-4" />} label={t("Total Purchased")} value={formatCurrency(supplier.totalPurchased)} />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "general", label: t("General") },
          { id: "products", label: t("Products"), count: products.length },
          { id: "purchases", label: t("Purchases"), count: purchases.length },
          { id: "payments", label: t("Payments") },
        ]}
      />

      {tab === "general" && (
        <div className="space-y-4">
          <ContactBlock email={supplier.email} phone={supplier.phone} city={supplier.city} address={supplier.address} />
          <dl className="divide-y divide-border rounded-md border border-border text-sm">
            <Row label={t("Contact person")} value={supplier.contactPerson || "—"} />
            <Row label={t("Tax number")} value={supplier.taxNumber || "—"} />
          </dl>
          {supplier.notes && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-content-subtle">{t("Notes")}</p>
              <p className="text-sm text-content-muted">{supplier.notes}</p>
            </div>
          )}
        </div>
      )}

      {tab === "products" && (
        <Section title={t("Products supplied ({n})", { n: products.length })}>
          {products.length === 0 ? (
            <p className="px-4 py-3 text-sm text-content-muted">{t("No products linked.")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {products.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="truncate">{p.name}</span>
                  <span className="text-content-muted">{p.stock} {p.unit}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {tab === "purchases" && (
        <Section title={t("Purchase history ({n})", { n: purchases.length })}>
          {purchases.length === 0 ? (
            <p className="px-4 py-3 text-sm text-content-muted">{t("No purchases yet.")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {purchases.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <div>
                    <p className="font-medium">{p.reference}</p>
                    <p className="text-xs text-content-muted">{formatDate(p.date)}</p>
                  </div>
                  <span className="font-medium">{formatCurrency(p.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {tab === "payments" && (
        <EmptyState
          icon={<Wallet className="h-6 w-6" />}
          title={t("Payments — coming soon")}
          description={t("Supplier payment tracking and accounts payable will live here.")}
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <dt className="text-content-muted">{label}</dt>
      <dd className="font-medium text-content">{value}</dd>
    </div>
  );
}

export function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-muted p-3">
      <div className="flex items-center gap-1.5 text-xs text-content-muted">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold text-content">{value}</p>
    </div>
  );
}

export function ContactBlock({
  email,
  phone,
  city,
  address,
}: {
  email: string;
  phone: string;
  city: string;
  address?: string;
}) {
  return (
    <div className="space-y-2 rounded-md border border-border p-4 text-sm">
      <div className="flex items-center gap-2 text-content-muted">
        <Mail className="h-4 w-4" /> <span className="text-content">{email}</span>
      </div>
      <div className="flex items-center gap-2 text-content-muted">
        <Phone className="h-4 w-4" /> <span className="text-content">{phone || "—"}</span>
      </div>
      <div className="flex items-center gap-2 text-content-muted">
        <MapPin className="h-4 w-4" />
        <span className="text-content">{[address, city].filter(Boolean).join(", ") || "—"}</span>
      </div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-subtle">
        {title}
      </p>
      <div className="overflow-hidden rounded-md border border-border">{children}</div>
    </div>
  );
}
