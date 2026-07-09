"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigation, type NavItem } from "@/config/navigation";
import { useSidebar } from "./sidebar-context";
import { useT } from "@/lib/i18n";
import { Boxes, PanelLeftClose, PanelLeftOpen, X, ChevronDown } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();
  const { t } = useT();

  const nav = (
    <>
      {/* Brand */}
      <div
        className={cn(
          "flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-white">
          <Boxes className="h-5 w-5" />
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              AutoParts
            </p>
            <p className="truncate text-[11px] text-sidebar-muted">
              {t("Inventory System")}
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
        {navigation.map((item) => (
          <NavEntry
            key={item.href}
            item={item}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      {/* Collapse toggle (desktop) */}
      <div className="hidden border-t border-sidebar-border p-2.5 lg:block">
        <button
          onClick={toggle}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-white",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          ) : (
            <>
              <PanelLeftClose className="h-[18px] w-[18px]" />
              <span>{t("Collapse")}</span>
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar transition-[width] duration-200 lg:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        {nav}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-content/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-60 flex-col bg-sidebar animate-slide-in-right">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 rounded p-1 text-sidebar-muted hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}

function NavEntry({
  item,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const { t } = useT();
  const Icon = item.icon;
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  const hasChildren = !!item.children?.length;
  const [expanded, setExpanded] = React.useState(active && hasChildren);

  const linkClass = cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    collapsed && "justify-center px-0",
    active
      ? "bg-sidebar-active text-white"
      : "text-sidebar-text hover:bg-sidebar-hover hover:text-white",
  );

  if (hasChildren && !collapsed) {
    return (
      <div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className={cn(linkClass, "w-full")}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" />
          <span className="truncate">{t(item.label)}</span>
          <ChevronDown
            className={cn(
              "ml-auto h-4 w-4 transition-transform",
              expanded && "rotate-180",
            )}
          />
        </button>
        {expanded && (
          <div className="mt-0.5 space-y-0.5 pl-4">
            {item.children!.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-sidebar-text/90 transition-colors hover:bg-sidebar-hover hover:text-white"
              >
                <span className="h-1 w-1 rounded-full bg-sidebar-muted" />
                <span className="truncate">{t(child.label)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? t(item.label) : undefined}
      className={linkClass}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span className="truncate">{t(item.label)}</span>}
      {active && !collapsed && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
      )}
    </Link>
  );
}
