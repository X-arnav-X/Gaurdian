import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import type { Lang } from "@/lib/i18n";
import {
  categoryLabel,
  intensity,
  markerRadius,
  type AreaReport,
  type TimeWindow,
  windowNote,
} from "@/lib/scam-watch";
import { cn } from "@/lib/utils";

const BENGALURU: [number, number] = [12.9629, 77.6];

const MARKER_CLASS: Record<"high" | "medium" | "low", string> = {
  high: "scam-marker scam-marker--high",
  medium: "scam-marker scam-marker--medium",
  low: "scam-marker scam-marker--low",
};

function FitCity({ areas }: { areas: AreaReport[] }) {
  const map = useMap();
  useEffect(() => {
    if (areas.length === 0) return;
    const bounds = areas.map((area) => [area.lat, area.lng] as [number, number]);
    map.fitBounds(bounds, { padding: [42, 42], animate: true });
  }, [areas, map]);
  return null;
}

export type ScamWatchMapProps = {
  areas: AreaReport[];
  window: TimeWindow;
  lang?: Lang;
  /** Quiet mode: no controls, no interaction — used as the landing-page hero visual. */
  quiet?: boolean;
  className?: string;
};

export default function ScamWatchMap({
  areas,
  window: timeWindow,
  lang = "en",
  quiet = false,
  className,
}: ScamWatchMapProps) {
  const max = areas.reduce((peak, area) => Math.max(peak, area.reports), 0);

  return (
    <div className={cn("relative h-full w-full", quiet && "map-quiet")}>
      <MapContainer
        center={BENGALURU}
        zoom={quiet ? 11 : 11.4}
        className="h-full w-full"
        zoomControl={!quiet}
        dragging={!quiet}
        scrollWheelZoom={false}
        doubleClickZoom={!quiet}
        touchZoom={!quiet}
        keyboard={!quiet}
        attributionControl={!quiet}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        <FitCity areas={areas} />

        {areas.map((area, index) => {
          const level = intensity(area.reports, max);
          return (
            <CircleMarker
              key={area.slug}
              center={[area.lat, area.lng]}
              radius={markerRadius(area.reports, max)}
              pathOptions={{
                className: cn(
                  MARKER_CLASS[level],
                  quiet && "scam-marker--quiet",
                  index % 3 === 0 && quiet && "scam-marker--breathe",
                ),
                weight: 2,
              }}
              interactive={!quiet}
            >
              {!quiet && (
                <Popup>
                  <p className="font-display text-base leading-tight">{area.name}</p>
                  <p className="mt-1.5">
                    <strong>{categoryLabel(area.topCategory, lang)}</strong> —{" "}
                    {area.topCategoryReports}{" "}
                    {area.topCategoryReports === 1 ? "report" : "reports"}{" "}
                    {windowNote(timeWindow)}
                  </p>
                  <p className="mt-1.5 text-ink-soft">
                    {area.reports} {area.reports === 1 ? "report" : "reports"} in total from this
                    area. Counts only — no message is ever shown here.
                  </p>
                </Popup>
              )}
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
