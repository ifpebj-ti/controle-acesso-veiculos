import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConfirmationProvider } from "../components/ui/ConfirmationProvider";
import {
  useAuthenticatedSession,
  type ProfileName,
} from "../features/authentication";
import {
  changeAccountProfile,
  createUserAccount,
  searchUserAccounts,
  type ChangedAccountProfile,
  type UserAccount,
  type UserAccountPage,
} from "../features/user-accounts";
import { expectNoSeriousAccessibilityViolations } from "../test/accessibility";
import { selectFieldOption } from "../test/selectField";
import { AdminPage } from "./AdminPage";

vi.mock("../features/authentication", async (original) => ({
  ...(await original<typeof import("../features/authentication")>()),
  useAuthenticatedSession: vi.fn(),
}));
vi.mock(
  "../features/user-accounts/services/userAccountsService",
  async (original) => ({
    ...(await original<
      typeof import("../features/user-accounts/services/userAccountsService")
    >()),
    changeAccountProfile: vi.fn(),
    createUserAccount: vi.fn(),
    searchUserAccounts: vi.fn(),
  }),
);

const account: UserAccount = {
  id: 8,
  name: "Pessoa Fictícia",
  email: "pessoa@example.test",
  profileName: "Porteiro",
  active: true,
  authenticationMethod: "Google",
  externalIdentityLinked: true,
  createdAtUtc: "2030-06-10T11:00:00Z",
  updatedAtUtc: null,
  lockedUntilUtc: null,
  requiresPasswordChange: false,
  temporaryCredentialExpiresAtUtc: null,
};
const page: UserAccountPage = {
  items: [account],
  page: 1,
  pageSize: 25,
  totalCount: 1,
  totalPages: 1,
};
const changed: ChangedAccountProfile = {
  previousProfileName: "Porteiro",
  currentProfileName: "Vigilante",
  authenticationMethod: "Google",
  temporaryCredential: null,
  temporaryCredentialExpiresAtUtc: null,
};
const justification = "Mudança de atribuição aprovada para teste fictício.";

function renderPage(profileName: ProfileName = "Administrador") {
  vi.mocked(useAuthenticatedSession).mockReturnValue({
    user: {
      id: 1,
      profileName,
      email: "admin@example.test",
      requiresPasswordChange: false,
    },
  } as ReturnType<typeof useAuthenticatedSession>);
  return render(
    <MemoryRouter>
      <ConfirmationProvider>
        <AdminPage />
      </ConfirmationProvider>
    </MemoryRouter>,
  );
}

async function openDialog(
  user: ReturnType<typeof userEvent.setup>,
  profile = "Vigilante",
) {
  const trigger = (
    await screen.findAllByRole("button", { name: "Alterar perfil" })
  )[0];
  await user.click(trigger);
  const dialog = screen.getByRole("dialog", {
    name: "Alterar perfil de acesso",
  });
  await selectFieldOption(
    user,
    within(dialog).getByLabelText("Novo perfil"),
    profile,
  );
  await user.type(
    within(dialog).getByLabelText("Justificativa"),
    justification,
  );
  return { dialog, trigger };
}

