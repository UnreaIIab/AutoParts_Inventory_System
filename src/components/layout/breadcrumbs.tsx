"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { navigation } from "@/config/navigation";
import { useT } from "@/lib/i18n";

function titleize(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const { t } = useT();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const nav = navigation.find((n) => n.href === href);
    return { label: t(nav?.label ?? titleize(seg)), href };
  });

  return (
    <nav className="flex items-center gap-1.5 text-xs text-content-muted">
      <Link href="/dashboard" className="hover:text-content">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 text-content-subtle" />
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-content">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-content">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
