import { LANGUAGE_NAMES, type Lang } from "./i18n";

const API_KEY = process.env["AI_API_KEY"];
const IS_GEMINI_KEY = Boolean(API_KEY?.startsWith("AQ.") || API_KEY?.startsWith("AIza"));
const GATEWAY = process.env["AI_API_URL"] ?? "https://api.openai.com/v1/chat/completions";
// Multimodal so an uploaded screenshot can be read directly, without separate OCR.
const MODEL = process.env["AI_MODEL"] ?? (IS_GEMINI_KEY ? "gemini-3.8-flash" : "gpt-4o-mini");

const INDIAN_SCAM_PATTERNS = `Common scam patterns targeting older adults in India:
- Fake KYC / bank account suspension threats ("your account will be blocked today, update KYC on this link")
- OTP phishing (anyone asking for an OTP, PIN, CVV or password, for any reason)
- Fake courier / customs / parcel fee requests ("your parcel is held, pay a small fee")
- Fake electricity board disconnection notices with a phone number or link
- "Digital arrest" / fake police, CBI, customs or court threats, video-call intimidation, demands to keep it secret
- Lottery, lucky draw, prize and KBC-style winnings requiring a "processing fee" or bank details
- Impersonation of a relative or friend asking urgently for money, often from a new number
- Fake job offers or work-from-home schemes requiring an upfront payment or registration fee
- Fake investment / trading groups promising guaranteed returns
- Requests to install a screen-sharing or remote-access app
- UPI "collect request" tricks where accepting sends money out instead of receiving it`;

export const SCAM_CATEGORIES = [
  "fake_kyc",
  "otp_phishing",
  "courier_customs",
  "electricity_bill",
  "digital_arrest",
  "lottery_prize",
  "impersonation",
  "job_offer",
  "upi_request",
  "other",
] as const;

export type ScamCategory = (typeof SCAM_CATEGORIES)[number];

export type ScamAnalysis = {
  verdict: "scam" | "safe" | "unsure";
  category: ScamCategory;
  confidence: "low" | "medium" | "high";
  summary: string;
  redFlags: string[];
  recommendedAction: string;
};

const FALLBACKS: Record<Lang, ScamAnalysis> = {
  en: {
    verdict: "unsure",
    category: "other",
    confidence: "low",
    summary: "I couldn't read this properly, so I can't say for certain.",
    redFlags: [],
    recommendedAction:
      "Please don't click any link or share any code. Show this to a family member before you do anything.",
  },
  hi: {
    verdict: "unsure",
    category: "other",
    confidence: "low",
    summary: "मैं इसे ठीक से पढ़ नहीं सका, इसलिए पक्का नहीं कह सकता।",
    redFlags: [],
    recommendedAction:
      "कृपया कोई लिंक न खोलें और कोई कोड साझा न करें। कुछ करने से पहले परिवार के किसी सदस्य को दिखाएँ।",
  },
  kn: {
    verdict: "unsure",
    category: "other",
    confidence: "low",
    summary: "ಇದನ್ನು ಸರಿಯಾಗಿ ಓದಲು ಆಗಲಿಲ್ಲ, ಹಾಗಾಗಿ ಖಚಿತವಾಗಿ ಹೇಳಲಾರೆ.",
    redFlags: [],
    recommendedAction:
      "ದಯವಿಟ್ಟು ಯಾವುದೇ ಲಿಂಕ್ ಒತ್ತಬೇಡಿ, ಯಾವುದೇ ಕೋಡ್ ಹಂಚಬೇಡಿ. ಏನಾದರೂ ಮಾಡುವ ಮೊದಲು ಕುಟುಂಬದವರಿಗೆ ತೋರಿಸಿ.",
  },
};

const ASSISTANT_FALLBACK: Record<Lang, string> = {
  en: "I'm sorry, I couldn't work that out just now. For anything to do with money, accounts or documents, it's best to ask a family member, or call the official helpline for that service.",
  hi: "क्षमा करें, मैं अभी यह समझ नहीं पाया। पैसे, खाते या कागज़ात से जुड़ी किसी भी बात के लिए परिवार के सदस्य से पूछें, या उस सेवा की सरकारी हेल्पलाइन पर बात करें।",
  kn: "ಕ್ಷಮಿಸಿ, ಇದನ್ನು ಈಗ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಆಗಲಿಲ್ಲ. ಹಣ, ಖಾತೆ ಅಥವಾ ದಾಖಲೆಗಳ ವಿಷಯದಲ್ಲಿ ಕುಟುಂಬದವರನ್ನು ಕೇಳಿ, ಅಥವಾ ಆ ಸೇವೆಯ ಅಧಿಕೃತ ಸಹಾಯವಾಣಿಗೆ ಕರೆ ಮಾಡಿ.",
};

