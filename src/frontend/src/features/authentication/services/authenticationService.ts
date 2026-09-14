import { api } from "../../../services/api";
import { loginResponseSchema, loginSchema } from "../schemas/loginSchema";
import type { AuthenticatedSession, LoginCredentials } from "../types";
import { z } from "zod";

const csrfResponseSchema = z
  .object({ requestToken: z.string().min(1) })
  .strict();

const sessionRequestConfig = {
  skipSessionRefresh: true,
} as const;
const logoutConfirmationTimeoutMilliseconds = 4_000;

export class AuthenticationContractError extends Error {
  constructor() {
    super("The authentication response does not match the expected contract.");
    this.name = "AuthenticationContractError";
  }
}

export async function authenticate(
  credentials: LoginCredentials,
): Promise<AuthenticatedSession> {
  const request = loginSchema.parse(credentials);
  const response = await api.post<unknown>(
    "/auth/login",
    request,
    sessionRequestConfig,
  );
  return parseAuthenticatedSession(response.data);
}

export async function refreshAuthentication(): Promise<AuthenticatedSession> {
  const requestToken = await requestCsrfToken();
  const response = await api.post<unknown>("/auth/refresh", null, {
    ...sessionRequestConfig,
    headers: { "X-CSRF-TOKEN": requestToken },
  });
  return parseAuthenticatedSession(response.data);
}

export async function logoutAuthentication(): Promise<void> {
  const requestToken = await requestCsrfToken(
    logoutConfirmationTimeoutMilliseconds,
  );
  await api.post("/auth/logout", null, {
    ...sessionRequestConfig,
    headers: { "X-CSRF-TOKEN": requestToken },
    timeout: logoutConfirmationTimeoutMilliseconds,
  });
}

async function requestCsrfToken(timeout?: number): Promise<string> {
  const response = await api.get<unknown>("/auth/csrf", {
    ...sessionRequestConfig,
    ...(timeout === undefined ? {} : { timeout }),
  });
  const parsedResponse = csrfResponseSchema.safeParse(response.data);

  if (!parsedResponse.success) {
    throw new AuthenticationContractError();
  }

  return parsedResponse.data.requestToken;
}

function parseAuthenticatedSession(data: unknown): AuthenticatedSession {
  const parsedResponse = loginResponseSchema.safeParse(data);

  if (!parsedResponse.success) {
    throw new AuthenticationContractError();
  }

  return parsedResponse.data;
}
