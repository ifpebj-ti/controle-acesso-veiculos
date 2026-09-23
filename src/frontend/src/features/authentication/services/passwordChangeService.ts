import { api } from "../../../services/api";

export interface AuthenticatedPasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export async function changeAuthenticatedPassword(
  request: AuthenticatedPasswordChangeRequest,
): Promise<void> {
  await api.post("/auth/password", request, { skipSessionRetry: true });
}
