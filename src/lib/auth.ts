import { supabase } from "@/integrations/supabase/client";
import { usernameToEmail } from "./brand";
import type { Lang } from "./i18n";

const CODE_WORDS = [
  "SUN",
  "MOON",
  "RAIN",
  "TREE",
  "LAMP",
  "DOOR",
  "BIRD",
  "STAR",
  "RIVER",
  "LOTUS",
  "MANGO",
  "TIGER",
  "CLOUD",
  "GATE",
  "BELL",
  "ROSE",
];

export function makeSafetyCode() {
  const word = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)];
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return `${word}-${digits}`;
}

export type Profile = {
  id: string;
  role: "senior" | "family";
  name: string;
  username: string;
  preferred_language: Lang;
  safety_code: string | null;
  linked_senior_id: string | null;
};

async function assertUsernameFree(username: string) {
  const { data, error } = await supabase.rpc("username_exists", { _username: username });
  if (error) throw new Error("Couldn't check that username. Please try again.");
  if (data) throw new Error("That username is already taken. Please pick another one.");
}

export async function signUpSenior(input: {
  name: string;
  username: string;
  password: string;
  language: Lang;
}) {
  await assertUsernameFree(input.username);

  const { data: auth, error: authError } = await supabase.auth.signUp({
    email: usernameToEmail(input.username),
    password: input.password,
  });
  if (authError) throw new Error(friendly(authError.message));
  const userId = auth.user?.id;
  if (!userId) throw new Error("Couldn't create the account. Please try again.");

  // Retry on the rare safety-code collision.
  let lastError: string | null = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = makeSafetyCode();
    const { error } = await supabase.from("profiles").insert({
      id: userId,
      role: "senior",
      name: input.name.trim(),
      username: input.username.trim().toLowerCase(),
      preferred_language: input.language,
      safety_code: code,
    });
    if (!error) return { safetyCode: code };
    if (!error.message.includes("safety_code")) {
      lastError = error.message;
      break;
    }
  }
  throw new Error(friendly(lastError ?? "Couldn't finish setting up the account."));
}

export async function lookupSenior(code: string) {
  const { data, error } = await supabase.rpc("senior_by_safety_code", { _code: code });
  if (error) throw new Error("Couldn't check that safety code. Please try again.");
  const match = Array.isArray(data) ? data[0] : null;
  if (!match) throw new Error("We couldn't find that safety code. Please check it and try again.");
  return match as { id: string; name: string };
}

export async function signUpFamily(input: {
  name: string;
  username: string;
  password: string;
  safetyCode: string;
}) {
  const senior = await lookupSenior(input.safetyCode);
  await assertUsernameFree(input.username);

  const { data: auth, error: authError } = await supabase.auth.signUp({
    email: usernameToEmail(input.username),
    password: input.password,
  });
  if (authError) throw new Error(friendly(authError.message));
  const userId = auth.user?.id;
  if (!userId) throw new Error("Couldn't create the account. Please try again.");

  const { error } = await supabase.from("profiles").insert({
    id: userId,
    role: "family",
    name: input.name.trim(),
    username: input.username.trim().toLowerCase(),
    preferred_language: "en",
    linked_senior_id: senior.id,
  });
  if (error) throw new Error(friendly(error.message));
  return { seniorName: senior.name };
}

export async function signIn(username: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });
  if (error) throw new Error("That username and password don't match. Please try again.");
}

export async function signOut() {
  await supabase.auth.signOut();
}

function friendly(message: string) {
  if (/password/i.test(message) && /6|short|least/i.test(message)) {
    return "Please choose a password with at least 6 characters.";
  }
  if (/already registered|already exists/i.test(message)) {
    return "That username is already taken. Please pick another one.";
  }
  return message;
}
