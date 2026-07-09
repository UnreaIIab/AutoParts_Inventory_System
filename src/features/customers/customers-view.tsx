"use client";

import * as React from "react";
import {
  Plus,
  Search,
  Users,
  Pencil,
  Trash2,
  MoreHorizontal,
  Eye,
  Receipt,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Drawer } from "@/components/ui/drawer";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { Dropdown, DropdownItem, DropdownDivider } from "@/components/ui/dropdown";
import { EmptyState, Tabs } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { useCollection } from "@/lib/store/hooks";
import { db } from "@/lib/store/db";
import type { Customer } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import {
  ContactForm,
  InfoTile,
  ContactBlock,
  Section,
  emptyContact,
  type ContactFormValues,
} from "@/features/suppliers/suppliers-view";

type DialogState =
  | { type: "create" }
  | { type: "edit"; customer: Customer }
  | null;

export function CustomersView() {
  const toast = useToast();
  const { t } = useT();
  const customers = useCollection(db.customers);
  const sales = useCollection(db.sales);

  const [search, setSearch] = React.useState("");
  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [viewing, setViewing] = React.useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Customer | null>(null);
  const [form, setForm] = React.useState<ContactFormValues>(emptyContact);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      `${c.name} ${c.email} ${c.city}`.toLowerCase().includes(q),
    );
  }, [customers, search]);

  const openCreate = () => {
    setForm(emptyContact);
    setErrors({});
    setDialog({ type: "create" });
  };
  const openEdit = (c: Customer) => {
    setForm({
      ...emptyContact,
      name: c.name, email: c.email, phone: c.phone,
      city: c.city, address: c.address ?? "", notes: c.notes ?? "",
    });
    setErrors({});
    setDialog({ type: "edit", customer: c });
  };

  const save = () => {
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = t("Name is required");
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email))
      errs.email = t("Enter a valid email");
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const data = {
      name: form.name, email: form.email, phone: form.phone,
      city: form.city, address: form.address, notes: form.notes,
    };
    if (dialog?.type === "edit") {
      db.customers.update(dialog.customer.id, data);
      toast.success(t("Customer updated"), form.name);
    } else {
      db.customers.create({
        ...data,
        totalOrders: 0,
        totalSpent: 0,
        balance: 0,
        createdAt: new Date().toISOString(),
      });
      toast.success(t("Customer created"), form.name);
    }
    setDialog(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    db.customers.remove(deleteTarget.id);
    toast.success(t("Customer deleted"), deleteTarget.name);
    setDeleteTarget(null);
  };

  const columns: Column<Customer>[] = [
    {
      key: "name", header: t("Customer"), sortable: true, accessor: (c) => c.name,
      cell: (c) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
            {c.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-content">{c.name}</p>
            <p className="truncate text-xs text-content-muted">{c.email}</p>
          </div>
        </div>
      ),
    },
    { key: "city", header: t("City"), sortable: true, accessor: (c) => c.city },
    { key: "totalOrders", header: t("Orders"), align: "right", sortable: true, accessor: (c) => c.totalOrders },
    {
      key: "totalSpent", header: t("Total Spent"), align: "right", sortable: true,
      accessor: (c) => c.totalSpent,
      cell: (c) => <span className="font-medium">{formatCurrency(c.totalSpent)}</span>,
    },
    {
      key: "balance", header: t("Balance"), align: "right", sortable: true,
      accessor: (c) => c.balance,
      cell: (c) =>
        c.balance > 0 ? (
          <Badge tone="warning">{formatCurrency(c.balance)}</Badge>
        ) : (
          <span className="text-content-subtle">—</span>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t("Customers")}
        subtitle={t("{n} customers", { n: customers.length })}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            {t("New Customer")}
          </Button>
        }
      />

      <div className="space-y-4 p-5">
        <Card className="p-3">
          <div className="max-w-md">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Search customers…")}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(c) => c.id}
            onRowClick={(c) => setViewing(c)}
            rowActions={(c) => (
              <Dropdown
                trigger={
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                }
              >
                <DropdownItem icon={<Eye className="h-4 w-4" />} onClick={() => setViewing(c)}>
                  {t("View details")}
                </DropdownItem>
                <DropdownItem icon={<Pencil className="h-4 w-4" />} onClick={() => openEdit(c)}>
                  {t("Edit")}
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem tone="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteTarget(c)}>
                  {t("Delete")}
                </DropdownItem>
              </Dropdown>
            )}
            emptyState={
              <EmptyState
                icon={<Users className="h-6 w-6" />}
                title={t("No customers found")}
                description={t("Add customers to track sales and balances.")}
                action={<Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>{t("New Customer")}</Button>}
              />
            }
          />
        </Card>
      </div>

      <Dialog
        open={!!dialog}
        onClose={() => setDialog(null)}
        title={dialog?.type === "edit" ? t("Edit customer") : t("New customer")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>{t("Cancel")}</Button>
            <Button onClick={save}>{dialog?.type === "edit" ? t("Save changes") : t("Create")}</Button>
          </>
        }
      >
        <ContactForm form={form} setForm={setForm} errors={errors} showNotes />
      </Dialog>

      <Drawer
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.name}
        description={viewing ? t("Customer since {date}", { date: formatDate(viewing.createdAt) }) : ""}
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
          <CustomerDetailTabs
            customer={viewing}
            sales={sales.filter((s) => s.partyId === viewing.id || s.partyName === viewing.name)}
          />
        )}
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={t("Delete customer")}
        message={t('This will permanently remove “{name}”.', { name: deleteTarget?.name ?? "" })}
      />
    </>
  );
}

function CustomerDetailTabs({
  customer,
  sales,
}: {
  customer: Customer;
  sales: { id: string; reference: string; date: string; total: number }[];
}) {
  const { t } = useT();
  const [tab, setTab] = React.useState("profile");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <InfoTile icon={<Receipt className="h-4 w-4" />} label={t("Total Spent")} value={formatCurrency(customer.totalSpent)} />
        <InfoTile icon={<Wallet className="h-4 w-4" />} label={t("Balance")} value={formatCurrency(customer.balance)} />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "profile", label: t("Profile") },
          { id: "sales", label: t("Sales History"), count: sales.length },
        ]}
      />

      {tab === "profile" && (
        <div className="space-y-4">
          <ContactBlock email={customer.email} phone={customer.phone} city={customer.city} address={customer.address} />
          {customer.notes && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-content-subtle">{t("Notes")}</p>
              <p className="text-sm text-content-muted">{customer.notes}</p>
            </div>
          )}
        </div>
      )}

      {tab === "sales" && (
        <Section title={t("Sales history ({n})", { n: sales.length })}>
          {sales.length === 0 ? (
            <p className="px-4 py-3 text-sm text-content-muted">{t("No sales yet.")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {sales.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <div>
                    <p className="font-medium">{s.reference}</p>
                    <p className="text-xs text-content-muted">{formatDate(s.date)}</p>
                  </div>
                  <span className="font-medium">{formatCurrency(s.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}
    </div>
  );
}
