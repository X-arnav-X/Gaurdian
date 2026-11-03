import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MapPin, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { signOut } from "@/lib/auth";
import { exitDemo, useDemoSession } from "@/lib/demo/demo-session";
import { APP_NAME } from "@/lib/brand";
import { DemoBanner } from "@/components/DemoBanner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: `Looking in — ${APP_NAME}` },
      {
        name: "description",
        content:
          "See your parent's daily check-in and a summary of anything suspicious they checked. Their messages stay private to them.",
      },
      { property: "og:title", content: `Looking in — ${APP_NAME}` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Their daily check-in and what's been caught — never the messages themselves.",
      },
    ],
  }),
  component: FamilyDashboard,
});

type CheckRow = {
  id: string;
  verdict: "scam" | "safe" | "unsure";
  summary: string;
  created_at: string;
};

const VERDICT_STYLE: Record<CheckRow["verdict"], { label: string; className: string }> = {
  scam: { label: "Scam", className: "bg-alarm text-alarm-foreground" },
  safe: { label: "Safe", className: "bg-safe text-safe-foreground" },
  unsure: { label: "Unsure", className: "bg-caution text-caution-foreground" },
};

function relative(iso: string | null) {
  if (!iso) return "Not yet";
  return `${formatDistanceToNow(new Date(iso))} ago`;
}

function FamilyDashboard() {
  const { profile, loading } = useSession();
  const navigate = useNavigate();
  const demo = useDemoSession();
  const [seniorName, setSeniorName] = useState("");
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [checks, setChecks] = useState<CheckRow[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!profile) void navigate({ to: "/login" });
    else if (profile.role === "senior") void navigate({ to: "/senior" });
  }, [loading, profile, navigate]);

  useEffect(() => {
    if (demo) {
      // Demo mode: everything comes from the local demo household, which
      // updates live across tabs — no database read.
      setSeniorName(demo.senior.name);
      setLastCheckIn(demo.checkins[demo.checkins.length - 1] ?? null);
      const rows = [...demo.checks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setChecks(
        rows.map((check) => ({
          id: check.id,
          verdict: check.verdict,
          summary: check.summary,
          created_at: check.createdAt,
        })),
      );
      setLoadError(false);
      setReady(true);
      return;
    }
    const seniorId = profile?.linked_senior_id;
    if (!seniorId) return;
    let active = true;

    void (async () => {
      const [senior, checkins, scamChecks] = await Promise.all([
        supabase.from("profiles").select("name").eq("id", seniorId).maybeSingle(),
        supabase
          .from("checkins")
          .select("created_at")
          .eq("senior_id", seniorId)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("scam_checks")
          .select("id, verdict, summary, created_at")
          .eq("senior_id", seniorId)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
      if (!active) return;
      if (senior.error || checkins.error || scamChecks.error) {
        setLoadError(true);
        setReady(true);
        return;
      }
      setSeniorName(senior.data?.name ?? "");
      setLastCheckIn(checkins.data?.[0]?.created_at ?? null);
      setChecks((scamChecks.data as CheckRow[]) ?? []);
      setReady(true);
    })();

    return () => {
      active = false;
    };
  }, [demo, profile, reloadKey]);

  if (loading || !profile || profile.role !== "family") {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12 sm:px-10 sm:py-16" aria-label="Loading family updates">
        <div className="shimmer h-7 w-40" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="shimmer h-28" />
          <div className="shimmer h-28" />
          <div className="shimmer h-28" />
        </div>
        <div className="mt-14 space-y-5">
          <div className="shimmer h-5 w-2/3" />
          <div className="shimmer h-20 w-full" />
          <div className="shimmer h-20 w-full" />
        </div>
      </main>
    );
  }

  const caught = checks.filter((check) => check.verdict === "scam").length;

  return (
    <main className="page-enter mx-auto min-h-screen w-full max-w-3xl px-6 py-12 sm:px-10 sm:py-16">
      <DemoBanner />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-lg text-accent-foreground/70">{APP_NAME}</p>
          <h1 className="mt-2 text-4xl leading-tight sm:text-5xl">
            {seniorName ? `Looking in on ${seniorName}` : "Looking in"}
          </h1>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/scam-watch" className="inline-flex min-h-12 items-center gap-2 border border-rule px-4 font-bold text-primary transition-colors hover:border-accent">
            <MapPin className="size-5" /> Scam Watch
          </Link>
          <button
            type="button"
            onClick={async () => {
              if (demo) {
                exitDemo();
                await navigate({ to: "/login" });
                return;
              }
              await signOut();
              await navigate({ to: "/" });
            }}
            className="py-2 text-base font-bold text-primary underline decoration-accent decoration-2 underline-offset-4"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Stat label="Last check-in" value={ready ? relative(lastCheckIn) : "…"} emphasis />
        <Stat label="Scams caught" value={ready ? String(caught) : "…"} />
        <Stat label="Messages checked" value={ready ? String(checks.length) : "…"} />
      </div>

      <section className="mt-14">
        <h2 className="text-2xl">Recent activity</h2>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-ink-soft">
          You see the verdict and a one-line summary only. The messages themselves stay private to{" "}
          {seniorName || "them"} — that's deliberate.
        </p>

        {!ready ? (
          <div className="mt-8 space-y-4 py-5" aria-label="Loading recent activity">
            <div className="shimmer h-5 w-3/4" />
            <div className="shimmer h-5 w-1/2" />
            <div className="shimmer h-5 w-2/3" />
          </div>
        ) : loadError ? (
          <div className="mt-8 border border-rule bg-card p-7">
            <p className="text-lg text-ink-soft">We couldn't load the latest update. Your connection may have dropped.</p>
            <button type="button" onClick={() => { setReady(false); setLoadError(false); setReloadKey((key) => key + 1); }} className="mt-5 min-h-12 bg-accent px-5 font-bold text-accent-foreground">Try again</button>
          </div>
        ) : checks.length === 0 ? (
          <div className="mt-8 border border-rule bg-card p-8 sm:p-10">
            <span className="flex size-12 items-center justify-center rounded-full bg-safe-soft text-safe"><ShieldCheck className="size-6" /></span>
            <h3 className="mt-5 font-display text-2xl">A quiet start is a good start</h3>
            <p className="mt-2 max-w-xl text-lg leading-relaxed text-ink-soft">When {seniorName || "your parent"} checks a message, you'll see a short summary here. The message itself always stays private.</p>
          </div>
        ) : (
          <ul className="mt-7 divide-y divide-rule border-y border-rule">
            {checks.map((check) => {
              const style = VERDICT_STYLE[check.verdict];
              return (
                <li key={check.id} className="flex gap-5 py-5">
                  <span
                    className={cn(
                      "mt-0.5 h-fit shrink-0 rounded-full px-3 py-1 text-sm font-bold",
                      style.className,
                    )}
                  >
                    {style.label}
                  </span>
                  <div className="min-w-0">
                    <p className="text-lg leading-relaxed">{check.summary}</p>
                    <p className="mt-1 text-base text-ink-soft">{relative(check.created_at)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "border bg-card p-6",
        emphasis ? "border-accent/60" : "border-rule",
      )}
    >
      <p className="text-base text-ink-soft">{label}</p>
      <p className="mt-2 font-display text-2xl leading-tight">{value}</p>
    </div>
  );
}
