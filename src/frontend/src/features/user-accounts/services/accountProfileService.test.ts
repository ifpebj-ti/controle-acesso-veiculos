import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../services/api";
import {
  changeAccountProfile,
  createUserAccount,
  searchUserAccounts,
  UserAccountsContractError,
} from "./userAccountsService";
import { changeAccountProfileFormSchema } from "../schemas/userAccountSchemas";

vi.mock("../../../services/api", () => ({
  api: { get: vi.fn(), put: vi.fn(), post: vi.fn() },
}));
const operational = {
  previousProfileName: "Porteiro",
  currentProfileName: "Vigilante",
  authenticationMethod: "Google",
  temporaryCredential: null,
  temporaryCredentialExpiresAtUtc: null,
};

describe("profile change contract", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["Porteiro", "Vigilante", "SetorTransporte", "Administrador"])(
    "accepts the public profile %s",
    async (profile) => {
      const response =
        profile === "Administrador"
          ? {
              ...operational,
              currentProfileName: profile,
              authenticationMethod: "Local",
              temporaryCredential: "fictitious-single-use-credential",
              temporaryCredentialExpiresAtUtc: "2030-06-10T12:00:00Z",
            }
          : { ...operational, currentProfileName: profile };
      vi.mocked(api.put).mockResolvedValue({ data: response });
      const input = {
        profileName: profile as "Vigilante",
        reason: "Justificativa fictícia para teste",
      };
      expect(await changeAccountProfile(8, input)).toEqual(response);
      expect(api.put).toHaveBeenCalledExactlyOnceWith(
        "/users/8/profile",
        input,
        { skipSessionRetry: true },
      );
    },
  );

  it.each([
    { ...operational, currentProfileName: "Unknown" },
    { ...operational, previousProfileName: "Unknown" },
    { ...operational, authenticationMethod: "Unknown" },
    { ...operational, authenticationMethod: "Local" },
    { ...operational, temporaryCredential: "unexpected-credential" },
    { ...operational, temporaryCredentialExpiresAtUtc: "invalid" },
    { currentProfileName: "Vigilante" },
  ])(
    "rejects an incompatible response without exposing partial results",
    async (response) => {
      vi.mocked(api.put).mockResolvedValue({ data: response });
      await expect(
        changeAccountProfile(8, {
          profileName: "Vigilante",
          reason: "Justificativa fictícia",
        }),
      ).rejects.toBeInstanceOf(UserAccountsContractError);
    },
  );

  it.each([401, 403, 409, 429])("does not retry HTTP %s", async (status) => {
    const error = { isAxiosError: true, response: { status } };
    vi.mocked(api.put).mockRejectedValue(error);
    await expect(
      changeAccountProfile(8, {
        profileName: "Vigilante",
        reason: "Justificativa fictícia",
      }),
    ).rejects.toBe(error);
    expect(api.put).toHaveBeenCalledTimes(1);
  });

  it.each(["", "curta", " ".repeat(12), "a".repeat(501)])(
    "rejects justification outside the backend limits",
    (reason) => {
      expect(
        changeAccountProfileFormSchema.safeParse({
          profileName: "Porteiro",
          reason,
        }).success,
      ).toBe(false);
    },
  );

  it.each([10, 500])(
    "accepts a trimmed justification with %s characters",
    (length) => {
      expect(
        changeAccountProfileFormSchema.parse({
          profileName: "Porteiro",
          reason: ` ${"a".repeat(length)} `,
        }).reason,
      ).toHaveLength(length);
    },
  );

  it("accepts the real account listing fields and nullable Google creation credential", async () => {
    const item = {
      active: true,
      authenticationMethod: "Google",
      externalIdentityLinked: false,
      createdAtUtc: "2030-06-10T11:00:00Z",
      email: "ficticio@example.test",
      id: 8,
      lockedUntilUtc: null,
      name: "Pessoa Fictícia",
      profileName: "Porteiro",
      requiresPasswordChange: false,
      temporaryCredentialExpiresAtUtc: null,
      updatedAtUtc: null,
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
    expect(
      (await searchUserAccounts({ page: 1, pageSize: 25, search: "" }))
        .items[0],
    ).toEqual(item);
    const creation = {
      id: item.id,
      email: item.email,
      profileName: item.profileName,
      authenticationMethod: "Google",
      temporaryCredential: null,
      temporaryCredentialExpiresAtUtc: null,
    };
    vi.mocked(api.post).mockResolvedValue({ data: creation });
    expect(
      await createUserAccount({
        name: item.name,
        email: item.email,
        profileName: "Porteiro",
      }),
    ).toEqual(creation);
  });
});
