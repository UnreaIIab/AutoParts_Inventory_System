/**
 * Central domain types. These mirror the future Supabase/Postgres tables so the
 * localStorage layer can be swapped for a Supabase repository with no changes to
 * feature code. Every entity has a string `id`.
 */

export type ProductStatus = "active" | "inactive";
export type InvoiceStatus = "draft" | "confirmed" | "paid";
export type PaymentStatus = "unpaid" | "partial" | "paid";
export type MovementType = "purchase" | "sale" | "adjustment";

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  supplier: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  location: string;
  description?: string;
  imageUrl?: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  archived?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  address?: string;
  notes?: string;
  totalOrders: number;
  totalSpent: number;
  balance: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  address?: string;
  contactPerson?: string;
  taxNumber?: string;
  notes?: string;
  productsSupplied: number;
  totalPurchased: number;
  createdAt: string;
}

export interface InvoiceLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number; // percentage 0-100
}

export interface Invoice {
  id: string;
  reference: string;
  invoiceNumber?: string;
  partyId: string;
  partyName: string;
  date: string;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  lines: InvoiceLine[];
  total: number;
  notes?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number; // signed: +in / -out
  reference: string;
  date: string;
  note?: string;
}
