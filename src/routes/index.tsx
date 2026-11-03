import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { MapPin, MessageSquareWarning, Mic, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isDemoActive } from "@/lib/demo/demo-session";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { useSession } from "@/hooks/useSession";
import { ScamWatchMapFrame } from "@/components/ScamWatchMapFrame";
import { Skeleton } from "@/components/Skeleton";
import { fetchAreaReports, fetchPlatformStats } from "@/lib/scam-watch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${APP_NAME} — a calm second opinion before your parent taps "yes"` },
      {
        name: "description",
        content:
          `${APP_NAME} tells an older adult in plain English, Hindi or Kannada whether a message is a scam — and lets their family know they're okay, without reading anything private.`,
      },
      {
        property: "og:title",
        content: `${APP_NAME} — a calm second opinion before your parent taps "yes"`,
      },
      {
        property: "og:description",
        content:
          "Paste a message, get a straight answer. Family sees the daily check-in, never the messages. Plus a live map of scam reports across Bengaluru.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { profile, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    // Demo mode keeps the visitor on public pages; the demo household is
    // entered deliberately from the sign-in page.
    if (loading || !profile || isDemoActive()) return;
    void navigate({ to: profile.role === "senior" ? "/senior" : "/family" });
  }, [loading, profile, navigate]);

  const areas = useQuery({
    queryKey: ["scam-watch", "areas", "week"],
    queryFn: () => fetchAreaReports("week"),
  });
  const stats = useQuery({ queryKey: ["insights", "stats"], queryFn: fetchPlatformStats });

  return (
    <div className="page-enter min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-6 sm:px-8">
        <p className="font-display text-xl">{APP_NAME}</p>
        <nav className="flex flex-wrap items-center gap-x-7 gap-y-2 text-base">
          <Link to="/scam-watch" className="py-1 font-bold text-primary hover:text-accent-foreground">
            Scam Watch
          </Link>
          <Link to="/insights" className="py-1 font-bold text-primary hover:text-accent-foreground">
            Insights
          </Link>
        </nav>
        <Link
          to="/login"
          className="ml-auto py-1 text-base font-bold text-primary underline decoration-accent decoration-2 underline-offset-4"
        >
          Sign in
        </Link>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="landing-hero relative overflow-hidden bg-primary text-primary-foreground">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pt-12 pb-20 sm:px-8 md:grid-cols-[0.95fr_1.05fr] md:gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-20">
        <div className="rise">
          <h1 className="max-w-xl text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">{APP_TAGLINE}</h1>
          <p className="mt-6 max-w-lg text-xl leading-relaxed text-primary-foreground/80">
              Your mother forwards you a message asking her to update her KYC today. We answer
            her in seconds, in her own language — and you can see she's okay without reading a word
            she wrote.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              to="/signup/senior"
              className="flex min-h-16 items-center bg-accent px-7 text-lg font-bold text-accent-foreground transition-opacity hover:opacity-90"
            >
              Try it as a senior
            </Link>
            <Link
              to="/signup/family"
              className="flex min-h-16 items-center border-2 border-primary-foreground/60 px-7 text-lg font-bold text-primary-foreground transition-colors hover:bg-primary-foreground hover:text-primary"
            >
              Try it as family
            </Link>
          </div>

          <p className="mt-6 max-w-md text-base text-primary-foreground/70">
            No card, no KYC, nothing to install. English, हिन्दी and ಕನ್ನಡ.
          </p>
          <p className="mt-3 text-base text-primary-foreground/80">
            In a hurry?{" "}
            <Link
              to="/login"
              className="font-bold text-primary-foreground underline decoration-accent decoration-2 underline-offset-4"
            >
              Try the built-in demo
            </Link>{" "}
            — example messages, no signup.
          </p>
        </div>

        <div className="relative">
          <div className="hero-map-frame overflow-hidden border-2 border-accent/50 bg-card">
            <ScamWatchMapFrame
              areas={areas.data ?? []}
              window="week"
              quiet
              className="h-[21rem] sm:h-[26rem]"
            />
          </div>
          <div className="mt-4 flex items-start gap-3">
            <span className="relative mt-1.5 flex size-3 shrink-0 items-center justify-center">
              <span className="live-ring absolute size-3 rounded-full bg-alarm/70" />
              <span className="size-2 rounded-full bg-alarm" />
            </span>
            <p className="text-base leading-relaxed text-primary-foreground/80">
              Live Scam Watch — scam reports across Bengaluru this week, counted by neighbourhood and
              never tied to a person.{" "}
              <Link
                to="/scam-watch"
                className="font-bold text-primary-foreground underline decoration-accent decoration-2 underline-offset-4"
              >
                Open the map
              </Link>
            </p>
          </div>
          {areas.data?.some((area) => area.isDemo) && <p className="mt-2 pl-6 text-sm text-primary-foreground/65">Illustrative Bengaluru preview data</p>}
        </div>
      </div>
      </section>

      {/* ---------- Stats strip ---------- */}
      <section className="border-y-2 border-primary/15 bg-secondary/60">
        <div className="mx-auto grid w-full max-w-6xl gap-x-10 gap-y-8 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          <StatStrip
            label="scams caught for families"
            value={stats.data?.scams}
            pending={stats.isPending}
          />
          <StatStrip
            label="messages given a straight answer"
            value={stats.data?.checks}
            pending={stats.isPending}
          />
          <StatStrip
            label="reports on the map this month"
            value={stats.data?.reports_month}
            pending={stats.isPending}
          />
          <StatStrip
            label="Bengaluru neighbourhoods covered"
            value={stats.data?.areas_covered}
            pending={stats.isPending}
          />
        </div>
        {stats.data?.isDemo && <p className="mx-auto max-w-6xl px-5 pb-5 text-sm text-ink-soft sm:px-8">Illustrative preview figures until live usage data is available.</p>}
      </section>

      {/* ---------- The problem ---------- */}
      <section className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8">
        <h2 className="text-3xl leading-tight sm:text-4xl">
          The message arrived at 4pm. The call came at 4.02.
        </h2>
        <div className="mt-7 space-y-5 text-xl leading-relaxed">
          <p>
            Sarala is 71 and lives in Jayanagar. Her son is in Pune. The message said her bank
            account would be blocked by evening unless she completed her KYC, and gave a number to
            call.
          </p>
          <p>
            The man who answered was polite, knew her bank's name, and stayed on the line while he
            talked her towards a six-digit code. She almost read it out. What stopped her was a
            hesitation — and nobody in the house to ask.
          </p>
          <p className="text-ink-soft">
            Her son found out four days later, over a phone call, in passing. That gap — between a
            parent alone with a convincing message and a child who finds out afterwards — is what
            {APP_NAME} closes.
          </p>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="border-t-2 border-primary/15 bg-card">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
          <h2 className="max-w-xl text-3xl leading-tight sm:text-4xl">
            Four things, and nothing else to learn
          </h2>
          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <Step
              n="01"
              icon={<MessageSquareWarning className="size-6" />}
              title="She pastes the message"
              body="Or photographs it. One big box, one big button that says exactly what it does: Check this message."
            />
            <Step
              n="02"
              icon={<ShieldCheck className="size-6" />}
              title="She gets a straight answer"
              body="Scam, safe or unsure — with the specific things that gave it away, and one concrete next step. Calm wording, never alarming."
            />
            <Step
              n="03"
              icon={<Mic className="size-6" />}
              title="Or she just asks out loud"
              body="A microphone button, a spoken question, a short spoken reply in her language. No typing, no menus."
            />
            <Step
              n="04"
              icon={<MapPin className="size-6" />}
              title="Family sees she's okay"
              body="A daily check-in, a count of what's been caught, and a one-line summary of each. Never the messages themselves."
            />
          </ol>
        </div>
      </section>

      {/* ---------- Why now ---------- */}
      <section className="mx-auto w-full max-w-5xl px-5 py-20 sm:px-8">
        <h2 className="max-w-2xl text-3xl leading-tight sm:text-4xl">Why this, and why now</h2>
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="text-xl leading-snug">India is ageing while families spread out</h3>
            <p className="mt-3 text-lg leading-relaxed text-ink-soft">
              The over-60 population is growing faster than any other age group, and their adult
              children increasingly work in another city or another country. The person who would
              have been asked "is this real?" is no longer in the next room.
            </p>
          </div>
          <div>
            <h3 className="text-xl leading-snug">Scams moved to the phone they just learned</h3>
            <p className="mt-3 text-lg leading-relaxed text-ink-soft">
              UPI, KYC renewals and digital-arrest calls arrived on devices adopted late and quickly.
              Fraud is now scripted, translated and industrial — and it targets exactly this gap in
              confidence.
            </p>
          </div>
          <div>
            <h3 className="text-xl leading-snug">Elder-care apps solve loneliness, not fraud</h3>
            <p className="mt-3 text-lg leading-relaxed text-ink-soft">
              Companionship apps, medicine reminders and emergency buttons all assume the danger is
              physical. None of them answer the one question an older adult actually asks in the
              moment, in their own language, on the message in front of them.
            </p>
          </div>
        </div>
        <Link
          to="/insights"
          className="mt-10 inline-block py-2 text-base font-bold text-primary underline decoration-accent decoration-2 underline-offset-4"
        >
          See how the service is being used
        </Link>
      </section>

      {/* ---------- Contact ---------- */}
      <footer className="border-t-2 border-primary/15 bg-primary text-primary-foreground">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="font-display text-2xl">{APP_NAME}</p>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-primary-foreground/80">
              Want a walkthrough, or the data behind the map? Leave a note and we'll reply.
            </p>
            <p className="mt-8 text-base text-primary-foreground/60">
              {APP_NAME} never asks for a payment, a card or an identity document. Messages a senior
              checks are never shown to anyone else.
            </p>
          </div>
          <DemoForm />
        </div>
      </footer>
    </div>
  );
}

