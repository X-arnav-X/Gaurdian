import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { APP_NAME } from "@/lib/brand";
import { StatSkeleton, SkeletonLines } from "@/components/Skeleton";
import {
  categoryLabel,
  fetchAreaReports,
  fetchDailyActivity,
  fetchPlatformStats,
} from "@/lib/scam-watch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: `Insights — how ${APP_NAME} is being used` },
      {
        name: "description",
        content:
          `Aggregate usage for ${APP_NAME}: accounts by role, messages checked, scam-catch rate, activity over time and geographic spread across Bengaluru.`,
      },
      { property: "og:title", content: `Insights — how ${APP_NAME} is being used` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Aggregate, anonymous metrics: accounts, checks, catch rate and citywide spread.",
      },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const stats = useQuery({ queryKey: ["insights", "stats"], queryFn: fetchPlatformStats });
  const daily = useQuery({ queryKey: ["insights", "daily"], queryFn: () => fetchDailyActivity(30) });
  const areas = useQuery({
    queryKey: ["insights", "areas"],
    queryFn: () => fetchAreaReports("month"),
  });

  const catchRate =
    stats.data && stats.data.checks > 0
      ? Math.round((stats.data.scams / stats.data.checks) * 100)
      : 0;

  const chartData = (daily.data ?? []).map((point) => ({
    label: format(parseISO(point.day), "d MMM"),
    reports: point.reports,
    checks: point.checks,
  }));

  return (
    <main className="page-enter mx-auto min-h-screen w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        to="/"
        className="py-2 text-base font-bold text-primary underline decoration-accent decoration-2 underline-offset-4"
      >
        Back to home
      </Link>

      <header className="mt-7 rise">
        <p className="font-display text-lg text-accent-foreground/70">{APP_NAME}</p>
        <h1 className="mt-2 max-w-2xl text-4xl leading-[1.15] sm:text-5xl">
          What's happening across the service
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">
          Counts only, drawn from live records. Nothing here identifies a person, and no message
          content is stored in these figures.
        </p>
        {(stats.data?.isDemo || daily.data?.some((point) => point.isDemo) || areas.data?.some((area) => area.isDemo)) && <p className="mt-3 text-sm font-bold text-ink-soft">Illustrative preview data · live metrics appear as the service is used</p>}
      </header>

      {stats.isError ? (
        <div className="mt-10 border-2 border-rule bg-card p-8">
          <h2 className="text-2xl">These figures didn't load</h2>
          <p className="mt-3 text-lg text-ink-soft">
            The connection dropped before the numbers arrived.
          </p>
          <button
            type="button"
            onClick={() => { void stats.refetch(); void daily.refetch(); void areas.refetch(); }}
            className="mt-6 min-h-14 bg-accent px-6 text-lg font-bold text-accent-foreground transition-opacity hover:opacity-90"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.isPending ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : (
            <>
              <Figure label="Seniors protected" value={stats.data.seniors} emphasis />
              <Figure label="Family members watching over" value={stats.data.families} />
              <Figure label="Messages checked" value={stats.data.checks} />
              <Figure label="Scams caught" value={stats.data.scams} tone="alarm" />
            </>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Figure label="Catch rate" value={`${catchRate}%`} note="of checked messages were scams" />
        <Figure label="Questions asked aloud" value={stats.data?.voice_queries ?? 0} />
        <Figure label="Daily check-ins" value={stats.data?.checkins ?? 0} />
        <Figure label="Neighbourhoods covered" value={stats.data?.areas_covered ?? 0} />
      </div>

      <section className="mt-14">
        <h2 className="text-2xl">Activity over the last 30 days</h2>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-ink-soft">
          Messages checked, against scam reports feeding the citywide map.
        </p>
        <div className="mt-6 border-2 border-rule bg-card p-4 pt-6 sm:p-6">
          {daily.isPending ? (
            <SkeletonLines lines={7} />
          ) : (
            <div className="h-[18rem] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="checksFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-rule)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--color-ink-soft)", fontSize: 12 }}
                    interval="preserveStartEnd"
                    minTickGap={28}
                    stroke="var(--color-rule)"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "var(--color-ink-soft)", fontSize: 12 }}
                    stroke="var(--color-rule)"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "2px solid var(--color-primary)",
                      borderRadius: 0,
                      fontFamily: "var(--font-sans)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reports"
                    name="Scam reports"
                    stroke="var(--color-alarm)"
                    strokeWidth={2}
                    fill="none"
                  />
                  <Area
                    type="monotone"
                    dataKey="checks"
                    name="Messages checked"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#checksFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl">Geographic spread this month</h2>
        {areas.isPending ? (
          <SkeletonLines lines={6} className="mt-6" />
        ) : (
          <ul className="mt-6 grid gap-x-10 gap-y-4 sm:grid-cols-2">
            {(areas.data ?? []).map((area) => {
              const peak = areas.data?.[0]?.reports ?? 1;
              return (
                <li key={area.slug}>
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-base">{area.name}</p>
                    <p className="shrink-0 font-display text-lg">{area.reports}</p>
                  </div>
                  <div className="mt-2 h-2 w-full bg-secondary">
                    <div
                      className="h-2 bg-primary/60"
                      style={{ width: `${Math.max(5, (area.reports / peak) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">
                    Mostly {categoryLabel(area.topCategory).toLowerCase()}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
        <Link
          to="/scam-watch"
          className="mt-8 inline-block py-2 text-base font-bold text-primary underline decoration-accent decoration-2 underline-offset-4"
        >
          See this on the map
        </Link>
      </section>
    </main>
  );
}

function Figure({
  label,
  value,
  note,
  emphasis,
  tone,
}: {
  label: string;
  value: number | string;
  note?: string;
  emphasis?: boolean;
  tone?: "alarm";
}) {
  return (
    <div className={cn("border bg-card p-6", emphasis ? "border-accent/60" : "border-rule")}>
      <p className="text-base text-ink-soft">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-3xl leading-tight",
          tone === "alarm" && "text-alarm",
        )}
      >
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </p>
      {note && <p className="mt-1 text-sm text-ink-soft">{note}</p>}
    </div>
  );
}
