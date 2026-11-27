import axios from "axios";
import { describeApiError } from "../../services/api-errors";
import {
  accessCorrectionFormSchema,
  type AccessCorrectionFormValues,
} from "../access-records/schemas/accessRecordSchemas";
import { useCorrectionIntentStore } from "./correctionIntentContext";
import {
  CorrectionReviewContractError,
  findOwnCorrectionRequest,
  submitCorrectionRequest,
} from "./service";
import type { CorrectionRequest } from "./schemas";

export function correctionReadError(error: unknown) {
  return error instanceof CorrectionReviewContractError ||
    !axios.isAxiosError(error)
    ? "Não foi possível conferir os dados recebidos. Consulte novamente mais tarde."
    : describeApiError(error).message;
}
export function useCorrectionSubmission() {
  const { store, snapshot } = useCorrectionIntentStore();
  function accept(id: number, request: CorrectionRequest) {
    const current = store.getSnapshot().proposals[id];
    if (
      !current ||
      current.requestKey !== request.requestKey ||
      request.accessRecordId !== id
    )
      return null;
    if (
      (current.request && current.request.status !== "Pendente") ||
      (current.phase === "submitted" &&
        current.request?.status === request.status)
    ) {
      store.setProposal(id, { ...current, reading: false, error: null });
      return null;
    }
    store.setProposal(id, {
      ...current,
      phase: "submitted",
      request,
      reading: false,
      error: null,
    });
    return request;
  }
  async function submit(id: number) {
    const current = store.getSnapshot().proposals[id];
    if (!current || current.phase !== "draft") return null;
    const parsed = accessCorrectionFormSchema.safeParse(current.draft);
    if (!parsed.success) return null;
    const values = parsed.data;
    const payload = {
      requestKey: current.requestKey,
      original: {
        categoryName: current.record.categoryName,
        objective: current.record.objective,
        observation: current.record.observation,
      },
      proposed: {
        categoryName: values.categoryName,
        objective: values.objective,
        observation: values.observation || null,
      },
      justification: values.justification,
    };
    if (JSON.stringify(payload.original) === JSON.stringify(payload.proposed)) {
      store.setProposal(id, {
        ...current,
        error:
          "Altere ao menos um dos dados propostos antes de solicitar a correção.",
      });
      return null;
    }
    store.setProposal(id, {
      ...current,
      payload,
      phase: "sending",
      error: null,
    });
    try {
      return accept(id, await submitCorrectionRequest(id, payload));
    } catch (error) {
      const latest = store.getSnapshot().proposals[id];
      if (!latest || latest.phase === "submitted") return null;
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;
      const phase =
        status === 400 || status === 422 || status === 429
          ? "draft"
          : status === 401 || status === 403
            ? "blocked"
            : status === 409
              ? "conflict"
              : "uncertain";
      store.setProposal(id, {
        ...latest,
        phase,
        error:
          phase === "uncertain"
            ? "Não foi possível confirmar o envio. A solicitação pode ter sido recebida. Consulte o envio sem reenviar."
            : correctionReadError(error),
      });
      return null;
    }
  }
  async function reconcile(id: number) {
    const current = store.getSnapshot().proposals[id];
    if (!current || current.phase === "draft" || current.reading) return null;
    store.setProposal(id, { ...current, reading: true, error: null });
    try {
      const request = await findOwnCorrectionRequest(current.requestKey);
      if (request) {
        if (request.accessRecordId !== id)
          throw new CorrectionReviewContractError();
        return accept(id, request);
      }
      const latest = store.getSnapshot().proposals[id];
      if (latest.phase === "submitted") return null;
      store.setProposal(id, {
        ...latest,
        reading: false,
        rejectedAndAbsent: latest.phase === "conflict",
        error:
          latest.phase === "conflict"
            ? "O conflito foi informado e não há pedido próprio para esta chave. Reconfira os registros antes de preparar outra intenção."
            : "Envio ainda não localizado. Isso não confirma que foi desfeito: ele pode estar em andamento. Continue consultando, sem reenviar.",
      });
      return null;
    } catch (error) {
      const latest = store.getSnapshot().proposals[id];
      if (latest.phase !== "submitted")
        store.setProposal(id, {
          ...latest,
          reading: false,
          error: correctionReadError(error),
        });
      return null;
    }
  }
  function updateDraft(
    id: number,
    field: keyof AccessCorrectionFormValues,
    value: string,
  ) {
    const current = store.getSnapshot().proposals[id];
    if (current?.phase === "draft")
      store.setProposal(id, {
        ...current,
        draft: { ...current.draft, [field]: value },
        error: null,
      });
  }
  return { store, snapshot, submit, reconcile, updateDraft };
}
