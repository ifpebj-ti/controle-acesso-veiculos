import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../services/api";
import {
  createUserAccount,
  deactivateUserAccount,
  reactivateUserAccount,
  resetTemporaryCredential,
  searchUserAccounts,
  UserAccountsContractError,
} from "./userAccountsService";

vi.mock("../../../services/api", () => ({
  api: { delete: vi.fn(), get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

const account = {
  authenticationMethod: "Local",
  externalIdentityLinked: false,
  active: true,
  createdAtUtc: "2030-06-10T11:00:00Z",
  email: "gestor.ficticio@example.test",
  id: 8,
  lockedUntilUtc: null,
  name: "Gestor Fictício",
  profileName: "SetorTransporte",
  requiresPasswordChange: true,
  temporaryCredentialExpiresAtUtc: "2030-06-10T11:30:00Z",
  updatedAtUtc: null,
};

describe("userAccountsService", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["Local", "Google"])(
    "accepts the published %s account fields",
    async (authenticationMethod) => {
      const item = {
        ...account,
        authenticationMethod,
        externalIdentityLinked: authenticationMethod === "Google",
        requiresPasswordChange: false,
        temporaryCredentialExpiresAtUtc: null,
      };
      vi.mocked(api.get).mockResolvedValue({
        data: {
          items: [item],
          page: 1,
          pageSize: 25,
          totalCount: 1,
          totalPages: 1,
        },
      });
      const result = await searchUserAccounts({
        page: 1,
        pageSize: 25,
        search: "",
      });
      expect(result.items).toEqual([item]);
    },
  );

  it.each([
    { ...account, authenticationMethod: "Unknown" },
    { ...account, externalIdentityLinked: "true" },
    { ...account, unexpectedField: true },
  ])("keeps account validation strict", async (item) => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        items: [item],
        page: 1,
        pageSize: 25,
        totalCount: 1,
        totalPages: 1,
      },
    });
    await expect(
      searchUserAccounts({ page: 1, pageSize: 25, search: "" }),
    ).rejects.toBeInstanceOf(UserAccountsContractError);
  });

  it("accepts Google creation with both credential fields null", async () => {
    const created = {
      email: account.email,
      id: 9,
      profileName: "Porteiro",
      authenticationMethod: "Google",
      temporaryCredential: null,
      temporaryCredentialExpiresAtUtc: null,
    };
    vi.mocked(api.post).mockResolvedValueOnce({ data: created });
    await expect(
      createUserAccount({
        email: account.email,
        name: account.name,
        profileName: "Porteiro",
      }),
    ).resolves.toEqual(created);
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      authenticationMethod: "Google",
      temporaryCredential: "fictitious-unexpected",
      temporaryCredentialExpiresAtUtc: null,
    },
    {
      authenticationMethod: "Google",
      temporaryCredential: null,
      temporaryCredentialExpiresAtUtc: "2030-06-10T12:00:00Z",
    },
    {
      authenticationMethod: "Local",
      temporaryCredential: null,
      temporaryCredentialExpiresAtUtc: null,
    },
  ])(
    "rejects credential fields inconsistent with the authentication method",
    async (credential) => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          email: account.email,
          id: 9,
          profileName: "Porteiro",
          ...credential,
        },
      });
      await expect(
        createUserAccount({
          email: account.email,
          name: account.name,
          profileName: "Porteiro",
        }),
      ).rejects.toBeInstanceOf(UserAccountsContractError);
      expect(api.post).toHaveBeenCalledTimes(1);
    },
  );

  it("uses the documented account lifecycle endpoints", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        items: [account],
        page: 1,
        pageSize: 25,
        totalCount: 1,
        totalPages: 1,
      },
    });
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        email: account.email,
        id: account.id,
        profileName: account.profileName,
        authenticationMethod: "Local",
        temporaryCredential: "temporary-test-credential",
        temporaryCredentialExpiresAtUtc: "2030-06-10T11:30:00Z",
      },
    });
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        temporaryCredential: "replacement-test-credential",
        temporaryCredentialExpiresAtUtc: "2030-06-10T12:00:00Z",
      },
    });
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });
    const input = {
      email: account.email,
      name: account.name,
      profileName: "SetorTransporte" as const,
    };

    await searchUserAccounts({
      active: true,
      page: 1,
      pageSize: 25,
      search: " gestor ",
    });
    await createUserAccount(input);
    await resetTemporaryCredential(account.id, "Esquecimento");
    await deactivateUserAccount(account.id);
    await reactivateUserAccount(account.id);

    expect(api.get).toHaveBeenCalledWith("/users", {
      params: { active: true, page: 1, pageSize: 25, search: "gestor" },
    });
    expect(api.post).toHaveBeenNthCalledWith(1, "/users", input, {
      skipSessionRetry: true,
    });
    expect(api.post).toHaveBeenNthCalledWith(
      2,
      "/users/8/temporary-credential",
      { reason: "Esquecimento" },
      { skipSessionRetry: true },
    );
    expect(api.delete).toHaveBeenCalledWith("/users/8");
    expect(api.post).toHaveBeenNthCalledWith(3, "/users/8/reactivation");
  });

  it("prevents automatic session retries for credential mutations", async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({
        data: {
          email: account.email,
          id: account.id,
          profileName: account.profileName,
          authenticationMethod: "Local",
          temporaryCredential: "temporary-test-credential",
          temporaryCredentialExpiresAtUtc: "2030-06-10T11:30:00Z",
        },
      })
      .mockResolvedValueOnce({
        data: {
          temporaryCredential: "replacement-test-credential",
          temporaryCredentialExpiresAtUtc: "2030-06-10T12:00:00Z",
        },
      });

    await createUserAccount({
      email: account.email,
      name: account.name,
      profileName: "SetorTransporte",
    });
    await resetTemporaryCredential(account.id, "Esquecimento");

    expect(api.post).toHaveBeenNthCalledWith(1, "/users", expect.any(Object), {
      skipSessionRetry: true,
    });
    expect(api.post).toHaveBeenNthCalledWith(
      2,
      "/users/8/temporary-credential",
      { reason: "Esquecimento" },
      { skipSessionRetry: true },
    );
  });

  it("rejects incomplete creation and reset responses before exposing a credential", async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({
        data: {
          email: account.email,
          id: account.id,
          profileName: account.profileName,
        },
      })
      .mockResolvedValueOnce({
        data: { temporaryCredential: "incomplete-test-credential" },
      });

    await expect(
      createUserAccount({
        email: account.email,
        name: account.name,
        profileName: "SetorTransporte",
      }),
    ).rejects.toMatchObject({ name: "UserAccountsContractError" });
    await expect(
      resetTemporaryCredential(account.id, "ProvisionamentoCorretivo"),
    ).rejects.toMatchObject({ name: "UserAccountsContractError" });
  });

  it("omits an empty search and rejects invalid external data", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          items: [],
          page: 1,
          pageSize: 25,
          totalCount: 0,
          totalPages: 0,
        },
      })
      .mockResolvedValueOnce({ data: { items: [{ id: "invalid" }] } });

    await searchUserAccounts({ page: 1, pageSize: 25, search: "   " });
    expect(api.get).toHaveBeenNthCalledWith(1, "/users", {
      params: {
        active: undefined,
        page: 1,
        pageSize: 25,
        search: undefined,
      },
    });
    await expect(
      searchUserAccounts({ page: 1, pageSize: 25, search: "" }),
    ).rejects.toMatchObject({ name: "UserAccountsContractError" });
  });
});
