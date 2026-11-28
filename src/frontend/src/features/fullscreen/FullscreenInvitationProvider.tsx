import { useEffect, useState, type ReactNode } from "react";
import { useSession } from "../authentication";
import { InvitationContext } from "./invitationContext";
import { createInvitationSession } from "./invitationSession";

/** Observe session lifecycle without changing login, refresh or authorization. */
export function FullscreenInvitationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { status, user } = useSession();
  const [invitation] = useState(createInvitationSession);
  useEffect(() => {
    invitation.observe(status, user?.id ?? null);
  }, [invitation, status, user?.id]);
  return (
    <InvitationContext.Provider value={invitation}>
      {children}
    </InvitationContext.Provider>
  );
}
