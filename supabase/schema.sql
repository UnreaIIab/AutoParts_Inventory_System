-- AutoParts Inventory System — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query → Run).
-- It creates the tables, enables Row Level Security, allows any signed-in user,
-- and loads the demo data.

create table if not exists public.categories (
  id text primary key,
  "name" text not null,
  "description" text,
  "archived" boolean not null default false
);

create table if not exists public.suppliers (
  id text primary key,
  "name" text not null,
  "email" text,
  "phone" text,
  "city" text,
  "address" text,
  "contactPerson" text,
  "taxNumber" text,
  "notes" text,
  "productsSupplied" integer not null default 0,
  "totalPurchased" numeric not null default 0,
  "createdAt" text
);

create table if not exists public.customers (
  id text primary key,
  "name" text not null,
  "email" text,
  "phone" text,
  "city" text,
  "address" text,
  "notes" text,
  "totalOrders" integer not null default 0,
  "totalSpent" numeric not null default 0,
  "balance" numeric not null default 0,
  "createdAt" text
);

create table if not exists public.products (
  id text primary key,
  "name" text not null,
  "sku" text,
  "barcode" text,
  "category" text,
  "supplier" text,
  "purchasePrice" numeric not null default 0,
  "sellingPrice" numeric not null default 0,
  "stock" integer not null default 0,
  "minStock" integer not null default 0,
  "unit" text,
  "location" text,
  "description" text,
  "imageUrl" text,
  "status" text not null default 'active',
  "createdAt" text,
  "updatedAt" text
);

create table if not exists public.sales (
  id text primary key,
  "reference" text,
  "invoiceNumber" text,
  "partyId" text,
  "partyName" text,
  "date" text,
  "status" text,
  "paymentStatus" text,
  "lines" jsonb not null default '[]'::jsonb,
  "total" numeric not null default 0,
  "notes" text
);

create table if not exists public.purchases (
  id text primary key,
  "reference" text,
  "invoiceNumber" text,
  "partyId" text,
  "partyName" text,
  "date" text,
  "status" text,
  "paymentStatus" text,
  "lines" jsonb not null default '[]'::jsonb,
  "total" numeric not null default 0,
  "notes" text
);

create table if not exists public.movements (
  id text primary key,
  "productId" text,
  "productName" text,
  "type" text,
  "quantity" integer,
  "reference" text,
  "date" text,
  "note" text
);

-- Row Level Security: any authenticated user can read/write.
alter table public.categories enable row level security;
drop policy if exists "authenticated_all_categories" on public.categories;
create policy "authenticated_all_categories" on public.categories
  for all to authenticated using (true) with check (true);

alter table public.suppliers enable row level security;
drop policy if exists "authenticated_all_suppliers" on public.suppliers;
create policy "authenticated_all_suppliers" on public.suppliers
  for all to authenticated using (true) with check (true);

alter table public.customers enable row level security;
drop policy if exists "authenticated_all_customers" on public.customers;
create policy "authenticated_all_customers" on public.customers
  for all to authenticated using (true) with check (true);

alter table public.products enable row level security;
drop policy if exists "authenticated_all_products" on public.products;
create policy "authenticated_all_products" on public.products
  for all to authenticated using (true) with check (true);

alter table public.sales enable row level security;
drop policy if exists "authenticated_all_sales" on public.sales;
create policy "authenticated_all_sales" on public.sales
  for all to authenticated using (true) with check (true);

alter table public.purchases enable row level security;
drop policy if exists "authenticated_all_purchases" on public.purchases;
create policy "authenticated_all_purchases" on public.purchases
  for all to authenticated using (true) with check (true);

alter table public.movements enable row level security;
drop policy if exists "authenticated_all_movements" on public.movements;
create policy "authenticated_all_movements" on public.movements
  for all to authenticated using (true) with check (true);

