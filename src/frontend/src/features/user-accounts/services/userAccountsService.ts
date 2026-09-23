import { api } from "../../../services/api";
import {
  createdUserAccountSchema,
  temporaryCredentialSchema,
  userAccountPageSchema,
} from "../schemas/userAccountSchemas";
import type {
  CreatedUserAccount,
  CredentialResetReason,
  CreateUserAccountInput,
  TemporaryCredential,
  UserAccountFilters,
  UserAccountPage,
} from "../types";

export class UserAccountsContractError extends Error {
  constructor() {
    super("The user accounts response does not match the expected contract.");
    this.name = "UserAccountsContractError";
  }
}

function parseContract<T>(
  result: { success: true; data: T } | { success: false },
): T {
  if (!result.success) throw new UserAccountsContractError();
  return result.data;
}

export async function searchUserAccounts(
  filters: UserAccountFilters,
): Promise<UserAccountPage> {
  const response = await api.get<unknown>("/users", {
    params: {
      active: filters.active,
      page: filters.page,
      pageSize: filters.pageSize,
      search: filters.search.trim() || undefined,
    },
  });
  return parseContract(userAccountPageSchema.safeParse(response.data));
}

export async function createUserAccount(
  input: CreateUserAccountInput,
): Promise<CreatedUserAccount> {
  const response = await api.post<unknown>("/users", input);
  return parseContract(createdUserAccountSchema.safeParse(response.data));
}

export async function resetTemporaryCredential(
  accountId: number,
  reason: CredentialResetReason,
): Promise<TemporaryCredential> {
  const response = await api.post<unknown>(
    `/users/${accountId}/temporary-credential`,
    { reason },
  );
  return parseContract(temporaryCredentialSchema.safeParse(response.data));
}

export async function deactivateUserAccount(accountId: number): Promise<void> {
  await api.delete(`/users/${accountId}`);
}

export async function reactivateUserAccount(accountId: number): Promise<void> {
  await api.post(`/users/${accountId}/reactivation`);
}
