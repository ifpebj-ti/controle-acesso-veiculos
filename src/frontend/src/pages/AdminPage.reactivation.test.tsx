import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders, CanceledError } from "axios";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfirmationProvider } from "../components/ui/ConfirmationProvider";
import {
  useAuthenticatedSession,
  type ProfileName,
} from "../features/authentication";
import type {
  UserAccount,
  UserAccountFilters,
} from "../features/user-accounts";
import { api } from "../services/api";
import { selectFieldOption } from "../test/selectField";
import { AdminPage } from "./AdminPage";

vi.mock("../features/authentication", async (original) => ({
  ...(await original<typeof import("../features/authentication")>()),
  useAuthenticatedSession: vi.fn(),
}));
vi.mock("../services/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const local: UserAccount = {
  id: 8,
  name: "Pessoa Fictícia",
  email: "pessoa@example.test",
  profileName: "Administrador",
  active: false,
  authenticationMethod: "Local",
  externalIdentityLinked: false,
  createdAtUtc: "2030-06-10T11:00:00Z",
  updatedAtUtc: null,
  lockedUntilUtc: null,
  requiresPasswordChange: false,
  temporaryCredentialExpiresAtUtc: null,
};
const credential = {
  temporaryCredential: "CREDENCIAL_FICTICIA_NAO_UTILIZAVEL",
  temporaryCredentialExpiresAtUtc: "2030-06-10T11:30:00Z",
};
let account: UserAccount;
function responseError(status: number, data: unknown = {}) {
  return new AxiosError(
    "controlled failure",
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    {
      status,
      statusText: "Controlled",
      headers: {},
      data,
      config: { headers: new AxiosHeaders() },
    },
  );
}
function authenticate(profileName: ProfileName = "Administrador", id = 1) {
  vi.mocked(useAuthenticatedSession).mockReturnValue({
    user: {
      id,
      email: "admin@example.test",
      profileName,
      requiresPasswordChange: false,
    },
  } as ReturnType<typeof useAuthenticatedSession>);
}
function page() {
  return (
    <MemoryRouter>
      <ConfirmationProvider>
        <AdminPage />
      </ConfirmationProvider>
    </MemoryRouter>
  );
}
async function open(user: ReturnType<typeof userEvent.setup>) {
  const trigger = (
    await screen.findAllByRole("button", { name: "Reativar" })
  )[0];
  await user.click(trigger);
  return { trigger, dialog: screen.getByRole("dialog", { name: /Reativar/ }) };
}
async function confirmLocal(
  user: ReturnType<typeof userEvent.setup>,
  dialog: HTMLElement,
) {
  await selectFieldOption(
    user,
    within(dialog).getByLabelText("Motivo da reativação"),
    "Esquecimento",
  );
  await user.click(
    within(dialog).getByRole("button", {
      name: "Confirmar reativação com nova credencial",
    }),
  );
}

