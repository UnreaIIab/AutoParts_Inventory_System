import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="animate-fade-in">
      {/* Page header placeholder */}
      <div className="border-b border-border bg-canvas px-5 py-3.5">
        <Skeleton className="h-3 w-40" />
        <div className="mt-3 flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-32 rounded" />
        </div>
      </div>

      <div className="space-y-4 p-5">
        {/* KPI row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-md border border-border bg-surface p-4 shadow-card">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-7 w-20" />
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="rounded-md border border-border bg-surface p-3 shadow-card">
          <Skeleton className="h-9 w-full max-w-md" />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-md border border-border bg-surface shadow-card">
          <div className="border-b border-border px-4 py-3">
            <Skeleton className="h-4 w-full" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-0">
              <Skeleton className="h-9 w-9 shrink-0 rounded" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
