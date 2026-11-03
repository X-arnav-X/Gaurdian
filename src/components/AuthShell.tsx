import { Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { APP_NAME } from "@/lib/brand";

export function AuthShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="page-enter mx-auto min-h-screen w-full max-w-xl px-6 py-12 sm:px-10 sm:py-20">
      <Link
        to="/"
        className="inline-flex items-center gap-2 py-2 text-lg font-bold text-primary underline decoration-accent decoration-2 underline-offset-4"
      >
        <ArrowLeft className="size-5" />
        Back
      </Link>
      <p className="mt-10 font-display text-lg text-accent-foreground/70">{APP_NAME}</p>
      <h1 className="mt-2 text-4xl leading-tight sm:text-5xl">{title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-soft">{intro}</p>
      <div className="mt-10">{children}</div>
    </main>
  );
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  hint,
  placeholder,
  error,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  hint?: string;
  placeholder?: string;
  error?: string;
  onBlur?: () => void;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div>
      <label htmlFor={id} className="block text-lg font-bold">
        {label}
      </label>
      {hint && <p className="mt-1 text-base text-ink-soft">{hint}</p>}
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`tap-target mt-2 w-full border-2 bg-card px-5 text-lg text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none ${error ? "border-alarm" : "border-rule"}`}
      />
      {error && <p id={`${id}-error`} className="mt-2 text-base text-alarm" role="alert">{error}</p>}
    </div>
  );
}

export function SubmitButton({
  busy,
  label,
  busyLabel,
}: {
  busy: boolean;
  label: string;
  busyLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="tap-target flex w-full items-center justify-center gap-3 bg-accent px-6 text-xl font-bold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
    >
      {busy && <Loader2 className="size-6 animate-spin" />}
      {busy ? busyLabel : label}
    </button>
  );
}
