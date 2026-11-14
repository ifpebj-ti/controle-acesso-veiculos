import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type AccessRecord,
  type PagedAccessRecords,
} from "../features/access-records";
import {
  countAccessHistoryByCategory,
  correctAccessRecord,
  searchAccessHistory,
} from "../features/access-records/services/accessRecordsService";
import {
  useAuthenticatedSession,
  type ProfileName,
} from "../features/authentication";
import { describeApiError } from "../services/api-errors";
import { expectNoSeriousAccessibilityViolations } from "../test/accessibility";
import { selectFieldOption } from "../test/selectField";
import { generalAccessCategories } from "../features/access-records/model/accessCategories";
import { HistoryPage } from "./HistoryPage";
import {
  correctionKey,
  pendingCorrection,
  terminalCorrection,
} from "../test/correctionReviewFixtures";
import {
  decideCorrectionRequest,
  searchCorrectionRequests,
  submitCorrectionRequest,
} from "../features/access-corrections/service";
vi.mock("../features/access-corrections/service", async (original) => ({
  ...(await original<
    typeof import("../features/access-corrections/service")
  >()),
  decideCorrectionRequest: vi.fn(),
  searchCorrectionRequests: vi.fn(),
  submitCorrectionRequest: vi.fn(),
}));

vi.mock("../features/access-records/services/accessRecordsService", () => ({
  countAccessHistoryByCategory: vi.fn(),
  correctAccessRecord: vi.fn(),
  searchAccessHistory: vi.fn(),
}));

vi.mock("../features/authentication", () => ({
  useAuthenticatedSession: vi.fn(),
}));

vi.mock("../services/api-errors", () => ({
  describeApiError: vi.fn(),
}));

const record: AccessRecord = {
  categoryName: "Visitante",
  createdById: 1,
  driverName: "Pessoa histórica fictícia",
  entryAtUtc: "2026-09-02T12:00:00.000Z",
  exitAtUtc: null,
  id: 10,
  objective: "Atendimento fictício",
  observation: null,
  personId: 2,
  plate: "DEM1A23",
  status: "Aberto",
  updatedById: null,
  vehicleId: 3,
};

function pageResult(
  items: AccessRecord[],
  page = 1,
  totalPages = items.length > 0 ? 1 : 0,
  totalCount = totalPages > 1 ? 26 : items.length,
): PagedAccessRecords {
  return {
    items,
    page,
    pageSize: 25,
    totalCount,
    totalPages,
  };
}

function renderPage(profileName: ProfileName = "Porteiro") {
  vi.mocked(useAuthenticatedSession).mockReturnValue({
    completePasswordChange: vi.fn(),
    expiresAtUtc: "2099-01-01T00:00:00Z",
    login: vi.fn(),
    logout: vi.fn(),
    restoreExternalSession: vi.fn(),
    sessionEndReason: null,
    status: "authenticated",
    user: {
      email: "operador.ficticio@example.test",
      id: 1,
      profileName,
      requiresPasswordChange: false,
    },
  });

  return render(
    <MemoryRouter>
      <HistoryPage />
    </MemoryRouter>,
  );
}

function prepareReview() {
  vi.mocked(searchCorrectionRequests).mockResolvedValue({
    items: [{ ...pendingCorrection, requestedByUserId: 2 }],
    page: 1,
    pageSize: 25,
    totalCount: 1,
    totalPages: 1,
  });
  vi.mocked(decideCorrectionRequest).mockResolvedValue({
    ...terminalCorrection(),
    requestedByUserId: 2,
    decidedByUserId: 1,
  });
}
async function approveRequest(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Consultar pedidos" }));
  await user.click(
    await screen.findByRole("button", { name: "Conferir solicitação #31" }),
  );
  await user.click(screen.getByRole("button", { name: "Aprovar" }));
  await user.type(
    screen.getByLabelText("Motivo — Aprovar"),
    "Conferência fictícia para aprovação.",
  );
  await user.click(screen.getByRole("button", { name: "Confirmar aprovar" }));
}
async function submitProposal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    (
      await screen.findAllByRole("button", {
        name: /Solicitar correção do registro/,
      })
    )[0],
  );
  const dialog = await screen.findByRole("dialog", {
    name: "Solicitar correção",
  });
  await user.clear(within(dialog).getByLabelText("Objetivo"));
  await user.type(
    within(dialog).getByLabelText("Objetivo"),
    pendingCorrection.proposed.objective,
  );
  await selectFieldOption(
    user,
    within(dialog).getByLabelText("Categoria"),
    "Entrega",
  );
  await user.type(
    within(dialog).getByLabelText(/Observação/),
    pendingCorrection.proposed.observation!,
  );
  await user.type(
    within(dialog).getByLabelText("Justificativa da correção"),
    pendingCorrection.justification,
  );
  await user.click(
    within(dialog).getByRole("button", { name: "Enviar solicitação" }),
  );
}

