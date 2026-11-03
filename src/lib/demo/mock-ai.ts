import type { ScamCategory } from "@/lib/scam-watch";
import type { DemoVerdict } from "./demo-data";

export type DemoAnalysis = {
  verdict: DemoVerdict;
  category: ScamCategory;
  confidence: number;
  summary: string;
  redFlags: string[];
  recommendedAction: string;
};

export type ExampleCase = {
  id: string;
  label: string;
  message: string;
  analysis: DemoAnalysis;
};

/**
 * The example cases teachers can tap in the checker. In demo mode the mock
 * analyser below answers from these definitions — no AI service is called.
 */
export const EXAMPLE_CASES: ExampleCase[] = [
  {
    id: "kyc-block",
    label: "Bank KYC threat",
    message:
      "Dear Customer, your SBI net banking will be BLOCKED today at 6 PM because your KYC is not updated. Click sbi-kyc-update.com immediately or your account will be permanently closed. — SBI Head Office",
    analysis: {
      verdict: "scam",
      category: "fake_kyc",
      confidence: 0.93,
      summary:
        "This claims your bank account will be blocked today unless you update KYC on a link.",
      redFlags: [
        "Banks never close accounts by text message",
        "The web address is not the bank's real one",
        "It rushes you with a same-day deadline",
      ],
      recommendedAction:
        "Don't tap the link. If you're worried, call the number printed on your ATM card, or visit the branch.",
    },
  },
  {
    id: "upi-collect",
    label: "UPI 'cashback' request",
    message:
      "You have received a UPI collect request of ₹4,999 from 'PhonePe Rewards'. Approve within 10 minutes to claim your cashback. Enter your UPI PIN to accept the money.",
    analysis: {
      verdict: "scam",
      category: "upi_request",
      confidence: 0.95,
      summary: "This asks you to enter your UPI PIN to 'receive' ₹4,999 cashback.",
      redFlags: [
        "Entering your UPI PIN to receive money always sends money away",
        "A countdown timer creates false urgency",
        "The reward app is not one you installed",
      ],
      recommendedAction:
        "Never enter your PIN to receive money. Decline the request — it is almost always fraud.",
    },
  },
  {
    id: "courier-customs",
    label: "Customs fee for a parcel",
    message:
      "Your parcel from London has been held at Mumbai Customs. Pending clearance fee: Rs. 2,450. Pay now via the link to avoid return: fedex-india-pay.online",
    analysis: {
      verdict: "scam",
      category: "courier_customs",
      confidence: 0.88,
      summary: "This asks for ₹2,450 as a 'clearance fee' to release a parcel.",
      redFlags: [
        "Real couriers never collect customs fees by a payment link",
        "It's a foreign parcel you didn't order",
        "The courier's name is spelt slightly wrong",
      ],
      recommendedAction:
        "Don't pay anything. If you're expecting a parcel, check the tracking in the courier's own app or website.",
    },
  },
  {
    id: "digital-arrest",
    label: "Fake police 'digital arrest'",
    message:
      "This is a call from Mumbai Cyber Police. Case FIR-2841 has been filed against your Aadhaar number. Stay on this video call. Do not tell anyone. Pay the verification deposit of Rs. 50,000 to clear your name today.",
    analysis: {
      verdict: "scam",
      category: "digital_arrest",
      confidence: 0.97,
      summary: "This claims police will arrest you unless you pay a ₹50,000 'verification deposit'.",
      redFlags: [
        "Real police never arrest anyone over a video call",
        "They tell you not to tell anyone — that's the trick",
        "No case can be closed by paying money to a UPI id",
      ],
      recommendedAction:
        "Hang up and don't stay on the call. Report it at cybercrime.gov.in or call 1930, and tell a family member.",
    },
  },
  {
    id: "lottery",
    label: "KBC lottery win",
    message:
      "CONGRATULATIONS! Your mobile number has won ₹25,00,000 in the KBC Lucky Draw 2026. Send your name, age and bank details to claim. Processing fee Rs. 8,000 only.",
    analysis: {
      verdict: "scam",
      category: "lottery_prize",
      confidence: 0.96,
      summary: "This says you won ₹25 lakh in a lottery — but asks you to pay a fee to claim it.",
      redFlags: [
        "Nobody wins a draw they never entered",
        "Real prizes never ask for a processing fee first",
        "It asks for your bank details",
      ],
      recommendedAction:
        "Delete the message. Never send money or bank details to claim a prize — these are always scams.",
    },
  },
  {
    id: "impersonation",
    label: "'Son' asking for urgent money",
    message:
      "Hi Ma, this is Rahul from my new number. My phone broke. I'm stuck abroad and need you to send ₹40,000 urgently to this UPI id. Please don't tell anyone, I'll explain later.",
    analysis: {
      verdict: "scam",
      category: "impersonation",
      confidence: 0.9,
      summary: "Someone saying they are your son, from a new number, urgently asks for ₹40,000.",
      redFlags: [
        "A new number claiming to be a close relative",
        "Urgency plus secrecy — 'don't tell anyone'",
        "Asks for money by UPI to an unknown account",
      ],
      recommendedAction:
        "Call your son on his old number before sending anything. If he doesn't answer, call another family member first.",
    },
  },
  {
    id: "safe-welfare",
    label: "A genuinely safe message",
    message:
      "Hello Aunty, this is Meena from the Jayanagar Residents' Welfare Association. The cleaning of the lane is scheduled for Saturday morning at 9. Water supply will be paused between 10 and 12.",
    analysis: {
      verdict: "safe",
      category: "other",
      confidence: 0.83,
      summary: "A routine neighbourhood notice about lane cleaning and a water pause on Saturday.",
      redFlags: [],
      recommendedAction: "Nothing needed — this looks like a normal message from your area.",
    },
  },
];

