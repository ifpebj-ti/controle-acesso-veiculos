(function () {
  "use strict";

  var storageKey = "ifpe.vehicle-access.appearance.v1";
  var preference = "system";

  try {
    var storedPreference = window.localStorage.getItem(storageKey);

    if (
      storedPreference === "light" ||
      storedPreference === "dark" ||
      storedPreference === "system"
    ) {
      preference = storedPreference;
    } else if (storedPreference !== null) {
      window.localStorage.removeItem(storageKey);
    }
  } catch {
    preference = "system";
  }

  var systemUsesDark = false;

  try {
    systemUsesDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    systemUsesDark = false;
  }

  var resolvedTheme =
    preference === "system" ? (systemUsesDark ? "dark" : "light") : preference;

  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
})();
