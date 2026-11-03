import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import { useSession } from "@/hooks/useSession";
import { ScamWatchMapFrame } from "@/components/ScamWatchMapFrame";
import { ActivitySkeleton, MapSkeleton, SkeletonLines } from "@/components/Skeleton";
import {
  categoryLabel,
  fetchAreaReports,
  fetchCategoryCounts,
  TIME_WINDOWS,
  windowNote,
  type TimeWindow,
} from "@/lib/scam-watch";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/scam-watch")({
  head: () => ({
    meta: [
      { title: `Scam Watch — where scams are being reported in Bengaluru | ${APP_NAME}` },
      {
        name: "description",
        content:
          "A live, anonymous map of where scam messages are being reported across Bengaluru neighbourhoods, with the most-reported type in each area.",
      },
      { property: "og:title", content: `Scam Watch — Bengaluru scam reports | ${APP_NAME}` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content:
          "Neighbourhood-level counts only. No message, and no person, is ever shown on this map.",
      },
    ],
  }),
  component: ScamWatchPage,
});

function ScamWatchPage() {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("week");
  const { profile } = useSession();
  const lang = (profile?.preferred_language ?? "en") as Lang;

  const areas = useQuery({
    queryKey: ["scam-watch", "areas", timeWindow],
    queryFn: () => fetchAreaReports(timeWindow),
  });
  const categories = useQuery({
    queryKey: ["scam-watch", "categories", timeWindow],
    queryFn: () => fetchCategoryCounts(timeWindow),
  });

  const total = (areas.data ?? []).reduce((sum, area) => sum + area.reports, 0);
  const home = profile?.role === "senior" ? "/senior" : profile?.role === "family" ? "/family" : "/";

  return (
    <main className="page-enter mx-auto min-h-screen w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        to={home}
        className="inline-flex items-center gap-2 py-2 text-base font-bold text-primary underline decoration-accent decoration-2 underline-offset-4"
      >
        <ArrowLeft className="size-4" />
        {profile ? "Back" : "Back to home"}
      </Link>

      <header className="mt-7 rise">
        <p className="font-display text-lg text-accent-foreground/70">{APP_NAME}</p>
        <h1 className="mt-2 max-w-2xl text-4xl leading-[1.15] sm:text-5xl">
          Where scams are being reported in Bengaluru
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">
          Every scam a {APP_NAME} user catches adds one anonymous count to their neighbourhood. No
          message, no name and no phone number ever appears here — only how many and what kind.
        </p>
        {areas.data?.some((area) => area.isDemo) && <p className="mt-3 text-sm font-bold text-ink-soft">Illustrative Bengaluru preview data · not live incident reports</p>}
      </header>

      <div className="mt-9 flex flex-wrap items-center gap-2" role="group" aria-label="Time period">
        {TIME_WINDOWS.map((option) => {
          const active = option.value === timeWindow;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => setTimeWindow(option.value)}
              className={cn(
                "border-2 px-5 py-2.5 text-base font-bold transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-rule bg-card text-primary hover:border-accent",
              )}
            >
              {option.label}
            </button>
          );
        })}
        <p className="ml-auto text-base text-ink-soft" aria-live="polite">
          {areas.isPending ? "Counting reports…" : `${total} reports ${windowNote(timeWindow)}${areas.data?.some((area) => area.isDemo) ? " · illustrative demo data" : ""}`}
        </p>
      </div>

      <section className="mt-6">
        {areas.isPending ? (
          <MapSkeleton className="h-[24rem] sm:h-[32rem]" />
        ) : areas.isError ? (
          <div className="border-2 border-rule bg-card p-8">
            <h2 className="text-2xl">The map didn't load</h2>
            <p className="mt-3 max-w-xl text-lg leading-relaxed text-ink-soft">
              We couldn't reach the report counts just now. Your connection may have dropped.
            </p>
            <button
              type="button"
              onClick={() => { void areas.refetch(); void categories.refetch(); }}
              className="mt-6 min-h-14 bg-accent px-6 text-lg font-bold text-accent-foreground transition-opacity hover:opacity-90"
            >
              Try again
            </button>
          </div>
        ) : areas.data.length === 0 ? (
          <div className="border-2 border-rule bg-card p-8">
            <h2 className="text-2xl">Nothing reported in this period</h2>
            <p className="mt-3 max-w-xl text-lg leading-relaxed text-ink-soft">
              A quiet window is good news. Try a longer period to see the wider picture.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden border-2 border-primary/25">
            <ScamWatchMapFrame
              areas={areas.data}
              window={timeWindow}
              lang={lang}
              className="h-[24rem] sm:h-[32rem]"
            />
          </div>
        )}
        {areas.data && areas.data.length > 0 && <p className="mt-3 text-sm text-ink-soft">
          Circle size and colour show how many reports came from that neighbourhood. Tap a circle for
          the most-reported type there.
        </p>}
      </section>

      <div className="mt-14 grid gap-12 md:grid-cols-[1.1fr_1fr]">
        <section>
          <h2 className="text-2xl">Busiest neighbourhoods</h2>
          {areas.isPending ? (
            <ActivitySkeleton rows={5} />
          ) : (
            <ul className="mt-5 divide-y divide-rule border-y border-rule">
              {(areas.data ?? []).slice(0, 8).map((area) => (
                <li key={area.slug} className="flex items-baseline justify-between gap-5 py-4">
                  <div className="min-w-0">
                    <p className="font-display text-xl leading-tight">{area.name}</p>
                    <p className="mt-1 text-base text-ink-soft">
                      Mostly {categoryLabel(area.topCategory, lang).toLowerCase()}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-2xl">{area.reports}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-2xl">What's being reported</h2>
          {categories.isPending ? (
            <SkeletonLines lines={6} className="mt-6" />
          ) : categories.isError ? (
            <div className="mt-5 border-l-2 border-rule pl-4">
              <p className="text-base leading-relaxed text-ink-soft">The category counts didn't arrive. The map is still available.</p>
              <button type="button" onClick={() => void categories.refetch()} className="mt-3 py-2 font-bold text-primary underline decoration-accent decoration-2 underline-offset-4">Try category counts again</button>
            </div>
          ) : (
            <ul className="mt-5 space-y-4">
              {(categories.data ?? []).map((row, index) => {
                const peak = categories.data?.[0]?.reports ?? 1;
                return (
                  <li key={row.category}>
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="text-base leading-snug">{categoryLabel(row.category, lang)}</p>
                      <p className="shrink-0 font-display text-lg">{row.reports}</p>
                    </div>
                    <div className="mt-2 h-2 w-full bg-secondary">
                      <div
                        className={cn("h-2", index === 0 ? "bg-alarm" : "bg-primary/55")}
                        style={{ width: `${Math.max(6, (row.reports / peak) * 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
