import { readCollection, writeCollection, generateId } from "./storage";

/**
 * A reactive, localStorage-backed collection. Designed for React's
 * useSyncExternalStore: `subscribe` + `getSnapshot` give tear-free reads and the
 * mutation methods notify subscribers. Snapshots are cached by reference so React
 * only re-renders when data actually changes.
 *
 * To move to Supabase: implement the same public surface (list/getById/create/
 * update/remove/...) backed by supabase-js and keep subscribe/getSnapshot for
 * realtime. Feature code depends only on this surface.
 */
export class Collection<T extends { id: string }> {
  private listeners = new Set<() => void>();
  private snapshot: T[];
  private hydrated = false;

  constructor(
    private readonly name: string,
    private readonly seed: T[],
  ) {
    this.snapshot = seed;
  }

  /** Lazily load from localStorage on the client (idempotent). */
  private hydrate() {
    if (this.hydrated || typeof window === "undefined") return;
    this.snapshot = readCollection(this.name, this.seed);
    writeCollection(this.name, this.snapshot); // persist seed on first run
    this.hydrated = true;
  }

  private commit(next: T[]) {
    this.snapshot = next;
    writeCollection(this.name, next);
    this.listeners.forEach((notify) => notify());
  }

  /* -------- external store contract -------- */
  subscribe = (onChange: () => void): (() => void) => {
    this.listeners.add(onChange);
    return () => this.listeners.delete(onChange);
  };

  getSnapshot = (): T[] => {
    this.hydrate();
    return this.snapshot;
  };

  getServerSnapshot = (): T[] => this.seed;

  /* --------------- reads --------------- */
  list(): T[] {
    return this.getSnapshot();
  }

  getById(id: string): T | undefined {
    return this.getSnapshot().find((row) => row.id === id);
  }

  /* -------------- mutations ------------- */
  create(input: Omit<T, "id"> & { id?: string }): T {
    const record = { ...input, id: input.id ?? generateId() } as T;
    this.commit([record, ...this.getSnapshot()]);
    return record;
  }

  update(id: string, patch: Partial<T>): T | undefined {
    let updated: T | undefined;
    const next = this.getSnapshot().map((row) => {
      if (row.id !== id) return row;
      updated = { ...row, ...patch };
      return updated;
    });
    this.commit(next);
    return updated;
  }

  remove(id: string): void {
    this.commit(this.getSnapshot().filter((row) => row.id !== id));
  }

  removeMany(ids: Set<string>): void {
    this.commit(this.getSnapshot().filter((row) => !ids.has(row.id)));
  }

  /** Replace the entire collection (used by import). */
  replaceAll(rows: T[]): void {
    this.commit(rows);
  }
}
