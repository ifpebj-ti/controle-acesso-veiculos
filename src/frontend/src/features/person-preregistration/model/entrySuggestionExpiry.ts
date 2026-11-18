import type { EntrySuggestion } from "../schemas/campusDriverSchemas";
export function isEntrySuggestionCurrent(item: EntrySuggestion) {
  return (
    item.source !== "SameDayVisit" ||
    (item.expiresAtUtc !== null && Date.parse(item.expiresAtUtc) > Date.now())
  );
}
