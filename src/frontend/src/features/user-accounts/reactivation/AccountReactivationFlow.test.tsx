import { useRef, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders, CanceledError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../services/api";
import { selectFieldOption } from "../../../test/selectField";
import { expectNoSeriousAccessibilityViolations } from "../../../test/accessibility";
import { AccountReactivationFlow } from "./AccountReactivationFlow";
import type { ReactivationAccount } from "./types";

vi.mock("../../../services/api", () => ({ api: { post: vi.fn() } }));
const local: ReactivationAccount = {
  id: 8,
  name: "Pessoa fictícia",
  active: false,
  authenticationMethod: "Local",
};
const google: ReactivationAccount = {
  ...local,
  authenticationMethod: "Google",
};
const fixtureCredential = {
  temporaryCredential: "CREDENCIAL_FICTICIA_NAO_UTILIZAVEL",
  temporaryCredentialExpiresAtUtc: "2030-06-10T11:30:00Z",
};
function error(status: number, data: unknown = {}) {
  return new AxiosError(
    "Fictitious response",
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    {
      status,
      statusText: "Fictitious",
      headers: {},
      data,
      config: { headers: new AxiosHeaders() },
    },
  );
}

async function show(
  account = local,
  read = vi.fn<() => Promise<ReactivationAccount | null>>(),
) {
  function Harness() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLButtonElement>(null);
    return (
      <>
        <button ref={ref} onClick={() => setOpen(true)}>
          Reativação de teste
        </button>
        {open && (
          <AccountReactivationFlow
            account={account}
            readAccount={read}
            onClose={() => setOpen(false)}
            returnFocusTo={ref.current}
          />
        )}
      </>
    );
  }
  const user = userEvent.setup();
  const view = render(<Harness />);
  const trigger = screen.getByRole("button", { name: "Reativação de teste" });
  await user.click(trigger);
  return { user, trigger, read, ...view };
}
async function chooseReason(
  user: ReturnType<typeof userEvent.setup>,
  reason = "Esquecimento",
) {
  await selectFieldOption(
    user,
    screen.getByLabelText("Motivo da reativação"),
    reason,
  );
}

