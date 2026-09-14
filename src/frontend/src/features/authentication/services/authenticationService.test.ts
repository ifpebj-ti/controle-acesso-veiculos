import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../services/api";
import {
  AuthenticationContractError,
  logoutAuthentication,
  refreshAuthentication,
} from "./authenticationService";

const session = {
  accessToken: "test-only-access-token",
  expiresAtUtc: "2030-06-10T13:00:00Z",
  user: {
    email: "operator@example.test",
    id: 42,
    profileName: "Porteiro",
  },
};

afterEach(() => vi.restoreAllMocks());

describe("authentication session service", () => {
  it("gets a fresh CSRF token before refreshing with cookies enabled globally", async () => {
    const get = vi
      .spyOn(api, "get")
      .mockResolvedValue({ data: { requestToken: "test-only-csrf-token" } });
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: session });

    await expect(refreshAuthentication()).resolves.toEqual(session);
    expect(api.defaults.withCredentials).toBe(true);
    expect(get).toHaveBeenCalledWith("/auth/csrf", {
      skipSessionRefresh: true,
    });
    expect(post).toHaveBeenCalledWith("/auth/refresh", null, {
      headers: { "X-CSRF-TOKEN": "test-only-csrf-token" },
      skipSessionRefresh: true,
    });
    expect(get.mock.invocationCallOrder[0]).toBeLessThan(
      post.mock.invocationCallOrder[0],
    );
  });

  it("gets a fresh CSRF token before server logout", async () => {
    vi.spyOn(api, "get").mockResolvedValue({
      data: { requestToken: "logout-test-csrf-token" },
    });
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: undefined });

    await logoutAuthentication();

    expect(post).toHaveBeenCalledWith("/auth/logout", null, {
      headers: { "X-CSRF-TOKEN": "logout-test-csrf-token" },
      skipSessionRefresh: true,
      timeout: 4_000,
    });
    expect(api.get).toHaveBeenCalledWith("/auth/csrf", {
      skipSessionRefresh: true,
      timeout: 4_000,
    });
  });

  it("rejects an invalid CSRF response without calling refresh", async () => {
    vi.spyOn(api, "get").mockResolvedValue({ data: {} });
    const post = vi.spyOn(api, "post");

    await expect(refreshAuthentication()).rejects.toBeInstanceOf(
      AuthenticationContractError,
    );
    expect(post).not.toHaveBeenCalled();
  });
});
