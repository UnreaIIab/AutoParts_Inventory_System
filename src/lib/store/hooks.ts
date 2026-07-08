"use client";

import { useSyncExternalStore } from "react";
import type { Collection } from "./collection";

/** Reactively read a collection. Re-renders on any create/update/remove. */
export function useCollection<T extends { id: string }>(
  collection: Collection<T>,
): T[] {
  return useSyncExternalStore(
    collection.subscribe,
    collection.getSnapshot,
    collection.getServerSnapshot,
  );
}