-- Seed data
insert into public.categories (id, "name", "description", "archived") values
  ('cat1', 'Brakes', 'Brake pads, discs, calipers', DEFAULT),
  ('cat2', 'Filters', 'Oil, air and cabin filters', DEFAULT),
  ('cat3', 'Ignition', 'Spark plugs, coils', DEFAULT),
  ('cat4', 'Engine', 'Belts, gaskets, engine parts', DEFAULT),
  ('cat5', 'Suspension', 'Shocks, struts, springs', DEFAULT),
  ('cat6', 'Electrical', 'Alternators, bulbs, sensors', DEFAULT),
  ('cat7', 'Accessories', 'Wipers and add-ons', DEFAULT),
  ('cat8', 'Fluids', 'Coolants, oils, lubricants', DEFAULT),
  ('cat9', 'Transmission', 'Clutches, gearbox parts', DEFAULT)
on conflict (id) do nothing;

insert into public.suppliers (id, "name", "email", "phone", "city", "address", "contactPerson", "taxNumber", "notes", "productsSupplied", "totalPurchased", "createdAt") values
  ('s1', 'AutoZone Distribution', 'orders@autozonedist.com', '+1 555 0300', 'Memphis', '455 Logistics Pkwy, Memphis, TN', 'Dana Reyes', 'US-84-2213391', 'Preferred brake & wiper supplier. Net 30.', 4, 84200, '2025-11-02'),
  ('s2', 'Global Parts Co.', 'supply@globalparts.com', '+1 555 0322', 'Houston', '12 Harbor Rd, Houston, TX', 'Omar Haddad', 'US-77-9012774', 'Bulk filters and fluids.', 4, 61300, '2025-12-14'),
  ('s3', 'PartSupply Intl.', 'b2b@partsupply.com', '+1 555 0355', 'Los Angeles', '900 Import Ave, Los Angeles, CA', 'Grace Liu', 'US-95-3388120', 'Engine & transmission specialist.', 4, 92750, '2026-01-09')
on conflict (id) do nothing;

insert into public.customers (id, "name", "email", "phone", "city", "address", "notes", "totalOrders", "totalSpent", "balance", "createdAt") values
  ('c1', 'Rapid Auto Garage', 'contact@rapidauto.com', '+1 555 0110', 'Chicago', '220 Mechanic St, Chicago, IL', 'High-volume trade account.', 42, 18420, 640, '2025-10-21'),
  ('c2', 'Downtown Motors', 'sales@downtownmotors.com', '+1 555 0142', 'Detroit', '18 Center Ave, Detroit, MI', DEFAULT, 31, 12240, 0, '2025-11-30'),
  ('c3', 'Elena Vasquez', 'elena.v@gmail.com', '+1 555 0188', 'Austin', DEFAULT, DEFAULT, 8, 1640, 120, '2026-02-11'),
  ('c4', 'FleetCare Services', 'ops@fleetcare.com', '+1 555 0199', 'Phoenix', '77 Depot Blvd, Phoenix, AZ', 'Fleet maintenance contract.', 64, 41200, 2100, '2025-09-04'),
  ('c5', 'Mike''s Repair Shop', 'mike@mikesrepair.com', '+1 555 0121', 'Denver', DEFAULT, DEFAULT, 19, 7350, 0, '2026-03-18')
on conflict (id) do nothing;

