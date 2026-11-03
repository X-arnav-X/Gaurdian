import type { Lang } from "@/lib/i18n";
import type { ScamCategory } from "@/lib/scam-watch";

export type DemoVerdict = "scam" | "safe" | "unsure";

export type DemoCheck = {
  id: string;
  verdict: DemoVerdict;
  category: ScamCategory;
  confidence: number;
  summary: string;
  redFlags: string[];
  recommendedAction: string;
  inputType: "text" | "screenshot";
  createdAt: string;
};

export type DemoProfile = {
  id: string;
  role: "senior" | "family";
  name: string;
  username: string;
  preferred_language: Lang;
  safety_code: string | null;
  linked_senior_id: string | null;
};

export type DemoQuery = {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
};

export type DemoState = {
  version: 1;
  role: "senior" | "family";
  senior: DemoProfile;
  family: DemoProfile;
  checks: DemoCheck[];
  checkins: string[];
  queries: DemoQuery[];
};

export const DEMO_SENIOR_ID = "demo-senior-sarala";
export const DEMO_FAMILY_ID = "demo-family-arjun";

function iso(hoursAgo: number) {
  return new Date(Date.now() - hoursAgo * 3_600_000).toISOString();
}

/**
 * Builds the ready-made demo household. Everything lives in the browser's
 * local storage: no account is created, no AI service is called and nothing
 * reaches the database while demo mode is on.
 */
export function buildSeedState(role: "senior" | "family"): DemoState {
  const senior: DemoProfile = {
    id: DEMO_SENIOR_ID,
    role: "senior",
    name: "Sarala Iyer",
    username: "sarala.demo",
    preferred_language: "en",
    safety_code: "SUN-4821",
    linked_senior_id: null,
  };
  const family: DemoProfile = {
    id: DEMO_FAMILY_ID,
    role: "family",
    name: "Arjun Iyer",
    username: "arjun.demo",
    preferred_language: "en",
    safety_code: null,
    linked_senior_id: DEMO_SENIOR_ID,
  };

  const checks: DemoCheck[] = [
    {
      id: "demo-check-seed-1",
      verdict: "scam",
      category: "fake_kyc",
      confidence: 0.93,
      summary:
        "A message claiming your bank account will be blocked today unless you update KYC on a link.",
      redFlags: [
        "Threatens account closure within hours",
        "The link is not the bank's real website",
        "Uses the word 'urgent' to rush you",
      ],
      recommendedAction:
        "Don't tap the link. If you're worried, call the number printed on your ATM card, or visit the branch.",
      inputType: "text",
      createdAt: iso(120),
    },
    {
      id: "demo-check-seed-2",
      verdict: "scam",
      category: "courier_customs",
      confidence: 0.88,
      summary:
        "A 'parcel held at customs' text asks for ₹2,450 as a clearance fee before delivery.",
      redFlags: [
        "Real couriers never collect customs fees by a payment link",
        "It's a foreign parcel you didn't order",
        "The courier's name is spelt slightly wrong",
      ],
      recommendedAction:
        "Don't pay anything. If you're expecting a parcel, check the tracking in the courier's own app.",
      inputType: "screenshot",
      createdAt: iso(74),
    },
    {
      id: "demo-check-seed-3",
      verdict: "safe",
      category: "other",
      confidence: 0.81,
      summary:
        "A routine message from the residents' welfare association about lane cleaning on Saturday.",
      redFlags: [],
      recommendedAction: "Nothing needed — this looks like a normal neighbourhood message.",
      inputType: "text",
      createdAt: iso(50),
    },
    {
      id: "demo-check-seed-4",
      verdict: "unsure",
      category: "job_offer",
      confidence: 0.42,
      summary: "An unfamiliar number offers part-time work-from-home pay credited daily.",
      redFlags: [
        "Earn-big-money offers are often the start of a scam",
        "It asks you to join a WhatsApp group first",
      ],
      recommendedAction: "Don't send money or documents. Ask a family member before replying.",
      inputType: "text",
      createdAt: iso(26),
    },
    {
      id: "demo-check-seed-5",
      verdict: "scam",
      category: "upi_request",
      confidence: 0.95,
      summary: "A UPI 'collect request' asks you to enter your PIN to receive ₹4,999 cashback.",
      redFlags: [
        "Entering your UPI PIN to receive money always sends money away",
        "A countdown timer creates false urgency",
        "The reward app is not one you installed",
      ],
      recommendedAction:
        "Never enter your PIN to receive money. Requests like this are almost always fraud.",
      inputType: "text",
      createdAt: iso(4),
    },
  ];

  // Check-ins only for previous days, so "I'm okay today" can be pressed live.
  const checkins = [iso(78), iso(54), iso(30)];

  const queries: DemoQuery[] = [
    {
      id: "demo-query-seed-1",
      question: "If someone asks for my OTP, what should I do?",
      answer:
        "Never share an OTP with anyone, even if they say they are from your bank. A real bank will never ask for it. If you already shared one, call your bank's helpline straight away — and tell a family member so they can help.",
      createdAt: iso(28),
    },
    {
      id: "demo-query-seed-2",
      question: "How do I block a number that keeps calling?",
      answer:
        "Open your phone's call log, tap the number, and choose 'Block number'. You can also forward scam text messages to 1909 to report them. If the caller mentions your bank or money, tell a family member as well.",
      createdAt: iso(6),
    },
  ];

  return { version: 1, role, senior, family, checks, checkins, queries };
}