function langName(lang: Lang) {
  return LANGUAGE_NAMES[lang] ?? "English";
}

async function callGateway(body: unknown, jsonResponse = false) {
  const apiKey = API_KEY;
  if (!apiKey) throw new Error("AI is not configured.");

  if (IS_GEMINI_KEY) {
    const messages = (body as {
      messages: Array<{
        role: string;
        content:
          | string
          | Array<{
              type: string;
              text?: string;
              image_url?: { url: string };
            }>;
      }>;
    }).messages;
    const systemInstruction = messages.find((message) => message.role === "system")?.content;
    const contents = messages
      .filter((message) => message.role !== "system")
      .map((message) => {
        const content = typeof message.content === "string" ? [{ type: "text", text: message.content }] : message.content;
        const parts = content.flatMap((part) => {
          if (part.type === "text" && part.text) return [{ text: part.text }];
          const imageUrl = part.image_url?.url;
          const image = imageUrl?.match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
          if (part.type === "image_url" && image) {
            return [{ inlineData: { mimeType: image[1]!, data: image[2]! } }];
          }
          return [];
        });
        return { role: message.role === "assistant" ? "model" : "user", parts };
      });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(systemInstruction && { systemInstruction: { parts: [{ text: systemInstruction }] } }),
          contents,
          ...(jsonResponse && { generationConfig: { responseMimeType: "application/json" } }),
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new GatewayError(response.status, detail);
    }

    const json = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  }

  const response = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new GatewayError(response.status, detail);
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content ?? "";
}

export class GatewayError extends Error {
  status: number;
  constructor(status: number, detail: string) {
    super(`AI gateway error ${status}: ${detail.slice(0, 400)}`);
    this.status = status;
  }
}

