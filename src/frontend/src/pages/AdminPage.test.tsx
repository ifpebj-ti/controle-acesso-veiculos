import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type ProfileName,
  useAuthenticatedSession,
} from "../features/authentication";
import {
  createUserAccount,
  deactivateUserAccount,
  reactivateUserAccount,
  searchUserAccounts,
  type UserAccount,
  type UserAccountPage,
} from "../features/user-accounts";
import {
  describeApiError,
  getApiValidationErrors,
} from "../services/api-errors";
import { expectNoSeriousAccessibilityViolations } from "../test/accessibility";
import { AdminPage } from "./AdminPage";

vi.mock("../features/authentication", () => ({
  profileLabels: {
    Administrador: "Administrador",
    Porteiro: "Porteiro",
    SetorTransporte: "Setor de Transporte",
    Vigilante: "Vigilante",
  },
  profileNames: ["Porteiro", "Vigilante", "SetorTransporte", "Administrador"],
  useAuthenticatedSession: vi.fn(),
}));
vi.mock("../features/user-accounts/services/userAccountsService", () => ({
  createUserAccount: vi.fn(),
  deactivateUserAccount: vi.fn(),
  reactivateUserAccount: vi.fn(),
  searchUserAccounts: vi.fn(),
}));
vi.mock("../services/api-errors", () => ({
  describeApiError: vi.fn(),
  getApiValidationErrors: vi.fn(),
}));

const activeAccount: UserAccount = {
  active: true,
  createdAtUtc: "2030-06-10T11:00:00Z",
  email: "porteiro.ficticio@example.test",
  id: 8,
  lockedUntilUtc: null,
  name: "Porteiro Fictício",
  profileName: "Porteiro",
  updatedAtUtc: null,
};

const inactiveAccount: UserAccount = {
  ...activeAccount,
  active: false,
  email: "vigilante.ficticio@example.test",
  id: 9,
  name: "Vigilante Fictício",
  profileName: "Vigilante",
};

const accountPage: UserAccountPage = {
  items: [activeAccount, inactiveAccount],
  page: 1,
  pageSize: 25,
  totalCount: 2,
  totalPages: 1,
};

function renderPage(profileName: ProfileName = "Administrador") {
  vi.mocked(useAuthenticatedSession).mockReturnValue({
    expiresAtUtc: "2030-06-10T22:00:00Z",
    login: vi.fn(),
    logout: vi.fn(),
    sessionEndReason: null,
    status: "authenticated",
    user: { email: "admin.ficticio@example.test", id: 1, profileName },
  });
  return render(
    <MemoryRouter>
      <AdminPage />
    </MemoryRouter>,
  );
}

