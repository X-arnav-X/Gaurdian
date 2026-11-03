import { CheckCircle2, HelpCircle, ShieldAlert } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type Verdict = "scam" | "safe" | "unsure";

const STYLES: Record<
  Verdict,
  { wrap: string; badge: string; icon: typeof CheckCircle2; rule: string }
> = {
  scam: {
    wrap: "bg-alarm-soft border-alarm/35",
    badge: "bg-alarm text-alarm-foreground",
    icon: ShieldAlert,
    rule: "bg-alarm/25",
  },
  safe: {
    wrap: "bg-safe-soft border-safe/35",
    badge: "bg-safe text-safe-foreground",
    icon: CheckCircle2,
    rule: "bg-safe/25",
  },
  unsure: {
    wrap: "bg-caution-soft border-caution/40",
    badge: "bg-caution text-caution-foreground",
    icon: HelpCircle,
    rule: "bg-caution/30",
  },
};

export function verdictLabel(verdict: Verdict, lang: Lang) {
  const copy = t(lang);
  return verdict === "scam"
    ? copy.verdictScam
    : verdict === "safe"
      ? copy.verdictSafe
      : copy.verdictUnsure;
}

export function VerdictCard({
  verdict,
  summary,
  redFlags,
  recommendedAction,
  lang,
}: {
  verdict: Verdict;
  summary: string;
  redFlags: string[];
  recommendedAction: string;
  lang: Lang;
}) {
  const copy = t(lang);
  const style = STYLES[verdict];
  const Icon = style.icon;

  return (
    <div role="status" className={cn("verdict-reveal border p-6 sm:p-8", style.wrap)}>
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "mt-1 flex size-11 shrink-0 items-center justify-center rounded-full",
            style.badge,
          )}
          aria-hidden="true"
        >
          <Icon className="size-6" />
        </span>
        <div>
          <h3 className="font-display text-2xl leading-tight sm:text-3xl">
            {verdictLabel(verdict, lang)}
          </h3>
          <p className="mt-2 text-lg leading-relaxed">{summary}</p>
        </div>
      </div>

      {redFlags.length > 0 && (
        <div className="mt-7">
          <div className={cn("mb-4 h-px w-full", style.rule)} />
          <h4 className="font-display text-lg">{copy.redFlags}</h4>
          <ul className="mt-3 space-y-2.5">
            {redFlags.map((flag) => (
              <li key={flag} className="flex gap-3 text-lg leading-relaxed">
                <span className="mt-2.5 size-2 shrink-0 rounded-full bg-foreground/45" />
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-7">
        <div className={cn("mb-4 h-px w-full", style.rule)} />
        <h4 className="font-display text-lg">{copy.whatToDo}</h4>
        <p className="mt-2 text-lg leading-relaxed">{recommendedAction}</p>
      </div>
    </div>
  );
}
