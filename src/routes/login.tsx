import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signIn } from "@/lib/auth";
import { enterDemo } from "@/lib/demo/demo-session";
import { APP_NAME } from "@/lib/brand";
import { AuthShell, Field, SubmitButton } from "@/components/AuthShell";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: `Sign in — ${APP_NAME}` },
      {
        name: "description",
        content: `Sign in to ${APP_NAME} with your username and password to check messages or look in on a parent.`,
      },
      { property: "og:title", content: `Sign in — ${APP_NAME}` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Sign in with your username and password.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const usernameError = touched["username"] && !username.trim() ? "Enter your username." : "";
  const passwordError = touched["password"] && !password ? "Enter your password." : "";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ username: true, password: true });
    if (!username.trim() || !password) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(username, password);
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id;
      const { data: profile } = id
        ? await supabase.from("profiles").select("role").eq("id", id).maybeSingle()
        : { data: null };
      await navigate({ to: profile?.role === "family" ? "/family" : "/senior" });
    } catch (err) {
      setError("We couldn't sign you in just now. Check your username and password, then try again.");
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" intro="Sign in with the username and password you chose.">
      <form onSubmit={submit} className="space-y-6">
        <Field label="Username" value={username} onChange={setUsername} autoComplete="username" error={usernameError} onBlur={() => setTouched((state) => ({ ...state, username: true }))} />
        <Field
          label="Password"
          value={password}
          onChange={setPassword}
          type="password"
          autoComplete="current-password"
          error={passwordError}
          onBlur={() => setTouched((state) => ({ ...state, password: true }))}
        />
        {error && (
          <p role="alert" className="border-l-4 border-alarm bg-alarm-soft p-4 text-lg">
            {error}
          </p>
        )}
        <SubmitButton busy={busy} label="Sign in" busyLabel="Signing in…" />
      </form>

      <p className="mt-8 text-lg">
        New here?{" "}
        <Link
          to="/"
          className="font-bold text-primary underline decoration-accent decoration-2 underline-offset-4"
        >
          Create an account
        </Link>
      </p>

      <div className="mt-10 border-t-2 border-rule pt-8">
        <p className="font-display text-xl">Just looking?</p>
        <p className="mt-1 text-base leading-relaxed text-ink-soft">
          Open a ready-made demo with example messages and saved history. No account is created and
          nothing is saved anywhere.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={async () => {
              enterDemo("senior");
              await navigate({ to: "/senior" });
            }}
            className="tap-target min-h-14 border-2 border-primary/25 px-6 text-lg font-bold text-primary transition-colors hover:bg-primary/5"
          >
            Try the demo as a senior
          </button>
          <button
            type="button"
            onClick={async () => {
              enterDemo("family");
              await navigate({ to: "/family" });
            }}
            className="tap-target min-h-14 border-2 border-primary/25 px-6 text-lg font-bold text-primary transition-colors hover:bg-primary/5"
          >
            Try the demo as family
          </button>
        </div>
      </div>
    </AuthShell>
  );
}
