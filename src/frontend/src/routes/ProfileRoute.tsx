import { Outlet } from "react-router-dom";

import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import {
  profileLabels,
  useAuthenticatedSession,
  type ProfileName,
} from "../features/authentication";

interface ProfileRouteProps {
  allowedProfiles: readonly ProfileName[];
}

export function ProfileRoute({ allowedProfiles }: ProfileRouteProps) {
  const { user } = useAuthenticatedSession();

  if (!allowedProfiles.includes(user.profileName)) {
    return (
      <AccessDeniedState
        message={`O perfil ${profileLabels[user.profileName]} não possui acesso a esta área.`}
      />
    );
  }

  return <Outlet />;
}
