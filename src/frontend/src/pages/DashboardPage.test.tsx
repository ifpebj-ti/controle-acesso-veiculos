import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type ProfileName,
  useAuthenticatedSession,
} from "../features/authentication";
import {
  type DailyOperationalSummary,
  getDailyOperationalSummary,
} from "../features/operational-summary";
import { describeApiError } from "../services/api-errors";
import { expectNoSeriousAccessibilityViolations } from "../test/accessibility";
import { DashboardPage } from "./DashboardPage";

vi.mock("../features/authentication", () => ({
  profileLabels: {
    Administrador: "Administrador",
    Porteiro: "Porteiro",
    SetorTransporte: "Setor de Transporte",
    Vigilante: "Vigilante",
  },
  useAuthenticatedSession: vi.fn(),
}));
vi.mock(
  "../features/operational-summary/services/operationalSummaryService",
  () => ({ getDailyOperationalSummary: vi.fn() }),
);
vi.mock("../services/api-errors", () => ({ describeApiError: vi.fn() }));

const summary: DailyOperationalSummary = {
  accessCategories: [
    { count: 6, label: "Visitante" },
    { count: 2, label: "Entrega" },
  ],
  eventAccess: { entries: 2, eventsWithEntries: 1 },
  generalAccess: { entries: 8, exits: 5, openAtEnd: 4, openAtStart: 1 },
  hourlyAccess: Array.from({ length: 24 }, (_, hour) => ({
    entries: hour === 8 ? 3 : hour === 14 ? 2 : 0,
    exits: hour === 17 ? 2 : 0,
    hour,
  })),
  institutionalUsages: {
    departures: 3,
    openAtEnd: 2,
    openAtStart: 1,
    returns: 2,
  },
  localDate: "2030-06-10",
  periodEndUtcExclusive: "2030-06-11T03:00:00Z",
  periodStartUtc: "2030-06-10T03:00:00Z",
  recentDailyAccess: Array.from({ length: 14 }, (_, index) => {
    const day = index < 4 ? index + 28 : index - 3;
    const month = index < 4 ? "05" : "06";
    return {
      entries: index + 1,
      exits: index,
      localDate: `2030-${month}-${String(day).padStart(2, "0")}`,
    };
  }),
  timeZoneId: "America/Recife",
  vehicleTypes: [
    { count: 5, label: "Automóvel" },
    { count: 3, label: "Motocicleta" },
  ],
};