function extractJson(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function coerceAnalysis(value: unknown, lang: Lang): ScamAnalysis {
  if (!value || typeof value !== "object") return FALLBACKS[lang] ?? FALLBACKS.en;
  const raw = value as Record<string, unknown>;

  const verdictRaw = String(raw["verdict"] ?? "").toLowerCase();
  const verdict =
    verdictRaw === "scam" || verdictRaw === "safe" || verdictRaw === "unsure" ? verdictRaw : "unsure";

  const confidenceRaw = String(raw["confidence"] ?? "").toLowerCase();
  const confidence =
    confidenceRaw === "low" || confidenceRaw === "medium" || confidenceRaw === "high"
      ? confidenceRaw
      : "medium";

  const categoryRaw = String(raw["category"] ?? "").toLowerCase();
  const category = (SCAM_CATEGORIES as readonly string[]).includes(categoryRaw)
    ? (categoryRaw as ScamCategory)
    : "other";

  const summary = typeof raw["summary"] === "string" ? raw["summary"].trim() : "";
  const action =
    typeof raw["recommendedAction"] === "string" ? raw["recommendedAction"].trim() : "";

  const flagsRaw = raw["redFlags"];
  const redFlags = Array.isArray(flagsRaw)
    ? flagsRaw
        .filter((f): f is string => typeof f === "string" && f.trim().length > 0)
        .map((f) => f.trim())
        .slice(0, 6)
    : [];

  if (!summary) return FALLBACKS[lang] ?? FALLBACKS.en;

  return {
    verdict: verdict as ScamAnalysis["verdict"],
    category,
    confidence: confidence as ScamAnalysis["confidence"],
    summary,
    redFlags,
    recommendedAction: action || (FALLBACKS[lang] ?? FALLBACKS.en).recommendedAction,
  };
}

export async function analyseSuspiciousMessage(input: {
  text?: string | undefined;
  imageDataUrl?: string | undefined;
  lang: Lang;
}): Promise<ScamAnalysis> {
  const lang = input.lang;
  const system = `You help older adults in India decide whether a message they received is a scam.

${INDIAN_SCAM_PATTERNS}

Judge the message against those patterns and against ordinary legitimate messages (real OTP notifications the person requested, delivery updates with no payment demanded, bank statements with no link, family chat).

Write every piece of text you output in ${langName(lang)}, and only in ${langName(lang)}.
Write for someone who is not comfortable with technology: short sentences, everyday words, no jargon, no English technical terms unless there is no alternative.
Stay calm and respectful even when it is clearly a scam. Never frighten, never scold, never patronise. Do not imply the person did something wrong.
The recommended action must be one concrete, doable step.

Reply with JSON only, no prose and no code fences, in exactly this shape:
{"verdict":"scam"|"safe"|"unsure","category":"fake_kyc"|"otp_phishing"|"courier_customs"|"electricity_bill"|"digital_arrest"|"lottery_prize"|"impersonation"|"job_offer"|"upi_request"|"other","confidence":"low"|"medium"|"high","summary":"one sentence explaining why","redFlags":["specific thing in the message that is suspicious"],"recommendedAction":"one concrete next step"}

"category" names which known pattern this message matches most closely; use "other" when none fits or the message looks safe.

Use "unsure" honestly when there is not enough to judge. Keep redFlags empty when the message looks safe. Each red flag quotes or names something actually present in the message.`;

  const userContent: Array<Record<string, unknown>> = [];
  if (input.text?.trim()) {
    userContent.push({
      type: "text",
      text: `Here is the message I received:\n\n${input.text.trim().slice(0, 6000)}`,
    });
  }
  if (input.imageDataUrl) {
    userContent.push({
      type: "text",
      text: "Here is a picture of the message I received. Read the text in it, then judge it.",
    });
    userContent.push({ type: "image_url", image_url: { url: input.imageDataUrl } });
  }
  if (userContent.length === 0) return FALLBACKS[lang] ?? FALLBACKS.en;

  try {
    const content = await callGateway({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
    }, true);
    return coerceAnalysis(extractJson(content), lang);
  } catch (error) {
    if (error instanceof GatewayError) throw error;
    return FALLBACKS[lang] ?? FALLBACKS.en;
  }
}

export async function answerSpokenQuestion(question: string, lang: Lang): Promise<string> {
  const system = `You are a patient digital-safety companion for an older adult in India. They speak to you out loud, so your answer is read back aloud.

Answer in ${langName(lang)} only, in 2 to 4 short sentences, in plain everyday words. No lists, no headings, no jargon, no emoji.
Be warm and respectful. Never patronising, never alarming.

You may give general digital-safety and everyday how-to guidance (blocking a number, checking whether a UPI request is genuine, spotting a fake message, renewing a common utility connection).
You must never give specific financial, medical or legal advice. For anything specific about money, health, legal matters, documents or a particular account, say clearly that it is best to confirm with a family member or the official helpline for that service, and stop there.
Never ask for or repeat an OTP, PIN, password or account number.

Known scam patterns you can refer to:
${INDIAN_SCAM_PATTERNS}`;

  try {
    const content = await callGateway({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: question.trim().slice(0, 2000) },
      ],
    });
    const answer = content.trim();
    return answer || (ASSISTANT_FALLBACK[lang] ?? ASSISTANT_FALLBACK.en);
  } catch (error) {
    if (error instanceof GatewayError) throw error;
    return ASSISTANT_FALLBACK[lang] ?? ASSISTANT_FALLBACK.en;
  }
}

export function gatewayUserMessage(status: number, lang: Lang) {
  const en =
    status === 429
      ? "A lot of checks are happening right now. Please wait a moment and try again."
      : status === 402 || status === 403
        ? "The checking service is unavailable right now. Please ask a family member to look at this message."
        : "Something went wrong while checking. Please try again in a moment.";
  if (lang === "hi") {
    return status === 429
      ? "अभी बहुत जाँचें हो रही हैं। कृपया थोड़ी देर बाद फिर कोशिश करें।"
      : status === 402 || status === 403
        ? "जाँच सेवा अभी उपलब्ध नहीं है। कृपया परिवार के किसी सदस्य से यह संदेश दिखाकर पूछें।"
        : "जाँचते समय कुछ गड़बड़ हुई। कृपया थोड़ी देर बाद फिर कोशिश करें।";
  }
  if (lang === "kn") {
    return status === 429
      ? "ಈಗ ಬಹಳ ಪರಿಶೀಲನೆಗಳು ನಡೆಯುತ್ತಿವೆ. ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಪ್ರಯತ್ನಿಸಿ."
      : status === 402 || status === 403
        ? "ಪರಿಶೀಲನಾ ಸೇವೆ ಈಗ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಕುಟುಂಬದವರಿಗೆ ಈ ಸಂದೇಶ ತೋರಿಸಿ."
        : "ಪರಿಶೀಲಿಸುವಾಗ ಏನೋ ತೊಂದರೆಯಾಯಿತು. ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಪ್ರಯತ್ನಿಸಿ.";
  }
  return en;
}
