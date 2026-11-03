import { useMemo, useSyncExternalStore } from "react";
import {
  buildSeedState,
  type DemoState,
} from "./demo-data";

const KEY = "guardian-demo-session";

/* ------------------------------------------------------------------ */
/* Store mechanics: same-tab listeners + cross-tab `storage` events.  */
/* ------------------------------------------------------------------ */

const listeners = new Set<(state: DemoState | null) => void>();
let storageInstalled = false;

function notifyAll() {
  const state = readDemo();
  for (const listener of listeners) listener(state);
}

function onStorage(event: StorageEvent) {
  if (event.key === KEY || event.key === null) notifyAll();
}

export function subscribeDemo(listener: (state: DemoState | null) => void) {
  listeners.add(listener);
  if (typeof window !== "undefined" && !storageInstalled) {
    storageInstalled = true;
    window.addEventListener("storage", onStorage);
  }
  // Fire immediately so callers (like useSession) pick up the current state.
  listener(readDemo());
  return () => {
    listeners.delete(listener);
  };
}

export function readDemo(): DemoState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoState;
  } catch {
    return null;
  }
}

export function isDemoActive() {
  return readDemo() !== null;
}

export function enterDemo(role: "senior" | "family") {
  if (typeof window === "undefined") return;
  // If a demo household already exists (e.g. the senior demo is open in
  // another tab), keep its data and only switch which member you're signed
  // in as — so live checks and check-ins aren't reset.
  const existing = readDemo();
  const state = existing ? { ...existing, role } : buildSeedState(role);
  window.localStorage.setItem(KEY, JSON.stringify(state));
  notifyAll();
}

export function exitDemo() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  notifyAll();
}

export function updateDemo(mutate: (state: DemoState) => void) {
  const state = readDemo();
  if (!state) return;
  mutate(state);
  window.localStorage.setItem(KEY, JSON.stringify(state));
  notifyAll();
}

/* ------------------------------------------------------------------ */
/* React hook                                                          */
/* ------------------------------------------------------------------ */

function getSnapshot(): string {
  if (typeof window === "undefined") return "null";
  return window.localStorage.getItem(KEY) ?? "null";
}

function getServerSnapshot(): string {
  return "null";
}

/** Returns the live demo state, or null when demo mode is off. */
export function useDemoSession(): DemoState | null {
  const raw = useSyncExternalStore(subscribeDemo, getSnapshot, getServerSnapshot);
  // Memoised on the raw string so the returned object keeps a stable
  // identity between renders with unchanged data (safe as an effect dep).
  return useMemo(() => parseDemo(raw), [raw]);
}

function parseDemo(raw: string): DemoState | null {
  if (raw === "null") return null;
  try {
    return JSON.parse(raw) as DemoState;
  } catch {
    return null;
  }
}
