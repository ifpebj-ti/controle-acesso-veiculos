import type { AppearancePreference, ResolvedTheme } from "./types";

export const appearanceStorageKey = "ifpe.vehicle-access.appearance.v1";
export const systemDarkModeQuery = "(prefers-color-scheme: dark)";

export function isAppearancePreference(
  value: unknown,
): value is AppearancePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function readAppearancePreference(
  storage: Pick<Storage, "getItem" | "removeItem"> | null,
): AppearancePreference {
  if (!storage) return "system";

  try {
    const storedPreference = storage.getItem(appearanceStorageKey);

    if (isAppearancePreference(storedPreference)) return storedPreference;

    if (storedPreference !== null) {
      storage.removeItem(appearanceStorageKey);
    }
  } catch {
    // The interface remains usable with an in-memory preference.
  }

  return "system";
}

export function persistAppearancePreference(
  preference: AppearancePreference,
  storage: Pick<Storage, "setItem"> | null,
) {
  if (!storage) return false;

  try {
    storage.setItem(appearanceStorageKey, preference);
    return true;
  } catch {
    return false;
  }
}

export function resolveTheme(
  preference: AppearancePreference,
  systemUsesDark: boolean,
): ResolvedTheme {
  if (preference === "system") {
    return systemUsesDark ? "dark" : "light";
  }

  return preference;
}

export function applyResolvedTheme(theme: ResolvedTheme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}