describe("standalone reactivation dialog, not wired into administration", () => {
  beforeEach(() => vi.resetAllMocks());
  it("requires a reason and explicit Local confirmation, then discloses once and clears on close", async () => {
    const storage = vi.spyOn(Storage.prototype, "setItem");
    vi.mocked(api.post).mockResolvedValue({
      status: 200,
      data: fixtureCredential,
    });
    const { user, trigger } = await show();
    expect(api.post).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "No primeiro acesso será exigida a troca da senha",
    );
    await user.click(
      screen.getByRole("button", {
        name: "Confirmar reativação com nova credencial",
      }),
    );
    expect(api.post).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Motivo da reativação")).toHaveFocus();
    expect(screen.getByText("Selecione o motivo da reativação.")).toBeVisible();
    await chooseReason(user);
    await user.click(
      screen.getByRole("button", {
        name: "Confirmar reativação com nova credencial",
      }),
    );
    expect(
      await screen.findByText(fixtureCredential.temporaryCredential),
    ).toBeVisible();
    expect(screen.getByText(/Válida até/)).toBeVisible();
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "a credencial não poderá ser recuperada",
    );
    expect(api.post).toHaveBeenCalledExactlyOnceWith(
      "/users/8/reactivation-with-reset",
      { reason: "Esquecimento" },
      { skipSessionRetry: true },
    );
    expect(storage).not.toHaveBeenCalled();
    expect(window.location.href).not.toContain(
      fixtureCredential.temporaryCredential,
    );
    await user.click(
      screen.getByRole("button", { name: "Fechar e apagar da tela" }),
    );
    expect(
      screen.queryByText(fixtureCredential.temporaryCredential),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    await user.click(trigger);
    expect(
      screen.queryByText(fixtureCredential.temporaryCredential),
    ).not.toBeInTheDocument();
    expect(api.post).toHaveBeenCalledTimes(1);
  });
  it("confirms Google without a reason field or Local credential", async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 204 });
    const { user } = await show(google);
    expect(
      screen.queryByLabelText("Motivo da reativação"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Nenhuma senha local será criada",
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar reativação Google" }),
    );
    expect(
      await screen.findByText(
        "Conta Google reativada. Nenhuma senha local foi criada.",
      ),
    ).toBeVisible();
    expect(api.post).toHaveBeenCalledExactlyOnceWith(
      "/users/8/reactivation",
      undefined,
      { skipSessionRetry: true },
    );
    expect(
      screen.queryByText(fixtureCredential.temporaryCredential),
    ).not.toBeInTheDocument();
  });
  it("preserves the reason/field error on 400 and sends another request only after explicit correction", async () => {
    vi.mocked(api.post)
      .mockRejectedValueOnce(
        error(400, { errors: { reason: ["Motivo fictício recusado."] } }),
      )
      .mockResolvedValueOnce({ status: 200, data: fixtureCredential });
    const { user } = await show();
    await chooseReason(user);
    await user.click(
      screen.getByRole("button", {
        name: "Confirmar reativação com nova credencial",
      }),
    );
    expect(await screen.findByText("Motivo fictício recusado.")).toBeVisible();
    expect(screen.getByLabelText("Motivo da reativação")).toHaveTextContent(
      "Esquecimento",
    );
    expect(api.post).toHaveBeenCalledTimes(1);
    await chooseReason(user, "ProvisionamentoCorretivo");
    await user.click(
      screen.getByRole("button", {
        name: "Confirmar reativação com nova credencial",
      }),
    );
    expect(
      await screen.findByText(fixtureCredential.temporaryCredential),
    ).toBeVisible();
    expect(api.post).toHaveBeenCalledTimes(2);
  });
  it.each([401, 403, 404, 409, 429, 500])(
    "handles HTTP %s without automatically repeating a mutation",
    async (status) => {
      vi.mocked(api.post).mockRejectedValue(error(status));
      const { user } = await show();
      await chooseReason(user);
      await user.click(
        screen.getByRole("button", {
          name: "Confirmar reativação com nova credencial",
        }),
      );
      expect(await screen.findByRole("alert")).toHaveAttribute(
        "aria-live",
        "assertive",
      );
      expect(api.post).toHaveBeenCalledTimes(1);
      expect(screen.getByLabelText("Motivo da reativação")).toHaveTextContent(
        "Esquecimento",
      );
      expect(
        screen.queryByText(fixtureCredential.temporaryCredential),
      ).not.toBeInTheDocument();
      if (status === 409 || status === 500)
        expect(
          screen.getByRole("button", { name: "Atualizar estado da conta" }),
        ).toBeEnabled();
      if (status === 401 || status === 403 || status === 404)
        expect(
          screen.queryByRole("button", {
            name: "Confirmar reativação com nova credencial",
          }),
        ).not.toBeInTheDocument();
    },
  );
  it.each([
    new AxiosError("", "ERR_NETWORK"),
    new CanceledError(),
    new DOMException("", "AbortError"),
  ])(
    "reconciles lost/cancelled responses by read only, without treating active as credential delivery",
    async (failure) => {
      vi.mocked(api.post).mockRejectedValue(failure);
      const read = vi
        .fn<() => Promise<ReactivationAccount | null>>()
        .mockResolvedValue({ ...local, active: true });
      const { user } = await show(local, read);
      await chooseReason(user);
      await user.click(
        screen.getByRole("button", {
          name: "Confirmar reativação com nova credencial",
        }),
      );
      await user.click(
        await screen.findByRole("button", {
          name: "Atualizar estado da conta",
        }),
      );
      expect(
        await screen.findByText(/não confirma o recebimento da credencial/),
      ).toBeVisible();
      expect(read).toHaveBeenCalledTimes(1);
      expect(api.post).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByText(fixtureCredential.temporaryCredential),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("dialog")).toHaveTextContent(
        "Redefinir credencial",
      );
    },
  );
  it("treats invalid 200 as uncertain and never renders response contents", async () => {
    vi.mocked(api.post).mockResolvedValue({
      status: 200,
      data: {
        ...fixtureCredential,
        temporaryCredentialExpiresAtUtc: "invalid",
      },
    });
    const { user } = await show();
    await chooseReason(user);
    await user.click(
      screen.getByRole("button", {
        name: "Confirmar reativação com nova credencial",
      }),
    );
    expect(
      await screen.findByRole("button", { name: "Atualizar estado da conta" }),
    ).toBeVisible();
    expect(
      screen.queryByText(fixtureCredential.temporaryCredential),
    ).not.toBeInTheDocument();
    expect(api.post).toHaveBeenCalledTimes(1);
  });
  it("does not automatically convert legacy Google refusal into Local mutation", async () => {
    vi.mocked(api.post).mockRejectedValue(
      error(409, { code: "local_reactivation_requires_credential_reset" }),
    );
    const { user, read } = await show(google);
    await user.click(
      screen.getByRole("button", { name: "Confirmar reativação Google" }),
    );
    expect(
      await screen.findByText(/exige uma nova credencial temporária/),
    ).toBeVisible();
    expect(read).not.toHaveBeenCalled();
    expect(api.post).toHaveBeenCalledTimes(1);
  });
  it("keeps keyboard focus contained and restores it on Escape without submitting", async () => {
    const { user, trigger } = await show(google);
    const cancel = screen.getByRole("button", { name: "Cancelar" });
    const confirm = screen.getByRole("button", {
      name: "Confirmar reativação Google",
    });
    expect(cancel).toHaveFocus();
    await user.tab();
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(api.post).not.toHaveBeenCalled();
  });
  it("ignores a credential delivered after unmount", async () => {
    let finish!: (value: unknown) => void;
    vi.mocked(api.post).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const { user, unmount } = await show();
    await chooseReason(user);
    await user.click(
      screen.getByRole("button", {
        name: "Confirmar reativação com nova credencial",
      }),
    );
    unmount();
    finish({ status: 200, data: fixtureCredential });
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByText(fixtureCredential.temporaryCredential),
    ).not.toBeInTheDocument();
  });
  it("contains focus while awaiting a mutation and recovers it for read-only reconciliation", async () => {
    let reject!: (error: unknown) => void;
    vi.mocked(api.post).mockImplementation(
      () =>
        new Promise((_, fail) => {
          reject = fail;
        }),
    );
    const { user, trigger } = await show(google);
    await user.click(
      screen.getByRole("button", { name: "Confirmar reativação Google" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveFocus();
    await user.tab();
    expect(dialog).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(dialog).toBeInTheDocument();
    reject(new CanceledError());
    const read = await screen.findByRole("button", {
      name: "Atualizar estado da conta",
    });
    await waitFor(() => expect(read).toHaveFocus());
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(api.post).toHaveBeenCalledTimes(1);
  });
  it("has no serious automated accessibility violations before sending", async () => {
    const { container } = await show();
    await expectNoSeriousAccessibilityViolations(container);
  });
});