const FALLBACK: DemoAnalysis = {
  verdict: "unsure",
  category: "other",
  confidence: 0.35,
  summary: "I'm not certain about this one. It doesn't match a common scam, but it deserves a second look.",
  redFlags: [
    "No clear warning signs found — but new tricks appear every week",
  ],
  recommendedAction:
    "Don't share any code, PIN or payment. Ask a family member before responding to it.",
};

function rule(text: string): DemoAnalysis | null {
  const q = text.toLowerCase();
  if (/(kyc|net ?banking|account will be blocked|block.*account|account.*suspend)/.test(q)) {
    return EXAMPLE_CASES[0]!.analysis;
  }
  if (/(upi|collect request|cashback|pin to (accept|receive)|phonepe|paytm|gpay)/.test(q)) {
    return EXAMPLE_CASES[1]!.analysis;
  }
  if (/(courier|parcel|customs|clearance fee|fedex|delivery fee)/.test(q)) {
    return EXAMPLE_CASES[2]!.analysis;
  }
  if (/(police|cyber|arrest|fir|aadhaar.*(case|call)|video call)/.test(q)) {
    return EXAMPLE_CASES[3]!.analysis;
  }
  if (/(lottery|kbc|prize|lucky draw|won rs|won ₹)/.test(q)) {
    return EXAMPLE_CASES[4]!.analysis;
  }
  if (/(new number|stuck abroad|don'?t tell anyone|send .*(urgently|rs\.? ?[0-9])|need money)/.test(q)) {
    return EXAMPLE_CASES[5]!.analysis;
  }
  if (/(welfare|association|cleaning|water supply|meeting on|saturday)/.test(q)) {
    return EXAMPLE_CASES[6]!.analysis;
  }
  return null;
}

/**
 * Demo-mode analyser: pure keyword matching against the example cases.
 * Never touches a network and never reads a picture.
 */
export function analyzeMock(text: string, hasImage: boolean): DemoAnalysis {
  const trimmed = text.trim();
  if (trimmed) {
    return rule(trimmed) ?? FALLBACK;
  }
  if (hasImage) {
    return {
      verdict: "unsure",
      category: "other",
      confidence: 0.3,
      summary:
        "This is a picture of a message. In this demo I can't read pictures, so treat it with care.",
      redFlags: [
        "If it mentions a payment, a code or a deadline, don't act on it",
      ],
      recommendedAction:
        "Don't tap or pay anything. Show the message to a family member, or type the words here to check them.",
    };
  }
  return FALLBACK;
}

/* ------------------------------------------------------------------ */
/* Demo voice companion — canned, keyword-matched answers.            */
/* ------------------------------------------------------------------ */

export function mockAnswer(question: string): string {
  const q = question.toLowerCase();
  if (/upi|collect|paytm|phonepe|gpay|cashback/.test(q)) {
    return "A real UPI payment never needs your PIN to receive money. If a message asks you to enter your PIN to 'accept' a reward, it is taking money out of your account. Don't approve it — and ask a family member to look at it with you.";
  }
  if (/otp|pin|password/.test(q)) {
    return "Never share an OTP, PIN or password with anyone — not even someone saying they are from your bank. Real banks never ask. If you already shared one, call your bank's helpline on the number printed on your card.";
  }
  if (/block|stop.*call|nuisance/.test(q)) {
    return "Open the call log on your phone, tap the number, and choose 'Block number'. You can also forward scam text messages to 1909 to report them. If the caller mentions your bank or money, tell a family member as well.";
  }
  if (/lpg|gas|cylinder/.test(q)) {
    return "LPG booking is done through your gas company's official app, or by calling 1906. Nobody needs your bank details to deliver a cylinder. If a message asks for money first, don't pay it — check with your family.";
  }
  if (/kyc|bank|account/.test(q)) {
    return "Banks never threaten to close your account by text message, and never ask for KYC through a link. If you're unsure, call the number printed on the back of your ATM card, or visit the branch. Don't tap any link in the message.";
  }
  if (/electric|bescom|power cut|disconnection/.test(q)) {
    return "The electricity board does not disconnect power within an hour, or ask for payment on a messaging app. Pay bills only through the official channels. If a message threatens disconnection today, show it to a family member before doing anything.";
  }
  if (/courier|parcel|customs|fedex|delivery/.test(q)) {
    return "A real courier never asks for a customs or clearance fee by a payment link. If you're expecting a parcel, check its status in the courier's own app or website. Don't pay anything through the message — and mention it to a family member.";
  }
  if (/police|arrest|cyber|cbi|fir/.test(q)) {
    return "Real police never arrest anyone over a video call, and never take money to close a case. Hang up, don't stay on the call, and don't pay anything. You can report such calls at cybercrime.gov.in or by calling 1930 — and tell a family member.";
  }
  if (/lottery|kbc|prize|lucky draw/.test(q)) {
    return "Real lottery wins never ask you to pay a fee first, and nobody wins a draw they never entered. Don't send money or personal details. Show the message to a family member — these are always scams.";
  }
  if (/job|work from home|part.?time|earn/.test(q)) {
    return "Be careful with messages promising easy daily income — most are scams that first ask for a small 'registration' payment. Never pay to get a job, and never share documents in a WhatsApp group. Discuss it with a family member before replying.";
  }
  return "That's a good question. Keep one rule in mind: never share a code, PIN or payment with someone who contacted you first. If the message mentions money, show it to a family member before acting — and when unsure, call the official helpline of your bank or service.";
}
