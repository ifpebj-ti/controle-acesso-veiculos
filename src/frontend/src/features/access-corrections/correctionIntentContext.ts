import { createContext, useContext, useSyncExternalStore } from "react";
import type { CorrectionIntentStore } from "./intentStore";

export const CorrectionIntentContext =
  createContext<CorrectionIntentStore | null>(null);
export function useCorrectionStore() {
  const store = useContext(CorrectionIntentContext);
  if (!store) throw new Error("Correction review scope is required.");
  return store;
}
export function useCorrectionIntentStore() {
  const store = useCorrectionStore();
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  return { store, snapshot };
}
