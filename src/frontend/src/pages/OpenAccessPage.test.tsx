import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AccessRecord } from "../features/access-records";
import {
  type ProfileName,
  useAuthenticatedSession,
} from "../features/authentication";
import {
  closeAccessRecord,
  exceptionallyCloseAccessRecord,
  listOpenAccessRecords,
} from "../features/access-records/services/accessRecordsService";
import { describeApiError } from "../services/api-errors";
import { expectNoSeriousAccessibilityViolations } from "../test/accessibility";
import { selectFieldOption } from "../test/selectField";
import { OpenAccessPage } from "./OpenAccessPage";

vi.mock(
  "../features/access-records/services/accessRecordsService",
  async () => {
    const actual = await vi.importActual<
      typeof import("../features/access-records/services/accessRecordsService")
    >("../features/access-records/services/accessRecordsService");
    return {
      ...actual,
      closeAccessRecord: vi.fn(),
      exceptionallyCloseAccessRecord: vi.fn(),
      listOpenAccessRecords: vi.fn(),
    };
  },
);

vi.mock("../features/authentication", async () => {
  const actual = await vi.importActual<
    typeof import("../features/authentication")
  >("../features/authentication");
  return { ...actual, useAuthenticatedSession: vi.fn() };
});

vi.mock("../services/api-errors", () => ({
  describeApiError: vi.fn(),
}));

const record: AccessRecord = {
  categoryName: "Visitante",
  createdById: 1,
  driverName: "Pessoa Fictícia",
  entryAtUtc: "2026-09-11T12:00:00.000Z",
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

const secondRecord: AccessRecord = {
  ...record,
  categoryName: "Entrega",
  driverName:
    "Condutora Fictícia com Nome Longo para Validar a Quebra Segura do Conteúdo",
  id: 11,
  objective: "Entrega fictícia de materiais para atividade acadêmica",
  plate: "DMO2B34",
  vehicleId: 4,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, reject, resolve };
}

function mockProfile(profileName: ProfileName) {
  vi.mocked(useAuthenticatedSession).mockReturnValue({
    completePasswordChange: vi.fn(),
    expiresAtUtc: "2030-06-10T22:00:00Z",
    login: vi.fn(),
    logout: vi.fn(),
    sessionEndReason: null,
    status: "authenticated",
    user: {
      email: "operador.ficticio@example.test",
      id: 1,
      profileName,
      requiresPasswordChange: false,
    },
  });
}

function renderPage(profileName: ProfileName = "Porteiro") {
  mockProfile(profileName);
  return render(
    <StrictMode>
      <MemoryRouter>
        <OpenAccessPage />
      </MemoryRouter>
    </StrictMode>,
  );
}

function mobileList() {
  return screen.getByTestId("open-access-cards");
}

function exitButton(accessRecord = record) {
  return within(mobileList()).getByRole("button", {
    name: `Registrar saída de ${accessRecord.plate}, condutor ${accessRecord.driverName}`,
  });
}

function exceptionalButton(accessRecord = record) {
  return within(mobileList()).getByRole("button", {
    name: `Regularizar saída não registrada de ${accessRecord.plate}, condutor ${accessRecord.driverName}`,
  });
}

