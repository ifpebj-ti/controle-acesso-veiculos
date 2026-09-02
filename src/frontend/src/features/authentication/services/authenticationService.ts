import { api } from "../../../services/api";
import { loginResponseSchema, loginSchema } from "../schemas/loginSchema";
import type { AuthenticatedSession, LoginCredentials } from "../types";

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
  const response = await api.post<unknown>("/auth/login", request);
  const parsedResponse = loginResponseSchema.safeParse(response.data);

  if (!parsedResponse.success) {
    throw new AuthenticationContractError();
  }

  return parsedResponse.data;
}
