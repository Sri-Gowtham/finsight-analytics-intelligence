/**
 * Tiny typed localStorage layer. Every mock API read/write goes through here so
 * the persistence boundary can be swapped for a real backend later.
 */

const PREFIX = "finsight:v1:";

export function readStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStore<T>(key: string, value: T): T {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* quota or private mode — mock data stays in-memory for the session */
    }
  }
  return value;
}

export function clearStore(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PREFIX + key);
}

/** Seeds a collection on first read, then always returns the persisted copy. */
export function collection<T>(key: string, seed: () => T): T {
  const existing = readStore<T | null>(key, null);
  if (existing !== null) return existing;
  return writeStore(key, seed());
}

export const STORE_KEYS = {
  session: "session",
  users: "users",
  clients: "clients",
  insights: "insights",
  scenarios: "scenarios",
  dataSources: "data-sources",
} as const;
