import http from "k6/http";
import { check, fail, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const profiles = {
  low: {
    stages: [
      { duration: "15s", target: 1 },
      { duration: "45s", target: 1 },
      { duration: "15s", target: 0 },
    ],
  },
  medium: {
    stages: [
      { duration: "30s", target: 3 },
      { duration: "90s", target: 3 },
      { duration: "30s", target: 0 },
    ],
  },
  intense: {
    stages: [
      { duration: "30s", target: 5 },
      { duration: "120s", target: 5 },
      { duration: "30s", target: 0 },
    ],
  },
};

const profileName = (__ENV.K6_PROFILE || "low").toLowerCase();
const profile = profiles[profileName];

if (!profile) {
  throw new Error("K6_PROFILE must be low, medium, or intense.");
}

const apiBaseUrl = (__ENV.K6_API_BASE_URL || "").replace(/\/+$/, "");
const accessToken = __ENV.K6_ACCESS_TOKEN || "";

validateConfiguration();

const applicationErrors = new Rate("application_errors");
const rateLimitedResponses = new Rate("rate_limited_responses");
const openAccessDuration = new Trend("open_access_duration", true);
const summaryDuration = new Trend("daily_summary_duration", true);

export const options = {
  scenarios: {
    read_only_pilot: {
      executor: "ramping-vus",
      gracefulRampDown: "15s",
      gracefulStop: "15s",
      stages: profile.stages,
      tags: { profile: profileName },
    },
  },
  thresholds: {
    application_errors: [
      { threshold: "rate<0.01", abortOnFail: true, delayAbortEval: "30s" },
    ],
    http_req_duration: ["p(95)<1500", "p(99)<3000"],
    http_req_failed: [
      { threshold: "rate<0.01", abortOnFail: true, delayAbortEval: "30s" },
    ],
    rate_limited_responses: ["rate<0.01"],
  },
  userAgent: "controle-acesso-veiculos-k6/1.0",
};

export function setup() {
  const readiness = http.get(`${apiBaseUrl}/health/ready`, {
    tags: { endpoint: "readiness", operation: "setup" },
  });

  const ready = check(readiness, {
    "API is ready before load": (response) => response.status === 200,
  });

  if (!ready) {
    fail(`Target is not ready (HTTP ${readiness.status}).`);
  }

  return { authorization: `Bearer ${accessToken}` };
}

export default function (data) {
  const requestOptions = {
    headers: {
      Accept: "application/json",
      Authorization: data.authorization,
    },
    redirects: 0,
  };

  const openAccess = http.get(`${apiBaseUrl}/access-records/open`, {
    ...requestOptions,
    tags: { endpoint: "open-accesses" },
  });
  recordResponse(openAccess, openAccessDuration, "open accesses");

  const dailySummary = http.get(`${apiBaseUrl}/operations/daily-summary`, {
    ...requestOptions,
    tags: { endpoint: "daily-summary" },
  });
  recordResponse(dailySummary, summaryDuration, "daily summary");

  sleep(2 + Math.random());
}

export function handleSummary(data) {
  const summary = {
    generatedAtUtc: new Date().toISOString(),
    profile: profileName,
    targetOrigin: redactTarget(apiBaseUrl),
    metrics: data.metrics,
    state: data.state,
  };

  return {
    stdout: `${JSON.stringify(summary, null, 2)}\n`,
    "/results/summary.json": `${JSON.stringify(summary, null, 2)}\n`,
  };
}

function recordResponse(response, durationMetric, operation) {
  const accepted = check(response, {
    [`${operation} returns HTTP 200`]: (candidate) => candidate.status === 200,
  });

  applicationErrors.add(!accepted && response.status !== 429);
  rateLimitedResponses.add(response.status === 429);
  durationMetric.add(response.timings.duration);
}

function validateConfiguration() {
  if (!apiBaseUrl) {
    throw new Error(
      "K6_API_BASE_URL is required, for example https://host/api.",
    );
  }

  if (!accessToken) {
    throw new Error("K6_ACCESS_TOKEN is required and must never be committed.");
  }

  const parsed = new URL(apiBaseUrl);
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);

  if (!isLocal && parsed.protocol !== "https:") {
    throw new Error("Remote targets require HTTPS.");
  }

  if (!isLocal && __ENV.K6_TARGET_APPROVED !== "yes") {
    throw new Error(
      "Set K6_TARGET_APPROVED=yes only after the target and test window are authorized.",
    );
  }

  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error(
      "The target URL cannot contain credentials, query, or fragment.",
    );
  }
}

function redactTarget(target) {
  const parsed = new URL(target);
  return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
}
