import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mic, Send, Volume2 } from "lucide-react";
import { askCompanion } from "@/lib/guardian.functions";
import { mockAnswer } from "@/lib/demo/mock-ai";
import { updateDemo, useDemoSession } from "@/lib/demo/demo-session";
import { speechLocale, t, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Turn = { id: string; from: "senior" | "companion"; text: string };

const VOICE_CASES: { id: string; label: string; question: string }[] = [
  { id: "upi", label: "Is this UPI request real?", question: "Is this UPI request real?" },
  { id: "block", label: "How do I block a number?", question: "How do I block a number that keeps calling?" },
  { id: "otp", label: "Someone asked for my OTP", question: "Someone from my bank asked for my OTP. What should I do?" },
  { id: "courier", label: "Parcel customs fee", question: "A courier is asking for a customs fee before delivery. Is that right?" },
  { id: "police", label: "Caller says police will arrest me", question: "A caller says police will arrest me unless I pay. What do I do?" },
  { id: "lpg", label: "Cylinder booking fee", question: "My gas cylinder booking asks for an extra fee first. Is that okay?" },
];

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"] ?? null) as
    | (new () => SpeechRecognitionLike)
    | null;
}

export function VoiceAssistant({ lang }: { lang: Lang }) {
  const copy = t(lang);
  const ask = useServerFn(askCompanion);
  const demo = useDemoSession();
  const isDemo = demo !== null;

  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [typed, setTyped] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const recognition = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(getRecognition() !== null);
    return () => {
      recognition.current?.stop();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLocale(lang);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const send = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || thinking) return;
    setError(null);
    setTyped("");
    setTurns((prev) => [...prev, { id: crypto.randomUUID(), from: "senior", text: trimmed }]);
    setThinking(true);
    if (isDemo) {
      // Demo mode: answer locally from built-in keyword rules.
      await new Promise((resolve) => setTimeout(resolve, 800));
      const answer = mockAnswer(trimmed);
      setTurns((prev) => [
        ...prev,
        { id: crypto.randomUUID(), from: "companion", text: answer },
      ]);
      speak(answer);
      updateDemo((state) => {
        state.queries.push({
          id: `demo-query-${Date.now()}`,
          question: trimmed,
          answer,
          createdAt: new Date().toISOString(),
        });
      });
      setThinking(false);
      return;
    }
    try {
      const data = await ask({ data: { question: trimmed, lang } });
      setTurns((prev) => [
        ...prev,
        { id: crypto.randomUUID(), from: "companion", text: data.answer },
      ]);
      speak(data.answer);
    } catch (err) {
      setError("I couldn't get an answer just now. Please try again when your connection is steady.");
    } finally {
      setThinking(false);
    }
  };

  const listen = () => {
    const Recognition = getRecognition();
    if (!Recognition) {
      setSupported(false);
      return;
    }
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const instance = new Recognition();
    recognition.current = instance;
    instance.lang = speechLocale(lang);
    instance.interimResults = false;
    instance.continuous = false;
    instance.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) void send(transcript);
    };
    instance.onerror = () => {
      setListening(false);
      setError(copy.voiceUnsupported);
    };
    instance.onend = () => setListening(false);
    setError(null);
    setListening(true);
    instance.start();
  };

  return (
    <div>
      <h2 className="font-display text-3xl leading-snug sm:text-4xl">{copy.voiceTitle}</h2>
      <p className="mt-3 max-w-xl text-lg leading-relaxed text-ink-soft">{copy.voiceBody}</p>

      <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={listen}
          disabled={thinking}
          aria-label={listening ? copy.voiceListening : copy.voiceStart}
          className={cn(
            "flex size-28 shrink-0 items-center justify-center rounded-full transition-transform disabled:opacity-40",
            listening
              ? "scale-105 bg-primary text-primary-foreground animate-pulse"
              : "bg-accent text-accent-foreground hover:scale-[1.03]",
          )}
        >
          <Mic className="size-12" />
        </button>
        <p className="text-xl font-bold">
          {thinking ? copy.voiceThinking : listening ? copy.voiceListening : copy.voiceStart}
        </p>
      </div>

      {!supported && (
        <p className="mt-5 border-l-4 border-caution bg-caution-soft p-4 text-lg">
          {copy.voiceUnsupported}
        </p>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(typed);
        }}
        className="mt-6 flex gap-3"
      >
        <input
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          placeholder={copy.checkerPlaceholder}
          aria-label={copy.voiceTitle}
          className="tap-target min-w-0 flex-1 border-2 border-rule bg-card px-5 text-lg text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={!typed.trim() || thinking}
          aria-label={copy.voiceStart}
          className="tap-target flex w-16 items-center justify-center border-2 border-primary/25 text-primary disabled:opacity-40"
        >
          {thinking ? <Loader2 className="size-6 animate-spin" /> : <Send className="size-6" />}
        </button>
      </form>

      {isDemo && (
        <div className="mt-7 border-2 border-dashed border-accent/60 bg-card p-5 sm:p-6">
          <p className="font-display text-xl">Try a question</p>
          <p className="mt-1 text-base leading-relaxed text-ink-soft">
            Demo answers are built into the app — nothing is sent anywhere.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {VOICE_CASES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void send(item.question)}
                disabled={thinking}
                className="border-2 border-rule px-4 py-2.5 text-base font-bold text-primary transition-colors hover:border-accent disabled:opacity-40"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-5 border-l-4 border-alarm bg-alarm-soft p-4 text-lg">
          {error}
        </p>
      )}

      {turns.length > 0 && (
        <div className="mt-8 space-y-5">
          {turns.map((turn) =>
            turn.from === "senior" ? (
              <p key={turn.id} className="border-l-4 border-rule pl-5 text-lg text-ink-soft">
                {turn.text}
              </p>
            ) : (
              <div key={turn.id} className="border border-rule bg-card p-5">
                <p className="text-lg leading-relaxed">{turn.text}</p>
                <button
                  type="button"
                  onClick={() => speak(turn.text)}
                  className="mt-4 flex items-center gap-2 py-2 text-base font-bold text-primary underline decoration-accent decoration-2 underline-offset-4"
                >
                  <Volume2 className="size-5" />
                  Read this out again
                </button>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
