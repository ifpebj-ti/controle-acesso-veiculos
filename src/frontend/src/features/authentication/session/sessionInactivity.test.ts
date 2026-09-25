import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";

import {
  SessionInactivityMonitor,
  sessionAbsoluteLifetimeMilliseconds,
  sessionInactivityWindowMilliseconds,
} from "./sessionInactivity";

const startTime = Date.parse("2030-06-10T12:00:00Z");

describe("session inactivity monitor", () => {
  let monotonic: number;
  let wall: number;
  let expired: Mock<() => void>;
  let monitor: SessionInactivityMonitor;

  beforeEach(() => {
    vi.useFakeTimers();
    monotonic = 0;
    wall = startTime;
    expired = vi.fn();
    monitor = new SessionInactivityMonitor({
      clock: () => ({ monotonic, wall }),
      onExpired: expired,
    });
    monitor.start({
      absoluteExpiresAtUtc: new Date(
        startTime + 12 * 60 * 60_000,
      ).toISOString(),
      inactivityExpiresAtUtc: new Date(
        startTime + sessionInactivityWindowMilliseconds,
      ).toISOString(),
    });
  });

  afterEach(() => {
    monitor.stop();
    vi.useRealTimers();
  });

  async function advance(milliseconds: number, runTimers = true) {
    wall += milliseconds;
    monotonic += milliseconds;
    if (runTimers) await vi.advanceTimersByTimeAsync(milliseconds);
  }

  it("renews the local period only after accepted human activity", async () => {
    await advance(10 * 60_000);
    expect(monitor.recordHumanActivity(wall)).toBe(true);

    await advance(5 * 60_000);
    expect(expired).not.toHaveBeenCalled();
    await advance(10 * 60_000);

    expect(expired).toHaveBeenCalledOnce();
  });

  it("expires after fifteen minutes without activity", async () => {
    await advance(sessionInactivityWindowMilliseconds);

    expect(expired).toHaveBeenCalledOnce();
    expect(monitor.checkNow()).toBe(false);
  });

  it("never extends beyond the absolute deadline", async () => {
    monitor.start({
      absoluteExpiresAtUtc: new Date(startTime + 20 * 60_000).toISOString(),
      inactivityExpiresAtUtc: new Date(
        startTime + sessionInactivityWindowMilliseconds,
      ).toISOString(),
    });
    await advance(10 * 60_000);
    monitor.recordHumanActivity(wall);
    await advance(10 * 60_000);

    expect(expired).toHaveBeenCalledOnce();
  });

  it("rejects an absolute deadline beyond twelve hours", () => {
    expect(() =>
      monitor.start({
        absoluteExpiresAtUtc: new Date(
          startTime + sessionAbsoluteLifetimeMilliseconds + 1,
        ).toISOString(),
        inactivityExpiresAtUtc: new Date(
          startTime + sessionInactivityWindowMilliseconds,
        ).toISOString(),
      }),
    ).toThrow("The session deadlines are invalid.");
  });

  it("does not let an automatic refresh extend human inactivity", async () => {
    await advance(14 * 60_000);
    monitor.reconcile({
      absoluteExpiresAtUtc: new Date(
        startTime + 12 * 60 * 60_000,
      ).toISOString(),
      inactivityExpiresAtUtc: new Date(wall + 15 * 60_000).toISOString(),
    });
    await advance(60_000);

    expect(expired).toHaveBeenCalledOnce();
  });

  it("expires immediately after a suspended tab resumes past its deadline", async () => {
    await advance(16 * 60_000, false);

    expect(monitor.checkNow()).toBe(false);
    expect(expired).toHaveBeenCalledOnce();
  });

  it("fails closed when the wall clock moves backwards", () => {
    monotonic += 60_000;
    wall -= 60_000;

    expect(monitor.checkNow()).toBe(false);
    expect(expired).toHaveBeenCalledOnce();
  });
});
