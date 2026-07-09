import type { RealtimeChannel } from "@supabase/supabase-js";
import { readCollection, writeCollection, generateId } from "./storage";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * A reactive collection with a swappable backend.
 *
 * - **Supabase mode** (env vars set): rows are fetched from the matching Postgres
 *   table via `hydrate()` (called after login) and every mutation is written
 *   through to Supabase. The in-memory snapshot stays the synchronous source of
 *   truth for React (`useSyncExternalStore`), so no feature screen changes.
 * - **localStorage mode** (no env vars): behaves exactly as before — seeded from
 *   `seed`, persisted to localStorage.
 */
export class Collection<T extends { id: string }> {
  private listeners = new Set<() => void>();
  private snapshot: T[];
  private readonly initial: T[];
  private localHydrated = false;
  private readonly useSupabase = isSupabaseConfigured;
  private channel: RealtimeChannel | null = null;

  constructor(
    private readonly name: string,
    private readonly seed: T[],
  ) {
    // Supabase starts empty (filled by hydrate); local starts from seed.
    this.initial = this.useSupabase ? [] : seed;
    this.snapshot = this.initial;
  }

  /* -------- localStorage lazy load (fallback mode) -------- */
  private localHydrate() {
    if (this.localHydrated || typeof window === "undefined") return;
    this.snapshot = readCollection(this.name, this.seed);
    writeCollection(this.name, this.snapshot);
    this.localHydrated = true;
  }

  private commit(next: T[]) {
    this.snapshot = next;
    if (!this.useSupabase) writeCollection(this.name, next);
    this.listeners.forEach((notify) => notify());
  }

  /* -------- external store contract -------- */
  subscribe = (onChange: () => void): (() => void) => {
    this.listeners.add(onChange);
    return () => this.listeners.delete(onChange);
  };

  getSnapshot = (): T[] => {
    if (!this.useSupabase) this.localHydrate();
    return this.snapshot;
  };

  getServerSnapshot = (): T[] => this.initial;

  /* -------- backend load / reset -------- */
  /** Load all rows from Supabase (no-op in local mode beyond ensuring load). */
  async hydrate(): Promise<void> {
    if (!this.useSupabase) {
      this.localHydrate();
      return;
    }
    if (!supabase) return;
    const { data, error } = await supabase.from(this.name).select("*");
    if (error) {
      console.error(`[supabase] load ${this.name}:`, error.message);
      return;
    }
    this.snapshot = (data as T[]) ?? [];
    this.listeners.forEach((notify) => notify());
    this.startRealtime();
  }

  /**
   * Subscribe to Postgres changes so edits from other tabs/users appear live.
   * Applied idempotently by id, so it also safely reconciles our own writes.
   */
  private startRealtime() {
    if (!this.useSupabase || !supabase || this.channel) return;
    this.channel = supabase
      .channel(`realtime:${this.name}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: this.name },
        (payload) => this.applyRealtime(payload),
      )
      .subscribe();
  }

  private applyRealtime(payload: {
    eventType: "INSERT" | "UPDATE" | "DELETE";
    new: Record<string, unknown>;
    old: Record<string, unknown>;
  }) {
    if (payload.eventType === "DELETE") {
      const id = payload.old?.id as string | undefined;
      if (!id) return;
      this.snapshot = this.snapshot.filter((row) => row.id !== id);
    } else {
      const row = payload.new as unknown as T;
      const exists = this.snapshot.some((r) => r.id === row.id);
      this.snapshot = exists
        ? this.snapshot.map((r) => (r.id === row.id ? row : r))
        : [row, ...this.snapshot];
    }
    this.listeners.forEach((notify) => notify());
  }

  /** Clear the in-memory cache and unsubscribe realtime (e.g. on logout). */
  reset(): void {
    if (this.channel && supabase) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.snapshot = this.initial;
    this.listeners.forEach((notify) => notify());
  }

  /* --------------- reads --------------- */
  list(): T[] {
    return this.getSnapshot();
  }

  getById(id: string): T | undefined {
    return this.getSnapshot().find((row) => row.id === id);
  }

  /* -------------- mutations (optimistic + write-through) ------------- */
  create(input: Omit<T, "id"> & { id?: string }): T {
    const record = { ...input, id: input.id ?? generateId() } as T;
    this.commit([record, ...this.snapshot]);
    if (this.useSupabase && supabase) {
      supabase
        .from(this.name)
        .insert(record as never)
        .then(({ error }) => error && console.error(`[supabase] insert ${this.name}:`, error.message));
    }
    return record;
  }

  update(id: string, patch: Partial<T>): T | undefined {
    let updated: T | undefined;
    const next = this.snapshot.map((row) => {
      if (row.id !== id) return row;
      updated = { ...row, ...patch };
      return updated;
    });
    this.commit(next);
    if (updated && this.useSupabase && supabase) {
      supabase
        .from(this.name)
        .update(patch as never)
        .eq("id", id)
        .then(({ error }) => error && console.error(`[supabase] update ${this.name}:`, error.message));
    }
    return updated;
  }

  remove(id: string): void {
    this.commit(this.snapshot.filter((row) => row.id !== id));
    if (this.useSupabase && supabase) {
      supabase
        .from(this.name)
        .delete()
        .eq("id", id)
        .then(({ error }) => error && console.error(`[supabase] delete ${this.name}:`, error.message));
    }
  }

  removeMany(ids: Set<string>): void {
    this.commit(this.snapshot.filter((row) => !ids.has(row.id)));
    if (this.useSupabase && supabase) {
      supabase
        .from(this.name)
        .delete()
        .in("id", [...ids])
        .then(({ error }) => error && console.error(`[supabase] delete ${this.name}:`, error.message));
    }
  }

  /** Replace the entire collection (used by import). */
  replaceAll(rows: T[]): void {
    this.commit(rows);
    if (this.useSupabase && supabase) {
      supabase
        .from(this.name)
        .upsert(rows as never)
        .then(({ error }) => error && console.error(`[supabase] upsert ${this.name}:`, error.message));
    }
  }
}
