import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, Loader2, MapPin, MessageSquareWarning, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { signOut } from "@/lib/auth";
import { exitDemo, readDemo, updateDemo, useDemoSession } from "@/lib/demo/demo-session";
import { APP_NAME } from "@/lib/brand";
import { t, type Lang } from "@/lib/i18n";
import { ScamChecker } from "@/components/ScamChecker";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { DemoBanner } from "@/components/DemoBanner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/senior")({
  head: () => ({
    meta: [
      { title: `Your home screen — ${APP_NAME}` },
      {
        name: "description",
        content:
          "Check whether a message is a scam, ask a question out loud, and let your family know you're okay today.",
      },
      { property: "og:title", content: `Your home screen — ${APP_NAME}` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Check a message, ask a question out loud, or say you're okay today.",
      },
    ],
  }),
  component: SeniorHome,
});

type View = "home" | "check" | "ask";

function SeniorHome() {
  const { profile, loading } = useSession();
  const navigate = useNavigate();
  const demo = useDemoSession();
  const [view, setView] = useState<View>("home");
  const [checkedInToday, setCheckedInToday] = useState<boolean | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState("");
  const [totals, setTotals] = useState<{ checked: number; scams: number } | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!profile) void navigate({ to: "/login" });
    else if (profile.role === "family") void navigate({ to: "/family" });
  }, [loading, profile, navigate]);

  const loadCheckIn = useCallback(async (seniorId: string) => {
    const demo = readDemo();
    if (demo) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      setCheckInError("");
      setCheckedInToday(demo.checkins.some((iso) => new Date(iso) >= start));
      return;
    }
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from("checkins")
      .select("id")
      .eq("senior_id", seniorId)
      .gte("created_at", start.toISOString())
      .limit(1);
    if (error) {
      setCheckInError("We couldn't check today's status just now. Please try again in a moment.");
      setCheckedInToday(false);
      return;
    }
    setCheckedInToday((data?.length ?? 0) > 0);
  }, []);

  useEffect(() => {
    if (profile?.role === "senior") void loadCheckIn(profile.id);
  }, [profile, loadCheckIn]);

  useEffect(() => {
    if (!profile) return;
    if (demo) {
      setTotals({
        checked: demo.checks.length,
        scams: demo.checks.filter((check) => check.verdict === "scam").length,
      });
      return;
    }
    void (async () => {
      const { data, error } = await supabase
        .from("scam_checks")
        .select("verdict")
        .eq("senior_id", profile.id);
      if (error || !data) {
        setTotals(null);
        return;
      }
      setTotals({
        checked: data.length,
        scams: data.filter((row) => row.verdict === "scam").length,
      });
    })();
  }, [demo, profile]);

  if (loading || !profile || profile.role !== "senior") {
    return (
      <main className="mx-auto min-h-screen w-full max-w-2xl px-6 py-10 sm:px-10 sm:py-14" aria-label="Loading your home screen">
        <div className="shimmer h-5 w-28" />
        <div className="shimmer mt-7 h-12 w-3/4" />
        <div className="mt-10 border-2 border-rule bg-card p-8">
          <div className="shimmer h-6 w-2/3" />
          <div className="shimmer mt-5 h-20 w-full" />
        </div>
        <div className="mt-8 space-y-4">
          <div className="shimmer h-20 w-full" />
          <div className="shimmer h-20 w-full" />
        </div>
      </main>
    );
  }

  const lang = profile.preferred_language as Lang;
  const copy = t(lang);

  const checkIn = async () => {
    setCheckingIn(true);
    setCheckInError("");
    if (demo) {
      updateDemo((state) => {
        state.checkins.push(new Date().toISOString());
      });
      setCheckedInToday(true);
      setCheckingIn(false);
      return;
    }
    const { error } = await supabase.from("checkins").insert({ senior_id: profile.id });
    if (error) setCheckInError("We couldn't save that just now. Please try again in a moment.");
    else setCheckedInToday(true);
    setCheckingIn(false);
  };

  return (
    <main className="senior-scale page-enter mx-auto min-h-screen w-full max-w-2xl px-6 py-10 sm:px-10 sm:py-14">
      <DemoBanner />
      {view === "home" ? (
        <>
          <header>
            <p className="font-display text-lg text-accent-foreground/70">{APP_NAME}</p>
            <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">
              {copy.greeting}, {profile.name.split(" ")[0]}
            </h1>
            {totals && (
              <p className="mt-3 text-lg leading-relaxed text-ink-soft">
                {copy.statsLine(totals.checked, totals.scams)}
              </p>
            )}
          </header>

          <section className="mt-10 border-2 border-primary/15 bg-card p-7 sm:p-9">
            <h2 className="font-display text-2xl">{copy.checkInTitle}</h2>
            {checkedInToday ? (
              <div className="mt-4 flex items-start gap-4">
                <span className="seal mt-1 flex size-11 shrink-0 items-center justify-center rounded-full bg-safe text-safe-foreground">
                  <Check className="size-6" />
                </span>
                <div>
                  <p className="font-display text-2xl">{copy.checkInDone}</p>
                  <p className="mt-1 text-lg text-ink-soft">{copy.checkInDoneBody}</p>
                </div>
              </div>
            ) : (
              <>
                <p className="mt-2 text-lg text-ink-soft">{copy.checkInBody}</p>
                <button
                  type="button"
                  onClick={checkIn}
                  disabled={checkingIn || checkedInToday === null}
                  className="mt-6 flex min-h-20 w-full items-center justify-center gap-3 bg-accent px-6 text-2xl font-bold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {checkingIn && <Loader2 className="size-7 animate-spin" />}
                  {copy.checkInButton}
                </button>
                {checkInError && <p role="alert" className="mt-4 border-l-4 border-alarm bg-alarm-soft p-4 text-lg">{checkInError}</p>}
              </>
            )}
          </section>

          <div className="mt-8 grid gap-5">
            <BigChoice
              icon={<MessageSquareWarning className="size-7" />}
              title={copy.checkerTitle}
              onClick={() => setView("check")}
              tone="accent"
            />
            <BigChoice
              icon={<Mic className="size-7" />}
              title={copy.voiceTitle}
              onClick={() => setView("ask")}
              tone="primary"
            />
            <Link
              to="/scam-watch"
              className="group flex min-h-16 items-center gap-5 border-2 border-primary/15 bg-card p-6 text-left transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-accent"
            >
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-safe-soft text-safe">
                <MapPin className="size-7" />
              </span>
              <span className="font-display text-2xl leading-snug sm:text-3xl">Scam Watch — Bengaluru</span>
            </Link>
          </div>

          <footer className="mt-16 border-t border-rule pt-7">
            <p className="text-base text-ink-soft">{copy.safetyCodeLabel}</p>
            <p className="mt-1 font-display text-2xl">{profile.safety_code}</p>
            <p className="mt-2 max-w-md text-base text-ink-soft">{copy.safetyCodeHelp}</p>
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
              className="mt-6 py-2 text-base font-bold text-primary underline decoration-accent decoration-2 underline-offset-4"
            >
              {copy.signOut}
            </button>
          </footer>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setView("home")}
            className="inline-flex items-center gap-2 py-3 text-lg font-bold text-primary underline decoration-accent decoration-2 underline-offset-4"
          >
            <ArrowLeft className="size-5" />
            Back
          </button>
          <div className="mt-8">
            {view === "check" ? (
              <ScamChecker lang={lang} onChecked={() => void loadCheckIn(profile.id)} />
            ) : (
              <VoiceAssistant lang={lang} />
            )}
          </div>
        </>
      )}
    </main>
  );
}

function BigChoice({
  icon,
  title,
  onClick,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  tone: "accent" | "primary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-5 border-2 border-primary/15 bg-card p-7 text-left transition-colors hover:border-accent"
    >
      <span
        className={cn(
          "flex size-14 shrink-0 items-center justify-center rounded-full",
          tone === "accent"
            ? "bg-accent text-accent-foreground"
            : "bg-primary text-primary-foreground",
        )}
      >
        {icon}
      </span>
      <span className="font-display text-2xl leading-snug sm:text-3xl">{title}</span>
    </button>
  );
}
