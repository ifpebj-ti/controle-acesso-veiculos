import { createContext } from "react";
import type { InvitationSession } from "./invitationSession";

export const InvitationContext = createContext<InvitationSession | null>(null);
