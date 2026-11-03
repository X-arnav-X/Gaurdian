import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Lang } from "./i18n";

type AnalyseInput = {
  text?: string | undefined;
  imageDataUrl?: string | undefined;
  lang: Lang;
};


const LANGS: Lang[] = ["en", "hi", "kn"];

function normaliseLang(value: unknown): Lang {
  return LANGS.includes(value as Lang) ? (value as Lang) : "en";
}

export const checkMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown): AnalyseInput => {
    const raw = (data ?? {}) as Record<string, unknown>;
    const text = typeof raw["text"] === "string" ? raw["text"] : undefined;
    const imageDataUrl =
      typeof raw["imageDataUrl"] === "string" && raw["imageDataUrl"].startsWith("data:image/")
        ? raw["imageDataUrl"]
        : undefined;
    if (!text?.trim() && !imageDataUrl) {
      throw new Error("Please paste a message or add a picture first.");
    }
    if (imageDataUrl && imageDataUrl.length > 8_000_000) {
      throw new Error("That picture is too large. Please try a smaller one.");
    }
    return { text, imageDataUrl, lang: normaliseLang(raw["lang"]) };
  })
  .handler(async ({ data, context }) => {
    const { analyseSuspiciousMessage, GatewayError, gatewayUserMessage } = await import(
      "./scam-ai.server"
    );

    let analysis;
    try {
      analysis = await analyseSuspiciousMessage(data);
    } catch (error) {
      if (error instanceof GatewayError) {
        throw new Error(gatewayUserMessage(error.status, data.lang));
      }
      throw error;
    }

    const { data: row, error } = await context.supabase
      .from("scam_checks")
      .insert({
        senior_id: context.userId,
        input_type: data.imageDataUrl ? "screenshot" : "text",
        verdict: analysis.verdict,
        category: analysis.category,
        confidence: analysis.confidence,
        summary: analysis.summary,
        red_flags: analysis.redFlags,
        recommended_action: analysis.recommendedAction,
      })
      .select("id, created_at")
      .single();

    if (error) console.error("[guardian] could not save check", error.message);

    return {
      id: row?.id ?? crypto.randomUUID(),
      createdAt: row?.created_at ?? new Date().toISOString(),
      ...analysis,
    };
  });

export const askCompanion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const raw = (data ?? {}) as Record<string, unknown>;
    const question = typeof raw["question"] === "string" ? raw["question"].trim() : "";
    if (!question) throw new Error("I didn't catch that. Please try again.");
    return { question: question.slice(0, 2000), lang: normaliseLang(raw["lang"]) };
  })
  .handler(async ({ data, context }) => {
    const { answerSpokenQuestion, GatewayError, gatewayUserMessage } = await import(
      "./scam-ai.server"
    );

    let answer: string;
    try {
      answer = await answerSpokenQuestion(data.question, data.lang);
    } catch (error) {
      if (error instanceof GatewayError) {
        throw new Error(gatewayUserMessage(error.status, data.lang));
      }
      throw error;
    }

    const { error } = await context.supabase.from("voice_queries").insert({
      senior_id: context.userId,
      question: data.question,
      answer,
    });
    if (error) console.error("[guardian] could not save question", error.message);

    return { answer };
  });
