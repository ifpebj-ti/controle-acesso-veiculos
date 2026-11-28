import { RouterProvider } from "react-router-dom";

import { ConfirmationProvider } from "./components/ui/ConfirmationProvider";
import { AppearanceProvider } from "./features/appearance";
import { SessionProvider } from "./features/authentication";
import { FullscreenInvitationProvider } from "./features/fullscreen";
import { router } from "./routes";

export default function App() {
  return (
    <AppearanceProvider>
      <SessionProvider>
        <FullscreenInvitationProvider>
          <ConfirmationProvider>
            <RouterProvider router={router} />
          </ConfirmationProvider>
        </FullscreenInvitationProvider>
      </SessionProvider>
    </AppearanceProvider>
  );
}
