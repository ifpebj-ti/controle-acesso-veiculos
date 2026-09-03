import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it } from "vitest";

import { SessionProvider } from "../features/authentication";
import { expectNoSeriousAccessibilityViolations } from "../test/accessibility";
import { LoginPage } from "./LoginPage";

describe("LoginPage accessibility", () => {
  it("has no serious automated accessibility violations", async () => {
    const { container } = render(
      <SessionProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </SessionProvider>,
    );

    await expectNoSeriousAccessibilityViolations(container);
  });
});
