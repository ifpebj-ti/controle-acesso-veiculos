import { api } from "../../../services/api";
import {
  eventAuthorizationPageSchema,
  eventAuthorizationSchema,
} from "../schemas/eventAuthorizationSchemas";
import type {
  EventAuthorization,
  EventAuthorizationFilters,
  EventAuthorizationInput,
  EventAuthorizationPage,
} from "../types";

export class EventAuthorizationsContractError extends Error {
  constructor() {
    super(
      "The event authorizations response does not match the expected contract.",
    );
    this.name = "EventAuthorizationsContractError";
  }
}

function parseContract<T>(
  result: { success: true; data: T } | { success: false },
): T {
  if (!result.success) throw new EventAuthorizationsContractError();
  return result.data;
}

export async function searchEventAuthorizations(
  filters: EventAuthorizationFilters,
): Promise<EventAuthorizationPage> {
  const response = await api.get<unknown>("/event-authorizations", {
    params: {
      active: filters.active === "all" ? undefined : filters.active,
      fromUtc: filters.fromUtc || undefined,
      name: filters.name.trim() || undefined,
      page: filters.page,
      pageSize: filters.pageSize,
      toUtc: filters.toUtc || undefined,
    },
  });
  return parseContract(eventAuthorizationPageSchema.safeParse(response.data));
}

export async function createEventAuthorization(
  input: EventAuthorizationInput,
): Promise<EventAuthorization> {
  const response = await api.post<unknown>("/event-authorizations", input);
  return parseContract(eventAuthorizationSchema.safeParse(response.data));
}

export async function updateEventAuthorization(
  id: number,
  input: EventAuthorizationInput,
): Promise<EventAuthorization> {
  const response = await api.put<unknown>(`/event-authorizations/${id}`, input);
  return parseContract(eventAuthorizationSchema.safeParse(response.data));
}

export async function cancelEventAuthorization(id: number): Promise<void> {
  await api.delete(`/event-authorizations/${id}`);
}