describe("OpenAccessPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(describeApiError).mockReturnValue({
      kind: "network",
      message: "Falha de rede fictícia.",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders compact desktop rows and mobile cards with the operational fields", async () => {
    vi.mocked(listOpenAccessRecords).mockResolvedValue([record, secondRecord]);

    renderPage();

    const table = await screen.findByTestId("open-access-table");
    const cards = screen.getByTestId("open-access-cards");
    expect(cards).toHaveClass("md:grid-cols-2", "xl:hidden");
    expect(table).toHaveClass("xl:block");
    expect(
      within(table).getByRole("columnheader", { name: "Placa" }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: "Tempo transcorrido" }),
    ).toBeInTheDocument();
    expect(within(table).getByText("Pessoa Fictícia")).toBeInTheDocument();
    expect(
      within(cards).getByText(secondRecord.driverName),
    ).toBeInTheDocument();
    expect(screen.getByText("2 em aberto")).toBeInTheDocument();
    expect(screen.getByText(/Última atualização:/)).toBeInTheDocument();
    expect(
      screen.queryByText(/atrasad|irregular|vencid|fora do prazo/i),
    ).not.toBeInTheDocument();
  });

  it("filters the successful result locally without another request", async () => {
    vi.mocked(listOpenAccessRecords).mockResolvedValue([record, secondRecord]);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("2 em aberto");
    await user.type(screen.getByLabelText("Buscar acesso aberto"), "DMO2");

    expect(within(mobileList()).queryByText("DEM1A23")).not.toBeInTheDocument();
    expect(within(mobileList()).getByText("DMO2B34")).toBeInTheDocument();
    expect(screen.getByText("2 em aberto · 1 exibido(s)")).toBeInTheDocument();
    expect(listOpenAccessRecords).toHaveBeenCalledTimes(1);
  });

  it("combines clickable category options with the existing local search", async () => {
    vi.mocked(listOpenAccessRecords).mockResolvedValue([record, secondRecord]);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("2 em aberto");
    const allOption = screen.getByRole("button", { name: "Todos" });
    const visitorOption = screen.getByRole("button", { name: "Visitante" });
    const deliveryOption = screen.getByRole("button", { name: "Entrega" });
    const search = screen.getByLabelText("Buscar acesso aberto");

    expect(allOption).toHaveAttribute("aria-pressed", "true");
    expect(visitorOption).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.queryByRole("button", { name: "Prestador de serviço" }),
    ).not.toBeInTheDocument();

    deliveryOption.focus();
    await user.keyboard("{Enter}");
    expect(deliveryOption).toHaveAttribute("aria-pressed", "true");
    expect(within(mobileList()).queryByText("DEM1A23")).not.toBeInTheDocument();
    expect(within(mobileList()).getByText("DMO2B34")).toBeInTheDocument();

    await user.type(search, "Pessoa");
    expect(
      screen.getByText("Nenhum acesso aberto encontrado"),
    ).toBeInTheDocument();
    expect(screen.getByText("2 em aberto · 0 exibido(s)")).toBeInTheDocument();

    await user.clear(search);
    expect(deliveryOption).toHaveAttribute("aria-pressed", "true");
    expect(within(mobileList()).getByText("DMO2B34")).toBeInTheDocument();

    await user.type(search, "DEM1");
    allOption.focus();
    await user.keyboard(" ");
    expect(search).toHaveValue("DEM1");
    expect(allOption).toHaveAttribute("aria-pressed", "true");
    expect(within(mobileList()).getByText("DEM1A23")).toBeInTheDocument();
    expect(within(mobileList()).queryByText("DMO2B34")).not.toBeInTheDocument();
    expect(listOpenAccessRecords).toHaveBeenCalledTimes(1);
  });

  it("offers the same category filter through the compact mobile selector", async () => {
    vi.mocked(listOpenAccessRecords).mockResolvedValue([record, secondRecord]);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("2 em aberto");
    const categorySelect = screen.getByLabelText("Categoria");

    expect(categorySelect).toHaveTextContent("Todas as categorias");

    await selectFieldOption(user, categorySelect, "Entrega");
    expect(categorySelect).toHaveTextContent("Entrega");
    expect(within(mobileList()).queryByText("DEM1A23")).not.toBeInTheDocument();
    expect(within(mobileList()).getByText("DMO2B34")).toBeInTheDocument();
    expect(screen.getByText("2 em aberto · 1 exibido(s)")).toBeInTheDocument();

    await selectFieldOption(user, categorySelect, "");
    expect(categorySelect).toHaveTextContent("Todas as categorias");
    expect(within(mobileList()).getByText("DEM1A23")).toBeInTheDocument();
    expect(within(mobileList()).getByText("DMO2B34")).toBeInTheDocument();
    expect(listOpenAccessRecords).toHaveBeenCalledTimes(1);
  });

  it("returns to all categories when a refresh removes the selected option", async () => {
    vi.mocked(listOpenAccessRecords)
      .mockResolvedValueOnce([record, secondRecord])
      .mockResolvedValueOnce([record]);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("2 em aberto");
    await user.click(screen.getByRole("button", { name: "Entrega" }));
    await user.click(screen.getByRole("button", { name: "Atualizar lista" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Entrega" }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Todos" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(mobileList()).getByText("DEM1A23")).toBeInTheDocument();
    expect(screen.getByText("1 em aberto")).toBeInTheDocument();
  });

  it("keeps previous records visible while a manual refresh succeeds", async () => {
    const refresh = deferred<AccessRecord[]>();
    vi.mocked(listOpenAccessRecords)
      .mockResolvedValueOnce([record])
      .mockReturnValueOnce(refresh.promise);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("1 em aberto");
    await user.click(screen.getByRole("button", { name: "Atualizar lista" }));

    expect(
      screen.getByText(/dados anteriores continuam disponíveis/i),
    ).toBeInTheDocument();
    expect(within(mobileList()).getByText("DEM1A23")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Atualizando…" })).toBeDisabled();

    refresh.resolve([secondRecord]);
    expect(
      await within(mobileList()).findByText("DMO2B34"),
    ).toBeInTheDocument();
    expect(within(mobileList()).queryByText("DEM1A23")).not.toBeInTheDocument();
  });

  it("keeps the last successful result and count when refresh fails, then retries", async () => {
    vi.mocked(listOpenAccessRecords)
      .mockResolvedValueOnce([record])
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([record, secondRecord]);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("1 em aberto");
    await user.click(screen.getByRole("button", { name: "Atualizar lista" }));

    expect(
      await screen.findByText(/dados exibidos podem estar desatualizados/i),
    ).toBeInTheDocument();
    expect(within(mobileList()).getByText("DEM1A23")).toBeInTheDocument();
    expect(screen.getByText("1 em aberto")).toBeInTheDocument();
    expect(
      screen.queryByText("Nenhum acesso aberto encontrado"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("2 em aberto")).toBeInTheDocument();
    expect(listOpenAccessRecords).toHaveBeenCalledTimes(3);
  });

  it("shows an empty state only after a successful empty response", async () => {
    vi.mocked(listOpenAccessRecords).mockResolvedValue([]);
    renderPage();

    expect(
      await screen.findByText("Nenhum acesso aberto encontrado"),
    ).toBeInTheDocument();
    expect(screen.getByText("0 em aberto")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an initial query failure without a false empty result", async () => {
    vi.mocked(listOpenAccessRecords)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([]);
    const user = userEvent.setup();
    renderPage();

    expect(
      await screen.findByText("Falha de rede fictícia."),
    ).toBeInTheDocument();
    expect(screen.queryByText("0 em aberto")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Nenhum acesso aberto encontrado"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(
      await screen.findByText("Nenhum acesso aberto encontrado"),
    ).toBeInTheDocument();
  });

  it("identifies plate and driver in the dialog and restores focus after cancel", async () => {
    vi.mocked(listOpenAccessRecords).mockResolvedValue([record]);
    const user = userEvent.setup();
    renderPage();

    const trigger = await waitFor(() => exitButton());
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Registrar saída?" });
    expect(dialog).toHaveTextContent("DEM1A23");
    expect(dialog).toHaveTextContent("Pessoa Fictícia");
    expect(
      within(dialog).getByRole("button", { name: "Cancelar" }),
    ).toHaveFocus();

    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(
      within(dialog).getByRole("button", { name: "Confirmar saída" }),
    ).toHaveFocus();
    await user.tab();
    expect(
      within(dialog).getByRole("button", { name: "Cancelar" }),
    ).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(closeAccessRecord).not.toHaveBeenCalled();
  });

  it.each(["Porteiro", "Vigilante", "Administrador"] as const)(
    "offers exceptional closure to profile %s while preserving normal exit",
    async (profileName) => {
      vi.mocked(listOpenAccessRecords).mockResolvedValue([record]);
      renderPage(profileName);

      await screen.findByText("1 em aberto");
      expect(exitButton()).toBeInTheDocument();
      expect(exceptionalButton()).toBeInTheDocument();
    },
  );

  it("does not offer exceptional closure to Transportation", async () => {
    vi.mocked(listOpenAccessRecords).mockResolvedValue([record]);
    renderPage("SetorTransporte");

    await screen.findByText("1 em aberto");
    expect(exitButton()).toBeInTheDocument();
    expect(
      within(mobileList()).queryByRole("button", {
        name: /Regularizar saída não registrada/,
      }),
    ).not.toBeInTheDocument();
  });

  it("applies the canonical exceptional response before list revalidation", async () => {
    const mutation = deferred<AccessRecord>();
    const revalidation = deferred<AccessRecord[]>();
    vi.mocked(listOpenAccessRecords)
      .mockResolvedValueOnce([record])
      .mockReturnValueOnce(revalidation.promise);
    vi.mocked(exceptionallyCloseAccessRecord).mockReturnValue(mutation.promise);
    const user = userEvent.setup();
    renderPage();

    await user.click(await waitFor(() => exceptionalButton()));
    await selectFieldOption(
      user,
      screen.getByLabelText("Motivo *"),
      "RegistroDeSaidaOmitido",
    );
    await user.type(
      screen.getByLabelText("Observação *"),
      "Saída confirmada posteriormente.",
    );
    await user.dblClick(
      screen.getByRole("button", {
        name: "Confirmar regularização excepcional",
      }),
    );

    expect(exceptionallyCloseAccessRecord).toHaveBeenCalledTimes(1);
    expect(exceptionallyCloseAccessRecord).toHaveBeenCalledWith(10, {
      observation: "Saída confirmada posteriormente.",
      observedExitAtUtc: null,
      reason: "RegistroDeSaidaOmitido",
    });

    mutation.resolve({
      ...record,
      closureType: "Excepcional",
      exceptionalClosureObservation: "Saída confirmada posteriormente.",
      exceptionalClosureReason: "RegistroDeSaidaOmitido",
      regularizedAtUtc: "2026-09-11T15:10:00.000Z",
      status: "Encerrado",
      updatedById: 5,
    });

    expect(
      await screen.findByText(
        "Saída do veículo DEM1A23 regularizada com sucesso.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("DEM1A23")).not.toBeInTheDocument();
    expect(listOpenAccessRecords).toHaveBeenCalledTimes(2);
    expect(
      screen.getByText(/dados anteriores continuam disponíveis/i),
    ).toBeInTheDocument();

    revalidation.resolve([]);
    await waitFor(() =>
      expect(
        screen.queryByText(/dados anteriores continuam disponíveis/i),
      ).not.toBeInTheDocument(),
    );
  });

  it("executes one exit mutation, uses its canonical response and revalidates", async () => {
    const mutation = deferred<AccessRecord>();
    vi.mocked(listOpenAccessRecords)
      .mockResolvedValueOnce([record])
      .mockResolvedValueOnce([]);
    vi.mocked(closeAccessRecord).mockReturnValue(mutation.promise);
    const user = userEvent.setup();
    renderPage();

    await user.click(await waitFor(() => exitButton()));
    const confirm = screen.getByRole("button", { name: "Confirmar saída" });
    await user.dblClick(confirm);

    expect(closeAccessRecord).toHaveBeenCalledTimes(1);
    expect(closeAccessRecord).toHaveBeenCalledWith(10);
    expect(
      screen.getByRole("button", { name: "Registrando saída…" }),
    ).toBeDisabled();

    mutation.resolve({
      ...record,
      exitAtUtc: "2026-09-11T15:00:00.000Z",
      plate: "DEM1A23",
      status: "Encerrado",
      updatedById: 5,
    });

    expect(
      await screen.findByText(
        "Saída do veículo DEM1A23 registrada com sucesso.",
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(listOpenAccessRecords).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByLabelText("Buscar acesso aberto")).toHaveFocus(),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the dialog open for a conflict and does not retry the mutation", async () => {
    vi.mocked(listOpenAccessRecords).mockResolvedValue([record]);
    vi.mocked(closeAccessRecord).mockRejectedValue(new Error("conflict"));
    vi.mocked(describeApiError).mockReturnValue({
      kind: "conflict",
      message: "O acesso fictício já foi encerrado.",
      status: 409,
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(await waitFor(() => exitButton()));
    await user.click(screen.getByRole("button", { name: "Confirmar saída" }));

    expect(
      await screen.findByText("O acesso fictício já foi encerrado."),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(within(mobileList()).getByText("DEM1A23")).toBeInTheDocument();
    expect(closeAccessRecord).toHaveBeenCalledTimes(1);
  });

  it("keeps the record and dialog available after an exit network failure", async () => {
    vi.mocked(listOpenAccessRecords).mockResolvedValue([record]);
    vi.mocked(closeAccessRecord).mockRejectedValue(new Error("network"));
    const user = userEvent.setup();
    renderPage();

    await user.click(await waitFor(() => exitButton()));
    await user.click(screen.getByRole("button", { name: "Confirmar saída" }));

    expect(
      await screen.findByText("Falha de rede fictícia."),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(within(mobileList()).getByText("DEM1A23")).toBeInTheDocument();
    expect(closeAccessRecord).toHaveBeenCalledTimes(1);
    expect(listOpenAccessRecords).toHaveBeenCalledTimes(1);
  });

  it("explains a successful exit followed by a failed list revalidation", async () => {
    vi.mocked(listOpenAccessRecords)
      .mockResolvedValueOnce([record])
      .mockRejectedValueOnce(new Error("network"));
    vi.mocked(closeAccessRecord).mockResolvedValue({
      ...record,
      exitAtUtc: "2026-09-11T15:00:00.000Z",
      status: "Encerrado",
      updatedById: 5,
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(await waitFor(() => exitButton()));
    await user.click(screen.getByRole("button", { name: "Confirmar saída" }));

    expect(
      await screen.findByText(/A saída de DEM1A23 foi registrada/),
    ).toBeInTheDocument();
    expect(screen.getByText(/sem repetir a saída/i)).toBeInTheDocument();
    expect(closeAccessRecord).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("DEM1A23")).not.toBeInTheDocument();
  });

  it("renders the explicit access denied state for a 403 response", async () => {
    vi.mocked(listOpenAccessRecords).mockRejectedValue(new Error("forbidden"));
    vi.mocked(describeApiError).mockReturnValue({
      kind: "access-denied",
      message: "Perfil fictício sem permissão.",
      status: 403,
    });
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Acesso negado" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Perfil fictício sem permissão."),
    ).toBeInTheDocument();
  });

  it("updates elapsed information using a controlled clock without another API request", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-11T12:30:00.000Z"));
    vi.mocked(listOpenAccessRecords).mockResolvedValue([record]);
    renderPage();

    await act(async () => Promise.resolve());
    expect(within(mobileList()).getByText("30 min")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30 * 60_000);
    });
    expect(within(mobileList()).getByText("1 h 00 min")).toBeInTheDocument();
    expect(listOpenAccessRecords).toHaveBeenCalledTimes(1);
  });

  it("has no serious accessibility violations in the list and confirmation dialog", async () => {
    vi.mocked(listOpenAccessRecords).mockResolvedValue([record, secondRecord]);
    const user = userEvent.setup();
    const { container } = renderPage();

    await screen.findByText("2 em aberto");
    await expectNoSeriousAccessibilityViolations(container);
    await user.click(exitButton());
    await expectNoSeriousAccessibilityViolations(container);
  });
});
