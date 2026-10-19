import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ReportExportReauthenticationError,
  exportVehicleMovementReport,
  searchInstitutionalFleetReport,
  searchVehicleMovementReport,
} from "../features/administrative-reports";
import { useAuthenticatedSession } from "../features/authentication";
import { describeApiError } from "../services/api-errors";
import { expectNoSeriousAccessibilityViolations } from "../test/accessibility";
import { selectFieldOption } from "../test/selectField";
import { ReportsPage } from "./ReportsPage";

vi.mock("../features/authentication", () => ({
  useAuthenticatedSession: vi.fn(),
}));
vi.mock("../features/administrative-reports", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../features/administrative-reports")>();
  return {
    ...original,
    exportInstitutionalFleetReport: vi.fn(),
    exportVehicleMovementReport: vi.fn(),
    searchInstitutionalFleetReport: vi.fn(),
    searchVehicleMovementReport: vi.fn(),
  };
});
vi.mock("../services/api-errors", () => ({ describeApiError: vi.fn() }));

const movementPage = {
  items: [
    {
      id: 1,
      entryAtUtc: "2026-10-10T12:00:00Z",
      exitAtUtc: null,
      driverName: "Pessoa Fictícia",
      vehicleType: "Automóvel",
      plate: null,
      vehicleIdentification: "INTERNO-01",
      categoryName: "Visitante",
      objective: "Atendimento",
      status: "Aberto",
      closureType: null,
      eventName: null,
      entryRecordedBy: {
        userId: 2,
        name: "Porteiro Fictício",
        profile: "Porteiro",
      },
      exitRecordedBy: null,
    },
  ],
  page: 1,
  pageSize: 25,
  totalCount: 1,
  totalPages: 1,
  from: "2026-10-01",
  to: "2026-10-15",
  timeZoneId: "America/Recife",
};

function administrator() {
  vi.mocked(useAuthenticatedSession).mockReturnValue({
    user: {
      id: 1,
      email: "admin.local@example.test",
      profileName: "Administrador",
      requiresPasswordChange: false,
    },
  } as ReturnType<typeof useAuthenticatedSession>);
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ReportsPage />
    </MemoryRouter>,
  );
}

