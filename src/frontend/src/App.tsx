import { RouterProvider } from "react-router-dom";

import { DemoProvider } from "./demo";
import { SessionProvider } from "./features/authentication";
import { router } from "./routes";

export default function App() {
  return (
    <SessionProvider>
      <DemoProvider>
        <RouterProvider router={router} />
      </DemoProvider>
    </SessionProvider>
  );
}
