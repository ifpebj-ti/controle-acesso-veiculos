import axios, { AxiosHeaders } from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (!accessToken) return config;

  const headers = AxiosHeaders.from(config.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  config.headers = headers;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      accessToken &&
      axios.isAxiosError(error) &&
      error.response?.status === 401
    ) {
      unauthorizedHandler?.();
    }

    return Promise.reject(error);
  },
);

export function setApiAccessToken(token: string | null) {
  accessToken = token;
}

export function setApiUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}
