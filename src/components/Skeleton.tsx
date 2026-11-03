import { cn } from "@/lib/utils";

/** Shimmering placeholder shaped like the content that is about to arrive. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("shimmer h-4 w-full", className)} />;
}

export function SkeletonLines({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={index === lines - 1 ? "w-2/3" : "w-full"} />
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="border border-rule bg-card p-6">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-7 w-20" />
    </div>
  );
}

export function ActivitySkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {Array.from({ length: rows }).map((_, index) => (
        <li key={index} className="flex gap-5 py-5">
          <Skeleton className="h-7 w-16 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-3 w-24" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function MapSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border-2 border-rule bg-secondary",
        className ?? "h-[26rem]",
      )}
      aria-hidden="true"
    >
      <div className="shimmer absolute inset-0 opacity-70" />
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="font-display text-lg text-ink-soft">Drawing the city…</p>
      </div>
    </div>
  );
}
