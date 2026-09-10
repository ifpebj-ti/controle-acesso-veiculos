import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { useSession } from "../features/authentication";
import { getRouteFocusSelector, getRouteTitle } from "./routeMetadata";

export function RouteTransitionManager() {
  const location = useLocation();
  const { user } = useSession();

  useEffect(() => {
    document.title = getRouteTitle(location.pathname, user?.profileName);
  }, [location.pathname, user?.profileName]);

  useEffect(() => {
    const focusTimeout = window.setTimeout(() => {
      const focusTarget = document.querySelector<HTMLElement>(
        getRouteFocusSelector(location.pathname),
      );

      if (!focusTarget) return;

      if (focusTarget.matches("h1")) {
        focusTarget.tabIndex = -1;
        focusTarget.dataset.routeFocusTarget = "";
      }

      focusTarget.focus();
    });

    return () => window.clearTimeout(focusTimeout);
  }, [location.pathname]);

  return <Outlet />;
}