describe("administrative profile changes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchUserAccounts).mockResolvedValue(page);
    vi.mocked(changeAccountProfile).mockResolvedValue(changed);
  });

  it.each(["Porteiro", "Vigilante", "SetorTransporte"] as const)(
    "keeps profile management unavailable to %s",
    (profile) => {
      renderPage(profile);
      expect(
        screen.queryByRole("button", { name: "Alterar perfil" }),
      ).not.toBeInTheDocument();
      expect(searchUserAccounts).not.toHaveBeenCalled();
    },
  );

  it("does not offer profile changes for the current or an inactive account", async () => {
    vi.mocked(searchUserAccounts).mockResolvedValue({
      ...page,
      items: [
        { ...account, id: 1 },
        { ...account, id: 9, active: false },
      ],
    });
    renderPage();
    await screen.findAllByText(account.name);
    expect(
      screen.queryByRole("button", { name: "Alterar perfil" }),
    ).not.toBeInTheDocument();
  });

  it("requires valid justification, another profile and explicit confirmation", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      (await screen.findAllByRole("button", { name: "Alterar perfil" }))[0],
    );
    const submit = screen.getByRole("button", {
      name: "Confirmar alteração de perfil",
    });
    await user.click(submit);
    expect(screen.getByRole("alert")).toHaveTextContent("10 a 500");
    await user.type(screen.getByLabelText("Justificativa"), justification);
    await user.click(submit);
    expect(screen.getByRole("alert")).toHaveTextContent("diferente");
    await selectFieldOption(
      user,
      screen.getByLabelText("Novo perfil"),
      "Vigilante",
    );
    await user.click(submit);
    expect(screen.getByRole("alert")).toHaveTextContent("Confirme");
    expect(changeAccountProfile).not.toHaveBeenCalled();
  });

  it.each([
    ["Porteiro", "Vigilante", "Google"],
    ["Administrador", "SetorTransporte", "Google"],
    ["Vigilante", "Administrador", "Local"],
  ] as const)(
    "uses the canonical result for %s to %s and preserves filters",
    async (previous, next, method) => {
      const source = {
        ...account,
        profileName: previous,
        authenticationMethod:
          previous === "Administrador"
            ? ("Local" as const)
            : ("Google" as const),
      };
      vi.mocked(searchUserAccounts).mockResolvedValue({
        ...page,
        items: [source],
      });
      const result = {
        ...changed,
        previousProfileName: previous,
        currentProfileName: next,
        authenticationMethod: method,
        temporaryCredential:
          method === "Local" ? "fictitious-profile-credential" : null,
        temporaryCredentialExpiresAtUtc:
          method === "Local" ? "2030-06-10T12:00:00Z" : null,
      };
      vi.mocked(changeAccountProfile).mockResolvedValue(result);
      const user = userEvent.setup();
      renderPage();
      await screen.findAllByText(source.name);
      const search = screen.getByLabelText("Nome ou e-mail");
      await user.type(search, "Pessoa");
      await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
      const { dialog } = await openDialog(user, next);
      expect(dialog).toHaveTextContent("sessões anteriores");
      await user.click(within(dialog).getByRole("checkbox"));
      vi.mocked(searchUserAccounts).mockResolvedValue({
        ...page,
        items: [{ ...source, profileName: next, authenticationMethod: method }],
      });
      await user.click(
        within(dialog).getByRole("button", {
          name: "Confirmar alteração de perfil",
        }),
      );
      await waitFor(() => expect(searchUserAccounts).toHaveBeenCalledTimes(3));
      expect(changeAccountProfile).toHaveBeenCalledExactlyOnceWith(account.id, {
        profileName: next,
        reason: justification,
      });
      expect(searchUserAccounts).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "Pessoa" }),
      );
      expect(search).toHaveValue("Pessoa");
      if (method === "Local") {
        expect(
          await screen.findByText("fictitious-profile-credential"),
        ).toBeInTheDocument();
        expect(
          JSON.stringify({ ...localStorage, ...sessionStorage }),
        ).not.toContain("fictitious-profile-credential");
        expect(window.location.href).not.toContain(
          "fictitious-profile-credential",
        );
        await user.click(
          screen.getByRole("button", { name: "Fechar e apagar da tela" }),
        );
        expect(
          screen.queryByText("fictitious-profile-credential"),
        ).not.toBeInTheDocument();
      } else {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(await screen.findByRole("status")).toHaveTextContent(
          "Perfil alterado",
        );
      }
    },
  );

  it("blocks duplicate submission while awaiting the server", async () => {
    let resolve!: (result: ChangedAccountProfile) => void;
    vi.mocked(changeAccountProfile).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const user = userEvent.setup();
    renderPage();
    const { dialog } = await openDialog(user);
    await user.click(within(dialog).getByRole("checkbox"));
    await user.dblClick(
      within(dialog).getByRole("button", {
        name: "Confirmar alteração de perfil",
      }),
    );
    expect(changeAccountProfile).toHaveBeenCalledTimes(1);
    expect(dialog).toHaveTextContent("Aguarde a confirmação");
    await act(async () => resolve(changed));
  });

  it.each([400, 409, 429])(
    "preserves form data and announces a recoverable HTTP %s failure",
    async (status) => {
      vi.mocked(changeAccountProfile).mockRejectedValue({
        isAxiosError: true,
        response: {
          status,
          data: {
            message: "A conta já possui o perfil solicitado.",
            errors: { reason: ["Revise a justificativa."] },
          },
        },
      });
      const user = userEvent.setup();
      renderPage();
      const { dialog } = await openDialog(user);
      await user.click(within(dialog).getByRole("checkbox"));
      await user.click(
        within(dialog).getByRole("button", {
          name: "Confirmar alteração de perfil",
        }),
      );
      expect(await screen.findByRole("alert")).toHaveFocus();
      expect(screen.getByLabelText("Justificativa")).toHaveValue(justification);
      expect(screen.queryByText(/Perfil alterado/)).not.toBeInTheDocument();
      expect(changeAccountProfile).toHaveBeenCalledTimes(1);
    },
  );

  it("requires a list refresh after an uncertain network result without repeating the mutation", async () => {
    vi.mocked(changeAccountProfile).mockRejectedValue(new Error("offline"));
    const user = userEvent.setup();
    renderPage();
    const { dialog } = await openDialog(user);
    await user.click(within(dialog).getByRole("checkbox"));
    await user.click(
      within(dialog).getByRole("button", {
        name: "Confirmar alteração de perfil",
      }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "pode ter sido recebida",
    );
    expect(
      screen.getByRole("button", { name: "Confirmar alteração de perfil" }),
    ).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: "Fechar e atualizar lista" }),
    );
    await waitFor(() => expect(searchUserAccounts).toHaveBeenCalledTimes(2));
    expect(changeAccountProfile).toHaveBeenCalledTimes(1);
  });

  it.each([401, 403])(
    "closes the form on HTTP %s without exposing a credential",
    async (status) => {
      vi.mocked(changeAccountProfile).mockRejectedValue({
        isAxiosError: true,
        response: { status, data: {} },
      });
      const user = userEvent.setup();
      renderPage();
      const { dialog } = await openDialog(user);
      await user.click(within(dialog).getByRole("checkbox"));
      await user.click(
        within(dialog).getByRole("button", {
          name: "Confirmar alteração de perfil",
        }),
      );
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(screen.queryByText(/Perfil alterado/)).not.toBeInTheDocument();
      expect(changeAccountProfile).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    "A operação deixaria o sistema sem administrador ativo.",
    "Reative a conta antes de alterar seu perfil.",
    "A conta já possui o perfil solicitado.",
  ])(
    "shows the backend conflict without a false confirmation: %s",
    async (message) => {
      vi.mocked(changeAccountProfile).mockRejectedValue({
        isAxiosError: true,
        response: { status: 409, data: { message } },
      });
      const user = userEvent.setup();
      renderPage();
      const { dialog } = await openDialog(user);
      await user.click(within(dialog).getByRole("checkbox"));
      await user.click(
        within(dialog).getByRole("button", {
          name: "Confirmar alteração de perfil",
        }),
      );
      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(screen.getByLabelText("Justificativa")).toHaveValue(justification);
      expect(screen.queryByText(/Perfil alterado/)).not.toBeInTheDocument();
    },
  );

  it("does not repeat a successful mutation when reloading fails", async () => {
    vi.mocked(searchUserAccounts)
      .mockResolvedValueOnce(page)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(page);
    const user = userEvent.setup();
    renderPage();
    const { dialog } = await openDialog(user);
    await user.click(within(dialog).getByRole("checkbox"));
    await user.click(
      within(dialog).getByRole("button", {
        name: "Confirmar alteração de perfil",
      }),
    );
    expect(
      await screen.findByText(/sem repetir a operação/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() => expect(searchUserAccounts).toHaveBeenCalledTimes(3));
    expect(changeAccountProfile).toHaveBeenCalledTimes(1);
  });

  it("contains keyboard focus, supports Escape, restores focus and has accessible labels", async () => {
    const user = userEvent.setup();
    renderPage();
    const { dialog, trigger } = await openDialog(user);
    const cancel = within(dialog).getByRole("button", { name: "Cancelar" });
    const confirm = within(dialog).getByRole("button", {
      name: "Confirmar alteração de perfil",
    });
    const first = within(dialog).getByLabelText("Novo perfil");
    first.focus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(first).toHaveFocus();
    expect(cancel).toBeInTheDocument();
    await expectNoSeriousAccessibilityViolations(dialog);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(changeAccountProfile).not.toHaveBeenCalled();
  });

  it("accepts Google account creation without inventing a local credential", async () => {
    vi.mocked(createUserAccount).mockResolvedValue({
      id: 9,
      email: "nova@example.test",
      profileName: "Porteiro",
      authenticationMethod: "Google",
      temporaryCredential: null,
      temporaryCredentialExpiresAtUtc: null,
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("button", { name: "Nova conta" }));
    await user.type(screen.getByLabelText("Nome da pessoa"), "Nova Pessoa");
    await user.type(
      screen.getByLabelText("E-mail de acesso"),
      "nova@example.test",
    );
    await selectFieldOption(
      user,
      screen.getByLabelText("Perfil de acesso"),
      "Porteiro",
    );
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(
      await screen.findByText(/O acesso será pelo Google/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
