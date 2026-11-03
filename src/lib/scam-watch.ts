import { supabase } from "@/integrations/supabase/client";
import { readDemo } from "./demo/demo-session";
import type { Lang } from "./i18n";

export type ScamCategory =
  | "fake_kyc"
  | "otp_phishing"
  | "courier_customs"
  | "electricity_bill"
  | "digital_arrest"
  | "lottery_prize"
  | "impersonation"
  | "job_offer"
  | "upi_request"
  | "other";

export const SCAM_CATEGORIES: ScamCategory[] = [
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
];

const CATEGORY_LABELS: Record<Lang, Record<ScamCategory, string>> = {
  en: {
    fake_kyc: "Fake KYC and bank alerts",
    otp_phishing: "OTP phishing",
    courier_customs: "Fake courier and customs fees",
    electricity_bill: "Fake electricity disconnection",
    digital_arrest: "Digital arrest and police threats",
    lottery_prize: "Lottery and prize wins",
    impersonation: "Someone posing as a relative",
    job_offer: "Fake job offers",
    upi_request: "UPI collect requests",
    other: "Other suspicious messages",
  },
  hi: {
    fake_kyc: "फर्जी KYC और बैंक संदेश",
    otp_phishing: "OTP माँगने वाले संदेश",
    courier_customs: "फर्जी कुरियर और कस्टम शुल्क",
    electricity_bill: "फर्जी बिजली कटने की सूचना",
    digital_arrest: "डिजिटल अरेस्ट और पुलिस की धमकी",
    lottery_prize: "लॉटरी और इनाम के संदेश",
    impersonation: "रिश्तेदार बनकर पैसे माँगना",
    job_offer: "फर्जी नौकरी के प्रस्ताव",
    upi_request: "UPI कलेक्ट रिक्वेस्ट",
    other: "अन्य संदिग्ध संदेश",
  },
  kn: {
    fake_kyc: "ನಕಲಿ KYC ಮತ್ತು ಬ್ಯಾಂಕ್ ಸಂದೇಶ",
    otp_phishing: "OTP ಕೇಳುವ ಸಂದೇಶ",
    courier_customs: "ನಕಲಿ ಕೊರಿಯರ್ ಮತ್ತು ಕಸ್ಟಮ್ಸ್ ಶುಲ್ಕ",
    electricity_bill: "ನಕಲಿ ವಿದ್ಯುತ್ ಕಡಿತ ಸೂಚನೆ",
    digital_arrest: "ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್ ಮತ್ತು ಪೊಲೀಸ್ ಬೆದರಿಕೆ",
    lottery_prize: "ಲಾಟರಿ ಮತ್ತು ಬಹುಮಾನ ಸಂದೇಶ",
    impersonation: "ಸಂಬಂಧಿಕರಂತೆ ನಟಿಸಿ ಹಣ ಕೇಳುವುದು",
    job_offer: "ನಕಲಿ ಉದ್ಯೋಗ ಕೊಡುಗೆ",
    upi_request: "UPI ಕಲೆಕ್ಟ್ ರಿಕ್ವೆಸ್ಟ್",
    other: "ಇತರ ಅನುಮಾನಾಸ್ಪದ ಸಂದೇಶ",
  },
};

export function categoryLabel(category: ScamCategory, lang: Lang = "en") {
  return (CATEGORY_LABELS[lang] ?? CATEGORY_LABELS.en)[category] ?? CATEGORY_LABELS.en.other;
}

export type TimeWindow = "today" | "week" | "month";

export const TIME_WINDOWS: { value: TimeWindow; label: string; days: number; note: string }[] = [
  { value: "today", label: "Today", days: 1, note: "in the last 24 hours" },
  { value: "week", label: "This week", days: 7, note: "in the last 7 days" },
  { value: "month", label: "This month", days: 30, note: "in the last 30 days" },
];

export function windowDays(window: TimeWindow) {
  return TIME_WINDOWS.find((option) => option.value === window)?.days ?? 7;
}

export function windowNote(window: TimeWindow) {
  return TIME_WINDOWS.find((option) => option.value === window)?.note ?? "in the last 7 days";
}

export type AreaReport = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  reports: number;
  topCategory: ScamCategory;
  topCategoryReports: number;
  isDemo?: boolean;
};

export type CategoryCount = { category: ScamCategory; reports: number };

