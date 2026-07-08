import { Collection } from "./collection";
import type {
  Product,
  Category,
  Brand,
  Customer,
  Supplier,
  Invoice,
  StockMovement,
} from "@/lib/types";
import {
  productSeed,
  categorySeed,
  brandSeed,
  customerSeed,
  supplierSeed,
  salesSeed,
  purchasesSeed,
  movementSeed,
} from "./seed";

/**
 * Singleton collections — the app's data access layer. Import these anywhere and
 * read reactively with `useCollection` (see hooks.ts) or mutate directly.
 *
 * Swapping to Supabase = replacing these instances with Supabase-backed
 * collections that expose the same surface. No feature code changes.
 */
export const db = {
  products: new Collection<Product>("products", productSeed),
  categories: new Collection<Category>("categories", categorySeed),
  brands: new Collection<Brand>("brands", brandSeed),
  customers: new Collection<Customer>("customers", customerSeed),
  suppliers: new Collection<Supplier>("suppliers", supplierSeed),
  sales: new Collection<Invoice>("sales", salesSeed),
  purchases: new Collection<Invoice>("purchases", purchasesSeed),
  movements: new Collection<StockMovement>("movements", movementSeed),
};
