"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, X } from "lucide-react";
import {
  productSchema,
  emptyProduct,
  productUnits,
  type ProductFormValues,
} from "./product-schema";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/input";
import { useCollection } from "@/lib/store/hooks";
import { db } from "@/lib/store/db";
import { useT } from "@/lib/i18n";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border pb-5 last:border-0 last:pb-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-content-subtle">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

interface ProductFormProps {
  id?: string;
  defaultValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
}

export function ProductForm({ id, defaultValues, onSubmit }: ProductFormProps) {
  const { t } = useT();
  const categories = useCollection(db.categories);
  const suppliers = useCollection(db.suppliers);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { ...emptyProduct, ...defaultValues },
  });

  const imageUrl = watch("imageUrl");

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setValue("imageUrl", String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <form id={id} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Section title={t("General")}>
        <div className="sm:col-span-2 flex items-center gap-4">
          <div className="relative">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="Product"
                className="h-20 w-20 rounded-md border border-border object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-border-strong bg-surface-muted text-content-subtle">
                <ImagePlus className="h-6 w-6" />
              </div>
            )}
            {imageUrl && (
              <button
                type="button"
                onClick={() => setValue("imageUrl", "")}
                className="absolute -right-2 -top-2 rounded-full bg-danger p-0.5 text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div>
            <Label>{t("Product image")}</Label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-border-strong bg-surface px-3 py-1.5 text-sm text-content hover:bg-surface-muted">
              <ImagePlus className="h-4 w-4" />
              {t("Upload image")}
              <input type="file" accept="image/*" className="hidden" onChange={onImage} />
            </label>
            <p className="mt-1 text-xs text-content-subtle">{t("PNG or JPG, stored locally.")}</p>
          </div>
        </div>
        <div className="sm:col-span-2">
          <Label required>{t("Product name")}</Label>
          <Input
            {...register("name")}
            invalid={!!errors.name}
            placeholder={t("e.g. Brake Pad Set — Front")}
          />
          <FieldError message={errors.name?.message} />
        </div>
        <div>
          <Label>{t("SKU")}</Label>
          <Input {...register("sku")} placeholder="BRK-FP-001" />
        </div>
        <div>
          <Label>{t("Barcode")}</Label>
          <Input {...register("barcode")} placeholder="7290001112221" />
        </div>
      </Section>

      <Section title={t("Categorization")}>
        <div>
          <Label required>{t("Category")}</Label>
          <Select {...register("category")} invalid={!!errors.category}>
            <option value="">{t("Select category…")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
          <FieldError message={errors.category?.message} />
        </div>
        <div>
          <Label required>{t("Supplier")}</Label>
          <Select {...register("supplier")} invalid={!!errors.supplier}>
            <option value="">{t("Select supplier…")}</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </Select>
          <FieldError message={errors.supplier?.message} />
        </div>
      </Section>

      <Section title={t("Pricing")}>
        <div>
          <Label required>{t("Purchase price")}</Label>
          <Input
            type="number"
            step="0.01"
            {...register("purchasePrice")}
            invalid={!!errors.purchasePrice}
            leftIcon={<span className="text-xs">DH</span>}
          />
          <FieldError message={errors.purchasePrice?.message} />
          <p className="mt-1 text-xs text-content-subtle">
            {t("Auto-updated by purchases (weighted average). Set the opening cost here.")}
          </p>
        </div>
        <div>
          <Label required>{t("Selling price")}</Label>
          <Input
            type="number"
            step="0.01"
            {...register("sellingPrice")}
            invalid={!!errors.sellingPrice}
            leftIcon={<span className="text-xs">DH</span>}
          />
          <FieldError message={errors.sellingPrice?.message} />
        </div>
      </Section>

      <Section title={t("Inventory")}>
        <div>
          <Label required>{t("Stock quantity")}</Label>
          <Input type="number" {...register("stock")} invalid={!!errors.stock} />
          <FieldError message={errors.stock?.message} />
        </div>
        <div>
          <Label required>{t("Minimum stock")}</Label>
          <Input
            type="number"
            {...register("minStock")}
            invalid={!!errors.minStock}
          />
          <FieldError message={errors.minStock?.message} />
        </div>
        <div>
          <Label required>{t("Unit")}</Label>
          <Select {...register("unit")} invalid={!!errors.unit}>
            {productUnits.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </Select>
          <FieldError message={errors.unit?.message} />
        </div>
        <div>
          <Label>{t("Status")}</Label>
          <Select {...register("status")}>
            <option value="active">{t("Active")}</option>
            <option value="inactive">{t("Inactive")}</option>
          </Select>
        </div>
      </Section>

      <Section title={t("Description")}>
        <div className="sm:col-span-2">
          <Label>{t("Notes")}</Label>
          <Textarea
            rows={3}
            {...register("description")}
            placeholder={t("Optional product description…")}
          />
        </div>
      </Section>
    </form>
  );
}
