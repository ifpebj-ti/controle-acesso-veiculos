import { Outlet, useLocation } from "react-router-dom";

import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import {
  profileLabels,
  useAuthenticatedSession,
} from "../features/authentication";
import { canProfileAccessRoute } from "./routeMetadata";

export function ProfileRoute() {
  const { user } = useAuthenticatedSession();
  const { pathname } = useLocation();

  if (!canProfileAccessRoute(user.profileName, pathname)) {
    return (
      <AccessDeniedState
        message={`O perfil ${profileLabels[user.profileName]} não possui acesso a esta área.`}
      />
    );
  }

  return <Outlet />;
}
