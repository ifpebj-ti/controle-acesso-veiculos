import axios from "axios";

export type ApiErrorKind =
  | "access-denied"
  | "conflict"
  | "network"
  | "rate-limited"
  | "session-expired"
  | "unexpected"
  | "validation";

export interface ApiErrorDescription {
  kind: ApiErrorKind;
  message: string;
  status?: number;
}

interface ApiErrorBody {
  detail?: unknown;
  errors?: unknown;
  message?: unknown;
  title?: unknown;
}

export function getApiValidationErrors(error: unknown) {
  if (!axios.isAxiosError(error) || !error.response) return {};

  const body = error.response.data;
  if (!body || typeof body !== "object" || !("errors" in body)) return {};

  const errors = (body as ApiErrorBody).errors;
  if (!errors || typeof errors !== "object") return {};

  return Object.fromEntries(
    Object.entries(errors).flatMap(([field, messages]) => {
      if (!Array.isArray(messages)) return [];
      const message = messages.find((item) => typeof item === "string");
      return typeof message === "string" ? [[field, message]] : [];
    }),
  );
}

function firstValidationMessage(errors: unknown) {
  if (!errors || typeof errors !== "object") return null;

  for (const value of Object.values(errors)) {
    if (Array.isArray(value)) {
      const message = value.find((item) => typeof item === "string");
      if (typeof message === "string") return message;
    }
  }

  return null;
}

export function describeApiError(error: unknown): ApiErrorDescription {
  if (!axios.isAxiosError(error) || !error.response) {
    return {
      kind: "network",
      message:
        "Não foi possível conectar ao sistema. Verifique a rede e tente novamente.",
    };
  }

  const status = error.response.status;
  const body =
    error.response.data && typeof error.response.data === "object"
      ? (error.response.data as ApiErrorBody)
      : null;

  if (status === 400 || status === 422) {
    return {
      kind: "validation",
      message:
        firstValidationMessage(body?.errors) ??
        (typeof body?.detail === "string" ? body.detail : null) ??
        "Revise os dados informados e tente novamente.",
      status,
    };
  }

  if (status === 401) {
    return {
      kind: "session-expired",
      message: "Sua sessão não é mais válida. Entre novamente.",
      status,
    };
  }

  if (status === 403) {
    return {
      kind: "access-denied",
      message: "Seu perfil não possui permissão para realizar esta ação.",
      status,
    };
  }

  if (status === 409) {
    return {
      kind: "conflict",
      message:
        (typeof body?.message === "string" ? body.message : null) ??
        "A operação entra em conflito com o estado atual do registro.",
      status,
    };
  }

  if (status === 429) {
    return {
      kind: "rate-limited",
      message: "Muitas tentativas em pouco tempo. Aguarde e tente novamente.",
      status,
    };
  }

  return {
    kind: "unexpected",
    message:
      "O sistema encontrou um erro inesperado. Tente novamente mais tarde.",
    status,
  };
}
