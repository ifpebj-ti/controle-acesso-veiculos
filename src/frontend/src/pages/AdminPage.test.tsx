import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type ProfileName,
  useAuthenticatedSession,
} from "../features/authentication";
import { searchAuditTrail, type AuditTrailPage } from "../features/audit-trail";
import {
  createUserAccount,
  deactivateUserAccount,
  reactivateUserAccount,
  resetTemporaryCredential,
  searchUserAccounts,
  type UserAccount,
  type UserAccountPage,
} from "../features/user-accounts";
import {
  describeApiError,
  getApiValidationErrors,
} from "../services/api-errors";
import { expectNoSeriousAccessibilityViolations } from "../test/accessibility";
import { selectFieldOption } from "../test/selectField";
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
  resetTemporaryCredential: vi.fn(),
  searchUserAccounts: vi.fn(),
}));
vi.mock("../features/audit-trail/services/auditTrailService", () => ({
  searchAuditTrail: vi.fn(),
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
  requiresPasswordChange: true,
  temporaryCredentialExpiresAtUtc: "2030-06-10T11:30:00Z",
  updatedAtUtc: null,
};

const inactiveAccount: UserAccount = {
  ...activeAccount,
  active: false,
  email: "vigilante.ficticio@example.test",
  id: 9,
  name: "Vigilante Fictício",
  profileName: "Vigilante",
  requiresPasswordChange: false,
  temporaryCredentialExpiresAtUtc: null,
};

const accountPage: UserAccountPage = {
  items: [activeAccount, inactiveAccount],
  page: 1,
  pageSize: 25,
  totalCount: 2,
  totalPages: 1,
};

const auditPage: AuditTrailPage = {
  items: [
    {
      action: "Alteracao",
      actorType: "Human",
      actorUserId: 1,
      details: "Conta fictícia desativada.",
      entity: "Usuario",
      id: 31,
      newState: { active: false },
      occurredAtUtc: "2030-06-10T11:00:00Z",
      previousState: { active: true },
      recordId: 8,
    },
  ],
  page: 1,
  pageSize: 25,
  totalCount: 1,
  totalPages: 1,
};

function renderPage(profileName: ProfileName = "Administrador") {
  vi.mocked(useAuthenticatedSession).mockReturnValue({
    completePasswordChange: vi.fn(),
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
  await user.type(screen.getByLabelText("Nome da pessoa"), "Nova Pessoa");
  await user.type(
    screen.getByLabelText("E-mail de acesso"),
    "nova.pessoa@example.test",
  );
  await selectFieldOption(
    user,
    screen.getByLabelText("Perfil de acesso"),
    "SetorTransporte",
  );
}

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchUserAccounts).mockResolvedValue(accountPage);
    vi.mocked(searchAuditTrail).mockResolvedValue(auditPage);
    vi.mocked(describeApiError).mockReturnValue({
      kind: "network",
      message: "Não foi possível consultar as contas.",
    });
    vi.mocked(getApiValidationErrors).mockReturnValue({});
  });

  it.each(["Porteiro", "Vigilante", "SetorTransporte"] as const)(
    "does not request administrative data for profile %s",
    async (profileName) => {
      renderPage(profileName);

      expect(
        await screen.findByRole("heading", { name: "Acesso negado" }),
      ).toBeInTheDocument();
      expect(searchUserAccounts).not.toHaveBeenCalled();
      expect(searchAuditTrail).not.toHaveBeenCalled();
      expect(resetTemporaryCredential).not.toHaveBeenCalled();
    },
  );

  it("loads the audit trail only when the administrator opens it", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(activeAccount.name);
    expect(searchAuditTrail).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Trilha de auditoria" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Alteração" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Usuário #1")).toBeInTheDocument();
    expect(searchAuditTrail).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: "Nova conta" }),
    ).not.toBeInTheDocument();
  });

  it("keeps valid audit results when a local period is invalid", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(activeAccount.name);
    await user.click(
      screen.getByRole("button", { name: "Trilha de auditoria" }),
    );
    await screen.findByRole("heading", { name: "Alteração" });
    const from = screen.getByLabelText("Início do período");
    const to = screen.getByLabelText("Fim do período");
    await user.clear(from);
    await user.type(from, "2030-06-11T08:00");
    await user.clear(to);
    await user.type(to, "2030-06-10T08:00");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    const error = screen.getByText(/O início deve ser anterior ao fim/);
    expect(from).toHaveAttribute("aria-invalid", "true");
    expect(from).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining(error.id),
    );
    expect(
      screen.getByRole("heading", { name: "Alteração" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Tentar novamente" }),
    ).not.toBeInTheDocument();
    expect(searchAuditTrail).toHaveBeenCalledTimes(1);
  });

  it("associates API validation errors and clears them after correction", async () => {
    vi.mocked(searchAuditTrail)
      .mockResolvedValueOnce(auditPage)
      .mockRejectedValueOnce(new Error("validation"));
    vi.mocked(describeApiError).mockReturnValue({
      kind: "validation",
      message: "Revise os filtros.",
      status: 400,
    });
    vi.mocked(getApiValidationErrors).mockReturnValue({
      entity: "A entidade informada é inválida.",
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(activeAccount.name);
    await user.click(
      screen.getByRole("button", { name: "Trilha de auditoria" }),
    );
    await screen.findByRole("heading", { name: "Alteração" });
    const entity = screen.getByLabelText("Entidade");
    await user.type(entity, "Invalida");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    const error = await screen.findByText("A entidade informada é inválida.");
    expect(entity).toHaveAttribute("aria-invalid", "true");
    expect(entity).toHaveAttribute("aria-describedby", error.id);
    expect(
      screen.getByRole("heading", { name: "Alteração" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Tentar novamente" }),
    ).not.toBeInTheDocument();

    await user.type(entity, " corrigida");
    expect(error).not.toBeInTheDocument();
    expect(entity).toHaveAttribute("aria-invalid", "false");
  });

  it("clears stale audit results after a real failure and retries the query", async () => {
    vi.mocked(searchAuditTrail)
      .mockResolvedValueOnce(auditPage)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(auditPage);
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(activeAccount.name);
    await user.click(
      screen.getByRole("button", { name: "Trilha de auditoria" }),
    );
    await screen.findByRole("heading", { name: "Alteração" });
    await user.type(screen.getByLabelText("Entidade"), "Usuario");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível consultar as contas.",
    );
    expect(
      screen.queryByRole("heading", { name: "Alteração" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/0 evento/)).not.toBeInTheDocument();
    expect(
      screen.queryByText("Nenhum evento encontrado"),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(
      await screen.findByRole("heading", { name: "Alteração" }),
    ).toBeInTheDocument();
    expect(searchAuditTrail).toHaveBeenCalledTimes(3);
  });

  it("renders audit states as text and preserves applied filters on pagination", async () => {
    const unsafeValue = '<img src=x onerror="alert(1)">';
    vi.mocked(searchAuditTrail).mockResolvedValue({
      ...auditPage,
      items: [
        {
          ...auditPage.items[0],
          details: unsafeValue,
          newState: { note: unsafeValue },
        },
      ],
      totalCount: 26,
      totalPages: 2,
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(activeAccount.name);
    await user.click(
      screen.getByRole("button", { name: "Trilha de auditoria" }),
    );
    await screen.findByText(unsafeValue);
    expect(document.querySelector("img[src='x']")).toBeNull();
    await user.type(screen.getByLabelText("Entidade"), "Usuario");
    await selectFieldOption(user, screen.getByLabelText("Ação"), "Alteracao");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() => expect(searchAuditTrail).toHaveBeenCalledTimes(2));
    await user.click(screen.getByRole("button", { name: "Próxima" }));

    await waitFor(() =>
      expect(searchAuditTrail).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: "Alteracao",
          entity: "Usuario",
          page: 2,
        }),
      ),
    );
  });

  it("shows the empty state only after a successful audit response", async () => {
    vi.mocked(searchAuditTrail).mockResolvedValue({
      ...auditPage,
      items: [],
      totalCount: 0,
      totalPages: 0,
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(activeAccount.name);
    await user.click(
      screen.getByRole("button", { name: "Trilha de auditoria" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Nenhum evento encontrado" }),
    ).toBeInTheDocument();
    expect(screen.getByText("0 evento(s) encontrado(s)")).toBeInTheDocument();
  });

  it("presents the API access barrier without audit data", async () => {
    vi.mocked(searchAuditTrail).mockRejectedValue(new Error("forbidden"));
    vi.mocked(describeApiError).mockReturnValue({
      kind: "access-denied",
      message: "Seu perfil não possui permissão para consultar a auditoria.",
      status: 403,
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(activeAccount.name);
    await user.click(
      screen.getByRole("button", { name: "Trilha de auditoria" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Acesso negado" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Alteração" }),
    ).not.toBeInTheDocument();
  });

  it("has no serious automated accessibility violations in the audit area", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    await screen.findAllByText(activeAccount.name);
    await user.click(
      screen.getByRole("button", { name: "Trilha de auditoria" }),
    );
    await screen.findByRole("heading", { name: "Alteração" });

    await expectNoSeriousAccessibilityViolations(container);
  });

  it("searches and filters the real account catalog", async () => {
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findAllByText(activeAccount.name)).not.toHaveLength(0);

    await user.type(screen.getByLabelText("Nome ou e-mail"), "porteiro");
    await selectFieldOption(user, screen.getByLabelText("Situação"), "true");
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

  it("preserves account filters and results across administrative areas", async () => {
    vi.mocked(searchUserAccounts)
      .mockResolvedValueOnce(accountPage)
      .mockResolvedValueOnce({
        ...accountPage,
        items: [activeAccount],
        totalCount: 1,
      });
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(activeAccount.name);

    await user.type(screen.getByLabelText("Nome ou e-mail"), "porteiro");
    await selectFieldOption(user, screen.getByLabelText("Situação"), "true");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() => expect(searchUserAccounts).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(inactiveAccount.name)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Trilha de auditoria" }),
    );
    await screen.findByRole("heading", { name: "Alteração" });
    await user.click(screen.getByRole("button", { name: "Contas de acesso" }));

    expect(screen.getByLabelText("Nome ou e-mail")).toHaveValue("porteiro");
    expect(screen.getByLabelText("Situação")).toHaveTextContent("Ativas");
    expect(screen.getAllByText(activeAccount.name)).not.toHaveLength(0);
    expect(screen.queryByText(inactiveAccount.name)).not.toBeInTheDocument();
    expect(searchUserAccounts).toHaveBeenCalledTimes(2);
    expect(searchUserAccounts).toHaveBeenLastCalledWith({
      active: true,
      page: 1,
      pageSize: 25,
      search: "porteiro",
    });
  });

  it("does not request a password and associates an API error with a creation field", async () => {
    vi.mocked(createUserAccount).mockRejectedValue(new Error("validation"));
    vi.mocked(describeApiError).mockReturnValue({
      kind: "validation",
      message: "Revise os dados informados.",
      status: 400,
    });
    vi.mocked(getApiValidationErrors).mockReturnValue({
      email: "O e-mail informado já está em uso.",
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(activeAccount.name);
    await fillAccountForm(user);
    expect(screen.queryByLabelText(/Senha/)).not.toBeInTheDocument();
    const email = screen.getByLabelText("E-mail de acesso");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    const message = await screen.findByText(
      "O e-mail informado já está em uso.",
    );
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(message).toHaveAttribute("id", "account-email-error");

    await user.type(email, ".br");
    expect(
      screen.queryByText("O e-mail informado já está em uso."),
    ).not.toBeInTheDocument();
    expect(email).toHaveAttribute("aria-invalid", "false");
  });

  it("retries a failed refresh without creating the account again", async () => {
    vi.mocked(createUserAccount).mockResolvedValue({
      email: "nova.pessoa@example.test",
      id: 10,
      profileName: "SetorTransporte",
      temporaryCredential: "temporary-test-credential",
      temporaryCredentialExpiresAtUtc: "2030-06-10T11:30:00Z",
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
    expect(createUserAccount).toHaveBeenCalledWith({
      email: "nova.pessoa@example.test",
      name: "Nova Pessoa",
      profileName: "SetorTransporte",
    });
    expect(
      screen.queryByText("Nenhuma conta encontrada"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nova conta" })).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: "Fechar e apagar da tela" }),
    );
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findAllByText(activeAccount.name)).not.toHaveLength(0);
    expect(createUserAccount).toHaveBeenCalledTimes(1);
    expect(searchUserAccounts).toHaveBeenCalledTimes(3);
  });

  it("creates an account without a password and reveals the credential only once", async () => {
    vi.mocked(createUserAccount).mockResolvedValue({
      email: "nova.pessoa@example.test",
      id: 10,
      profileName: "SetorTransporte",
      temporaryCredential: "temporary-test-credential",
      temporaryCredentialExpiresAtUtc: "2030-06-10T11:30:00Z",
    });
    const user = userEvent.setup();
    const { container } = renderPage();
    await screen.findAllByText(activeAccount.name);
    const openButton = screen.getByRole("button", { name: "Nova conta" });
    await fillAccountForm(user);
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    const dialog = await screen.findByRole("dialog", {
      name: "Credencial temporária criada",
    });
    expect(createUserAccount).toHaveBeenCalledWith({
      email: "nova.pessoa@example.test",
      name: "Nova Pessoa",
      profileName: "SetorTransporte",
    });
    expect(vi.mocked(createUserAccount).mock.calls[0][0]).not.toHaveProperty(
      "password",
    );
    expect(dialog).toHaveTextContent("temporary-test-credential");
    expect(dialog).toHaveTextContent(/não poderá ser recuperada/i);
    await expectNoSeriousAccessibilityViolations(container);
    expect(
      within(dialog).getByRole("button", { name: "Fechar e apagar da tela" }),
    ).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(
      screen.queryByText("temporary-test-credential"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /reabrir/i }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(openButton).toHaveFocus());
  });

  it("does not reveal an invalid creation response", async () => {
    vi.mocked(createUserAccount).mockRejectedValue(
      Object.assign(new Error("contract"), {
        name: "UserAccountsContractError",
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(activeAccount.name);
    await fillAccountForm(user);
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível consultar as contas.",
    );
    expect(
      screen.queryByRole("dialog", { name: "Credencial temporária criada" }),
    ).not.toBeInTheDocument();
  });

  it("announces clipboard success and failure without persisting the credential", async () => {
    vi.mocked(createUserAccount).mockResolvedValue({
      email: "nova.pessoa@example.test",
      id: 10,
      profileName: "SetorTransporte",
      temporaryCredential: "temporary-test-credential",
      temporaryCredentialExpiresAtUtc: "2030-06-10T11:30:00Z",
    });
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    renderPage();
    await screen.findAllByText(activeAccount.name);
    await fillAccountForm(user);
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    await screen.findByRole("dialog", { name: "Credencial temporária criada" });

    writeText.mockResolvedValueOnce();
    await user.click(screen.getByRole("button", { name: "Copiar credencial" }));
    expect(await screen.findByText("Credencial copiada.")).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith("temporary-test-credential");

    writeText.mockRejectedValueOnce(new Error("clipboard unavailable"));
    await user.click(screen.getByRole("button", { name: "Copiar credencial" }));
    expect(
      await screen.findByText(/Não foi possível copiar/),
    ).toBeInTheDocument();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(window.location.href).not.toContain("temporary-test-credential");
  });

  it.each([
    "Esquecimento",
    "SuspeitaComprometimento",
    "ProvisionamentoCorretivo",
  ] as const)("resets another active account for reason %s", async (reason) => {
    vi.mocked(resetTemporaryCredential).mockResolvedValue({
      temporaryCredential: "replacement-test-credential",
      temporaryCredentialExpiresAtUtc: "2030-06-10T12:00:00Z",
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(activeAccount.name);
    await user.click(
      screen.getAllByRole("button", { name: "Redefinir credencial" })[0],
    );
    const dialog = screen.getByRole("dialog", {
      name: "Redefinir credencial?",
    });
    expect(dialog).toHaveTextContent("sessões anteriores serão encerradas");
    expect(dialog).toHaveTextContent(
      "credencial temporária anterior será invalidada",
    );
    expect(dialog).toHaveTextContent("nova troca obrigatória será exigida");
    await selectFieldOption(
      user,
      screen.getByLabelText("Motivo da redefinição"),
      reason,
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar redefinição" }),
    );

    expect(resetTemporaryCredential).toHaveBeenCalledWith(
      activeAccount.id,
      reason,
    );
    expect(
      await screen.findByText("replacement-test-credential"),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("dialog", { name: "Credencial temporária criada" }),
      ).getByRole("button", { name: "Fechar e apagar da tela" }),
    ).toHaveFocus();
  });

  it("does not offer self-reset or reset for inactive accounts", async () => {
    vi.mocked(searchUserAccounts).mockResolvedValue({
      ...accountPage,
      items: [{ ...activeAccount, id: 1 }, inactiveAccount],
    });
    renderPage();
    await screen.findAllByText(activeAccount.name);

    expect(
      screen.queryByRole("button", { name: "Redefinir credencial" }),
    ).not.toBeInTheDocument();
  });

  it("shows only the pending credential state and its expiration", async () => {
    renderPage();
    await screen.findAllByText(activeAccount.name);

    expect(screen.getAllByText("Troca obrigatória pendente")).not.toHaveLength(
      0,
    );
    expect(screen.getAllByText(/Expira em/)).not.toHaveLength(0);
    expect(screen.getAllByText("Sem troca pendente")).not.toHaveLength(0);
    expect(document.body.textContent).not.toMatch(/hash|versão interna/i);
  });

  it("closes reset with Escape and restores focus to its trigger", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(activeAccount.name);
    const trigger = screen.getAllByRole("button", {
      name: "Redefinir credencial",
    })[0];
    await user.click(trigger);

    expect(
      within(
        screen.getByRole("dialog", { name: "Redefinir credencial?" }),
      ).getByRole("button", { name: "Cancelar" }),
    ).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", { name: "Redefinir credencial?" }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("clears a disclosed credential when administrative access is lost", async () => {
    vi.mocked(createUserAccount).mockResolvedValue({
      email: "nova.pessoa@example.test",
      id: 10,
      profileName: "SetorTransporte",
      temporaryCredential: "temporary-test-credential",
      temporaryCredentialExpiresAtUtc: "2030-06-10T11:30:00Z",
    });
    const user = userEvent.setup();
    const view = renderPage();
    await screen.findAllByText(activeAccount.name);
    await fillAccountForm(user);
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(
      await screen.findByText("temporary-test-credential"),
    ).toBeInTheDocument();

    vi.mocked(useAuthenticatedSession).mockReturnValue({
      completePasswordChange: vi.fn(),
      expiresAtUtc: "2030-06-10T22:00:00Z",
      login: vi.fn(),
      logout: vi.fn(),
      sessionEndReason: "expired",
      status: "authenticated",
      user: {
        email: "porteiro.ficticio@example.test",
        id: 2,
        profileName: "Porteiro",
      },
    });
    view.rerender(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("heading", { name: "Acesso negado" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("temporary-test-credential"),
    ).not.toBeInTheDocument();
  });

  it("has no serious accessibility violations in the credential reset dialog", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    await screen.findAllByText(activeAccount.name);
    await user.click(
      screen.getAllByRole("button", { name: "Redefinir credencial" })[0],
    );
    await expectNoSeriousAccessibilityViolations(container);
  });

  it("requires a reset reason and sends only one request during repeated activation", async () => {
    let resolveReset!: (value: {
      temporaryCredential: string;
      temporaryCredentialExpiresAtUtc: string;
    }) => void;
    vi.mocked(resetTemporaryCredential).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveReset = resolve;
        }),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(activeAccount.name);
    await user.click(
      screen.getAllByRole("button", { name: "Redefinir credencial" })[0],
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar redefinição" }),
    );
    expect(
      screen.getByText("Selecione o motivo da redefinição."),
    ).toBeInTheDocument();
    expect(resetTemporaryCredential).not.toHaveBeenCalled();

    await selectFieldOption(
      user,
      screen.getByLabelText("Motivo da redefinição"),
      "Esquecimento",
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar redefinição" }),
    );
    const resetDialog = screen.getByRole("dialog", {
      name: "Redefinir credencial?",
    });
    const pendingButton = within(resetDialog).getByRole("button", {
      name: "Redefinindo…",
    });
    expect(pendingButton).toBeDisabled();
    await user.click(pendingButton);
    expect(resetTemporaryCredential).toHaveBeenCalledTimes(1);

    await act(async () =>
      resolveReset({
        temporaryCredential: "replacement-test-credential",
        temporaryCredentialExpiresAtUtc: "2030-06-10T12:00:00Z",
      }),
    );
    expect(
      await screen.findByText("replacement-test-credential"),
    ).toBeInTheDocument();
  });

  it.each([
    ["validation", 400, "Selecione um motivo válido."],
    ["expired session", 401, "Sua sessão não é mais válida."],
    ["conflict", 409, "Reative a conta antes de redefinir sua credencial."],
    ["rate limit", 429, "Muitas tentativas em pouco tempo."],
    ["missing", 404, "A conta não foi encontrada."],
  ])("keeps the reset dialog safe after %s", async (_case, status, message) => {
    vi.mocked(resetTemporaryCredential).mockRejectedValue(new Error("request"));
    vi.mocked(describeApiError).mockReturnValue({
      kind:
        status === 400
          ? "validation"
          : status === 401
            ? "session-expired"
            : status === 409
              ? "conflict"
              : status === 429
                ? "rate-limited"
                : "unexpected",
      message,
      status,
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(activeAccount.name);
    await user.click(
      screen.getAllByRole("button", { name: "Redefinir credencial" })[0],
    );
    await selectFieldOption(
      user,
      screen.getByLabelText("Motivo da redefinição"),
      "Esquecimento",
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar redefinição" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.getByLabelText("Motivo da redefinição")).toHaveTextContent(
      "Esquecimento",
    );
    expect(resetTemporaryCredential).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByText("replacement-test-credential"),
    ).not.toBeInTheDocument();
  });

  it("closes administrative controls after a forbidden reset", async () => {
    vi.mocked(resetTemporaryCredential).mockRejectedValue(
      new Error("forbidden"),
    );
    vi.mocked(describeApiError).mockReturnValue({
      kind: "access-denied",
      message: "Seu perfil não possui permissão para realizar esta ação.",
      status: 403,
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(activeAccount.name);
    await user.click(
      screen.getAllByRole("button", { name: "Redefinir credencial" })[0],
    );
    await selectFieldOption(
      user,
      screen.getByLabelText("Motivo da redefinição"),
      "Esquecimento",
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar redefinição" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Acesso negado" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Redefinir credencial?" }),
    ).not.toBeInTheDocument();
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

  it("presents a backend state conflict without a false success", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(deactivateUserAccount).mockRejectedValue(new Error("conflict"));
    vi.mocked(describeApiError).mockReturnValue({
      kind: "conflict",
      message: "Um administrador não pode desativar a própria conta.",
      status: 409,
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(activeAccount.name);
    await user.click(screen.getAllByRole("button", { name: "Desativar" })[0]);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Um administrador não pode desativar a própria conta.",
    );
    expect(
      screen.queryByText(/desativada com sucesso/),
    ).not.toBeInTheDocument();
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
      temporaryCredential: string;
      temporaryCredentialExpiresAtUtc: string;
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
        temporaryCredential: "temporary-test-credential",
        temporaryCredentialExpiresAtUtc: "2030-06-10T11:30:00Z",
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
    expect(screen.getByRole("button", { name: "Nova conta" })).toBeDisabled();
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
