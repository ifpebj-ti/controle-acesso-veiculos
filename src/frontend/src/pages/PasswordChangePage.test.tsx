import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { SessionContext } from "../features/authentication/session/SessionContext";
import { changeAuthenticatedPassword } from "../features/authentication/services/passwordChangeService";
import type { ProfileName } from "../features/authentication/types";
import { expectNoSeriousAccessibilityViolations } from "../test/accessibility";
import { PasswordChangePage } from "./PasswordChangePage";

vi.mock("../features/authentication/services/passwordChangeService", () => ({
  changeAuthenticatedPassword: vi.fn(),
}));

function renderPage(profileName: ProfileName = "Porteiro") {
  const completePasswordChange = vi.fn();
  const view = render(
    <SessionContext.Provider
      value={{
        completePasswordChange,
        expiresAtUtc: "2030-09-21T23:59:59.000Z",
        login: vi.fn(),
        logout: vi.fn(),
        sessionEndReason: null,
        sessionNotice: null,
        status: "authenticated",
        user: { email: "operator@example.test", id: 42, profileName },
      }}
    >
      <MemoryRouter initialEntries={["/conta/senha"]}>
        <Routes>
          <Route element={<PasswordChangePage />} path="/conta/senha" />
          <Route element={<h1>Novo login necessário</h1>} path="/login" />
        </Routes>
      </MemoryRouter>
    </SessionContext.Provider>,
  );

  return { ...view, completePasswordChange };
}

describe("PasswordChangePage", () => {
  it.each<ProfileName>([
    "Porteiro",
    "Vigilante",
    "SetorTransporte",
    "Administrador",
  ])("provides the same account flow to %s", (profileName) => {
    renderPage(profileName);

    expect(
      screen.getByRole("heading", { level: 1, name: "Alterar senha" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/todas as sessões anteriores/)).toBeInTheDocument();
  });

  it("ends the local session and requires a new login after success", async () => {
    vi.mocked(changeAuthenticatedPassword).mockResolvedValue();
    const user = userEvent.setup();
    const { completePasswordChange } = renderPage();

    await user.type(
      screen.getByLabelText("Senha atual"),
      "current-test-password",
    );
    await user.type(
      screen.getByLabelText("Nova senha"),
      "new-test-password-value",
    );
    await user.type(
      screen.getByLabelText("Confirmar nova senha"),
      "new-test-password-value",
    );
    await user.click(screen.getByRole("button", { name: "Alterar senha" }));

    expect(
      await screen.findByRole("heading", { name: "Novo login necessário" }),
    ).toBeInTheDocument();
    expect(completePasswordChange).toHaveBeenCalledOnce();
  });

  it("has no serious automated accessibility violations", async () => {
    const { container } = renderPage("Administrador");
    await expectNoSeriousAccessibilityViolations(container);
  });
});
