import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { signUpFamily } from "@/lib/auth";
import { APP_NAME } from "@/lib/brand";
import { AuthShell, Field, SubmitButton } from "@/components/AuthShell";

export const Route = createFileRoute("/signup/family")({
  head: () => ({
    meta: [
      { title: `Look in on a parent — ${APP_NAME}` },
      {
        name: "description",
        content:
          "Create a family account with the safety code your parent shared. You'll see their daily check-in and what's been caught, never their messages.",
      },
      { property: "og:title", content: `Look in on a parent — ${APP_NAME}` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Peace of mind without reading anything private.",
      },
    ],
  }),
  component: FamilySignup,
});

function FamilySignup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [safetyCode, setSafetyCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const nameError = touched["name"] && name.trim().length < 2 ? "Please enter your name." : "";
  const usernameError = touched["username"] && !/^[a-zA-Z0-9_]{3,24}$/.test(username.trim())
    ? "Use 3–24 letters, numbers or underscores."
    : "";
  const passwordError = touched["password"] && password.length < 6 ? "Choose at least 6 characters." : "";
  const codeError = touched["code"] && !/^[A-Za-z]{3,12}-\d{4}$/.test(safetyCode.trim())
    ? "Enter the code in the format SUN-4821."
    : "";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ name: true, username: true, password: true, code: true });
    if (
      name.trim().length < 2 ||
      !/^[a-zA-Z0-9_]{3,24}$/.test(username.trim()) ||
      password.length < 6 ||
      !/^[A-Za-z]{3,12}-\d{4}$/.test(safetyCode.trim())
    ) return;
    setBusy(true);
    setError(null);
    try {
      await signUpFamily({ name, username, password, safetyCode });
      await navigate({ to: "/family" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the account.");
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Look in on a parent"
      intro="You'll see their daily check-in and a summary of anything suspicious they checked. You will never see the messages themselves — that stays private to them."
    >
      <form onSubmit={submit} className="space-y-6">
        <Field label="Your name" value={name} onChange={setName} autoComplete="name" error={nameError} onBlur={() => setTouched((state) => ({ ...state, name: true }))} />
        <Field label="Username" value={username} onChange={setUsername} autoComplete="username" error={usernameError} onBlur={() => setTouched((state) => ({ ...state, username: true }))} />
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
        <Field
          label="Their safety code"
          hint="The short code your parent read out to you, like SUN-4821."
          placeholder="SUN-4821"
          value={safetyCode}
          onChange={setSafetyCode}
          error={codeError}
          onBlur={() => setTouched((state) => ({ ...state, code: true }))}
        />

        {error && (
          <p role="alert" className="border-l-4 border-alarm bg-alarm-soft p-4 text-lg">
            {error}
          </p>
        )}

        <SubmitButton busy={busy} label="Link my account" busyLabel="Linking…" />
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
