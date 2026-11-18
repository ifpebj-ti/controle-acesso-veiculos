import { useContext, useEffect, useState, type ReactNode } from "react";
import { createCorrectionIntentStore } from "./intentStore";

import { CorrectionIntentContext as Context } from "./correctionIntentContext";
function Provider({ children }: { children: ReactNode }) {
  const [store] = useState(createCorrectionIntentStore);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      const current = store.getSnapshot();
      if (
        Object.values(current.proposals).some(
          ({ phase }) => phase === "sending" || phase === "uncertain",
        ) ||
        Object.values(current.decisions).some(
          ({ phase }) => phase === "sending" || phase === "uncertain",
        )
      ) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function CorrectionReviewScope({ children }: { children: ReactNode }) {
  const parent = useContext(Context);
  return parent ? children : <Provider>{children}</Provider>;
}