function StatStrip({
  label,
  value,
  pending,
}: {
  label: string;
  value: number | undefined;
  pending: boolean;
}) {
  return (
    <div>
      {pending ? (
        <Skeleton className="h-9 w-24" />
      ) : (
        <p className="font-display text-4xl leading-none">
          {(value ?? 0).toLocaleString("en-IN")}
        </p>
      )}
      <p className="mt-3 text-base leading-snug text-ink-soft">{label}</p>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  body,
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li>
      <div className="flex items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          {icon}
        </span>
        <span className="font-display text-2xl text-ink-soft/60">{n}</span>
      </div>
      <h3 className="mt-5 text-xl leading-snug">{title}</h3>
      <p className="mt-2.5 text-lg leading-relaxed text-ink-soft">{body}</p>
    </li>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function DemoForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [failure, setFailure] = useState("");

  const nameError = name.trim().length < 2 ? "Please enter your name." : "";
  const emailError = !email.trim()
    ? "Please enter an email we can reply to."
    : EMAIL.test(email.trim())
      ? ""
      : "That email address looks incomplete — check for a missing @ or dot.";
  const messageError = touched["message"] && message.length > 1000 ? "Please keep your note under 1,000 characters." : "";

  if (sent) {
    return (
      <div className="seal border-2 border-accent/60 bg-primary-foreground/5 p-8">
        <h3 className="font-display text-2xl">Thank you — it's with us</h3>
        <p className="mt-3 text-lg leading-relaxed text-primary-foreground/80">
          We'll reply to {email.trim()} within a day or two.
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        setTouched({ name: true, email: true });
        if (nameError || emailError || message.length > 1000) return;
        setSending(true);
        setFailure("");
        const { error } = await supabase.from("demo_requests").insert({
          name: name.trim(),
          email: email.trim(),
          message: message.trim() || null,
        });
        setSending(false);
        if (error) {
          setFailure("That didn't send — your connection may have dropped. Please try once more.");
          return;
        }
        setSent(true);
      }}
      className="border-2 border-primary-foreground/25 p-7 sm:p-8"
    >
      <h3 className="font-display text-2xl">Request a demo</h3>
      <div className="mt-6 space-y-5">
        <FooterField
          label="Your name"
          value={name}
          onChange={setName}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          error={touched["name"] ? nameError : ""}
        />
        <FooterField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={touched["email"] ? emailError : ""}
        />
        <label className="block">
          <span className="text-base">What would you like to see? (optional)</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, message: true }))}
            maxLength={1000}
            aria-invalid={messageError ? true : undefined}
            rows={3}
            className={cn("mt-2 w-full border-2 bg-transparent px-4 py-3 text-lg text-primary-foreground placeholder:text-primary-foreground/40 focus:border-accent focus:outline-none", messageError ? "border-accent" : "border-primary-foreground/30")}
            placeholder="A walkthrough of the senior screen, the map data, anything."
          />
          {messageError && <span className="mt-2 block text-base">{messageError}</span>}
        </label>
      </div>
      {failure && (
        <p className="mt-5 border-l-4 border-accent pl-4 text-base leading-relaxed">{failure}</p>
      )}
      <button
        type="submit"
        disabled={sending}
        className="mt-7 min-h-14 w-full bg-accent px-6 text-lg font-bold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send this"}
      </button>
    </form>
  );
}

function FooterField({
  label,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-base">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        className={cn(
          "mt-2 min-h-14 w-full border-2 bg-transparent px-4 text-lg text-primary-foreground focus:outline-none",
          error ? "border-accent" : "border-primary-foreground/30 focus:border-accent",
        )}
      />
      {error && <span className="mt-2 block text-base">{error}</span>}
    </label>
  );
}