describe("ReportsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    administrator();
    vi.mocked(searchVehicleMovementReport).mockResolvedValue(movementPage);
    vi.mocked(searchInstitutionalFleetReport).mockResolvedValue({
      ...movementPage,
      items: [],
      totalCount: 0,
      totalPages: 0,
    });
    vi.mocked(describeApiError).mockReturnValue({
      kind: "network",
      message: "Relatório indisponível.",
    });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:report"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("shows real authorship and keeps internal identification distinct from plate", async () => {
    const { container } = renderPage();

    expect(await screen.findByText("Pessoa Fictícia")).toBeInTheDocument();
    expect(screen.getByText("Não informada")).toBeInTheDocument();
    expect(screen.getByText("INTERNO-01")).toBeInTheDocument();
    expect(screen.getByText(/Porteiro Fictício/)).toBeInTheDocument();
    expect(screen.getByText(/Fuso: America\/Recife/)).toBeInTheDocument();
    await expectNoSeriousAccessibilityViolations(container);
  });

  it("blocks non-administrators before consulting the API", () => {
    vi.mocked(useAuthenticatedSession).mockReturnValue({
      user: {
        id: 2,
        email: "porteiro@example.test",
        profileName: "Porteiro",
        requiresPasswordChange: false,
      },
    } as ReturnType<typeof useAuthenticatedSession>);

    renderPage();
    expect(
      screen.getByRole("heading", { name: "Acesso negado" }),
    ).toBeInTheDocument();
    expect(searchVehicleMovementReport).not.toHaveBeenCalled();
  });

  it("validates the 31-day limit locally and preserves the filters", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Pessoa Fictícia");
    const dates = screen.getAllByDisplayValue(/^\d{4}-\d{2}-\d{2}$/);
    await user.clear(dates[0]);
    await user.type(dates[0], "2026-01-01");
    await user.clear(dates[1]);
    await user.type(dates[1], "2026-02-01");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "máximo permitido é de 31 dias",
    );
    expect(searchVehicleMovementReport).toHaveBeenCalledTimes(1);
    expect(dates[0]).toHaveValue("2026-01-01");
  });

  it("uses the public fleet status and presents an empty successful response", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Pessoa Fictícia");
    await user.click(
      screen.getByRole("button", { name: "Frota institucional" }),
    );
    await selectFieldOption(
      user,
      screen.getByLabelText("Situação"),
      "Concluido",
    );
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(
      await screen.findByText("Nenhum registro encontrado"),
    ).toBeInTheDocument();
    expect(searchInstitutionalFleetReport).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "Concluido" }),
    );
  });

  it("clears the password after a failed confirmation without repeating the export", async () => {
    vi.mocked(exportVehicleMovementReport).mockRejectedValue(
      new ReportExportReauthenticationError(),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Pessoa Fictícia");
    await user.click(screen.getByRole("button", { name: "Exportar PDF" }));
    const dialog = screen.getByRole("dialog", { name: "Confirmar exportação" });
    const input = within(dialog).getByLabelText("Senha atual");
    await user.type(input, "temporary-secret");
    await user.click(
      within(dialog).getByRole("button", { name: "Exportar PDF" }),
    );

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "sessão continua ativa",
    );
    expect(input).toHaveValue("");
    await waitFor(() => expect(input).toHaveFocus());
    expect(exportVehicleMovementReport).toHaveBeenCalledTimes(1);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("downloads the server PDF once and announces the result", async () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    vi.mocked(exportVehicleMovementReport).mockResolvedValue({
      blob: new Blob(["pdf"], { type: "application/pdf" }),
      fileName: "relatorio.pdf",
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Pessoa Fictícia");
    await user.click(screen.getByRole("button", { name: "Exportar PDF" }));
    const dialog = screen.getByRole("dialog", {
      name: "Confirmar exportação",
    });
    await user.type(
      within(dialog).getByLabelText("Senha atual"),
      "temporary-secret",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Exportar PDF" }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "download do relatório foi iniciado",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(exportVehicleMovementReport).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:report");
  });

  it("preserves applied filters when the API is unavailable", async () => {
    vi.mocked(searchVehicleMovementReport).mockRejectedValue(
      new Error("offline"),
    );
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Relatório indisponível",
    );
    await user.type(screen.getByLabelText("Placa"), "ABC");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() =>
      expect(searchVehicleMovementReport).toHaveBeenCalledTimes(2),
    );
    expect(screen.getByLabelText("Placa")).toHaveValue("ABC");
  });

  it("replaces report content with the API access barrier on 403", async () => {
    vi.mocked(searchVehicleMovementReport).mockRejectedValue(
      new Error("forbidden"),
    );
    vi.mocked(describeApiError).mockReturnValue({
      kind: "access-denied",
      message: "Seu perfil não possui permissão para consultar relatórios.",
      status: 403,
    });

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Acesso negado" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Pessoa Fictícia")).not.toBeInTheDocument();
  });

  it("treats HTTP 429 as its own recoverable export state", async () => {
    vi.mocked(exportVehicleMovementReport).mockRejectedValue(
      new Error("rate limited"),
    );
    vi.mocked(describeApiError).mockReturnValue({
      kind: "rate-limited",
      message: "Muitas tentativas em pouco tempo. Aguarde e tente novamente.",
      status: 429,
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Pessoa Fictícia");
    await user.click(screen.getByRole("button", { name: "Exportar PDF" }));
    const dialog = screen.getByRole("dialog", {
      name: "Confirmar exportação",
    });
    await user.type(within(dialog).getByLabelText("Senha atual"), "secret");
    await user.click(
      within(dialog).getByRole("button", { name: "Exportar PDF" }),
    );

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Muitas tentativas",
    );
    expect(within(dialog).getByLabelText("Senha atual")).toHaveValue("");
    expect(exportVehicleMovementReport).toHaveBeenCalledTimes(1);
  });
});