describe("HistoryPage", () => {
  beforeEach(() => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(correctionKey);
    vi.mocked(submitCorrectionRequest).mockReset();
    vi.mocked(decideCorrectionRequest).mockReset();
    vi.mocked(searchCorrectionRequests).mockReset();
    vi.mocked(searchCorrectionRequests).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 25,
      totalCount: 0,
      totalPages: 0,
    });
    vi.mocked(countAccessHistoryByCategory).mockReset();
    vi.mocked(countAccessHistoryByCategory).mockResolvedValue({
      Entrega: 1,
      Evento: 0,
      "Prestador de serviço": 2,
      "Treino ou jogo": 0,
      Visitante: 3,
      "Caminhada com veículo": 4,
      Mototáxi: 5,
      "Permanência excepcional": 0,
      "Outro acesso autorizado": 0,
    });
    vi.mocked(correctAccessRecord).mockReset();
    vi.mocked(searchAccessHistory).mockReset();
    vi.mocked(describeApiError).mockReset();
    vi.mocked(describeApiError).mockReturnValue({
      kind: "network",
      message: "Não foi possível consultar o histórico.",
    });
  });

  it("clears previous results when a new request fails", async () => {
    vi.mocked(searchAccessHistory)
      .mockResolvedValueOnce(pageResult([record], 1, 2))
      .mockRejectedValueOnce(new Error("network"));
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findAllByText("DEM1A23")).not.toHaveLength(0);
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(
      await screen.findByText("Não foi possível consultar o histórico."),
    ).toBeInTheDocument();
    expect(screen.queryByText("DEM1A23")).not.toBeInTheDocument();
    expect(screen.queryByText("0 registro(s)")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Nenhum registro encontrado"),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "2" })).not.toBeInTheDocument();
  });

  it("shows the empty state only after a successful empty response", async () => {
    vi.mocked(searchAccessHistory).mockResolvedValue(pageResult([]));

    renderPage();

    expect(
      await screen.findByText("Nenhum registro encontrado"),
    ).toBeInTheDocument();
    expect(screen.getByText("0 registro(s)")).toBeInTheDocument();
  });

  it("keeps compact cards through tablet widths and reserves the table for wide desktop", async () => {
    vi.mocked(searchAccessHistory).mockResolvedValue(pageResult([record]));

    renderPage();

    const table = await screen.findByRole("table", {
      name: "Histórico de acessos retornado pela API",
    });
    const card = screen
      .getAllByText("DEM1A23")
      .map((element) => element.closest("article"))
      .find((element): element is HTMLElement => element !== null);

    expect(card?.parentElement).toHaveClass("md:grid-cols-2", "2xl:hidden");
    expect(table.parentElement).toHaveClass("overflow-x-auto", "2xl:block");
    expect(
      within(table).getByRole("button", {
        name: /Solicitar correção do registro DEM1A23/,
      }).parentElement,
    ).toHaveClass("flex-col", "min-w-[10.5rem]");
  });

  it("distinguishes normal exit, observed exceptional exit and unknown exit time", async () => {
    const normal: AccessRecord = {
      ...record,
      closureType: "Normal",
      exitAtUtc: "2026-09-02T14:00:00.000Z",
      id: 11,
      plate: "NOR1A11",
      status: "Encerrado",
    };
    const exceptionalObserved: AccessRecord = {
      ...record,
      closureType: "Excepcional",
      exceptionalClosureObservation: "Confirmada pela equipe da portaria.",
      exceptionalClosureReason: "IndisponibilidadeDoSistema",
      exitAtUtc: "2026-09-02T14:30:00.000Z",
      id: 12,
      plate: "OBS1A12",
      regularizedAtUtc: "2026-09-02T16:00:00.000Z",
      status: "Encerrado",
    };
    const exceptionalUnknown: AccessRecord = {
      ...record,
      closureType: "Excepcional",
      exceptionalClosureObservation: "Saída confirmada sem horário confiável.",
      exceptionalClosureReason: "RegistroDeSaidaOmitido",
      id: 13,
      plate: "UNK1A13",
      regularizedAtUtc: "2026-09-02T17:00:00.000Z",
      status: "Encerrado",
    };
    vi.mocked(searchAccessHistory).mockResolvedValue(
      pageResult([normal, exceptionalObserved, exceptionalUnknown]),
    );

    renderPage();
    await screen.findByText("3 registro(s)");

    const normalCard = screen
      .getAllByText("NOR1A11")
      .map((element) => element.closest("article"))
      .find((element): element is HTMLElement => element !== null)!;
    const observedCard = screen
      .getAllByText("OBS1A12")
      .map((element) => element.closest("article"))
      .find((element): element is HTMLElement => element !== null)!;
    const unknownCard = screen
      .getAllByText("UNK1A13")
      .map((element) => element.closest("article"))
      .find((element): element is HTMLElement => element !== null)!;

    expect(within(normalCard).getByText("Saída normal")).toBeInTheDocument();
    expect(
      within(observedCard).getByText("Encerramento excepcional"),
    ).toBeInTheDocument();
    expect(
      within(observedCard).getByText(/Saída observada:/),
    ).toBeInTheDocument();
    expect(
      within(observedCard).getByText(/Regularizado em:/),
    ).toBeInTheDocument();
    expect(
      within(observedCard).getByText("Motivo: Indisponibilidade do sistema"),
    ).toBeInTheDocument();
    expect(
      within(unknownCard).getByText("Saída observada: horário desconhecido"),
    ).toBeInTheDocument();
    expect(
      within(unknownCard).getByText("Horário de saída desconhecido"),
    ).toBeInTheDocument();
    expect(
      within(unknownCard).getByText(/Regularizado em:/),
    ).toBeInTheDocument();
    expect(
      within(unknownCard).getByText(
        "Observação: Saída confirmada sem horário confiável.",
      ),
    ).toBeInTheDocument();
  });

  it("retries a failed history request", async () => {
    vi.mocked(searchAccessHistory)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(pageResult([]));
    const user = userEvent.setup();
    renderPage();

    expect(
      await screen.findByText("Não foi possível consultar o histórico."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Nenhum registro encontrado"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(
      await screen.findByText("Nenhum registro encontrado"),
    ).toBeInTheDocument();
    expect(searchAccessHistory).toHaveBeenCalledTimes(2);
  });

  it("sends only the filters supported by the history endpoint", async () => {
    vi.mocked(searchAccessHistory).mockResolvedValue(pageResult([]));
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Nenhum registro encontrado");

    await user.type(screen.getByLabelText("Placa"), "DEM-1A23");
    await user.type(screen.getByLabelText("Condutor"), "Pessoa fictícia");
    await selectFieldOption(
      user,
      screen.getByLabelText("Situação"),
      "Encerrado",
    );
    await selectFieldOption(
      user,
      screen.getByLabelText("Categoria"),
      "Mototáxi",
    );
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    await waitFor(() => expect(searchAccessHistory).toHaveBeenCalledTimes(2));
    expect(searchAccessHistory).toHaveBeenLastCalledWith(
      expect.objectContaining({
        categoryName: "Mototáxi",
        driverName: "Pessoa fictícia",
        page: 1,
        pageSize: 25,
        plate: "DEM-1A23",
        status: "Encerrado",
      }),
    );
  });

  it("applies featured categories as immediate server-side filters", async () => {
    vi.mocked(searchAccessHistory).mockResolvedValue(pageResult([]));
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Nenhum registro encontrado");

    expect(screen.getByText("Operação da portaria")).toHaveClass(
      "uppercase",
      "text-primary",
    );
    expect(
      screen.getByRole("heading", { name: "Histórico de acessos", level: 1 }),
    ).toHaveClass("sm:text-4xl");
    expect(
      screen.getByRole("heading", { name: "Histórico de acessos", level: 1 }),
    ).not.toHaveClass("font-display");

    const visitorShortcut = screen.getByRole("button", { name: "Visitante" });
    expect(visitorShortcut).toHaveAttribute("aria-pressed", "false");
    expect(within(visitorShortcut).getByText("3")).toBeInTheDocument();

    await user.click(visitorShortcut);

    await waitFor(() => expect(searchAccessHistory).toHaveBeenCalledTimes(2));
    expect(searchAccessHistory).toHaveBeenLastCalledWith(
      expect.objectContaining({ categoryName: "Visitante", page: 1 }),
    );
    expect(visitorShortcut).toHaveAttribute("aria-pressed", "true");
  });

  it("exposes all nine categories and preserves the alternative selector", async () => {
    vi.mocked(searchAccessHistory).mockResolvedValue(pageResult([]));
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Nenhum registro encontrado");

    for (const category of generalAccessCategories) {
      expect(
        screen.getByRole("button", { name: category }),
      ).toBeInTheDocument();
    }
    expect(
      screen.queryByRole("button", { name: "Mais categorias" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Categoria")).toBeInTheDocument();
    const category = screen.getByRole("button", { name: "Mototáxi" });
    category.focus();
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(searchAccessHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({ categoryName: "Mototáxi", page: 1 }),
      ),
    );
    expect(category).toHaveAttribute("aria-pressed", "true");
    expect(category).toHaveFocus();
    await user.keyboard("{End}");
    expect(
      screen.getByRole("button", { name: "Outro acesso autorizado" }),
    ).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("button", { name: "Visitante" })).toHaveFocus();
  });

  it("reuses real totals when only category or page changes and refreshes them for other filters", async () => {
    vi.mocked(searchAccessHistory).mockImplementation(async (filters) =>
      pageResult([record], filters.page, 2),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("DEM1A23");
    await waitFor(() =>
      expect(countAccessHistoryByCategory).toHaveBeenCalledOnce(),
    );
    expect(countAccessHistoryByCategory).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, pageSize: 1 }),
      generalAccessCategories,
    );
    await user.click(screen.getByRole("button", { name: "Mototáxi" }));
    await waitFor(() => expect(searchAccessHistory).toHaveBeenCalledTimes(2));
    await user.click(screen.getByRole("button", { name: "2" }));
    await waitFor(() => expect(searchAccessHistory).toHaveBeenCalledTimes(3));
    expect(countAccessHistoryByCategory).toHaveBeenCalledOnce();
    await user.type(screen.getByLabelText("Condutor"), "Fictício");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() =>
      expect(countAccessHistoryByCategory).toHaveBeenCalledTimes(2),
    );
  });

  it("announces unavailable totals without showing fabricated zeroes and keeps category filtering usable", async () => {
    vi.mocked(searchAccessHistory).mockResolvedValue(pageResult([]));
    vi.mocked(countAccessHistoryByCategory).mockRejectedValue(
      new Error("unavailable"),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(
      "As contagens estão indisponíveis. Você ainda pode filtrar por categoria.",
    );
    const category = screen.getByRole("button", { name: "Mototáxi" });
    expect(category).toHaveAccessibleDescription("Contagem indisponível.");
    expect(within(category).queryByText("0")).not.toBeInTheDocument();
    await user.click(category);
    await waitFor(() =>
      expect(searchAccessHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({ categoryName: "Mototáxi" }),
      ),
    );
  });

  it("refreshes unavailable counts when explicitly reapplying unchanged filters", async () => {
    vi.mocked(searchAccessHistory).mockResolvedValue(pageResult([]));
    vi.mocked(countAccessHistoryByCategory)
      .mockRejectedValueOnce(new Error("unavailable"))
      .mockResolvedValue({ Visitante: 3 });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(
      "As contagens estão indisponíveis. Você ainda pode filtrar por categoria.",
    );
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Visitante" }),
      ).toHaveAccessibleDescription("3 registros no período e filtros atuais."),
    );
    expect(countAccessHistoryByCategory).toHaveBeenCalledTimes(2);
    expect(
      screen.queryByText(
        "As contagens estão indisponíveis. Você ainda pode filtrar por categoria.",
      ),
    ).not.toBeInTheDocument();
  });

  it("keeps filter submission focus while the request is pending", async () => {
    let resolveRequest: ((value: PagedAccessRecords) => void) | undefined;
    const pendingRequest = new Promise<PagedAccessRecords>((resolve) => {
      resolveRequest = resolve;
    });
    vi.mocked(searchAccessHistory)
      .mockResolvedValueOnce(pageResult([]))
      .mockReturnValueOnce(pendingRequest);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Nenhum registro encontrado");

    const applyButton = screen.getByRole("button", {
      name: "Aplicar filtros",
    });
    await user.click(applyButton);

    expect(applyButton).toHaveFocus();
    expect(applyButton).toHaveAttribute("aria-disabled", "true");
    expect(applyButton).not.toBeDisabled();
    await user.click(applyButton);
    expect(searchAccessHistory).toHaveBeenCalledTimes(2);

    resolveRequest?.(pageResult([]));
    await waitFor(() =>
      expect(applyButton).toHaveAttribute("aria-disabled", "false"),
    );
    expect(applyButton).toHaveFocus();
  });

  it("requests the selected server-side page", async () => {
    vi.mocked(searchAccessHistory)
      .mockResolvedValueOnce(pageResult([record], 1, 2))
      .mockResolvedValueOnce(pageResult([{ ...record, id: 11 }], 2, 2));
    const user = userEvent.setup();
    renderPage();

    await screen.findAllByText("DEM1A23");
    await user.click(screen.getByRole("button", { name: "2" }));

    await waitFor(() =>
      expect(searchAccessHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, pageSize: 25 }),
      ),
    );
    expect(await screen.findByText("Página 2 de 2")).toBeInTheDocument();
  });

  it("shows the associated event in desktop and mobile history views", async () => {
    vi.mocked(searchAccessHistory).mockResolvedValue(
      pageResult([
        {
          ...record,
          eventAuthorizationId: 7,
          eventAuthorizationName: "Evento Fictício de Demonstração",
          eventVehicleRuleId: 9,
        },
      ]),
    );

    renderPage();

    expect(
      await screen.findAllByText("Evento Fictício de Demonstração"),
    ).toHaveLength(2);
    expect(screen.getAllByText("Evento:")).toHaveLength(2);
  });

  it("omits event details when the access has no named association", async () => {
    vi.mocked(searchAccessHistory).mockResolvedValue(
      pageResult([
        record,
        {
          ...record,
          eventAuthorizationId: 8,
          eventAuthorizationName: "   ",
          id: 11,
        },
      ]),
    );

    renderPage();

    await screen.findAllByText("DEM1A23");
    expect(screen.queryByText("Evento:")).not.toBeInTheDocument();
    expect(screen.queryByText("8")).not.toBeInTheDocument();
  });

  it.each<ProfileName>([
    "Porteiro",
    "Vigilante",
    "SetorTransporte",
    "Administrador",
  ])(
    "allows %s to inspect the complete record details",
    async (profileName) => {
      vi.mocked(searchAccessHistory).mockResolvedValue(
        pageResult([
          {
            ...record,
            eventAuthorizationName: "Evento Fictício",
            observation: "Observação fictícia do acesso.",
            vehicleType: "Motocicleta",
          },
        ]),
      );
      const user = userEvent.setup();
      const { container } = renderPage(profileName);

      const detailsButton = (
        await screen.findAllByRole("button", {
          name: /Ver detalhes do registro DEM1A23/,
        })
      )[0];
      await user.click(detailsButton);

      const dialog = screen.getByRole("dialog", {
        name: "Detalhes do registro",
      });
      expect(dialog).toHaveTextContent("DEM1A23");
      expect(dialog).toHaveTextContent("Motocicleta");
      expect(dialog).toHaveTextContent("Pessoa histórica fictícia");
      expect(dialog).toHaveTextContent("Atendimento fictício");
      expect(dialog).toHaveTextContent("Evento Fictício");
      expect(dialog).toHaveTextContent("Observação fictícia do acesso.");
      expect(
        within(dialog).getByRole("button", {
          name: "Fechar detalhes do registro",
        }),
      ).toHaveFocus();
      await expectNoSeriousAccessibilityViolations(container);

      await user.keyboard("{Escape}");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      await waitFor(() => expect(detailsButton).toHaveFocus());
    },
  );

  it("opens the existing audited correction flow from record details", async () => {
    vi.mocked(searchAccessHistory).mockResolvedValue(pageResult([record]));
    const user = userEvent.setup();
    renderPage();

    const detailsButton = (
      await screen.findAllByRole("button", {
        name: /Ver detalhes do registro DEM1A23/,
      })
    )[0];
    await user.click(detailsButton);
    await user.click(
      within(
        screen.getByRole("dialog", { name: "Detalhes do registro" }),
      ).getByRole("button", { name: "Solicitar correção" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Solicitar correção" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Objetivo")).toHaveValue(
      "Atendimento fictício",
    );
  });

  it.each<ProfileName>([
    "Porteiro",
    "Vigilante",
    "SetorTransporte",
    "Administrador",
  ])(
    "allows %s to request correction without changing the effective row",
    async (profileName) => {
      vi.mocked(searchAccessHistory).mockResolvedValue(pageResult([record]));
      vi.mocked(submitCorrectionRequest).mockResolvedValue(pendingCorrection);
      const user = userEvent.setup();
      renderPage(profileName);
      await submitProposal(user);
      expect(
        await screen.findByText(/Solicitação #31: Pendente/),
      ).toBeInTheDocument();
      expect(screen.getAllByText(record.objective)).toHaveLength(2);
      expect(
        screen.queryByText(pendingCorrection.proposed.objective),
      ).not.toBeInTheDocument();
      expect(searchAccessHistory).toHaveBeenCalledTimes(1);
      expect(submitCorrectionRequest).toHaveBeenCalledExactlyOnceWith(10, {
        requestKey: correctionKey,
        original: pendingCorrection.original,
        proposed: pendingCorrection.proposed,
        justification: pendingCorrection.justification,
      });
      expect(correctAccessRecord).not.toHaveBeenCalled();
      expect(countAccessHistoryByCategory).toHaveBeenCalledTimes(1);
    },
  );
  it("offers requests for both open and closed records", async () => {
    vi.mocked(searchAccessHistory).mockResolvedValue(
      pageResult([
        record,
        {
          ...record,
          id: 11,
          exitAtUtc: "2026-09-02T13:00:00Z",
          status: "Encerrado",
        },
      ]),
    );
    const user = userEvent.setup();
    renderPage();
    const controls = await screen.findAllByRole("button", {
      name: /Solicitar correção do registro/,
    });
    expect(controls).toHaveLength(4);
    await user.click(controls[1]);
    expect(
      await screen.findByRole("dialog", { name: "Solicitar correção" }),
    ).toHaveTextContent("Registro #11");
    expect(screen.queryByLabelText(/Horário/)).not.toBeInTheDocument();
  });
  it("keeps the current row during approval revalidation instead of applying proposed values locally", async () => {
    let resolve!: (value: PagedAccessRecords) => void;
    const pending = new Promise<PagedAccessRecords>((yes) => {
      resolve = yes;
    });
    vi.mocked(searchAccessHistory)
      .mockResolvedValueOnce(pageResult([record]))
      .mockReturnValueOnce(pending);
    prepareReview();
    const user = userEvent.setup();
    renderPage("Administrador");
    await screen.findAllByText(record.plate);
    await approveRequest(user);
    await waitFor(() => expect(searchAccessHistory).toHaveBeenCalledTimes(2));
    expect(screen.getAllByText(record.objective)).toHaveLength(2);
    expect(
      screen.queryByText(pendingCorrection.proposed.objective),
    ).not.toBeInTheDocument();
    await act(async () =>
      resolve(pageResult([{ ...record, ...pendingCorrection.proposed }])),
    );
    expect(
      await screen.findAllByText(pendingCorrection.proposed.objective),
    ).toHaveLength(2);
    expect(decideCorrectionRequest).toHaveBeenCalledTimes(1);
  });
  it("revalidates applied filters and announces when an approved row is no longer in the results", async () => {
    vi.mocked(searchAccessHistory)
      .mockResolvedValueOnce(pageResult([record]))
      .mockResolvedValueOnce(pageResult([record]))
      .mockResolvedValueOnce(pageResult([]));
    prepareReview();
    const user = userEvent.setup();
    renderPage("Administrador");
    await screen.findAllByText(record.plate);
    await user.click(screen.getByRole("button", { name: "Visitante" }));
    await waitFor(() => expect(searchAccessHistory).toHaveBeenCalledTimes(2));
    await approveRequest(user);
    const feedback = await screen.findByText(
      /não aparece no resultado consultado/,
    );
    await waitFor(() =>
      expect(
        feedback.closest("[tabindex] ") ?? feedback.closest("[tabindex]"),
      ).toHaveFocus(),
    );
    expect(searchAccessHistory).toHaveBeenLastCalledWith(
      expect.objectContaining({ categoryName: "Visitante", page: 1 }),
    );
    expect(screen.getByLabelText("Categoria")).toHaveTextContent("Visitante");
    expect(decideCorrectionRequest).toHaveBeenCalledTimes(1);
  });
  it("preserves a valid applied page after approval", async () => {
    const other = { ...record, id: 11 };
    vi.mocked(searchAccessHistory)
      .mockResolvedValueOnce(pageResult([other], 1, 2))
      .mockResolvedValueOnce(pageResult([record], 2, 2))
      .mockResolvedValueOnce(
        pageResult([{ ...record, ...pendingCorrection.proposed }], 2, 2),
      );
    prepareReview();
    const user = userEvent.setup();
    renderPage("Administrador");
    await screen.findAllByText(record.plate);
    await user.click(screen.getByRole("button", { name: "2" }));
    await screen.findByText("Página 2 de 2");
    await approveRequest(user);
    await waitFor(() => expect(searchAccessHistory).toHaveBeenCalledTimes(3));
    expect(searchAccessHistory).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, pageSize: 25 }),
    );
    expect(await screen.findByText("Página 2 de 2")).toBeInTheDocument();
  });
  it("loads the last valid page when approval reduces pagination", async () => {
    vi.mocked(searchAccessHistory)
      .mockResolvedValueOnce(pageResult([record], 1, 2))
      .mockResolvedValueOnce(pageResult([record], 2, 2))
      .mockResolvedValueOnce(pageResult([], 2, 1))
      .mockResolvedValueOnce(
        pageResult([{ ...record, ...pendingCorrection.proposed }], 1, 1),
      );
    prepareReview();
    const user = userEvent.setup();
    renderPage("Administrador");
    await screen.findAllByText(record.plate);
    await user.click(screen.getByRole("button", { name: "2" }));
    await screen.findByText("Página 2 de 2");
    await approveRequest(user);
    await waitFor(() => expect(searchAccessHistory).toHaveBeenCalledTimes(4));
    expect(searchAccessHistory).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1 }),
    );
    expect(await screen.findByText("Página 1 de 1")).toBeInTheDocument();
    expect(decideCorrectionRequest).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(countAccessHistoryByCategory).toHaveBeenCalledTimes(2),
    );
  });
  it("reports a failed read after approval without repeating the decision", async () => {
    vi.mocked(searchAccessHistory)
      .mockResolvedValueOnce(pageResult([record]))
      .mockRejectedValueOnce(new Error("read fixture"));
    prepareReview();
    const user = userEvent.setup();
    renderPage("Administrador");
    await screen.findAllByText(record.plate);
    await approveRequest(user);
    expect(
      await screen.findByText(/consulta dos registros não foi concluída/),
    ).toBeInTheDocument();
    expect(decideCorrectionRequest).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(countAccessHistoryByCategory).toHaveBeenCalledTimes(2),
    );
  });

  it("has no serious accessibility violations in the empty state", async () => {
    vi.mocked(searchAccessHistory).mockResolvedValue(pageResult([]));
    const { container } = renderPage();

    await screen.findByText("Nenhum registro encontrado");
    await expectNoSeriousAccessibilityViolations(container);
  });
});