type DemoAreaBase = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  /** Representative count for the "this week" window. */
  weight: number;
  topCategory: ScamCategory;
  topWeight: number;
};

const AREA_BASE: DemoAreaBase[] = [
  { slug: "koramangala", name: "Koramangala", lat: 12.9352, lng: 77.6245, weight: 26, topCategory: "fake_kyc", topWeight: 9 },
  { slug: "indiranagar", name: "Indiranagar", lat: 12.9784, lng: 77.6408, weight: 23, topCategory: "otp_phishing", topWeight: 9 },
  { slug: "whitefield", name: "Whitefield", lat: 12.9698, lng: 77.75, weight: 21, topCategory: "courier_customs", topWeight: 8 },
  { slug: "jayanagar", name: "Jayanagar", lat: 12.925, lng: 77.5838, weight: 18, topCategory: "fake_kyc", topWeight: 7 },
  { slug: "hsr-layout", name: "HSR Layout", lat: 12.9116, lng: 77.6389, weight: 17, topCategory: "upi_request", topWeight: 7 },
  { slug: "btm-layout", name: "BTM Layout", lat: 12.8442, lng: 77.6154, weight: 15, topCategory: "otp_phishing", topWeight: 6 },
  { slug: "malleswaram", name: "Malleswaram", lat: 13.0031, lng: 77.5643, weight: 14, topCategory: "impersonation", topWeight: 5 },
  { slug: "banashankari", name: "Banashankari", lat: 12.9255, lng: 77.5468, weight: 13, topCategory: "digital_arrest", topWeight: 5 },
  { slug: "marathahalli", name: "Marathahalli", lat: 12.9569, lng: 77.7011, weight: 13, topCategory: "job_offer", topWeight: 5 },
  { slug: "rajajinagar", name: "Rajajinagar", lat: 13.0108, lng: 77.555, weight: 11, topCategory: "electricity_bill", topWeight: 4 },
  { slug: "electronic-city", name: "Electronic City", lat: 12.8452, lng: 77.6602, weight: 11, topCategory: "job_offer", topWeight: 4 },
  { slug: "basavanagudi", name: "Basavanagudi", lat: 12.9421, lng: 77.5732, weight: 10, topCategory: "impersonation", topWeight: 4 },
  { slug: "rt-nagar", name: "RT Nagar", lat: 13.0298, lng: 77.596, weight: 9, topCategory: "upi_request", topWeight: 3 },
  { slug: "hebbal", name: "Hebbal", lat: 13.0358, lng: 77.597, weight: 9, topCategory: "lottery_prize", topWeight: 3 },
  { slug: "yelahanka", name: "Yelahanka", lat: 13.1007, lng: 77.5963, weight: 8, topCategory: "electricity_bill", topWeight: 3 },
  { slug: "kengeri", name: "Kengeri", lat: 12.9047, lng: 77.5305, weight: 6, topCategory: "lottery_prize", topWeight: 2 },
];

/** Scales the illustrative counts so Today < This week < This month. */
function demoFactor(window: TimeWindow) {
  return window === "today" ? 0.18 : window === "month" ? 4.6 : 1;
}

function demoAreaReports(window: TimeWindow): AreaReport[] {
  const factor = demoFactor(window);
  return AREA_BASE.map((area) => ({
    slug: area.slug,
    name: area.name,
    lat: area.lat,
    lng: area.lng,
    reports: Math.max(1, Math.round(area.weight * factor)),
    topCategory: area.topCategory,
    topCategoryReports: Math.max(1, Math.round(area.topWeight * factor)),
    isDemo: true,
  }));
}

const CATEGORY_BASE: CategoryCount[] = [
  { category: "fake_kyc", reports: 44 },
  { category: "otp_phishing", reports: 36 },
  { category: "digital_arrest", reports: 27 },
  { category: "courier_customs", reports: 24 },
  { category: "upi_request", reports: 21 },
  { category: "impersonation", reports: 18 },
  { category: "job_offer", reports: 13 },
  { category: "electricity_bill", reports: 12 },
  { category: "lottery_prize", reports: 9 },
];

function demoCategoryCounts(window: TimeWindow): CategoryCount[] {
  const factor = demoFactor(window);
  return CATEGORY_BASE.map((row) => ({
    category: row.category,
    reports: Math.max(1, Math.round(row.reports * factor)),
  }));
}

/**
 * Reads the anonymised, neighbourhood-level aggregate behind Scam Watch.
 * The aggregate is computed in the database from `scam_reports`, which real
 * scam checks write into automatically — no row here belongs to a person.
 */
