import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Loader2, X } from "lucide-react";
import { checkMessage } from "@/lib/guardian.functions";
import { analyzeMock, EXAMPLE_CASES } from "@/lib/demo/mock-ai";
import { updateDemo, useDemoSession } from "@/lib/demo/demo-session";
import { t, type Lang } from "@/lib/i18n";
import { VerdictCard, type Verdict } from "./VerdictCard";

type Result = {
  verdict: Verdict;
  summary: string;
  redFlags: string[];
  recommendedAction: string;
};

export function ScamChecker({ lang, onChecked }: { lang: Lang; onChecked: () => void }) {
  const copy = t(lang);
  const run = useServerFn(checkMessage);
  const fileInput = useRef<HTMLInputElement>(null);
  const demo = useDemoSession();
  const isDemo = demo !== null;

  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const pickImage = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a picture file, such as a photo or screenshot.");
      return;
    }
    if (file.size === 0) {
      setError("That picture looks empty. Please choose another one.");
      return;
    }
    if (file.size > 6_000_000) {
      setError("That picture is too large. Please try a smaller one.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setError("We couldn't open that picture. Please try another one.");
    reader.onload = () => {
      setImage(typeof reader.result === "string" ? reader.result : null);
      setError(null);
    };
    reader.onabort = () => setError("That picture wasn't added. Please choose it again.");
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!text.trim() && !image) return;
    setBusy(true);
    setError(null);
    if (isDemo) {
      // Demo mode: answer locally from the built-in example rules.
      await new Promise((resolve) => setTimeout(resolve, 700));
      const analysis = analyzeMock(text, Boolean(image));
      updateDemo((state) => {
        state.checks.push({
          id: `demo-check-${Date.now()}`,
          verdict: analysis.verdict,
          category: analysis.category,
          confidence: analysis.confidence,
          summary: analysis.summary,
          redFlags: analysis.redFlags,
          recommendedAction: analysis.recommendedAction,
          inputType: image ? "screenshot" : "text",
          createdAt: new Date().toISOString(),
        });
      });
      setResult({
        verdict: analysis.verdict,
        summary: analysis.summary,
        redFlags: analysis.redFlags,
        recommendedAction: analysis.recommendedAction,
      });
      onChecked();
      setBusy(false);
      return;
    }
    try {
      const data = await run({
        data: { text: text.trim() || undefined, imageDataUrl: image ?? undefined, lang },
      });
      setResult({
        verdict: data.verdict,
        summary: data.summary,
        redFlags: data.redFlags,
        recommendedAction: data.recommendedAction,
      });
      onChecked();
    } catch (err) {
      setError("We couldn't check that just now. Your message is still private — please try again when your connection is steady.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setResult(null);
    setText("");
    setImage(null);
    setError(null);
  };

  if (result) {
    return (
      <div>
        <VerdictCard {...result} lang={lang} />
        <button
          type="button"
          onClick={reset}
          className="tap-target mt-6 w-full border-2 border-primary/25 px-6 text-lg font-bold text-primary transition-colors hover:bg-primary/5"
        >
          {copy.checkAnother}
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-3xl leading-snug sm:text-4xl">{copy.checkerTitle}</h2>
      <p className="mt-3 max-w-xl text-lg leading-relaxed text-ink-soft">{copy.checkerBody}</p>

      {isDemo && (
        <div className="mt-7 border-2 border-dashed border-accent/60 bg-card p-5 sm:p-6">
          <p className="font-display text-xl">Try an example</p>
          <p className="mt-1 text-base leading-relaxed text-ink-soft">
            In demo mode nothing is sent anywhere — tap a card and the answer is worked out on this
            device.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {EXAMPLE_CASES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setText(item.message);
                  setImage(null);
                  setError(null);
                }}
                className="border-2 border-rule px-4 py-2.5 text-base font-bold text-primary transition-colors hover:border-accent"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={copy.checkerPlaceholder}
        rows={6}
        aria-label={copy.checkerTitle}
        className="mt-6 w-full resize-y border-2 border-rule bg-card p-5 text-lg leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
      />

      {image ? (
        <div className="mt-4 flex items-start gap-4 border border-rule bg-card p-4">
          <img src={image} alt="" className="h-24 w-24 object-cover" />
          <button
            type="button"
            onClick={() => setImage(null)}
            className="flex items-center gap-2 py-2 text-lg font-bold text-primary underline decoration-accent decoration-2 underline-offset-4"
          >
            <X className="size-5" />
            {copy.removeImage}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="mt-4 flex items-center gap-3 py-3 text-lg font-bold text-primary underline decoration-accent decoration-2 underline-offset-4"
        >
          <ImagePlus className="size-6" />
          {copy.attachImage}
        </button>
      )}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => pickImage(event.target.files?.[0])}
      />

      {error && (
        <p role="alert" className="mt-5 border-l-4 border-alarm bg-alarm-soft p-4 text-lg">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={busy || (!text.trim() && !image)}
        className="tap-target mt-6 flex w-full items-center justify-center gap-3 bg-accent px-6 text-xl font-bold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {busy && <Loader2 className="size-6 animate-spin" />}
        {busy ? copy.checkerWorking : copy.checkerButton}
      </button>
    </div>
  );
}
