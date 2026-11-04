import axios from "axios";
import { useCorrectionIntentStore } from "./correctionIntentContext";
import {
  correctionReasonSchema,
  type CorrectionAction,
  type CorrectionRequest,
} from "./schemas";
import { decideCorrectionRequest, getCorrectionRequest } from "./service";
import { correctionReadError } from "./useCorrectionSubmission";

export function useCorrectionDecision() {
  const { store, snapshot } = useCorrectionIntentStore();
  function prepare(id: number, action: CorrectionAction) {
    const current = store.getSnapshot().decisions[id];
    if (current && current.phase !== "draft") return;
    store.setDecision(id, {
      action,
      reason: current?.reason ?? "",
      phase: "draft",
      reading: false,
      error: null,
    });
  }
  function setReason(id: number, reason: string) {
    const current = store.getSnapshot().decisions[id];
    if (current?.phase === "draft")
      store.setDecision(id, { ...current, reason, error: null });
  }
  function accept(request: CorrectionRequest) {
    const current = store.getSnapshot().decisions[request.id];
    if (!current) return null;
    if (current.phase === "complete") {
      store.setDecision(request.id, { ...current, reading: false });
      return null;
    }
    if (request.status === "Pendente") {
      store.setDecision(request.id, {
        ...current,
        reading: false,
        error:
          "O pedido continua pendente. O resultado da decisão ainda não foi confirmado; consulte novamente, sem reenviar.",
      });
      return null;
    }
    store.setDecision(request.id, {
      ...current,
      phase: "complete",
      reading: false,
      error: null,
    });
    return request;
  }
  async function confirm(id: number) {
    const current = store.getSnapshot().decisions[id];
    if (!current || current.phase !== "draft") return null;
    const reason = correctionReasonSchema.safeParse(current.reason);
    if (!reason.success) {
      store.setDecision(id, {
        ...current,
        error: reason.error.issues[0].message,
      });
      return null;
    }
    store.setDecision(id, {
      ...current,
      reason: reason.data,
      phase: "sending",
      error: null,
    });
    try {
      return accept(
        await decideCorrectionRequest(id, current.action, reason.data),
      );
    } catch (error) {
      const latest = store.getSnapshot().decisions[id];
      if (latest.phase === "complete") return null;
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;
      const phase =
        status === 400 || status === 422 || status === 429
          ? "draft"
          : status === 401 || status === 403
            ? "blocked"
            : "uncertain";
      store.setDecision(id, {
        ...latest,
        phase,
        error:
          phase === "uncertain"
            ? "Não foi possível confirmar a decisão. Consulte o pedido antes de qualquer outra ação; a decisão pode ter sido recebida."
            : correctionReadError(error),
      });
      return null;
    }
  }
  async function reconcile(id: number) {
    const current = store.getSnapshot().decisions[id];
    if (!current || current.reading) return null;
    store.setDecision(id, { ...current, reading: true, error: null });
    try {
      return accept(await getCorrectionRequest(id));
    } catch (error) {
      const latest = store.getSnapshot().decisions[id];
      if (latest.phase !== "complete")
        store.setDecision(id, {
          ...latest,
          reading: false,
          error: correctionReadError(error),
        });
      return null;
    }
  }
  return { snapshot, prepare, setReason, confirm, reconcile };
}