insert into public.products (id, "name", "sku", "barcode", "category", "supplier", "purchasePrice", "sellingPrice", "stock", "minStock", "unit", "location", "description", "imageUrl", "status", "createdAt", "updatedAt") values
  ('p1', 'Brake Pad Set — Front', 'BRK-FP-001', '7290001112221', 'Brakes', 'AutoZone Distribution', 22.5, 39.9, 148, 40, 'set', 'A-01-03', 'Ceramic front brake pads, low dust.', DEFAULT, 'active', '2026-01-12', '2026-06-28'),
  ('p2', 'Oil Filter Premium', 'FLT-OIL-014', '7290001112238', 'Filters', 'Global Parts Co.', 4.2, 9.5, 12, 60, 'pcs', 'B-04-11', 'High-flow spin-on oil filter.', DEFAULT, 'active', '2026-01-20', '2026-07-03'),
  ('p3', 'Spark Plug Iridium (4pk)', 'IGN-SP-220', '7290001112245', 'Ignition', 'Global Parts Co.', 14, 28, 0, 30, 'pack', 'C-02-07', 'Long-life iridium spark plugs.', DEFAULT, 'active', '2026-02-02', '2026-07-05'),
  ('p4', 'Timing Belt Kit', 'ENG-TB-088', '7290001112252', 'Engine', 'PartSupply Intl.', 48, 89, 34, 15, 'kit', 'D-01-02', 'Complete timing belt kit with tensioner.', DEFAULT, 'active', '2026-02-15', DEFAULT),
  ('p5', 'Cabin Air Filter', 'FLT-CAB-077', '7290001112269', 'Filters', 'Global Parts Co.', 6.5, 15, 8, 25, 'pcs', 'B-04-14', 'Activated carbon cabin filter.', DEFAULT, 'active', '2026-02-28', DEFAULT),
  ('p6', 'Shock Absorber Rear', 'SUS-SA-131', '7290001112276', 'Suspension', 'AutoZone Distribution', 33, 62, 56, 20, 'pcs', 'E-03-05', 'Gas-charged rear shock absorber.', DEFAULT, 'active', '2026-03-05', DEFAULT),
  ('p7', 'Alternator 90A', 'ELC-ALT-045', '7290001112283', 'Electrical', 'PartSupply Intl.', 78, 145, 19, 10, 'pcs', 'F-01-01', 'Remanufactured 90A alternator.', DEFAULT, 'active', '2026-03-12', DEFAULT),
  ('p8', 'Wiper Blade Set 24"', 'ACC-WB-300', '7290001112290', 'Accessories', 'AutoZone Distribution', 8, 18.5, 210, 50, 'set', 'G-02-09', 'All-season beam wiper blades.', DEFAULT, 'active', '2026-03-22', DEFAULT),
  ('p9', 'Radiator Coolant 5L', 'FLU-CL-012', '7290001112306', 'Fluids', 'Global Parts Co.', 11, 22, 74, 30, 'bottle', 'H-01-04', 'Long-life ready-to-use coolant.', DEFAULT, 'active', '2026-04-01', DEFAULT),
  ('p10', 'Clutch Kit Complete', 'TRN-CL-159', '7290001112313', 'Transmission', 'PartSupply Intl.', 120, 215, 6, 8, 'kit', 'I-02-02', 'Clutch disc, pressure plate and bearing.', DEFAULT, 'active', '2026-04-10', DEFAULT),
  ('p11', 'Headlight Bulb H7', 'ELC-HL-201', '7290001112320', 'Electrical', 'AutoZone Distribution', 3.5, 8.9, 320, 80, 'pcs', 'F-03-12', 'Standard H7 halogen bulb.', DEFAULT, 'active', '2026-04-19', DEFAULT),
  ('p12', 'Brake Disc Ventilated', 'BRK-DS-050', '7290001112337', 'Brakes', 'PartSupply Intl.', 41, 79, 42, 16, 'pcs', 'A-02-01', 'Ventilated front brake disc.', DEFAULT, 'active', '2026-05-02', DEFAULT)
on conflict (id) do nothing;

