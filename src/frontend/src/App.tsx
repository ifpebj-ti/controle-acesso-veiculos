import { RouterProvider } from "react-router-dom";

import { ConfirmationProvider } from "./components/ui/ConfirmationProvider";
import { DemoProvider } from "./demo";
import { SessionProvider } from "./features/authentication";
import { router } from "./routes";

export default function App() {
  return (
    <SessionProvider>
      <ConfirmationProvider>
        <DemoProvider>
          <RouterProvider router={router} />
        </DemoProvider>
      </ConfirmationProvider>
    </SessionProvider>
  );
}