function renderPage(profileName: ProfileName = "Porteiro") {
  vi.mocked(useAuthenticatedSession).mockReturnValue({
    completePasswordChange: vi.fn(),
    expiresAtUtc: "2030-06-10T22:00:00Z",
    login: vi.fn(),
    logout: vi.fn(),
    restoreExternalSession: vi.fn(),
    sessionEndReason: null,
    status: "authenticated",
    user: {
      email: "usuario@example.test",
      id: 1,
      profileName,
      requiresPasswordChange: false,
    },
  });
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDailyOperationalSummary).mockResolvedValue(summary);
    vi.mocked(describeApiError).mockReturnValue({
      kind: "network",
      message: "Não foi possível consultar o resumo operacional.",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the daily context visible while the summary scrolls", () => {
    const { container } = renderPage();
    const pageHeader = container.querySelector("header");

    expect(pageHeader).toHaveClass("sticky", "top-16", "lg:top-0");
  });

  it.each<ProfileName>(["Porteiro", "Vigilante", "SetorTransporte"])(
    "loads the same authorized summary for the %s profile",
    async (profile) => {
      renderPage(profile);

      expect(
        await screen.findByRole("heading", { name: "Acessos gerais" }),
      ).toBeInTheDocument();
      expect(getDailyOperationalSummary).toHaveBeenCalledWith();
      expect(screen.getByText(/10 de junho de 2030/)).toBeInTheDocument();
    },
  );

  it("renders a dedicated management dashboard for the administrator", async () => {
    renderPage("Administrador");

    expect(
      await screen.findByRole("heading", {
        name: "Visão geral administrativa",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Movimentações de acesso" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Fluxo de acessos" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Tipos de acesso" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Acessos por dia" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Veículos por tipo" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Alertas e pendências" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Status das credenciais" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Setores mais acessados" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Prévia visual/i)).not.toBeInTheDocument();
    expect(screen.getByText("6 (75%)")).toBeInTheDocument();
    expect(screen.getByText("5 (62,5%)")).toBeInTheDocument();
    expect(
      screen.getByText("14 dias: 28/05/2030 a 10/06/2030"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Entradas e saídas por hora em 10/06/2030"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Total de acessos").nextElementSibling,
    ).toHaveTextContent("8");
    expect(
      screen.getByText("Saídas registradas").nextElementSibling,
    ).toHaveTextContent("5");
    expect(screen.queryByText("Pessoas únicas")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Gerar relatório" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Como ler o resumo")).not.toBeInTheDocument();
  });

  it("renders the general, institutional and event totals", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Acessos gerais" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Frota institucional" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Eventos" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Entradas vinculadas").nextElementSibling,
    ).toHaveTextContent("2");
    expect(
      screen.getAllByText("Ainda estavam em uso")[0].nextElementSibling,
    ).toHaveTextContent("2");
  });

  it("keeps technical context out of the summary and offers optional guidance", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Resumo do dia" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Fuso|America\/Recife/)).not.toBeInTheDocument();

    const guidanceToggle = screen.getByText("Como ler o resumo");
    const guidance = guidanceToggle.closest("details");

    expect(guidance).not.toHaveAttribute("open");
    await user.click(guidanceToggle);
    expect(guidance).toHaveAttribute("open");
    expect(
      screen.getByText(/sem saída registrada ao encerrar aquele dia/),
    ).toBeInTheDocument();
  });

  it("uses the campus timezone when the device instant is already on the next UTC day", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-06-11T01:30:00Z"));
    vi.mocked(getDailyOperationalSummary).mockResolvedValue({
      ...summary,
      localDate: "2030-06-10",
      timeZoneId: "America/Recife",
    });
    await act(async () => {
      renderPage();
    });

    fireEvent.click(screen.getByText("Como ler o resumo"));

    expect(
      screen.getByText(/Segunda-feira, 10 de junho de 2030/i),
    ).toBeVisible();
    expect(screen.getByText("22:30:00")).toBeVisible();
    expect(
      screen.getByText("Acessos que continuam sem saída registrada agora."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Veículos institucionais que continuam sem retorno registrado agora.",
      ),
    ).toBeInTheDocument();
  });

  it("stops describing the selected date as current after midnight at the campus", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-06-11T02:59:59Z"));
    vi.mocked(getDailyOperationalSummary).mockResolvedValue({
      ...summary,
      localDate: "2030-06-10",
      timeZoneId: "America/Recife",
    });
    await act(async () => {
      renderPage();
    });
    fireEvent.click(screen.getByText("Como ler o resumo"));

    expect(
      screen.getByText("Acessos que continuam sem saída registrada agora."),
    ).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(
      screen.getByText(
        "Acessos que continuavam sem saída registrada ao encerrar aquele dia.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("00:00:00")).toBeVisible();
  });

  it("loads a selected local date without mixing previous results", async () => {
    vi.mocked(getDailyOperationalSummary)
      .mockResolvedValueOnce(summary)
      .mockResolvedValueOnce({
        ...summary,
        generalAccess: { ...summary.generalAccess, entries: 12 },
        localDate: "2030-06-11",
      });
    const user = userEvent.setup();
    renderPage("SetorTransporte");
    await screen.findByRole("heading", { name: "Acessos gerais" });

    fireEvent.change(screen.getByLabelText("Data do resumo"), {
      target: { value: "2030-06-11" },
    });
    await user.click(screen.getByRole("button", { name: "Atualizar resumo" }));

    expect(await screen.findByText(/11 de junho de 2030/)).toBeInTheDocument();
    expect(getDailyOperationalSummary).toHaveBeenLastCalledWith("2030-06-11");
    expect(screen.getByText("Entradas").nextElementSibling).toHaveTextContent(
      "12",
    );
  });

  it("updates every administrative graph when the selected date changes", async () => {
    const nextSummary: DailyOperationalSummary = {
      ...summary,
      accessCategories: [{ count: 4, label: "Evento" }],
      hourlyAccess: summary.hourlyAccess.map((item) => ({
        ...item,
        entries: item.hour === 9 ? 4 : 0,
        exits: item.hour === 16 ? 3 : 0,
      })),
      localDate: "2030-06-11",
      recentDailyAccess: summary.recentDailyAccess.map((item, index) => ({
        ...item,
        entries: index === 13 ? 4 : 0,
        exits: index === 13 ? 3 : 0,
        localDate:
          index === 13
            ? "2030-06-11"
            : (summary.recentDailyAccess[index + 1]?.localDate ??
              item.localDate),
      })),
      vehicleTypes: [{ count: 4, label: "Van" }],
    };
    vi.mocked(getDailyOperationalSummary)
      .mockResolvedValueOnce(summary)
      .mockResolvedValueOnce(nextSummary);
    const user = userEvent.setup();
    renderPage("Administrador");
    await screen.findByText("6 (75%)");

    fireEvent.change(screen.getByLabelText("Data do resumo"), {
      target: { value: "2030-06-11" },
    });
    await user.click(screen.getByRole("button", { name: "Atualizar resumo" }));

    expect(await screen.findByText("Evento")).toBeInTheDocument();
    expect(screen.getByText("Van")).toBeInTheDocument();
    expect(screen.queryByText("Visitante")).not.toBeInTheDocument();
    expect(
      screen.getByText("Entradas e saídas por hora em 11/06/2030"),
    ).toBeInTheDocument();
    expect(getDailyOperationalSummary).toHaveBeenLastCalledWith("2030-06-11");
  });

  it("removes previous totals after a request failure and retries the query", async () => {
    vi.mocked(getDailyOperationalSummary)
      .mockResolvedValueOnce(summary)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ ...summary, localDate: "2030-06-11" });
    const user = userEvent.setup();
    renderPage("Administrador");
    await screen.findByRole("heading", { name: "Fluxo de acessos" });

    fireEvent.change(screen.getByLabelText("Data do resumo"), {
      target: { value: "2030-06-11" },
    });
    await user.click(screen.getByRole("button", { name: "Atualizar resumo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível consultar o resumo operacional.",
    );
    expect(
      screen.queryByRole("heading", { name: "Fluxo de acessos" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(
      await screen.findByRole("heading", { name: "Fluxo de acessos" }),
    ).toBeInTheDocument();
    expect(getDailyOperationalSummary).toHaveBeenLastCalledWith("2030-06-11");
  });

  it("shows an explicit access barrier for a forbidden response", async () => {
    vi.mocked(getDailyOperationalSummary).mockRejectedValue(
      new Error("forbidden"),
    );
    vi.mocked(describeApiError).mockReturnValue({
      kind: "access-denied",
      message: "Seu perfil não possui permissão para consultar este resumo.",
      status: 403,
    });

    renderPage("Administrador");

    expect(
      await screen.findByRole("heading", { name: "Acesso negado" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Tentar novamente")).not.toBeInTheDocument();
  });

  it("explains a successful day with no counted movements", async () => {
    vi.mocked(getDailyOperationalSummary).mockResolvedValue({
      ...summary,
      eventAccess: { entries: 0, eventsWithEntries: 0 },
      generalAccess: { entries: 0, exits: 0, openAtEnd: 0, openAtStart: 0 },
      institutionalUsages: {
        departures: 0,
        openAtEnd: 0,
        openAtStart: 0,
        returns: 0,
      },
    });
    renderPage();

    expect(
      await screen.findByText(
        "Nenhuma movimentação foi contabilizada nesta data.",
        {
          exact: false,
        },
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Acessos gerais" }),
    ).toBeInTheDocument();
  });

  it("shows accessible empty states instead of administrative charts with invented data", async () => {
    vi.mocked(getDailyOperationalSummary).mockResolvedValue({
      ...summary,
      accessCategories: [],
      generalAccess: { entries: 0, exits: 0, openAtEnd: 0, openAtStart: 0 },
      hourlyAccess: summary.hourlyAccess.map((item) => ({
        ...item,
        entries: 0,
        exits: 0,
      })),
      recentDailyAccess: summary.recentDailyAccess.map((item) => ({
        ...item,
        entries: 0,
        exits: 0,
      })),
      vehicleTypes: [],
    });
    renderPage("Administrador");

    expect(
      await screen.findByText(
        "Nenhuma entrada ou saída foi registrada em 10/06/2030.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Nenhuma categoria de acesso foi contabilizada em 10/06/2030.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Nenhuma entrada ou saída foi registrada entre 28/05/2030 e 10/06/2030.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Nenhum tipo de veículo foi contabilizado nos acessos de 10/06/2030.",
      ),
    ).toBeInTheDocument();
  });

  it("has no serious automated accessibility violations", async () => {
    const { container } = renderPage("Vigilante");
    await waitFor(() => expect(getDailyOperationalSummary).toHaveBeenCalled());
    await screen.findByRole("heading", { name: "Acessos gerais" });
    await expectNoSeriousAccessibilityViolations(container);
  });

  it("renders the administrative dashboard without serious accessibility violations", async () => {
    const { container } = renderPage("Administrador");
    await screen.findByRole("heading", { name: "Fluxo de acessos" });
    await expectNoSeriousAccessibilityViolations(container);
  });
});