export async function fetchAreaReports(window: TimeWindow): Promise<AreaReport[]> {
  if (readDemo()) return demoAreaReports(window);
  const { data, error } = await supabase.rpc("scam_watch", { window_days: windowDays(window) });
  if (error && !import.meta.env.DEV) throw new Error(error.message);
  const reports = (data ?? []).map((row) => ({
    slug: row.area_slug,
    name: row.area_name,
    lat: row.lat,
    lng: row.lng,
    reports: Number(row.reports),
    topCategory: row.top_category as ScamCategory,
    topCategoryReports: Number(row.top_category_reports),
  }));
  return reports.length === 0 ? demoAreaReports(window) : reports;
}

export async function fetchCategoryCounts(window: TimeWindow): Promise<CategoryCount[]> {
  if (readDemo()) return demoCategoryCounts(window);
  const { data, error } = await supabase.rpc("scam_watch_categories", {
    window_days: windowDays(window),
  });
  if (error && !import.meta.env.DEV) throw new Error(error.message);
  const counts = (data ?? []).map((row) => ({
    category: row.category as ScamCategory,
    reports: Number(row.reports),
  }));
  return counts.length === 0 ? demoCategoryCounts(window) : counts;
}

export type PlatformStats = {
  seniors: number;
  families: number;
  checks: number;
  scams: number;
  voice_queries: number;
  checkins: number;
  reports_month: number;
  areas_covered: number;
  isDemo?: boolean;
};

function demoPlatformStats(): PlatformStats {
  return {
    seniors: 412,
    families: 306,
    checks: 1842,
    scams: 594,
    voice_queries: 1105,
    checkins: 7633,
    reports_month: 1038,
    areas_covered: 16,
    isDemo: true,
  };
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  if (readDemo()) return demoPlatformStats();
  const { data, error } = await supabase.rpc("platform_stats");
  if (error && !import.meta.env.DEV) throw new Error(error.message);
  const raw = (data ?? {}) as Partial<Record<keyof PlatformStats, number>>;
  const stats = {
    seniors: Number(raw.seniors ?? 0),
    families: Number(raw.families ?? 0),
    checks: Number(raw.checks ?? 0),
    scams: Number(raw.scams ?? 0),
    voice_queries: Number(raw.voice_queries ?? 0),
    checkins: Number(raw.checkins ?? 0),
    reports_month: Number(raw.reports_month ?? 0),
    areas_covered: Number(raw.areas_covered ?? 0),
  };
  if (stats.seniors === 0 && stats.checks === 0) {
    return demoPlatformStats();
  }
  return stats;
}

export type DailyPoint = { day: string; reports: number; checks: number; isDemo?: boolean };

function demoDailyActivity(days = 30): DailyPoint[] {
  return Array.from({ length: Math.min(days, 30) }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (Math.min(days, 30) - index - 1));
    return {
      day: date.toISOString().slice(0, 10),
      reports: [3, 5, 4, 7, 6, 8, 5][index % 7] ?? 4,
      checks: [9, 12, 11, 15, 13, 17, 14][index % 7] ?? 10,
      isDemo: true,
    };
  });
}

export async function fetchDailyActivity(days = 30): Promise<DailyPoint[]> {
  if (readDemo()) return demoDailyActivity(days);
  const { data, error } = await supabase.rpc("daily_activity", { window_days: days });
  if (error && !import.meta.env.DEV) throw new Error(error.message);
  const activity = (data ?? []).map((row) => ({
    day: row.day,
    reports: Number(row.reports),
    checks: Number(row.checks),
  }));
  if (activity.length === 0) {
    return demoDailyActivity(days);
  }
  return activity;
}

export type Area = { slug: string; name: string };

export async function fetchAreas(): Promise<Area[]> {
  const { data, error } = await supabase.from("areas").select("slug, name").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Marker weight: scales the circle without letting one busy area swallow the map. */
export function markerRadius(reports: number, max: number) {
  if (max <= 0) return 10;
  const ratio = Math.sqrt(reports / max);
  return 11 + ratio * 21;
}

export function intensity(reports: number, max: number): "high" | "medium" | "low" {
  if (max <= 0) return "low";
  const ratio = reports / max;
  if (ratio >= 0.66) return "high";
  if (ratio >= 0.33) return "medium";
  return "low";
}
