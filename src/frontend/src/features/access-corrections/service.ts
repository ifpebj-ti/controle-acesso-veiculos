import axios from "axios";
import { api } from "../../services/api";
import {
  correctionPageSchema,
  correctionRequestSchema,
  type CorrectionAction,
  type CorrectionRequest,
  type CorrectionStatus,
  type CorrectionSubmission,
} from "./schemas";

export class CorrectionReviewContractError extends Error {
  constructor() {
    super("Invalid correction review response.");
    this.name = "CorrectionReviewContractError";
  }
}
function parseRequest(data: unknown): CorrectionRequest {
  const parsed = correctionRequestSchema.safeParse(data);
  if (!parsed.success) throw new CorrectionReviewContractError();
  return parsed.data;
}
export async function submitCorrectionRequest(
  id: number,
  input: CorrectionSubmission,
) {
  const response = await api.post<unknown>(
    `/access-records/${id}/correction-requests`,
    input,
    { skipSessionRetry: true },
  );
  const result = parseRequest(response.data);
  if (result.accessRecordId !== id || result.requestKey !== input.requestKey)
    throw new CorrectionReviewContractError();
  return result;
}
export async function findOwnCorrectionRequest(requestKey: string) {
  try {
    const response = await api.get<unknown>(
      `/access-correction-requests/by-key/${encodeURIComponent(requestKey)}`,
    );
    const result = parseRequest(response.data);
    if (result.requestKey !== requestKey)
      throw new CorrectionReviewContractError();
    return result;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404)
      return null;
    throw error;
  }
}
export async function getCorrectionRequest(id: number) {
  const response = await api.get<unknown>(`/access-correction-requests/${id}`);
  const result = parseRequest(response.data);
  if (result.id !== id) throw new CorrectionReviewContractError();
  return result;
}
export async function searchCorrectionRequests(
  status: CorrectionStatus | "",
  page: number,
) {
  const response = await api.get<unknown>("/access-correction-requests", {
    params: { status: status || undefined, page, pageSize: 25 },
  });
  const result = correctionPageSchema.safeParse(response.data);
  if (!result.success) throw new CorrectionReviewContractError();
  return result.data;
}
export async function decideCorrectionRequest(
  id: number,
  action: CorrectionAction,
  justification: string,
) {
  const response = await api.post<unknown>(
    `/access-correction-requests/${id}/${action === "Cancel" ? "cancellation" : "decision"}`,
    action === "Cancel"
      ? { justification }
      : { decision: action, justification },
    { skipSessionRetry: true },
  );
  const result = parseRequest(response.data);
  if (result.id !== id || result.status === "Pendente")
    throw new CorrectionReviewContractError();
  return result;
}