describe("reactivation mounted in authenticated account management (controlled HTTP)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    account = { ...local };
    authenticate();
    vi.mocked(api.get).mockImplementation(async (url, config) => {
      if (url !== "/users") throw new Error("Unexpected controlled route");
      const params = config?.params as UserAccountFilters | undefined;
      const matches =
        params?.active === undefined || params.active === account.active;
      return {
        status: 200,
        data: {
          items: matches ? [account] : [],
          page: params?.page ?? 1,
          pageSize: params?.pageSize ?? 25,
          totalCount: matches ? 1 : 0,
          totalPages: matches ? 1 : 0,
        },
      };
    });
  });

  it("uses one Local reset POST, discloses once in memory, refreshes applied filters and clears on close", async () => {
    const storage = vi.spyOn(Storage.prototype, "setItem");
    vi.mocked(api.post).mockImplementation(async () => {
      account = { ...account, active: true };
      return { status: 200, data: credential };
    });
    const user = userEvent.setup();
    render(page());
    await screen.findAllByRole("button", { name: "Reativar" });
    await user.type(screen.getByLabelText("Nome ou e-mail"), "Pessoa");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() =>
      expect(api.get).toHaveBeenLastCalledWith("/users", {
        params: { active: undefined, page: 1, pageSize: 25, search: "Pessoa" },
      }),
    );
    const { dialog } = await open(user);
    expect(screen.getByRole("button", { name: "Nova conta" })).toBeDisabled();
    await confirmLocal(user, dialog);
    const disclosure = await screen.findByRole("dialog", {
      name: "Credencial temporária criada",
    });
    expect(api.post).toHaveBeenCalledExactlyOnceWith(
      "/users/8/reactivation-with-reset",
      { reason: "Esquecimento" },
      { skipSessionRetry: true },
    );
    expect(disclosure).toHaveTextContent(credential.temporaryCredential);
    await user.click(
      within(disclosure).getByRole("button", { name: /Fechar/ }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await screen.findAllByRole("button", { name: "Redefinir credencial" });
    expect(
      screen.queryByText(credential.temporaryCredential),
    ).not.toBeInTheDocument();
    expect(storage).not.toHaveBeenCalled();
    expect(api.get).toHaveBeenLastCalledWith("/users", {
      params: { active: undefined, page: 1, pageSize: 25, search: "Pessoa" },
    });
    expect(api.post).toHaveBeenCalledOnce();
    storage.mockRestore();
  });

  it("uses the canonical Google method for an administrative profile without a password or reset", async () => {
    account = {
      ...account,
      authenticationMethod: "Google",
      externalIdentityLinked: true,
    };
    vi.mocked(api.post).mockResolvedValue({ status: 204 });
    const user = userEvent.setup();
    render(page());
    const { dialog } = await open(user);
    expect(dialog).toHaveTextContent("Nenhuma senha local será criada");
    expect(
      within(dialog).queryByLabelText(/Motivo|Senha/),
    ).not.toBeInTheDocument();
    await user.click(
      within(dialog).getByRole("button", {
        name: "Confirmar reativação Google",
      }),
    );
    expect(
      await within(dialog).findByText(/Conta Google reativada/),
    ).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledExactlyOnceWith(
      "/users/8/reactivation",
      undefined,
      { skipSessionRetry: true },
    );
  });

  it.each(["CanceledError", "AbortError", "network"])(
    "reconciles %s only through reads and blocks reopening from resending",
    async (kind) => {
      const failure =
        kind === "CanceledError"
          ? new CanceledError()
          : kind === "AbortError"
            ? new DOMException("Controlled", "AbortError")
            : new AxiosError("Controlled", "ERR_NETWORK");
      vi.mocked(api.post).mockRejectedValue(failure);
      const user = userEvent.setup();
      render(page());
      const { dialog } = await open(user);
      await confirmLocal(user, dialog);
      await user.click(
        await within(dialog).findByRole("button", {
          name: "Atualizar estado da conta",
        }),
      );
      expect(
        await within(dialog).findByText(/aparece inativa/),
      ).toBeInTheDocument();
      expect(api.get).toHaveBeenLastCalledWith("/users", {
        params: {
          active: undefined,
          page: 1,
          pageSize: 100,
          search: account.name,
        },
      });
      await user.click(within(dialog).getByRole("button", { name: "Fechar" }));
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Nova conta" }),
        ).toBeEnabled(),
      );
      await user.click(screen.getAllByRole("button", { name: "Reativar" })[0]);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(
        screen.getByText(/resultado anterior desta conta continua incerto/),
      ).toBeInTheDocument();
      expect(api.post).toHaveBeenCalledOnce();
    },
  );

  it("reads an active account after lost delivery but never fetches or issues another credential automatically", async () => {
    vi.mocked(api.post).mockImplementation(async () => {
      account = { ...account, active: true };
      throw new AxiosError("Controlled lost delivery", "ERR_NETWORK");
    });
    const user = userEvent.setup();
    render(page());
    const { dialog } = await open(user);
    await confirmLocal(user, dialog);
    await user.click(
      await within(dialog).findByRole("button", {
        name: "Atualizar estado da conta",
      }),
    );
    expect(
      await within(dialog).findByText(
        /não confirma o recebimento da credencial/,
      ),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Fechar" }));
    await screen.findAllByRole("button", { name: "Redefinir credencial" });
    expect(api.post).toHaveBeenCalledOnce();
    expect(
      screen.queryByText(credential.temporaryCredential),
    ).not.toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalledWith("/users/8", expect.anything());
  });

  it("preserves a rejected reason and only retries after another explicit submission", async () => {
    vi.mocked(api.post)
      .mockRejectedValueOnce(
        responseError(400, {
          errors: { reason: ["Motivo fictício recusado."] },
        }),
      )
      .mockResolvedValueOnce({ status: 200, data: credential });
    const user = userEvent.setup();
    render(page());
    const { dialog } = await open(user);
    await confirmLocal(user, dialog);
    expect(
      await within(dialog).findByText("Motivo fictício recusado."),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("combobox")).toHaveTextContent(
      "Esquecimento",
    );
    await selectFieldOption(
      user,
      within(dialog).getByLabelText("Motivo da reativação"),
      "SuspeitaComprometimento",
    );
    expect(
      within(dialog).queryByText("Motivo fictício recusado."),
    ).not.toBeInTheDocument();
    expect(api.post).toHaveBeenCalledOnce();
    await user.click(
      within(dialog).getByRole("button", {
        name: "Confirmar reativação com nova credencial",
      }),
    );
    await screen.findByRole("dialog", { name: "Credencial temporária criada" });
    expect(api.post).toHaveBeenCalledTimes(2);
  });

  it("refreshes the canonical method after the legacy 409 and requires a new explicit Local confirmation", async () => {
    account = {
      ...account,
      authenticationMethod: "Google",
      externalIdentityLinked: true,
    };
    vi.mocked(api.post)
      .mockImplementationOnce(async () => {
        account = {
          ...account,
          authenticationMethod: "Local",
          externalIdentityLinked: false,
        };
        throw responseError(409, {
          code: "local_reactivation_requires_credential_reset",
        });
      })
      .mockResolvedValueOnce({ status: 200, data: credential });
    const user = userEvent.setup();
    render(page());
    const { dialog } = await open(user);
    await user.click(
      within(dialog).getByRole("button", {
        name: "Confirmar reativação Google",
      }),
    );
    await within(dialog).findByRole("button", {
      name: "Atualizar estado da conta",
    });
    await user.click(within(dialog).getByRole("button", { name: "Fechar" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Nova conta" })).toBeEnabled(),
    );
    expect(api.post).toHaveBeenCalledOnce();
    const reopened = await open(user);
    expect(reopened.dialog).toHaveAccessibleName(
      "Reativar com nova credencial?",
    );
    expect(api.post).toHaveBeenCalledOnce();
    await confirmLocal(user, reopened.dialog);
    await screen.findByRole("dialog", { name: "Credencial temporária criada" });
    expect(api.post).toHaveBeenCalledTimes(2);
    expect(api.post).toHaveBeenLastCalledWith(
      "/users/8/reactivation-with-reset",
      { reason: "Esquecimento" },
      { skipSessionRetry: true },
    );
  });

  it("does not reveal invalid successful response data or repeat a mutation", async () => {
    vi.mocked(api.post).mockResolvedValue({
      status: 200,
      data: { ...credential, unexpected: true },
    });
    const user = userEvent.setup();
    render(page());
    const { dialog } = await open(user);
    await confirmLocal(user, dialog);
    await within(dialog).findByRole("button", {
      name: "Atualizar estado da conta",
    });
    expect(
      screen.queryByText(credential.temporaryCredential),
    ).not.toBeInTheDocument();
    expect(api.post).toHaveBeenCalledOnce();
  });

  it("cancels with Escape and restores the actual catalog trigger", async () => {
    const user = userEvent.setup();
    render(page());
    const { dialog, trigger } = await open(user);
    expect(
      within(dialog).getByRole("button", { name: "Cancelar" }),
    ).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(api.post).not.toHaveBeenCalled();
  });

  it("ignores a late credential after changing the authenticated administrator", async () => {
    let resolve!: (value: unknown) => void;
    vi.mocked(api.post).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const user = userEvent.setup();
    const view = render(page());
    const { dialog } = await open(user);
    await confirmLocal(user, dialog);
    authenticate("Administrador", 2);
    view.rerender(page());
    await act(async () => {
      resolve({ status: 200, data: credential });
    });
    expect(
      screen.queryByText(credential.temporaryCredential),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(api.post).toHaveBeenCalledOnce();
  });

  it("does not send twice when confirmation is double-clicked and cannot close while pending", async () => {
    let resolve!: (value: unknown) => void;
    vi.mocked(api.post).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const user = userEvent.setup();
    render(page());
    const { dialog } = await open(user);
    await selectFieldOption(
      user,
      within(dialog).getByLabelText("Motivo da reativação"),
      "Esquecimento",
    );
    await user.dblClick(
      within(dialog).getByRole("button", {
        name: "Confirmar reativação com nova credencial",
      }),
    );
    expect(api.post).toHaveBeenCalledOnce();
    await user.keyboard("{Escape}");
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Fechar" }),
    ).toBeDisabled();
    await act(async () => {
      resolve({ status: 200, data: credential });
    });
    await screen.findByRole("dialog", { name: "Credencial temporária criada" });
    expect(api.post).toHaveBeenCalledOnce();
  });

  it("keeps the inactive filter and corrects an invalid last page after reactivation", async () => {
    const others = Array.from({ length: 25 }, (_, index) => ({
      ...local,
      id: index + 20,
      name: `Outra Pessoa Fictícia ${index}`,
    }));
    vi.mocked(api.get).mockImplementation(async (_url, config) => {
      const params = config?.params as UserAccountFilters | undefined;
      const index = params?.page ?? 1;
      return {
        status: 200,
        data: {
          items: index === 1 ? others : account.active ? [] : [account],
          page: index,
          pageSize: 25,
          totalCount: account.active ? 25 : 26,
          totalPages: account.active ? 1 : 2,
        },
      };
    });
    vi.mocked(api.post).mockImplementation(async () => {
      account = { ...account, active: true };
      return { status: 200, data: credential };
    });
    const user = userEvent.setup();
    render(page());
    await screen.findAllByText(others[0].name);
    await selectFieldOption(user, screen.getByLabelText("Situação"), "false");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await screen.findAllByText(others[0].name);
    await user.click(screen.getByRole("button", { name: "Próxima" }));
    const { dialog } = await open(user);
    await confirmLocal(user, dialog);
    const disclosure = await screen.findByRole("dialog", {
      name: "Credencial temporária criada",
    });
    await user.click(
      within(disclosure).getByRole("button", { name: /Fechar/ }),
    );
    await screen.findAllByText(others[0].name);
    expect(screen.getByLabelText("Situação")).toHaveTextContent("Desativadas");
    expect(api.get).toHaveBeenLastCalledWith("/users", {
      params: { active: false, page: 1, pageSize: 25, search: undefined },
    });
    expect(api.post).toHaveBeenCalledOnce();
    await waitFor(() => expect(document.activeElement).not.toBe(document.body));
  });

  it.each<ProfileName>(["Porteiro", "Vigilante", "SetorTransporte"])(
    "never loads this administrative flow for %s",
    (profile) => {
      authenticate(profile);
      render(page());
      expect(
        screen.getByRole("heading", { name: "Acesso negado" }),
      ).toBeInTheDocument();
      expect(api.get).not.toHaveBeenCalled();
      expect(api.post).not.toHaveBeenCalled();
    },
  );
});
