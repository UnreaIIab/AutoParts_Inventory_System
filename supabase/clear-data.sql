-- Remove ALL rows from the AutoParts tables (keeps the tables & structure).
-- Run in the Supabase SQL Editor. ⚠️ This permanently deletes every row.

truncate table
  public.movements,
  public.purchases,
  public.sales,
  public.products,
  public.customers,
  public.suppliers,
  public.categories;
