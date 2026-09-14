import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  api,
  setApiAccessToken,
  setApiSessionRefreshHandler,
  setApiUnauthorizedHandler,
} from "./api";

function unauthorized(config: InternalAxiosRequestConfig) {
  return {
    config,
    isAxiosError: true,
    response: { config, data: null, headers: {}, status: 401 },
  };
}

function success(
  config: InternalAxiosRequestConfig,
  data: unknown = { ok: true },
): AxiosResponse {
  return { config, data, headers: {}, status: 200, statusText: "OK" };
}

afterEach(() => {
  setApiAccessToken(null);
  setApiSessionRefreshHandler(null);
  setApiUnauthorizedHandler(null);
});

describe("authenticated API requests", () => {
  it("shares one renewal between concurrent requests and retries each once", async () => {
    setApiAccessToken("expired-test-token");
    let releaseRefresh: ((token: string) => void) | undefined;
    const refresh = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          releaseRefresh = resolve;
        }),
    );
    setApiSessionRefreshHandler(refresh);
    const attempts = new Map<string, number>();
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      const url = config.url ?? "";
      const attempt = (attempts.get(url) ?? 0) + 1;
      attempts.set(url, attempt);
      if (attempt === 1) throw unauthorized(config);
      return success(config);
    });

    const first = api.get("/first", { adapter });
    const second = api.get("/second", { adapter });
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    releaseRefresh?.("renewed-test-token");

    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(refresh).toHaveBeenCalledOnce();
    expect(attempts).toEqual(
      new Map([
        ["/first", 2],
        ["/second", 2],
      ]),
    );
  });

  it("retries a mutation once without issuing duplicate renewals", async () => {
    setApiAccessToken("expired-test-token");
    const refresh = vi.fn().mockResolvedValue("renewed-test-token");
    setApiSessionRefreshHandler(refresh);
    let attempts = 0;

    await expect(
      api.post(
        "/access-records",
        { plate: "TST1A23" },
        {
          adapter: async (config) => {
            attempts += 1;
            if (attempts === 1) throw unauthorized(config);
            return success(config, { id: 10 });
          },
        },
      ),
    ).resolves.toMatchObject({ data: { id: 10 } });

    expect(refresh).toHaveBeenCalledOnce();
    expect(attempts).toBe(2);
  });

  it("stops after one retry and ends the rejected session", async () => {
    setApiAccessToken("expired-test-token");
    setApiSessionRefreshHandler(async () => "renewed-test-token");
    const unauthorizedHandler = vi.fn();
    setApiUnauthorizedHandler(unauthorizedHandler);
    let attempts = 0;

    await expect(
      api.get("/protected", {
        adapter: async (config) => {
          attempts += 1;
          throw unauthorized(config);
        },
      }),
    ).rejects.toMatchObject({ isAxiosError: true });

    expect(attempts).toBe(2);
    expect(unauthorizedHandler).toHaveBeenCalledOnce();
  });

  it.each(["/auth/login", "/auth/refresh", "/auth/logout", "/auth/csrf"])(
    "never renews or retries the session endpoint %s",
    async (url) => {
      setApiAccessToken("expired-test-token");
      const refresh = vi.fn().mockResolvedValue("renewed-test-token");
      setApiSessionRefreshHandler(refresh);
      let attempts = 0;

      await expect(
        api.post(url, null, {
          adapter: async (config) => {
            attempts += 1;
            throw unauthorized(config);
          },
        }),
      ).rejects.toMatchObject({ isAxiosError: true });

      expect(refresh).not.toHaveBeenCalled();
      expect(attempts).toBe(1);
    },
  );

  it("does not renew or repeat a network failure", async () => {
    setApiAccessToken("test-token");
    const refresh = vi.fn().mockResolvedValue("renewed-test-token");
    setApiSessionRefreshHandler(refresh);
    let attempts = 0;

    await expect(
      api.get("/protected", {
        adapter: async () => {
          attempts += 1;
          throw new Error("network unavailable");
        },
      }),
    ).rejects.toThrow("network unavailable");

    expect(refresh).not.toHaveBeenCalled();
    expect(attempts).toBe(1);
  });
});
