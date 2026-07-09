import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Receipt,
  Users,
  Truck,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavChild {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavChild[];
}

export const navigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
  { label: "Inventory", href: "/inventory", icon: Warehouse },
  { label: "Purchases", href: "/purchases", icon: ShoppingCart },
  { label: "Sales", href: "/sales", icon: Receipt },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Suppliers", href: "/suppliers", icon: Truck },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    children: [
      { label: "Company", href: "/settings?tab=company" },
      { label: "Categories", href: "/settings?tab=categories" },
    ],
  },
];
