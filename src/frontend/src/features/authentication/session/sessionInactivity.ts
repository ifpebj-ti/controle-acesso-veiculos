export const sessionInactivityWindowMilliseconds = 15 * 60 * 1_000;
export const sessionAbsoluteLifetimeMilliseconds = 12 * 60 * 60 * 1_000;

const clockRollbackToleranceMilliseconds = 5_000;
const maximumTimerDelayMilliseconds = 2_147_483_647;

export interface SessionDeadlines {
  absoluteExpiresAtUtc: string;
  inactivityExpiresAtUtc: string;
}

interface ClockReading {
  monotonic: number;
  wall: number;
}

interface SessionInactivityState {
  absoluteDeadline: number;
  inactivityDeadline: number;
  observation: ClockReading;
}

interface SessionInactivityMonitorOptions {
  clock?: () => ClockReading;
  onExpired: () => void;
}

export class InvalidSessionDeadlineError extends Error {
  constructor() {
    super("The session deadlines are invalid.");
    this.name = "InvalidSessionDeadlineError";
  }
}

export class SessionInactiveError extends Error {
  constructor() {
    super("The session is no longer active.");
    this.name = "SessionInactiveError";
  }
}

export class SessionInactivityMonitor {
  private readonly clock: () => ClockReading;
  private readonly onExpired: () => void;
  private state: SessionInactivityState | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor({
    clock = readClock,
    onExpired,
  }: SessionInactivityMonitorOptions) {
    this.clock = clock;
    this.onExpired = onExpired;
  }

  start(deadlines: SessionDeadlines) {
    const parsed = parseDeadlines(deadlines);
    const observation = this.clock();

    if (
      parsed.inactivityDeadline <= observation.wall ||
      parsed.absoluteDeadline <= observation.wall ||
      parsed.absoluteDeadline >
        observation.wall + sessionAbsoluteLifetimeMilliseconds
    ) {
      throw new InvalidSessionDeadlineError();
    }

    this.state = { ...parsed, observation };
    this.schedule();
  }

  reconcile(deadlines: SessionDeadlines) {
    const parsed = parseDeadlines(deadlines);
    if (!this.state) {
      this.start(deadlines);
      return;
    }

    if (!this.checkNow()) return;

    this.state.absoluteDeadline = Math.min(
      this.state.absoluteDeadline,
      parsed.absoluteDeadline,
    );
    this.state.inactivityDeadline = Math.min(
      this.state.inactivityDeadline,
      parsed.inactivityDeadline,
      this.state.absoluteDeadline,
    );

    if (!this.checkNow()) return;
    this.schedule();
  }

  recordHumanActivity(activityAtEpochMilliseconds = this.clock().wall) {
    if (!this.state || !this.checkNow()) return false;

    const observation = this.clock();
    const oldestAcceptedActivity =
      observation.wall - sessionInactivityWindowMilliseconds;
    if (
      !Number.isFinite(activityAtEpochMilliseconds) ||
      activityAtEpochMilliseconds < oldestAcceptedActivity ||
      activityAtEpochMilliseconds >
        observation.wall + clockRollbackToleranceMilliseconds
    ) {
      return false;
    }

    const nextDeadline = Math.min(
      activityAtEpochMilliseconds + sessionInactivityWindowMilliseconds,
      this.state.absoluteDeadline,
    );
    this.state.inactivityDeadline = Math.max(
      this.state.inactivityDeadline,
      nextDeadline,
    );
    this.state.observation = observation;
    this.schedule();
    return true;
  }

  checkNow() {
    if (!this.state) return false;

    const observation = this.clock();
    const wallElapsed = observation.wall - this.state.observation.wall;
    const monotonicElapsed =
      observation.monotonic - this.state.observation.monotonic;
    const clockMovedBackwards =
      wallElapsed < -clockRollbackToleranceMilliseconds ||
      monotonicElapsed < 0 ||
      wallElapsed + clockRollbackToleranceMilliseconds < monotonicElapsed;
    const deadlineReached =
      observation.wall >= this.state.inactivityDeadline ||
      observation.wall >= this.state.absoluteDeadline;

    if (clockMovedBackwards || deadlineReached) {
      this.expire();
      return false;
    }

    this.state.observation = observation;
    return true;
  }

  stop() {
    this.clearTimer();
    this.state = null;
  }

  getDeadlines() {
    if (!this.state) return null;
    return {
      absoluteDeadline: this.state.absoluteDeadline,
      inactivityDeadline: this.state.inactivityDeadline,
    };
  }

  private expire() {
    const wasActive = this.state !== null;
    this.stop();
    if (wasActive) this.onExpired();
  }

  private schedule() {
    this.clearTimer();
    if (!this.state) return;

    const nextDeadline = Math.min(
      this.state.inactivityDeadline,
      this.state.absoluteDeadline,
    );
    const delay = Math.min(
      maximumTimerDelayMilliseconds,
      Math.max(0, nextDeadline - this.clock().wall),
    );
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.checkNow()) this.schedule();
    }, delay);
  }

  private clearTimer() {
    if (this.timer === null) return;
    clearTimeout(this.timer);
    this.timer = null;
  }
}

function parseDeadlines({
  absoluteExpiresAtUtc,
  inactivityExpiresAtUtc,
}: SessionDeadlines) {
  const absoluteDeadline = Date.parse(absoluteExpiresAtUtc);
  const inactivityDeadline = Date.parse(inactivityExpiresAtUtc);

  if (
    !Number.isFinite(absoluteDeadline) ||
    !Number.isFinite(inactivityDeadline) ||
    inactivityDeadline > absoluteDeadline
  ) {
    throw new InvalidSessionDeadlineError();
  }

  return { absoluteDeadline, inactivityDeadline };
}

function readClock(): ClockReading {
  return {
    monotonic: performance.now(),
    wall: Date.now(),
  };
}
