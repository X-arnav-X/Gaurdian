import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { signUpSenior } from "@/lib/auth";
import { APP_NAME } from "@/lib/brand";
import { LANGUAGES, type Lang } from "@/lib/i18n";
import { AuthShell, Field, SubmitButton } from "@/components/AuthShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/signup/senior")({
  head: () => ({
    meta: [
      { title: `Create your account — ${APP_NAME}` },
      {
        name: "description",
        content:
          "Create an account to check whether a message is a scam, ask questions out loud, and let your family know you're okay.",
      },
      { property: "og:title", content: `Create your account — ${APP_NAME}` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Check messages, ask questions out loud, and share a daily check-in with family.",
      },
    ],
  }),
  component: SeniorSignup,
});

function SeniorSignup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState<Lang>("en");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [safetyCode, setSafetyCode] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const nameError = touched["name"] && name.trim().length < 2 ? "Please enter your name." : "";
  const usernameError = touched["username"] && !/^[a-zA-Z0-9_]{3,24}$/.test(username.trim())
    ? "Use 3–24 letters, numbers or underscores."
    : "";
  const passwordError = touched["password"] && password.length < 6 ? "Choose at least 6 characters." : "";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ name: true, username: true, password: true });
    if (name.trim().length < 2 || !/^[a-zA-Z0-9_]{3,24}$/.test(username.trim()) || password.length < 6) return;
    setBusy(true);
    setError(null);
    try {
      const { safetyCode: code } = await signUpSenior({ name, username, password, language });
      setSafetyCode(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the account.");
    } finally {
      setBusy(false);
    }
  };

  if (safetyCode) {
    return (
      <AuthShell
        title="Your account is ready"
        intro="This is your safety code. Read it out to the family member who will look in on you — they'll need it once, when they create their account."
      >
        <div className="border-2 border-accent bg-card p-8 text-center">
          <p className="text-lg text-ink-soft">Your safety code</p>
          <p className="mt-3 font-display text-5xl tracking-wide sm:text-6xl">{safetyCode}</p>
        </div>
        <p className="mt-6 text-lg leading-relaxed text-ink-soft">
          You can find this code again at the bottom of your home screen, any time.
        </p>
        <button
          type="button"
          onClick={() => void navigate({ to: "/senior" })}
          className="tap-target mt-8 w-full bg-accent px-6 text-xl font-bold text-accent-foreground transition-opacity hover:opacity-90"
        >
          Take me to my home screen
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Let's set you up"
      intro="Four short questions, and you're done. Nothing you check is ever shown to anyone."
    >
      <form onSubmit={submit} className="space-y-6">
        <Field label="Your name" value={name} onChange={setName} autoComplete="name" error={nameError} onBlur={() => setTouched((state) => ({ ...state, name: true }))} />
        <Field
          label="Username"
          hint="Anything you'll remember — no email needed."
          value={username}
          onChange={setUsername}
          autoComplete="username"
          error={usernameError}
          onBlur={() => setTouched((state) => ({ ...state, username: true }))}
        />
        <Field
          label="Password"
          hint="At least 6 characters."
          value={password}
          onChange={setPassword}
          type="password"
          autoComplete="new-password"
          error={passwordError}
          onBlur={() => setTouched((state) => ({ ...state, password: true }))}
        />

        <div>
          <p className="text-lg font-bold">Which language would you like?</p>
          <div className="mt-3 grid gap-3">
            {LANGUAGES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setLanguage(option.value)}
                aria-pressed={language === option.value}
                className={cn(
                  "tap-target border-2 px-5 text-left text-lg font-bold transition-colors",
                  language === option.value
                    ? "border-accent bg-accent/15"
                    : "border-rule bg-card hover:border-primary/30",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="border-l-4 border-alarm bg-alarm-soft p-4 text-lg">
            {error}
          </p>
        )}

        <SubmitButton busy={busy} label="Create my account" busyLabel="Setting things up…" />
      </form>

      <p className="mt-8 text-lg">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-bold text-primary underline decoration-accent decoration-2 underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
