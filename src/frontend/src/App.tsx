import { RouterProvider } from "react-router-dom";

import { ConfirmationProvider } from "./components/ui/ConfirmationProvider";
import { DemoProvider } from "./demo";
import { AppearanceProvider } from "./features/appearance";
import { SessionProvider } from "./features/authentication";
import { router } from "./routes";

export default function App() {
  return (
    <AppearanceProvider>
      <SessionProvider>
        <ConfirmationProvider>
          <DemoProvider>
            <RouterProvider router={router} />
          </DemoProvider>
        </ConfirmationProvider>
      </SessionProvider>
    </AppearanceProvider>
  );
}
