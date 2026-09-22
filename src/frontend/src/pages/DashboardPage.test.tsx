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
  eventAccess: { entries: 2, eventsWithEntries: 1 },
  generalAccess: { entries: 8, exits: 5, openAtEnd: 4, openAtStart: 1 },
  institutionalUsages: {
    departures: 3,
    openAtEnd: 2,
    openAtStart: 1,
    returns: 2,
  },
  localDate: "2030-06-10",
  periodEndUtcExclusive: "2030-06-11T03:00:00Z",
  periodStartUtc: "2030-06-10T03:00:00Z",
  timeZoneId: "America/Recife",
};

function renderPage(profileName: ProfileName = "Porteiro") {
  vi.mocked(useAuthenticatedSession).mockReturnValue({
    completePasswordChange: vi.fn(),
    expiresAtUtc: "2030-06-10T22:00:00Z",
    login: vi.fn(),
    logout: vi.fn(),
    sessionEndReason: null,
    status: "authenticated",
    user: { email: "usuario@example.test", id: 1, profileName },
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

  it.each<ProfileName>([
    "Porteiro",
    "Vigilante",
    "SetorTransporte",
    "Administrador",
  ])(
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

  it("removes previous totals after a request failure and retries the query", async () => {
    vi.mocked(getDailyOperationalSummary)
      .mockResolvedValueOnce(summary)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ ...summary, localDate: "2030-06-11" });
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("heading", { name: "Acessos gerais" });

    fireEvent.change(screen.getByLabelText("Data do resumo"), {
      target: { value: "2030-06-11" },
    });
    await user.click(screen.getByRole("button", { name: "Atualizar resumo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível consultar o resumo operacional.",
    );
    expect(
      screen.queryByRole("heading", { name: "Acessos gerais" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(
      await screen.findByRole("heading", { name: "Acessos gerais" }),
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

  it("has no serious automated accessibility violations", async () => {
    const { container } = renderPage("Vigilante");
    await waitFor(() => expect(getDailyOperationalSummary).toHaveBeenCalled());
    await screen.findByRole("heading", { name: "Acessos gerais" });
    await expectNoSeriousAccessibilityViolations(container);
  });
});