async function fillAccountForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Nova conta" }));
  await user.type(screen.getByLabelText("Nome do funcionário"), "Nova Pessoa");
  await user.type(
    screen.getByLabelText("E-mail institucional"),
    "nova.pessoa@example.test",
  );
  await user.type(
    screen.getByLabelText("Senha temporária"),
    "Senha-ficticia-2030",
  );
  await user.selectOptions(
    screen.getByLabelText("Perfil de acesso"),
    "SetorTransporte",
  );
}

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchUserAccounts).mockResolvedValue(accountPage);
    vi.mocked(describeApiError).mockReturnValue({
      kind: "network",
      message: "Não foi possível consultar as contas.",
    });
    vi.mocked(getApiValidationErrors).mockReturnValue({});
  });

  it("does not request administrative data for another profile", async () => {
    renderPage("Porteiro");

    expect(
      await screen.findByRole("heading", { name: "Acesso negado" }),
    ).toBeInTheDocument();
    expect(searchUserAccounts).not.toHaveBeenCalled();
  });

  it("searches and filters the real account catalog", async () => {
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findAllByText(activeAccount.name)).not.toHaveLength(0);

    await user.type(screen.getByLabelText("Nome ou e-mail"), "porteiro");
    await user.selectOptions(screen.getByLabelText("Situação"), "true");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    await waitFor(() =>
      expect(searchUserAccounts).toHaveBeenLastCalledWith({
        active: true,
        page: 1,
        pageSize: 25,
        search: "porteiro",
      }),
    );
  });

  it("clears the password and associates an API error with its field", async () => {
    vi.mocked(createUserAccount).mockRejectedValue(new Error("validation"));
    vi.mocked(describeApiError).mockReturnValue({
      kind: "validation",
      message: "Revise os dados informados.",
      status: 400,
    });
    vi.mocked(getApiValidationErrors).mockReturnValue({
      password: "A senha temporária não atende aos requisitos.",
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(activeAccount.name);
    await fillAccountForm(user);
    const password = screen.getByLabelText("Senha temporária");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    const message = await screen.findByText(
      "A senha temporária não atende aos requisitos.",
    );
    expect(password).toHaveValue("");
    expect(password).toHaveAttribute("aria-invalid", "true");
    expect(password).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("account-password-error"),
    );
    expect(message).toHaveAttribute("id", "account-password-error");

    await user.type(password, "Outra-senha-ficticia");
    expect(
      screen.queryByText("A senha temporária não atende aos requisitos."),
    ).not.toBeInTheDocument();
    expect(password).toHaveAttribute("aria-invalid", "false");
  });

  it("retries a failed refresh without creating the account again", async () => {
    vi.mocked(createUserAccount).mockResolvedValue({
      email: "nova.pessoa@example.test",
      id: 10,
      profileName: "SetorTransporte",
    });
    vi.mocked(searchUserAccounts)
      .mockResolvedValueOnce(accountPage)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(accountPage);
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(activeAccount.name);
    await fillAccountForm(user);
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Conta criada com sucesso. Porém, não foi possível atualizar a lista.",
    );
    expect(
      screen.queryByText("Nenhuma conta encontrada"),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findAllByText(activeAccount.name)).not.toHaveLength(0);
    expect(createUserAccount).toHaveBeenCalledTimes(1);
    expect(searchUserAccounts).toHaveBeenCalledTimes(3);
  });

  it("confirms and deactivates without deleting account history", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(deactivateUserAccount).mockResolvedValue();
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(activeAccount.name);
    await user.click(screen.getAllByRole("button", { name: "Desativar" })[0]);

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("histórico"));
    await waitFor(() => expect(deactivateUserAccount).toHaveBeenCalledWith(8));
    expect(reactivateUserAccount).not.toHaveBeenCalled();
  });

  it("confirms and reactivates an inactive account", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(reactivateUserAccount).mockResolvedValue();
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(inactiveAccount.name);
    await user.click(screen.getAllByRole("button", { name: "Reativar" })[0]);

    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining("O acesso voltará a ser permitido"),
    );
    await waitFor(() => expect(reactivateUserAccount).toHaveBeenCalledWith(9));
    expect(deactivateUserAccount).not.toHaveBeenCalled();
  });

  it("paginates using the last applied filters", async () => {
    vi.mocked(searchUserAccounts).mockResolvedValue({
      ...accountPage,
      totalCount: 26,
      totalPages: 2,
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(activeAccount.name);
    await user.type(screen.getByLabelText("Nome ou e-mail"), "fictício");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() => expect(searchUserAccounts).toHaveBeenCalledTimes(2));
    await user.click(screen.getByRole("button", { name: "Próxima" }));

    await waitFor(() =>
      expect(searchUserAccounts).toHaveBeenLastCalledWith({
        page: 2,
        pageSize: 25,
        search: "fictício",
      }),
    );
  });

  it("blocks duplicate creation while the request is pending", async () => {
    let resolveCreation!: (value: {
      id: number;
      email: string;
      profileName: "SetorTransporte";
    }) => void;
    vi.mocked(createUserAccount).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreation = resolve;
        }),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(activeAccount.name);
    await fillAccountForm(user);
    const submit = screen.getByRole("button", { name: "Criar conta" });
    await user.click(submit);

    await waitFor(() => expect(createUserAccount).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Nova conta" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Criando…" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Criando…" }));
    expect(createUserAccount).toHaveBeenCalledTimes(1);

    await act(async () =>
      resolveCreation({
        email: "nova.pessoa@example.test",
        id: 10,
        profileName: "SetorTransporte",
      }),
    );
    expect(
      await screen.findByText("Conta criada com sucesso."),
    ).toBeInTheDocument();
  });

  it("distinguishes a failed query from an empty successful response", async () => {
    vi.mocked(searchUserAccounts)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        ...accountPage,
        items: [],
        totalCount: 0,
        totalPages: 0,
      });
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível consultar as contas.",
    );
    expect(screen.queryByText(/0 conta/)).not.toBeInTheDocument();
    expect(
      screen.queryByText("Nenhuma conta encontrada"),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(
      await screen.findByText("Nenhuma conta encontrada"),
    ).toBeInTheDocument();
  });

  it("shows the API access barrier without stale account data", async () => {
    vi.mocked(searchUserAccounts).mockRejectedValue(new Error("forbidden"));
    vi.mocked(describeApiError).mockReturnValue({
      kind: "access-denied",
      message: "Seu perfil não possui permissão para administrar contas.",
      status: 403,
    });
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Acesso negado" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(activeAccount.name)).not.toBeInTheDocument();
  });

  it("has no serious automated accessibility violations", async () => {
    const { container } = renderPage();
    await screen.findAllByText(activeAccount.name);
    await expectNoSeriousAccessibilityViolations(container);
  });
});
