import { useCallback, useEffect, useRef, useState } from "react";

import { describeApiError } from "../../../services/api-errors";
import {
  EventAuthorizationsContractError,
  searchEventAuthorizations,
} from "../services/eventAuthorizationsService";
import type { EventAuthorization } from "../types";

export type CurrentEventAuthorizationsStatus =
  | "idle"
  | "loading"
  | "ready"
  | "empty"
  | "error"
  | "denied"
  | "contract-error";

function isCurrentAuthorization(event: EventAuthorization, now: Date) {
  const currentTime = now.getTime();
  return (
    event.active &&
    new Date(event.startsAtUtc).getTime() <= currentTime &&
    new Date(event.endsAtUtc).getTime() >= currentTime
  );
}

export function useCurrentEventAuthorizations(enabled: boolean) {
  const requestId = useRef(0);
  const [events, setEvents] = useState<EventAuthorization[]>([]);
  const [status, setStatus] =
    useState<CurrentEventAuthorizationsStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    const now = new Date();
    const queryEnd = new Date(now.getTime() + 1_000);
    setStatus("loading");
    setEvents([]);
    setErrorMessage(null);

    try {
      const result = await searchEventAuthorizations({
        active: "true",
        fromUtc: now.toISOString(),
        name: "",
        page: 1,
        pageSize: 100,
        toUtc: queryEnd.toISOString(),
      });
      if (requestId.current !== currentRequest) return;

      const currentEvents = result.items.filter((event) =>
        isCurrentAuthorization(event, now),
      );
      setEvents(currentEvents);
      setStatus(currentEvents.length > 0 ? "ready" : "empty");
    } catch (error) {
      if (requestId.current !== currentRequest) return;
      setEvents([]);

      if (error instanceof EventAuthorizationsContractError) {
        setStatus("contract-error");
        setErrorMessage(
          "A resposta das autorizações não pôde ser validada. Tente novamente.",
        );
        return;
      }

      const description = describeApiError(error);
      setStatus(description.kind === "access-denied" ? "denied" : "error");
      setErrorMessage(description.message);
    }
  }, []);

  useEffect(() => {
    if (!enabled || status !== "idle") return;

    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void load();
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, load, status]);

  useEffect(
    () => () => {
      requestId.current += 1;
    },
    [],
  );

  return { errorMessage, events, retry: load, status };
}
