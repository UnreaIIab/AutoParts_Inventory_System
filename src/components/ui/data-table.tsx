"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  /** render cell content */
  cell?: (row: T) => React.ReactNode;
  /** accessor for default rendering + sorting */
  accessor?: (row: T) => string | number;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  width?: string;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  selectable?: boolean;
  selected?: Set<string>;
  onSelectedChange?: (next: Set<string>) => void;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => React.ReactNode;
  emptyState?: React.ReactNode;
}

type SortState = { key: string; dir: "asc" | "desc" } | null;

export function DataTable<T>({
  columns,
  data,
  rowKey,
  selectable = false,
  selected,
  onSelectedChange,
  onRowClick,
  rowActions,
  emptyState,
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<SortState>(null);

  const sorted = React.useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.accessor) return data;
    const acc = col.accessor;
    return [...data].sort((a, b) => {
      const av = acc(a);
      const bv = acc(b);
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sort, columns]);

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };

  const allKeys = sorted.map(rowKey);
  const allSelected =
    selectable && allKeys.length > 0 && allKeys.every((k) => selected?.has(k));

  const toggleAll = () => {
    if (!onSelectedChange) return;
    onSelectedChange(allSelected ? new Set() : new Set(allKeys));
  };

  const toggleRow = (key: string) => {
    if (!onSelectedChange || !selected) return;
    const next = new Set(selected);
    next.has(key) ? next.delete(key) : next.add(key);
    onSelectedChange(next);
  };

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-surface-muted">
          <tr className="border-b border-border">
            {selectable && (
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 cursor-pointer rounded border-border-strong text-primary focus-ring accent-primary"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={cn(
                  "px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-content-muted",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  col.align !== "right" && col.align !== "center" && "text-left",
                )}
              >
                {col.sortable ? (
                  <button
                    onClick={() => toggleSort(col.key)}
                    className={cn(
                      "inline-flex items-center gap-1 hover:text-content",
                      col.align === "right" && "flex-row-reverse",
                    )}
                  >
                    {col.header}
                    {sort?.key === col.key ? (
                      sort.dir === "asc" ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )
                    ) : (
                      <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
            {rowActions && <th className="w-12 px-4 py-2.5" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((row) => {
            const key = rowKey(row);
            const isSelected = selected?.has(key);
            return (
              <tr
                key={key}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "group transition-colors",
                  onRowClick && "cursor-pointer",
                  isSelected ? "bg-primary-soft/50" : "hover:bg-surface-muted",
                )}
              >
                {selectable && (
                  <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected ?? false}
                      onChange={() => toggleRow(key)}
                      className="h-4 w-4 cursor-pointer rounded border-border-strong text-primary focus-ring accent-primary"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-2.5 text-content",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      col.className,
                    )}
                  >
                    {col.cell
                      ? col.cell(row)
                      : col.accessor
                        ? col.accessor(row)
                        : null}
                  </td>
                ))}
                {rowActions && (
                  <td
                    className="px-4 py-2.5 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="opacity-0 transition-opacity group-hover:opacity-100">
                      {rowActions(row)}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
