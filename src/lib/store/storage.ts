/**
 * Thin, SSR-safe wrapper around localStorage. All keys are namespaced so the app
 * can coexist with anything else on the origin. Swapping to Supabase later means
 * replacing the Collection backend (see collection.ts) — nothing here leaks into
 * feature code.
 */

const PREFIX = "autoparts:";

export function readCollection<T>(name: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + name);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export function writeCollection<T>(name: string, data: T[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + name, JSON.stringify(data));
  } catch {
    // storage full or unavailable — fail silently, data stays in memory
  }
}

/** Generate a stable unique id. */
export function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
