import type {
  Product,
  Category,
  Customer,
  Supplier,
  Invoice,
  StockMovement,
} from "@/lib/types";

export const categorySeed: Category[] = [
  { id: "cat1", name: "Brakes", description: "Brake pads, discs, calipers" },
  { id: "cat2", name: "Filters", description: "Oil, air and cabin filters" },
  { id: "cat3", name: "Ignition", description: "Spark plugs, coils" },
  { id: "cat4", name: "Engine", description: "Belts, gaskets, engine parts" },
  { id: "cat5", name: "Suspension", description: "Shocks, struts, springs" },
  { id: "cat6", name: "Electrical", description: "Alternators, bulbs, sensors" },
  { id: "cat7", name: "Accessories", description: "Wipers and add-ons" },
  { id: "cat8", name: "Fluids", description: "Coolants, oils, lubricants" },
  { id: "cat9", name: "Transmission", description: "Clutches, gearbox parts" },
];

export const supplierSeed: Supplier[] = [
  { id: "s1", name: "AutoZone Distribution", email: "orders@autozonedist.com", phone: "+1 555 0300", city: "Memphis", address: "455 Logistics Pkwy, Memphis, TN", contactPerson: "Dana Reyes", taxNumber: "US-84-2213391", notes: "Preferred brake & wiper supplier. Net 30.", productsSupplied: 4, totalPurchased: 84200, createdAt: "2025-11-02" },
  { id: "s2", name: "Global Parts Co.", email: "supply@globalparts.com", phone: "+1 555 0322", city: "Houston", address: "12 Harbor Rd, Houston, TX", contactPerson: "Omar Haddad", taxNumber: "US-77-9012774", notes: "Bulk filters and fluids.", productsSupplied: 4, totalPurchased: 61300, createdAt: "2025-12-14" },
  { id: "s3", name: "PartSupply Intl.", email: "b2b@partsupply.com", phone: "+1 555 0355", city: "Los Angeles", address: "900 Import Ave, Los Angeles, CA", contactPerson: "Grace Liu", taxNumber: "US-95-3388120", notes: "Engine & transmission specialist.", productsSupplied: 4, totalPurchased: 92750, createdAt: "2026-01-09" },
];

export const customerSeed: Customer[] = [
  { id: "c1", name: "Rapid Auto Garage", email: "contact@rapidauto.com", phone: "+1 555 0110", city: "Chicago", address: "220 Mechanic St, Chicago, IL", notes: "High-volume trade account.", totalOrders: 42, totalSpent: 18420, balance: 640, createdAt: "2025-10-21" },
  { id: "c2", name: "Downtown Motors", email: "sales@downtownmotors.com", phone: "+1 555 0142", city: "Detroit", address: "18 Center Ave, Detroit, MI", totalOrders: 31, totalSpent: 12240, balance: 0, createdAt: "2025-11-30" },
  { id: "c3", name: "Elena Vasquez", email: "elena.v@gmail.com", phone: "+1 555 0188", city: "Austin", totalOrders: 8, totalSpent: 1640, balance: 120, createdAt: "2026-02-11" },
  { id: "c4", name: "FleetCare Services", email: "ops@fleetcare.com", phone: "+1 555 0199", city: "Phoenix", address: "77 Depot Blvd, Phoenix, AZ", notes: "Fleet maintenance contract.", totalOrders: 64, totalSpent: 41200, balance: 2100, createdAt: "2025-09-04" },
  { id: "c5", name: "Mike's Repair Shop", email: "mike@mikesrepair.com", phone: "+1 555 0121", city: "Denver", totalOrders: 19, totalSpent: 7350, balance: 0, createdAt: "2026-03-18" },
];

