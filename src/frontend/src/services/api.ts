import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    sessionRetryAttempted?: boolean;
    skipSessionRetry?: boolean;
    skipSessionRefresh?: boolean;
  }

  interface InternalAxiosRequestConfig {
    sessionRetryAttempted?: boolean;
    skipSessionRetry?: boolean;
    sessionTokenVersion?: number;
    skipSessionRefresh?: boolean;
  }
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

let accessToken: string | null = null;
let accessTokenVersion = 0;
let sessionRefreshHandler: (() => Promise<string>) | null = null;
let sessionRefreshInFlight: Promise<string> | null = null;
let unauthorizedHandler: (() => void) | null = null;

const sessionEndpointPattern =
  /^\/?auth\/(?:csrf|login|refresh|logout)(?:[/?#]|$)/;

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (
    !accessToken ||
    config.skipSessionRefresh ||
    sessionEndpointPattern.test(config.url ?? "")
  ) {
    return config;
  }

  const headers = AxiosHeaders.from(config.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  config.headers = headers;
  config.sessionTokenVersion = accessTokenVersion;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const config = error.config as InternalAxiosRequestConfig | undefined;
    const isSessionEndpoint = sessionEndpointPattern.test(config?.url ?? "");

    if (config?.skipSessionRetry) {
      unauthorizedHandler?.();
      return Promise.reject(error);
    }

    if (
      !config ||
      config.skipSessionRefresh ||
      isSessionEndpoint ||
      !accessToken ||
      !sessionRefreshHandler
    ) {
      return Promise.reject(error);
    }

    if (config.sessionRetryAttempted) {
      unauthorizedHandler?.();
      return Promise.reject(error);
    }

    config.sessionRetryAttempted = true;

    try {
      const token =
        config.sessionTokenVersion !== undefined &&
        config.sessionTokenVersion !== accessTokenVersion
          ? accessToken
          : await refreshSessionOnce();
      const headers = AxiosHeaders.from(config.headers);
      headers.set("Authorization", `Bearer ${token}`);
      config.headers = headers;
      config.sessionTokenVersion = accessTokenVersion;
      return api.request(config);
    } catch {
      return Promise.reject(error);
    }
  },
);

export function setApiAccessToken(token: string | null) {
  accessToken = token;
  accessTokenVersion += 1;
}

export function setApiSessionRefreshHandler(
  handler: (() => Promise<string>) | null,
) {
  sessionRefreshHandler = handler;
  sessionRefreshInFlight = null;
}

export function setApiUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

function refreshSessionOnce() {
  if (sessionRefreshInFlight) return sessionRefreshInFlight;
  if (!sessionRefreshHandler) {
    return Promise.reject(new Error("Session refresh is not configured."));
  }

  const request = sessionRefreshHandler().finally(() => {
    if (sessionRefreshInFlight === request) sessionRefreshInFlight = null;
  });
  sessionRefreshInFlight = request;
  return request;
}
