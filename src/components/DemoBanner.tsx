import { useNavigate } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { exitDemo, useDemoSession } from "@/lib/demo/demo-session";

export function DemoBanner() {
  const demo = useDemoSession();
  const navigate = useNavigate();
  if (!demo) return null;

  return (
    <div className="page-enter mb-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-2 border-accent/60 bg-card px-5 py-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <FlaskConical className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg leading-snug">
          Demo mode — you're signed in as {demo.role === "senior" ? demo.senior.name : demo.family.name}
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">
          Example cases only. Nothing is created, sent or saved anywhere — messages here never
          reach the AI service or the database.
        </p>
      </div>
      <button
        type="button"
        onClick={async () => {
          exitDemo();
          await navigate({ to: "/login" });
        }}
        className="min-h-11 border-2 border-primary/25 px-4 text-base font-bold text-primary transition-colors hover:bg-primary/5"
      >
        Exit demo
      </button>
    </div>
  );
}
