"use client";

import * as React from "react";
import {
  Plus,
  Search,
  X,
  Download,
  Upload,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Package,
  SlidersHorizontal,
  Printer,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/dialog";
import {
  Dropdown,
  DropdownItem,
  DropdownDivider,
} from "@/components/ui/dropdown";
import { EmptyState, Pagination } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { useCollection } from "@/lib/store/hooks";
import { db } from "@/lib/store/db";
import type { Product } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { toCSV, parseCSV, downloadFile } from "@/lib/csv";
import { generateId } from "@/lib/store/storage";
import { ProductForm } from "./product-form";
import { ProductDetailTabs } from "./product-detail-tabs";
import { stockLevel, type ProductFormValues } from "./product-schema";

const PAGE_SIZE = 8;

type DrawerMode = { type: "create" } | { type: "edit"; product: Product } | { type: "view"; product: Product } | null;

const stockTone = { in: "success", low: "warning", out: "danger" } as const;
const stockText = { in: "In stock", low: "Low stock", out: "Out of stock" };

export function ProductsView() {
  const toast = useToast();
  const { t } = useT();
  const products = useCollection(db.products);
  const categories = useCollection(db.categories);
  const suppliers = useCollection(db.suppliers);

  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [supplier, setSupplier] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [stock, setStock] = React.useState("");
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [showFilters, setShowFilters] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [drawer, setDrawer] = React.useState<DrawerMode>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Product | null>(null);
  const [bulkDelete, setBulkDelete] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !`${p.name} ${p.sku} ${p.barcode}`.toLowerCase().includes(q))
        return false;
      if (category && p.category !== category) return false;
      if (supplier && p.supplier !== supplier) return false;
      if (status && p.status !== status) return false;
      if (stock && stockLevel(p.stock, p.minStock) !== stock) return false;
      if (minPrice && p.sellingPrice < Number(minPrice)) return false;
      if (maxPrice && p.sellingPrice > Number(maxPrice)) return false;
      return true;
    });
  }, [products, search, category, supplier, status, stock, minPrice, maxPrice]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  React.useEffect(
    () => setPage(1),
    [search, category, supplier, status, stock, minPrice, maxPrice],
  );

  const activeFilters = [
    category && { key: "category", label: category, clear: () => setCategory("") },
    supplier && { key: "supplier", label: supplier, clear: () => setSupplier("") },
    status && { key: "status", label: status, clear: () => setStatus("") },
    stock && {
      key: "stock",
      label: stockText[stock as keyof typeof stockText],
      clear: () => setStock(""),
    },
    (minPrice || maxPrice) && {
      key: "price",
      label: `Price ${minPrice || "0"}–${maxPrice || "∞"}`,
      clear: () => {
        setMinPrice("");
        setMaxPrice("");
      },
    },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  const clearAll = () => {
    setCategory("");
    setSupplier("");
    setStatus("");
    setStock("");
    setMinPrice("");
    setMaxPrice("");
    setSearch("");
  };

  /* --------------------------- mutations --------------------------- */
  const handleSave = (values: ProductFormValues) => {
    if (drawer?.type === "edit") {
      db.products.update(drawer.product.id, {
        ...values,
        updatedAt: new Date().toISOString(),
      });
      toast.success(t("Product updated"), values.name);
    } else {
      db.products.create({
        ...values,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success(t("Product created"), values.name);
    }
    setDrawer(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    db.products.remove(deleteTarget.id);
    toast.success(t("Product deleted"), deleteTarget.name);
    setDeleteTarget(null);
  };

  const confirmBulkDelete = () => {
    db.products.removeMany(selected);
    toast.success(t("{n} products deleted", { n: selected.size }));
    setSelected(new Set());
    setBulkDelete(false);
  };

  const handleExport = () => {
    const csv = toCSV(filtered, [
      "name", "sku", "barcode", "category", "supplier",
      "purchasePrice", "sellingPrice", "stock", "minStock", "unit", "status",
    ]);
    downloadFile("products.csv", csv);
    toast.success(t("Exported"), t("{n} products to CSV", { n: filtered.length }));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCSV(String(reader.result));
        let count = 0;
        for (const r of rows) {
          if (!r.name || !r.sku) continue;
          db.products.create({
            id: generateId(),
            name: r.name,
            sku: r.sku,
            barcode: r.barcode ?? "",
            category: r.category ?? "",
            supplier: r.supplier ?? "",
            purchasePrice: Number(r.purchasePrice) || 0,
            sellingPrice: Number(r.sellingPrice) || 0,
            stock: Number(r.stock) || 0,
            minStock: Number(r.minStock) || 0,
            unit: r.unit || "pcs",
            location: r.location ?? "",
            status: r.status === "inactive" ? "inactive" : "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          count++;
        }
        toast.success(t("Imported"), t("{n} products added", { n: count }));
      } catch {
        toast.error(t("Import failed"), t("Could not parse the CSV file"));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  /* ---------------------------- columns ---------------------------- */
  const columns: Column<Product>[] = [
    {
      key: "name",
      header: t("Product"),
      sortable: true,
      accessor: (p) => p.name,
      cell: (p) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary-soft text-primary">
            <Package className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-content">{p.name}</p>
            <p className="text-xs text-content-muted">{p.sku}</p>
          </div>
        </div>
      ),
    },
    { key: "category", header: t("Category"), sortable: true, accessor: (p) => p.category,
      cell: (p) => <Badge tone="neutral">{p.category}</Badge> },
    {
      key: "sellingPrice", header: t("Price"), align: "right", sortable: true,
      accessor: (p) => p.sellingPrice,
      cell: (p) => <span className="font-medium">{formatCurrency(p.sellingPrice)}</span>,
    },
    {
      key: "stock", header: t("Stock"), align: "right", sortable: true,
      accessor: (p) => p.stock,
      cell: (p) => {
        const level = stockLevel(p.stock, p.minStock);
        return (
          <div className="flex items-center justify-end gap-2">
            <span className="tabular-nums font-medium">{p.stock}</span>
            <Badge tone={stockTone[level]} dot>
              {t(stockText[level])}
            </Badge>
          </div>
        );
      },
    },
    {
      key: "status", header: t("Status"), align: "center", sortable: true,
      accessor: (p) => p.status,
      cell: (p) => (
        <Badge tone={p.status === "active" ? "success" : "neutral"}>
          {t(p.status)}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t("Products")}
        subtitle={t("{n} parts in catalog", { n: products.length })}
        actions={
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImport}
            />
            <Button
              variant="secondary"
              icon={<Upload className="h-4 w-4" />}
              onClick={() => fileRef.current?.click()}
            >
              {t("Import")}
            </Button>
            <Button
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={handleExport}
            >
              {t("Export")}
            </Button>
            <Button
              variant="secondary"
              icon={<Printer className="h-4 w-4" />}
              onClick={() => window.print()}
            >
              {t("Print")}
            </Button>
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setDrawer({ type: "create" })}
            >
              {t("New Product")}
            </Button>
          </>
        }
      />

      {/* Print-only product listing (all filtered rows) */}
      <div id="report-print" className="hidden print:block">
        <h1 className="mb-1 text-lg font-semibold">Products</h1>
        <p className="mb-4 text-sm">
          {filtered.length} items · Generated {formatDate(new Date())}
        </p>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-black text-left">
              <th className="py-1 pr-3">Name</th>
              <th className="py-1 pr-3">SKU</th>
              <th className="py-1 pr-3">Category</th>
              <th className="py-1 pr-3 text-right">Price</th>
              <th className="py-1 pr-3 text-right">Stock</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-gray-300">
                <td className="py-1 pr-3">{p.name}</td>
                <td className="py-1 pr-3">{p.sku}</td>
                <td className="py-1 pr-3">{p.category}</td>
                <td className="py-1 pr-3 text-right">{formatCurrency(p.sellingPrice)}</td>
                <td className="py-1 pr-3 text-right">{p.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 p-5">
        {/* Toolbar */}
        <Card className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[220px] flex-1">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Search by name, SKU or barcode…")}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <Button
              variant={showFilters ? "outline" : "secondary"}
              icon={<SlidersHorizontal className="h-4 w-4" />}
              onClick={() => setShowFilters((s) => !s)}
            >
              {t("Filters")}
              {activeFilters.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-white">
                  {activeFilters.length}
                </span>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 sm:grid-cols-3 lg:grid-cols-5">
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">{t("All categories")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </Select>
              <Select value={supplier} onChange={(e) => setSupplier(e.target.value)}>
                <option value="">{t("All suppliers")}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </Select>
              <Select value={stock} onChange={(e) => setStock(e.target.value)}>
                <option value="">{t("Any stock level")}</option>
                <option value="in">{t("In stock")}</option>
                <option value="low">{t("Low stock")}</option>
                <option value="out">{t("Out of stock")}</option>
              </Select>
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">{t("Any status")}</option>
                <option value="active">{t("Active")}</option>
                <option value="inactive">{t("Inactive")}</option>
              </Select>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min DH"
                  className="h-9"
                />
                <span className="text-content-subtle">–</span>
                <Input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max DH"
                  className="h-9"
                />
              </div>
            </div>
          )}

          {activeFilters.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {activeFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={f.clear}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary-softhover"
                >
                  {f.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              <button
                onClick={clearAll}
                className="text-xs font-medium text-content-muted hover:text-content"
              >
                {t("Clear all")}
              </button>
            </div>
          )}
        </Card>

        {/* Bulk selection bar */}
        {selected.size > 0 && (
          <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary-soft px-4 py-2.5 text-sm">
            <span className="font-medium text-primary">
              {t("{n} selected", { n: selected.size })}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelected(new Set())}
              >
                {t("Clear")}
              </Button>
              <Button
                size="sm"
                variant="danger"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => setBulkDelete(true)}
              >
                {t("Delete")}
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <Card className="overflow-hidden p-0">
          <DataTable
            columns={columns}
            data={paged}
            rowKey={(p) => p.id}
            selectable
            selected={selected}
            onSelectedChange={setSelected}
            onRowClick={(p) => setDrawer({ type: "view", product: p })}
            rowActions={(p) => (
              <Dropdown
                trigger={
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                }
              >
                <DropdownItem
                  icon={<Eye className="h-4 w-4" />}
                  onClick={() => setDrawer({ type: "view", product: p })}
                >
                  {t("Quick view")}
                </DropdownItem>
                <DropdownItem
                  icon={<Pencil className="h-4 w-4" />}
                  onClick={() => setDrawer({ type: "edit", product: p })}
                >
                  {t("Edit")}
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem
                  tone="danger"
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => setDeleteTarget(p)}
                >
                  {t("Delete")}
                </DropdownItem>
              </Dropdown>
            )}
            emptyState={
              <EmptyState
                icon={<Package className="h-6 w-6" />}
                title={t("No products found")}
                description={
                  activeFilters.length || search
                    ? t("Try adjusting your search or filters.")
                    : t("Get started by adding your first product.")
                }
                action={
                  <Button
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => setDrawer({ type: "create" })}
                  >
                    {t("New Product")}
                  </Button>
                }
              />
            }
          />
          {filtered.length > 0 && (
            <div className="border-t border-border">
              <Pagination
                page={currentPage}
                pageSize={PAGE_SIZE}
                total={filtered.length}
                onPageChange={setPage}
              />
            </div>
          )}
        </Card>
      </div>

      {/* Create / Edit drawer */}
      <Drawer
        open={drawer?.type === "create" || drawer?.type === "edit"}
        onClose={() => setDrawer(null)}
        width="lg"
        title={drawer?.type === "edit" ? t("Edit product") : t("New product")}
        description={
          drawer?.type === "edit"
            ? t("Update the details of this part")
            : t("Add a new part to your catalog")
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawer(null)}>
              {t("Cancel")}
            </Button>
            <Button type="submit" form="product-form">
              {drawer?.type === "edit" ? t("Save changes") : t("Create product")}
            </Button>
          </>
        }
      >
        {(drawer?.type === "create" || drawer?.type === "edit") && (
          <ProductForm
            id="product-form"
            defaultValues={
              drawer.type === "edit" ? drawer.product : undefined
            }
            onSubmit={handleSave}
          />
        )}
      </Drawer>

      {/* Quick view drawer */}
      <Drawer
        open={drawer?.type === "view"}
        onClose={() => setDrawer(null)}
        width="lg"
        title={drawer?.type === "view" ? drawer.product.name : ""}
        description={drawer?.type === "view" ? drawer.product.sku : ""}
        footer={
          drawer?.type === "view" && (
            <>
              <Button variant="secondary" onClick={() => setDrawer(null)}>
                {t("Close")}
              </Button>
              <Button
                icon={<Pencil className="h-4 w-4" />}
                onClick={() =>
                  drawer.type === "view" &&
                  setDrawer({ type: "edit", product: drawer.product })
                }
              >
                {t("Edit")}
              </Button>
            </>
          )
        }
      >
        {drawer?.type === "view" && <ProductDetailTabs product={drawer.product} />}
      </Drawer>

      {/* Delete confirmations */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={t("Delete product")}
        message={t('This will permanently remove “{name}”. This action cannot be undone.', { name: deleteTarget?.name ?? "" })}
      />
      <ConfirmDialog
        open={bulkDelete}
        onClose={() => setBulkDelete(false)}
        onConfirm={confirmBulkDelete}
        title={t("Delete products")}
        message={t("This will permanently remove {n} selected products.", { n: selected.size })}
      />
    </>
  );
}
