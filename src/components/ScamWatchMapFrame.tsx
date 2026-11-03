import { Suspense, lazy } from "react";
import { ClientOnly } from "./ClientOnly";
import { MapSkeleton } from "./Skeleton";
import type { ScamWatchMapProps } from "./ScamWatchMap";

/**
 * Leaflet touches `window` at import time, so the map module is only ever
 * loaded in the browser, after hydration.
 */
const ScamWatchMap = lazy(() => import("./ScamWatchMap"));

export function ScamWatchMapFrame({
  className,
  ...props
}: ScamWatchMapProps & { className?: string }) {
  const fallback = className ? <MapSkeleton className={className} /> : <MapSkeleton />;
  return (
    <div className={className}>
      <ClientOnly fallback={fallback}>
        <Suspense fallback={fallback}>
          <ScamWatchMap {...props} />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
