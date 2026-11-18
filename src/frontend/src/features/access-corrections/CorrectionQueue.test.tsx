import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, CanceledError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedSession } from "../authentication";
import {
  pendingCorrection,
  terminalCorrection,
} from "../../test/correctionReviewFixtures";
import { expectNoSeriousAccessibilityViolations } from "../../test/accessibility";
import { selectFieldOption } from "../../test/selectField";
import { CorrectionQueue } from "./CorrectionQueue";
import { CorrectionReviewScope } from "./CorrectionReviewScope";
import {
  decideCorrectionRequest,
  getCorrectionRequest,
  searchCorrectionRequests,
} from "./service";
import type { CorrectionPage, CorrectionRequest } from "./schemas";

vi.mock("../authentication", () => ({ useAuthenticatedSession: vi.fn() }));
vi.mock("./service", async (original) => ({
  ...(await original<typeof import("./service")>()),
  searchCorrectionRequests: vi.fn(),
  decideCorrectionRequest: vi.fn(),
  getCorrectionRequest: vi.fn(),
}));
const session = { user: { id: 2, profileName: "SetorTransporte" } };
const page = (
  items: CorrectionRequest[] = [pendingCorrection],
  number = 1,
  pages = 1,
): CorrectionPage => ({
  items,
  page: number,
  pageSize: 25,
  totalCount: pages > 1 ? 26 : items.length,
  totalPages: pages,
});
function mount() {
  const approved = vi.fn();
  const rendered = render(
    <CorrectionReviewScope>
      <CorrectionQueue onResume={vi.fn()} onApproved={approved} />
    </CorrectionReviewScope>,
  );
  return { ...rendered, approved };
}
async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Consultar pedidos" }));
  await user.click(
    await screen.findByRole("button", { name: "Conferir solicitação #31" }),
  );
}
describe("correction queue and authorized review", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useAuthenticatedSession).mockReturnValue(
      session as ReturnType<typeof useAuthenticatedSession>,
    );
    vi.mocked(searchCorrectionRequests).mockResolvedValue(page());
  });
  it("does not close another request when a previous decision finishes after closing", async () => {
    let resolve!: (request: CorrectionRequest) => void;
    vi.mocked(searchCorrectionRequests).mockResolvedValue(
      page([pendingCorrection, { ...pendingCorrection, id: 32 }]),
    );
    vi.mocked(decideCorrectionRequest).mockReturnValueOnce(
      new Promise((yes) => {
        resolve = yes;
      }),
    );
    const user = userEvent.setup();
    const { approved } = mount();
    await open(user);
    await user.click(screen.getByRole("button", { name: "Aprovar" }));
    await user.type(
      screen.getByLabelText("Motivo — Aprovar"),
      "Conferência fictícia realizada.",
    );
    await user.click(screen.getByRole("button", { name: "Confirmar aprovar" }));
    await user.keyboard("{Escape}");
    await user.click(
      screen.getByRole("button", { name: "Conferir solicitação #32" }),
    );
    await act(async () => resolve(terminalCorrection("Aprovada")));
    expect(
      screen.getByRole("dialog", { name: "Solicitação #32" }),
    ).toBeInTheDocument();
    expect(approved).toHaveBeenCalledOnce();
    expect(decideCorrectionRequest).toHaveBeenCalledTimes(1);
  });
  it("loads only on demand and preserves real status filters and pagination", async () => {
    const user = userEvent.setup();
    mount();
    expect(searchCorrectionRequests).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Consultar pedidos" }));
    await screen.findByText(/1 pedido\(s\)/);
    await selectFieldOption(
      user,
      screen.getByLabelText("Estado do pedido"),
      "Pendente",
    );
    vi.mocked(searchCorrectionRequests).mockResolvedValue(
      page([pendingCorrection], 1, 2),
    );
    await user.click(
      screen.getByRole("button", { name: "Aplicar filtro de pedidos" }),
    );
    await waitFor(() =>
      expect(searchCorrectionRequests).toHaveBeenLastCalledWith("Pendente", 1),
    );
    vi.mocked(searchCorrectionRequests).mockResolvedValue(
      page([pendingCorrection], 2, 2),
    );
    await user.click(
      screen.getByRole("button", { name: "Próxima nos pedidos" }),
    );
    await waitFor(() =>
      expect(searchCorrectionRequests).toHaveBeenLastCalledWith("Pendente", 2),
    );
    expect(await screen.findByText(/Página 2 de 2/)).toBeInTheDocument();
  });
  it("shows empty/error states and ignores an obsolete query response", async () => {
    let resolve!: (value: CorrectionPage) => void;
    vi.mocked(searchCorrectionRequests).mockReturnValueOnce(
      new Promise((yes) => {
        resolve = yes;
      }),
    );
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Consultar pedidos" }));
    vi.mocked(searchCorrectionRequests).mockResolvedValueOnce(page([]));
    await user.click(screen.getByRole("button", { name: "Atualizar pedidos" }));
    await screen.findByText("Nenhum pedido encontrado neste filtro.");
    await act(async () => resolve(page()));
    expect(
      screen.queryByRole("button", { name: "Conferir solicitação #31" }),
    ).not.toBeInTheDocument();
    vi.mocked(searchCorrectionRequests).mockRejectedValueOnce(
      new Error("fictional contract failure"),
    );
    await user.click(screen.getByRole("button", { name: "Atualizar pedidos" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Não|conexão/);
  });
  it("does not offer self review; preserves cancellation reason after a recoverable error", async () => {
    vi.mocked(useAuthenticatedSession).mockReturnValue({
      user: { id: 1, profileName: "Administrador" },
    } as ReturnType<typeof useAuthenticatedSession>);
    const user = userEvent.setup();
    const { approved } = mount();
    await open(user);
    expect(
      screen.queryByRole("button", { name: "Aprovar" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancelar pedido" }));
    const reason = screen.getByLabelText("Motivo — Cancelar pedido");
    await user.type(reason, "Cancelamento fictício solicitado.");
    vi.mocked(decideCorrectionRequest).mockRejectedValueOnce(
      new AxiosError("validation", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 400,
      } as never),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar cancelar pedido" }),
    );
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(reason).toHaveValue("Cancelamento fictício solicitado.");
    vi.mocked(decideCorrectionRequest).mockResolvedValueOnce(
      terminalCorrection("Cancelada"),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar cancelar pedido" }),
    );
    await screen.findByText(/Cancelada. O registro efetivo foi preservado/);
    expect(approved).not.toHaveBeenCalled();
  });
  it.each(["Porteiro", "Vigilante"] as const)(
    "does not offer review to %s for another requester",
    async (profileName) => {
      vi.mocked(useAuthenticatedSession).mockReturnValue({
        user: { id: 2, profileName },
      } as ReturnType<typeof useAuthenticatedSession>);
      const user = userEvent.setup();
      mount();
      await open(user);
      expect(
        screen.queryByRole("button", { name: "Aprovar" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Cancelar pedido" }),
      ).not.toBeInTheDocument();
    },
  );
  it("keeps uncertain decisions locked across closing/reopening and reconciles by GET only", async () => {
    const user = userEvent.setup();
    const { approved } = mount();
    await open(user);
    await user.click(screen.getByRole("button", { name: "Aprovar" }));
    await user.type(
      screen.getByLabelText("Motivo — Aprovar"),
      "Aprovação fictícia conferida.",
    );
    vi.mocked(decideCorrectionRequest).mockRejectedValueOnce(
      new CanceledError(),
    );
    await user.click(screen.getByRole("button", { name: "Confirmar aprovar" }));
    await screen.findByText(/A decisão pode ter sido recebida/i);
    await user.keyboard("{Escape}");
    await user.click(
      screen.getByRole("button", { name: "Conferir solicitação #31" }),
    );
    expect(screen.getByLabelText("Motivo — Aprovar")).toHaveValue(
      "Aprovação fictícia conferida.",
    );
    expect(
      screen.queryByRole("button", { name: "Confirmar aprovar" }),
    ).not.toBeInTheDocument();
    vi.mocked(getCorrectionRequest).mockResolvedValueOnce(pendingCorrection);
    await user.click(
      screen.getByRole("button", { name: "Consultar resultado da decisão" }),
    );
    await screen.findByText(/continua pendente/);
    vi.mocked(getCorrectionRequest).mockResolvedValueOnce(
      terminalCorrection("Aprovada"),
    );
    await user.click(
      screen.getByRole("button", { name: "Consultar resultado da decisão" }),
    );
    await waitFor(() => expect(approved).toHaveBeenCalledOnce());
    expect(decideCorrectionRequest).toHaveBeenCalledTimes(1);
    expect(getCorrectionRequest).toHaveBeenCalledTimes(2);
  });
  it.each([403, 409])(
    "preserves server %i without bypass or repeated decisions",
    async (status) => {
      const user = userEvent.setup();
      mount();
      await open(user);
      await user.click(screen.getByRole("button", { name: "Rejeitar" }));
      await user.type(
        screen.getByLabelText("Motivo — Rejeitar"),
        "Recusa fictícia justificada.",
      );
      vi.mocked(decideCorrectionRequest).mockRejectedValueOnce(
        new AxiosError("scope", "ERR_BAD_REQUEST", undefined, undefined, {
          status,
        } as never),
      );
      await user.click(
        screen.getByRole("button", { name: "Confirmar rejeitar" }),
      );
      await screen.findByRole("alert");
      expect(
        screen.queryByRole("button", { name: "Confirmar rejeitar" }),
      ).not.toBeInTheDocument();
      if (status === 403)
        expect(
          screen.getByRole("button", {
            name: "Consultar resultado da decisão",
          }),
        ).toBeDisabled();
      expect(decideCorrectionRequest).toHaveBeenCalledTimes(1);
    },
  );
  it("keeps internal identification separate from plate, keyboard focus contained and restored", async () => {
    vi.mocked(searchCorrectionRequests).mockResolvedValue(
      page([
        {
          ...pendingCorrection,
          plate: null,
          vehicleIdentification: "Identificação fictícia",
        },
      ]),
    );
    const user = userEvent.setup();
    const { container } = mount();
    await open(user);
    expect(screen.getByText("Sem placa informada")).toBeInTheDocument();
    expect(screen.getByText("Identificação fictícia")).toBeInTheDocument();
    const heading = screen.getByRole("heading", { name: "Solicitação #31" });
    expect(heading).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Fechar" })).toHaveFocus();
    await user.tab();
    expect(
      screen.getByRole("button", { name: "Fechar janela de correção" }),
    ).toHaveFocus();
    await expectNoSeriousAccessibilityViolations(container);
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Conferir solicitação #31" }),
      ).toHaveFocus(),
    );
  });
});
