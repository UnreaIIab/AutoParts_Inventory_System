import * as React from "react";
import { Breadcrumbs } from "./breadcrumbs";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="sticky top-14 z-20 border-b border-border bg-canvas/80 px-5 py-3.5 backdrop-blur">
      <Breadcrumbs />
      <div className="mt-2 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-content">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-content-muted">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
