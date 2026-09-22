import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { expectNoSeriousAccessibilityViolations } from "../../../test/accessibility";
import { changeAuthenticatedPassword } from "../services/passwordChangeService";
import { PasswordChangeForm } from "./PasswordChangeForm";

vi.mock("../services/passwordChangeService", () => ({
  changeAuthenticatedPassword: vi.fn(),
}));

const currentTestPassword = "current-test-password";
const newTestPassword = "new-test-password-value";

function axiosError(status: number, data: unknown = {}) {
  return { isAxiosError: true, response: { data, status } };
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Senha atual"), currentTestPassword);
  await user.type(screen.getByLabelText("Nova senha"), newTestPassword);
  await user.type(
    screen.getByLabelText("Confirmar nova senha"),
    newTestPassword,
  );
}

describe("PasswordChangeForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("presents accessible labels, policy and password-manager semantics", async () => {
    const { container } = render(<PasswordChangeForm onSuccess={vi.fn()} />);

    expect(screen.getByLabelText("Senha atual")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(screen.getByLabelText("Nova senha")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByLabelText("Confirmar nova senha")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(
      screen.getByText(
        "Use entre 12 e 128 caracteres e não repita a senha atual.",
      ),
    ).toBeInTheDocument();
    await expectNoSeriousAccessibilityViolations(container);
  });

  it("blocks reuse and mismatched confirmation before any request", async () => {
    const user = userEvent.setup();
    render(<PasswordChangeForm onSuccess={vi.fn()} />);

    await user.type(screen.getByLabelText("Senha atual"), currentTestPassword);
    await user.type(screen.getByLabelText("Nova senha"), currentTestPassword);
    await user.type(screen.getByLabelText("Confirmar nova senha"), "different");
    await user.click(screen.getByRole("button", { name: "Alterar senha" }));

    expect(changeAuthenticatedPassword).not.toHaveBeenCalled();
    expect(
      screen.getByText("A nova senha deve ser diferente da senha atual."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("A confirmação deve ser igual à nova senha."),
    ).toBeInTheDocument();
  });

  it("allows only one pending mutation and clears all fields after success", async () => {
    let finishRequest: (() => void) | undefined;
    vi.mocked(changeAuthenticatedPassword).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishRequest = resolve;
        }),
    );
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(<PasswordChangeForm onSuccess={onSuccess} />);
    await fillValidForm(user);

    const submit = screen.getByRole("button", { name: "Alterar senha" });
    await user.dblClick(submit);

    expect(changeAuthenticatedPassword).toHaveBeenCalledOnce();
    expect(submit).toBeDisabled();
    finishRequest?.();
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(screen.getByLabelText("Senha atual")).toHaveValue("");
    expect(screen.getByLabelText("Nova senha")).toHaveValue("");
    expect(screen.getByLabelText("Confirmar nova senha")).toHaveValue("");
    expect(window.localStorage).toHaveLength(0);
    expect(window.sessionStorage).toHaveLength(0);
  });

  it("preserves the new password for correction but clears the submitted current password", async () => {
    vi.mocked(changeAuthenticatedPassword).mockRejectedValue(
      axiosError(400, {
        errors: {
          currentPassword: ["Não foi possível confirmar a senha atual."],
          newPassword: ["A nova senha deve ser diferente da senha atual."],
        },
      }),
    );
    const user = userEvent.setup();
    render(<PasswordChangeForm onSuccess={vi.fn()} />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Alterar senha" }));

    expect(
      await screen.findByText("Não foi possível confirmar a senha atual."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Senha atual")).toHaveValue("");
    expect(screen.getByLabelText("Senha atual")).toHaveFocus();
    expect(screen.getByLabelText("Nova senha")).toHaveValue(newTestPassword);
    expect(screen.getByLabelText("Confirmar nova senha")).toHaveValue(
      newTestPassword,
    );
  });

  it.each([
    [401, "Sua sessão não é mais válida. Entre novamente."],
    [429, "Muitas tentativas em pouco tempo. Aguarde e tente novamente."],
    [
      undefined,
      "Não foi possível conectar ao sistema. Verifique a rede e tente novamente.",
    ],
  ])(
    "announces a safe recoverable failure for status %s",
    async (status, message) => {
      vi.mocked(changeAuthenticatedPassword).mockRejectedValue(
        status === undefined ? new Error("network") : axiosError(status),
      );
      const user = userEvent.setup();
      render(<PasswordChangeForm onSuccess={vi.fn()} />);
      await fillValidForm(user);
      await user.click(screen.getByRole("button", { name: "Alterar senha" }));

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent(message);
      await waitFor(() => expect(alert).toHaveFocus());
      expect(screen.getByLabelText("Senha atual")).toHaveValue("");
      expect(screen.getByLabelText("Nova senha")).toHaveValue(newTestPassword);
    },
  );
});