export const productSeed: Product[] = [
  { id: "p1", name: "Brake Pad Set — Front", sku: "BRK-FP-001", barcode: "7290001112221", category: "Brakes", supplier: "AutoZone Distribution", purchasePrice: 22.5, sellingPrice: 39.9, stock: 148, minStock: 40, unit: "set", location: "A-01-03", status: "active", description: "Ceramic front brake pads, low dust.", createdAt: "2026-01-12", updatedAt: "2026-06-28" },
  { id: "p2", name: "Oil Filter Premium", sku: "FLT-OIL-014", barcode: "7290001112238", category: "Filters", supplier: "Global Parts Co.", purchasePrice: 4.2, sellingPrice: 9.5, stock: 12, minStock: 60, unit: "pcs", location: "B-04-11", status: "active", description: "High-flow spin-on oil filter.", createdAt: "2026-01-20", updatedAt: "2026-07-03" },
  { id: "p3", name: "Spark Plug Iridium (4pk)", sku: "IGN-SP-220", barcode: "7290001112245", category: "Ignition", supplier: "Global Parts Co.", purchasePrice: 14.0, sellingPrice: 28.0, stock: 0, minStock: 30, unit: "pack", location: "C-02-07", status: "active", description: "Long-life iridium spark plugs.", createdAt: "2026-02-02", updatedAt: "2026-07-05" },
  { id: "p4", name: "Timing Belt Kit", sku: "ENG-TB-088", barcode: "7290001112252", category: "Engine", supplier: "PartSupply Intl.", purchasePrice: 48.0, sellingPrice: 89.0, stock: 34, minStock: 15, unit: "kit", location: "D-01-02", status: "active", description: "Complete timing belt kit with tensioner.", createdAt: "2026-02-15" },
  { id: "p5", name: "Cabin Air Filter", sku: "FLT-CAB-077", barcode: "7290001112269", category: "Filters", supplier: "Global Parts Co.", purchasePrice: 6.5, sellingPrice: 15.0, stock: 8, minStock: 25, unit: "pcs", location: "B-04-14", status: "active", description: "Activated carbon cabin filter.", createdAt: "2026-02-28" },
  { id: "p6", name: "Shock Absorber Rear", sku: "SUS-SA-131", barcode: "7290001112276", category: "Suspension", supplier: "AutoZone Distribution", purchasePrice: 33.0, sellingPrice: 62.0, stock: 56, minStock: 20, unit: "pcs", location: "E-03-05", status: "active", description: "Gas-charged rear shock absorber.", createdAt: "2026-03-05" },
  { id: "p7", name: "Alternator 90A", sku: "ELC-ALT-045", barcode: "7290001112283", category: "Electrical", supplier: "PartSupply Intl.", purchasePrice: 78.0, sellingPrice: 145.0, stock: 19, minStock: 10, unit: "pcs", location: "F-01-01", status: "active", description: "Remanufactured 90A alternator.", createdAt: "2026-03-12" },
  { id: "p8", name: 'Wiper Blade Set 24"', sku: "ACC-WB-300", barcode: "7290001112290", category: "Accessories", supplier: "AutoZone Distribution", purchasePrice: 8.0, sellingPrice: 18.5, stock: 210, minStock: 50, unit: "set", location: "G-02-09", status: "active", description: "All-season beam wiper blades.", createdAt: "2026-03-22" },
  { id: "p9", name: "Radiator Coolant 5L", sku: "FLU-CL-012", barcode: "7290001112306", category: "Fluids", supplier: "Global Parts Co.", purchasePrice: 11.0, sellingPrice: 22.0, stock: 74, minStock: 30, unit: "bottle", location: "H-01-04", status: "active", description: "Long-life ready-to-use coolant.", createdAt: "2026-04-01" },
  { id: "p10", name: "Clutch Kit Complete", sku: "TRN-CL-159", barcode: "7290001112313", category: "Transmission", supplier: "PartSupply Intl.", purchasePrice: 120.0, sellingPrice: 215.0, stock: 6, minStock: 8, unit: "kit", location: "I-02-02", status: "active", description: "Clutch disc, pressure plate and bearing.", createdAt: "2026-04-10" },
  { id: "p11", name: "Headlight Bulb H7", sku: "ELC-HL-201", barcode: "7290001112320", category: "Electrical", supplier: "AutoZone Distribution", purchasePrice: 3.5, sellingPrice: 8.9, stock: 320, minStock: 80, unit: "pcs", location: "F-03-12", status: "active", description: "Standard H7 halogen bulb.", createdAt: "2026-04-19" },
  { id: "p12", name: "Brake Disc Ventilated", sku: "BRK-DS-050", barcode: "7290001112337", category: "Brakes", supplier: "PartSupply Intl.", purchasePrice: 41.0, sellingPrice: 79.0, stock: 42, minStock: 16, unit: "pcs", location: "A-02-01", status: "active", description: "Ventilated front brake disc.", createdAt: "2026-05-02" },
];

