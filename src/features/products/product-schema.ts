import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  sku: z.string().optional().default(""),
  barcode: z.string().optional().default(""),
  category: z.string().min(1, "Select a category"),
  brand: z.string().optional().default(""),
  supplier: z.string().min(1, "Select a supplier"),
  purchasePrice: z.coerce.number().min(0, "Must be ≥ 0"),
  sellingPrice: z.coerce.number().min(0, "Must be ≥ 0"),
  stock: z.coerce.number().int("Whole number").min(0, "Must be ≥ 0"),
  minStock: z.coerce.number().int("Whole number").min(0, "Must be ≥ 0"),
  unit: z.string().min(1, "Select a unit"),
  location: z.string().optional().default(""),
  description: z.string().optional().default(""),
  imageUrl: z.string().optional().default(""),
  status: z.enum(["active", "inactive"]),
});

export const productUnits = [
  "pcs",
  "set",
  "pack",
  "kit",
  "pair",
  "box",
  "bottle",
  "liter",
  "meter",
];

export type ProductFormValues = z.infer<typeof productSchema>;

export const emptyProduct: ProductFormValues = {
  name: "",
  sku: "",
  barcode: "",
  category: "",
  brand: "",
  supplier: "",
  purchasePrice: 0,
  sellingPrice: 0,
  stock: 0,
  minStock: 0,
  unit: "pcs",
  location: "",
  description: "",
  imageUrl: "",
  status: "active",
};

export type StockLevel = "in" | "low" | "out";

export function stockLevel(stock: number, minStock: number): StockLevel {
  if (stock <= 0) return "out";
  if (stock <= minStock) return "low";
  return "in";
}