insert into public.sales (id, "reference", "invoiceNumber", "partyId", "partyName", "date", "status", "paymentStatus", "lines", "total", "notes") values
  ('so1', 'SO-2026-0148', 'INV-8841', 'c4', 'FleetCare Services', '2026-07-06', 'confirmed', 'unpaid', '[{"productId":"p12","productName":"Brake Disc Ventilated","quantity":8,"unitPrice":79,"discount":0},{"productId":"p2","productName":"Oil Filter Premium","quantity":20,"unitPrice":9.5,"discount":0}]'::jsonb, 822, DEFAULT),
  ('so2', 'SO-2026-0147', 'INV-8840', 'c1', 'Rapid Auto Garage', '2026-07-06', 'paid', 'paid', '[{"productId":"p1","productName":"Brake Pad Set — Front","quantity":10,"unitPrice":39.9,"discount":0},{"productId":"p11","productName":"Headlight Bulb H7","quantity":10,"unitPrice":8.9,"discount":0}]'::jsonb, 488, DEFAULT),
  ('so3', 'SO-2026-0146', 'INV-8839', 'c2', 'Downtown Motors', '2026-07-05', 'paid', 'paid', '[{"productId":"p6","productName":"Shock Absorber Rear","quantity":5,"unitPrice":62,"discount":0},{"productId":"p9","productName":"Radiator Coolant 5L","quantity":10,"unitPrice":22,"discount":0}]'::jsonb, 530, DEFAULT),
  ('so4', 'SO-2026-0145', 'INV-8838', 'c5', 'Mike''s Repair Shop', '2026-07-05', 'confirmed', 'partial', '[{"productId":"p8","productName":"Wiper Blade Set 24\"","quantity":10,"unitPrice":18.5,"discount":0},{"productId":"p5","productName":"Cabin Air Filter","quantity":8,"unitPrice":15,"discount":0}]'::jsonb, 305, DEFAULT),
  ('so5', 'SO-2026-0144', 'INV-8837', 'c3', 'Elena Vasquez', '2026-07-04', 'paid', 'paid', '[{"productId":"p11","productName":"Headlight Bulb H7","quantity":5,"unitPrice":8.9,"discount":0},{"productId":"p2","productName":"Oil Filter Premium","quantity":5,"unitPrice":9.5,"discount":0}]'::jsonb, 92, DEFAULT)
on conflict (id) do nothing;

insert into public.purchases (id, "reference", "invoiceNumber", "partyId", "partyName", "date", "status", "paymentStatus", "lines", "total", "notes") values
  ('po1', 'PO-2026-0074', 'BILL-3390', 's3', 'PartSupply Intl.', '2026-07-05', 'confirmed', 'unpaid', '[{"productId":"p10","productName":"Clutch Kit Complete","quantity":20,"unitPrice":120,"discount":0},{"productId":"p7","productName":"Alternator 90A","quantity":10,"unitPrice":78,"discount":0}]'::jsonb, 3180, DEFAULT),
  ('po2', 'PO-2026-0073', 'BILL-3388', 's2', 'Global Parts Co.', '2026-07-04', 'paid', 'paid', '[{"productId":"p2","productName":"Oil Filter Premium","quantity":200,"unitPrice":4.2,"discount":0},{"productId":"p11","productName":"Headlight Bulb H7","quantity":300,"unitPrice":3.5,"discount":0}]'::jsonb, 1890, DEFAULT),
  ('po3', 'PO-2026-0072', 'BILL-3385', 's1', 'AutoZone Distribution', '2026-07-02', 'paid', 'paid', '[{"productId":"p1","productName":"Brake Pad Set — Front","quantity":100,"unitPrice":22.5,"discount":0},{"productId":"p8","productName":"Wiper Blade Set 24\"","quantity":100,"unitPrice":8,"discount":0}]'::jsonb, 3050, DEFAULT)
on conflict (id) do nothing;

insert into public.movements (id, "productId", "productName", "type", "quantity", "reference", "date", "note") values
  ('m1', 'p1', 'Brake Pad Set — Front', 'purchase', 100, 'PO-2026-0072', '2026-07-02', DEFAULT),
  ('m2', 'p1', 'Brake Pad Set — Front', 'sale', -12, 'SO-2026-0147', '2026-07-06', DEFAULT),
  ('m3', 'p3', 'Spark Plug Iridium (4pk)', 'sale', -30, 'SO-2026-0146', '2026-07-05', DEFAULT),
  ('m4', 'p2', 'Oil Filter Premium', 'adjustment', -6, 'ADJ-0004', '2026-07-03', 'Damaged stock write-off')
on conflict (id) do nothing;