export const salesSeed: Invoice[] = [
  { id: "so1", reference: "SO-2026-0148", invoiceNumber: "INV-8841", partyId: "c4", partyName: "FleetCare Services", date: "2026-07-06", status: "confirmed", paymentStatus: "unpaid", total: 822.0, lines: [
    { productId: "p12", productName: "Brake Disc Ventilated", quantity: 8, unitPrice: 79.0, discount: 0 },
    { productId: "p2", productName: "Oil Filter Premium", quantity: 20, unitPrice: 9.5, discount: 0 },
  ] },
  { id: "so2", reference: "SO-2026-0147", invoiceNumber: "INV-8840", partyId: "c1", partyName: "Rapid Auto Garage", date: "2026-07-06", status: "paid", paymentStatus: "paid", total: 488.0, lines: [
    { productId: "p1", productName: "Brake Pad Set — Front", quantity: 10, unitPrice: 39.9, discount: 0 },
    { productId: "p11", productName: "Headlight Bulb H7", quantity: 10, unitPrice: 8.9, discount: 0 },
  ] },
  { id: "so3", reference: "SO-2026-0146", invoiceNumber: "INV-8839", partyId: "c2", partyName: "Downtown Motors", date: "2026-07-05", status: "paid", paymentStatus: "paid", total: 530.0, lines: [
    { productId: "p6", productName: "Shock Absorber Rear", quantity: 5, unitPrice: 62.0, discount: 0 },
    { productId: "p9", productName: "Radiator Coolant 5L", quantity: 10, unitPrice: 22.0, discount: 0 },
  ] },
  { id: "so4", reference: "SO-2026-0145", invoiceNumber: "INV-8838", partyId: "c5", partyName: "Mike's Repair Shop", date: "2026-07-05", status: "confirmed", paymentStatus: "partial", total: 305.0, lines: [
    { productId: "p8", productName: 'Wiper Blade Set 24"', quantity: 10, unitPrice: 18.5, discount: 0 },
    { productId: "p5", productName: "Cabin Air Filter", quantity: 8, unitPrice: 15.0, discount: 0 },
  ] },
  { id: "so5", reference: "SO-2026-0144", invoiceNumber: "INV-8837", partyId: "c3", partyName: "Elena Vasquez", date: "2026-07-04", status: "paid", paymentStatus: "paid", total: 92.0, lines: [
    { productId: "p11", productName: "Headlight Bulb H7", quantity: 5, unitPrice: 8.9, discount: 0 },
    { productId: "p2", productName: "Oil Filter Premium", quantity: 5, unitPrice: 9.5, discount: 0 },
  ] },
];

export const purchasesSeed: Invoice[] = [
  { id: "po1", reference: "PO-2026-0074", invoiceNumber: "BILL-3390", partyId: "s3", partyName: "PartSupply Intl.", date: "2026-07-05", status: "confirmed", paymentStatus: "unpaid", total: 3180.0, lines: [
    { productId: "p10", productName: "Clutch Kit Complete", quantity: 20, unitPrice: 120.0, discount: 0 },
    { productId: "p7", productName: "Alternator 90A", quantity: 10, unitPrice: 78.0, discount: 0 },
  ] },
  { id: "po2", reference: "PO-2026-0073", invoiceNumber: "BILL-3388", partyId: "s2", partyName: "Global Parts Co.", date: "2026-07-04", status: "paid", paymentStatus: "paid", total: 1890.0, lines: [
    { productId: "p2", productName: "Oil Filter Premium", quantity: 200, unitPrice: 4.2, discount: 0 },
    { productId: "p11", productName: "Headlight Bulb H7", quantity: 300, unitPrice: 3.5, discount: 0 },
  ] },
  { id: "po3", reference: "PO-2026-0072", invoiceNumber: "BILL-3385", partyId: "s1", partyName: "AutoZone Distribution", date: "2026-07-02", status: "paid", paymentStatus: "paid", total: 3050.0, lines: [
    { productId: "p1", productName: "Brake Pad Set — Front", quantity: 100, unitPrice: 22.5, discount: 0 },
    { productId: "p8", productName: 'Wiper Blade Set 24"', quantity: 100, unitPrice: 8.0, discount: 0 },
  ] },
];

export const movementSeed: StockMovement[] = [
  { id: "m1", productId: "p1", productName: "Brake Pad Set — Front", type: "purchase", quantity: 100, reference: "PO-2026-0072", date: "2026-07-02" },
  { id: "m2", productId: "p1", productName: "Brake Pad Set — Front", type: "sale", quantity: -12, reference: "SO-2026-0147", date: "2026-07-06" },
  { id: "m3", productId: "p3", productName: "Spark Plug Iridium (4pk)", type: "sale", quantity: -30, reference: "SO-2026-0146", date: "2026-07-05" },
  { id: "m4", productId: "p2", productName: "Oil Filter Premium", type: "adjustment", quantity: -6, reference: "ADJ-0004", date: "2026-07-03", note: "Damaged stock write-off" },
];
