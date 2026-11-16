import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../services/api";
import { UserAccountsContractError } from "../services/userAccountsService";
import { readReactivationAccount } from "./readReactivationAccount";

vi.mock("../../../services/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));
const account = {
  id: 8,
  name: "Pessoa Fictícia",
  email: "pessoa@example.test",
  profileName: "Administrador",
  active: false,
  authenticationMethod: "Local",
  externalIdentityLinked: false,
  createdAtUtc: "2030-06-10T11:00:00Z",
  updatedAtUtc: null,
  lockedUntilUtc: null,
  requiresPasswordChange: false,
  temporaryCredentialExpiresAtUtc: null,
};

describe("reactivation catalog reconciliation", () => {
  beforeEach(() => vi.clearAllMocks());
  it("reads the canonical method by ID through the existing validated catalog, without active/UI filters", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          items: [{ ...account, id: 9 }],
          page: 1,
          pageSize: 100,
          totalCount: 101,
          totalPages: 2,
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [{ ...account, active: true, authenticationMethod: "Google" }],
          page: 2,
          pageSize: 100,
          totalCount: 101,
          totalPages: 2,
        },
      });
    await expect(
      readReactivationAccount({ ...account, authenticationMethod: "Local" }),
    ).resolves.toEqual({
      id: 8,
      name: account.name,
      active: true,
      authenticationMethod: "Google",
    });
    expect(api.get).toHaveBeenNthCalledWith(2, "/users", {
      params: {
        active: undefined,
        page: 2,
        pageSize: 100,
        search: account.name,
      },
    });
    expect(api.post).not.toHaveBeenCalled();
  });
  it("returns inconclusive absence after at most five catalog pages", async () => {
    vi.mocked(api.get).mockImplementation(async (_url, config) => ({
      data: {
        items: [],
        page: (config?.params as { page: number }).page,
        pageSize: 100,
        totalCount: 10000,
        totalPages: 100,
      },
    }));
    await expect(
      readReactivationAccount({ ...account, authenticationMethod: "Local" }),
    ).resolves.toBeNull();
    expect(api.get).toHaveBeenCalledTimes(5);
    expect(api.post).not.toHaveBeenCalled();
  });
  it("rejects a noncanonical account response instead of inferring a method", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        items: [{ ...account, authenticationMethod: 0 }],
        page: 1,
        pageSize: 100,
        totalCount: 1,
        totalPages: 1,
      },
    });
    await expect(
      readReactivationAccount({ ...account, authenticationMethod: "Local" }),
    ).rejects.toBeInstanceOf(UserAccountsContractError);
  });
  it("does not hide transport errors or invent a user-detail endpoint", async () => {
    const error = new Error("controlled transport");
    vi.mocked(api.get).mockRejectedValue(error);
    await expect(
      readReactivationAccount({ ...account, authenticationMethod: "Local" }),
    ).rejects.toBe(error);
    expect(api.get).toHaveBeenCalledOnce();
  });
});
