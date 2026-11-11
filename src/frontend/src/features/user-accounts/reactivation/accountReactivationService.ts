import axios from "axios";
import { api } from "../../../services/api";
import {
  describeApiError,
  getApiValidationErrors,
} from "../../../services/api-errors";
import { temporaryCredentialSchema } from "../schemas/userAccountSchemas";
import { UserAccountsContractError } from "../services/userAccountsService";
import type { CredentialResetReason, TemporaryCredential } from "../types";

export class LocalReactivationResetRequiredError extends Error {
  constructor() {
    super(
      "A reativação local exige uma nova credencial temporária. Atualize o estado da conta antes de continuar.",
    );
    this.name = "LocalReactivationResetRequiredError";
  }
}

export async function reactivateGoogleAccount(id: number): Promise<void> {
  try {
    const response = await api.post(`/users/${id}/reactivation`, undefined, {
      skipSessionRetry: true,
    });
    if (response.status !== 204) throw new UserAccountsContractError();
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 409 &&
      error.response.data?.code ===
        "local_reactivation_requires_credential_reset"
    ) {
      throw new LocalReactivationResetRequiredError();
    }
    throw error;
  }
}

export async function reactivateLocalAccount(
  id: number,
  reason: CredentialResetReason,
): Promise<TemporaryCredential> {
  const response = await api.post<unknown>(
    `/users/${id}/reactivation-with-reset`,
    { reason },
    { skipSessionRetry: true },
  );
  if (response.status !== 200) throw new UserAccountsContractError();
  const parsed = temporaryCredentialSchema.safeParse(response.data);
  if (!parsed.success) throw new UserAccountsContractError();
  return parsed.data;
}

export function reactivationFailure(error: unknown) {
  if (error instanceof LocalReactivationResetRequiredError) {
    return {
      kind: "reconcile" as const,
      message: error.message,
      reasonError: null,
    };
  }
  const description = describeApiError(error);
  if (
    description.kind === "validation" ||
    description.kind === "rate-limited"
  ) {
    return {
      kind: "retryable" as const,
      message: description.message,
      reasonError: getApiValidationErrors(error).reason ?? null,
    };
  }
  if (
    description.status === 401 ||
    description.status === 403 ||
    description.status === 404
  ) {
    return {
      kind: "blocked" as const,
      message:
        description.status === 404
          ? "A conta não foi encontrada. Feche esta janela e atualize a lista."
          : description.message,
      reasonError: null,
    };
  }
  return {
    kind: "reconcile" as const,
    message:
      description.kind === "conflict"
        ? description.message
        : "Não foi possível confirmar o resultado da reativação. Consulte o estado da conta sem repetir o envio.",
    reasonError: null,
  };
}
