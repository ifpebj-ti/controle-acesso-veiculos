import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  registerAccessEntry,
  type AccessRecord,
} from "../features/access-records";
import {
  EventAuthorizationsContractError,
  searchEventAuthorizations,
  type EventAuthorization,
  type EventAuthorizationPage,
} from "../features/event-authorizations";
import { expectNoSeriousAccessibilityViolations } from "../test/accessibility";
import { NewAccessPage } from "./NewAccessPage";

vi.mock("../features/access-records", async () => {
  const actual = await vi.importActual<
    typeof import("../features/access-records")
  >("../features/access-records");
  return { ...actual, registerAccessEntry: vi.fn() };
});
vi.mock(
  "../features/event-authorizations/services/eventAuthorizationsService",
  async () => {
    const actual = await vi.importActual<
      typeof import("../features/event-authorizations/services/eventAuthorizationsService")
    >("../features/event-authorizations/services/eventAuthorizationsService");
    return { ...actual, searchEventAuthorizations: vi.fn() };
  },
);

const createdRecord: AccessRecord = {
  categoryName: "Visitante",
  createdById: 1,
  driverName: "Pessoa fictícia",
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

const plateEvent: EventAuthorization = {
  active: true,
  area: "Pátio de Teste",
  createdAtUtc: "2026-01-01T12:00:00Z",
  createdById: 1,
  endsAtUtc: "2100-01-01T00:00:00Z",
  id: 7,
  name: "Evento por Placa Fictício",
  notes: null,
  overnightAllowed: false,
  responsible: "Setor Fictício",
  startsAtUtc: "2020-01-01T00:00:00Z",
  updatedAtUtc: null,
  updatedById: null,
  vehicleRules: [
    {
      consumedQuantity: 0,
      id: 9,
      plate: "EVT1A23",
      quantity: 1,
      remainingQuantity: 1,
      vehicleType: "AUTOMÓVEL",
    },
  ],
};

const quotaEvent: EventAuthorization = {
  ...plateEvent,
  id: 8,
  name: "Evento por Cota Fictício",
  vehicleRules: [
    {
      consumedQuantity: 2,
      id: 10,
      plate: null,
      quantity: 5,
      remainingQuantity: 3,
      vehicleType: "VAN",
    },
  ],
};

function eventPage(items: EventAuthorization[]): EventAuthorizationPage {
  return {
    items,
    page: 1,
    pageSize: 100,
    totalCount: items.length,
    totalPages: items.length > 0 ? 1 : 0,
  };
}

function apiError(status: number, data: unknown) {
  return { isAxiosError: true, response: { data, status } };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/acessos/novo"]}>
      <Routes>
        <Route path="/acessos/novo" element={<NewAccessPage />} />
        <Route path="/acessos/abertos" element={<h1>Acessos carregados</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("NewAccessPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchEventAuthorizations).mockResolvedValue(
      eventPage([plateEvent, quotaEvent]),
    );
  });

  it("submits documented fields once and opens accesses when requested", async () => {
    vi.mocked(registerAccessEntry).mockResolvedValue(createdRecord);
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/Placa do veículo/), "DEM-1A23");
    await user.type(
      screen.getByLabelText(/Nome do condutor/),
      "Pessoa fictícia",
    );
    await user.type(
      screen.getByLabelText(/Objetivo do acesso/),
      "Atendimento fictício",
    );
    await user.click(
      screen.getByRole("button", { name: "Registrar e ver acessos" }),
    );

    await waitFor(() =>
      expect(registerAccessEntry).toHaveBeenCalledWith({
        categoryName: "Visitante",
        driverName: "Pessoa fictícia",
        objective: "Atendimento fictício",
        observation: undefined,
        plate: "DEM-1A23",
        vehicleType: undefined,
      }),
    );
    expect(
      await screen.findByRole("heading", { name: "Acessos carregados" }),
    ).toBeInTheDocument();
  });

  it.each([
    ["Evento por Placa Fictício", 7],
    ["Evento por Cota Fictício", 8],
  ])("associates an entry explicitly with %s", async (eventName, eventId) => {
    vi.mocked(registerAccessEntry).mockResolvedValue(createdRecord);
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", {
        name: "Vincular uma autorização de evento",
      }),
    );
    await user.click(
      await screen.findByRole("radio", { name: new RegExp(eventName) }),
    );
    await user.type(screen.getByLabelText(/Placa do veículo/), "EVT-1A23");
    await user.type(
      screen.getByLabelText(/Nome do condutor/),
      "Pessoa fictícia",
    );
    await user.type(screen.getByLabelText(/Tipo do veículo/), "Automóvel");
    await user.type(
      screen.getByLabelText(/Objetivo do acesso/),
      "Evento fictício",
    );
    await user.click(
      screen.getByRole("button", { name: "Registrar e continuar" }),
    );

    await waitFor(() =>
      expect(registerAccessEntry).toHaveBeenCalledWith(
        expect.objectContaining({ eventAuthorizationId: eventId }),
      ),
    );
  });

  it("keeps a common entry available when the event query fails", async () => {
    vi.mocked(searchEventAuthorizations).mockRejectedValue(
      new Error("network"),
    );
    vi.mocked(registerAccessEntry).mockResolvedValue(createdRecord);
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", {
        name: "Vincular uma autorização de evento",
      }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /entrada comum sem vincular um evento/i,
    );
    await user.type(screen.getByLabelText(/Placa do veículo/), "COM-1A23");
    await user.type(
      screen.getByLabelText(/Nome do condutor/),
      "Pessoa fictícia",
    );
    await user.type(
      screen.getByLabelText(/Objetivo do acesso/),
      "Atendimento fictício",
    );
    await user.click(
      screen.getByRole("button", { name: "Registrar e continuar" }),
    );

    await waitFor(() => expect(registerAccessEntry).toHaveBeenCalledTimes(1));
    expect(registerAccessEntry).toHaveBeenCalledWith(
      expect.not.objectContaining({ eventAuthorizationId: expect.anything() }),
    );
    expect(searchEventAuthorizations).toHaveBeenCalledTimes(1);
  });

  it("distinguishes an empty event list and retries its query", async () => {
    vi.mocked(searchEventAuthorizations)
      .mockResolvedValueOnce(eventPage([]))
      .mockResolvedValueOnce(eventPage([plateEvent]));
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", {
        name: "Vincular uma autorização de evento",
      }),
    );
    expect(
      await screen.findByText("Nenhuma autorização vigente disponível"),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Atualizar autorizações" }),
    );

    expect(
      await screen.findByRole("radio", { name: /Evento por Placa Fictício/ }),
    ).toBeInTheDocument();
    expect(registerAccessEntry).not.toHaveBeenCalled();
  });

  it("presents an invalid event response separately", async () => {
    vi.mocked(searchEventAuthorizations).mockRejectedValue(
      new EventAuthorizationsContractError(),
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", {
        name: "Vincular uma autorização de evento",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /resposta das autorizações não pôde ser validada/i,
    );
  });

  it("presents denied event lookup without disabling the common form", async () => {
    vi.mocked(searchEventAuthorizations).mockRejectedValue(apiError(403, {}));
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", {
        name: "Vincular uma autorização de evento",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /perfil não possui permissão/i,
    );
    expect(
      screen.getByRole("button", { name: "Registrar e continuar" }),
    ).toBeEnabled();
  });

  it("resets the completed entry and restores plate focus for the next vehicle", async () => {
    vi.mocked(registerAccessEntry).mockResolvedValue(createdRecord);
    const user = userEvent.setup();
    renderPage();

    const plateField = screen.getByLabelText(/Placa do veículo/);
    const driverField = screen.getByLabelText(/Nome do condutor/);
    const objectiveField = screen.getByLabelText(/Objetivo do acesso/);

    await user.type(plateField, "DEM-1A23");
    await user.type(driverField, "Pessoa fictícia");
    await user.type(objectiveField, "Atendimento fictício");
    await user.click(
      screen.getByRole("button", { name: "Registrar e continuar" }),
    );

    expect(
      await screen.findByText(
        "Entrada registrada. O formulário está pronto para o próximo veículo.",
      ),
    ).toHaveAttribute("role", "status");
    expect(plateField).toHaveValue("");
    expect(driverField).toHaveValue("");
    expect(objectiveField).toHaveValue("");
    await waitFor(() => expect(plateField).toHaveFocus());
    expect(
      screen.getByRole("heading", { name: "Registrar entrada" }),
    ).toBeInTheDocument();
  });

  it("clears the completed event association for the next entry", async () => {
    vi.mocked(registerAccessEntry).mockResolvedValue(createdRecord);
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", {
        name: "Vincular uma autorização de evento",
      }),
    );
    await user.click(
      await screen.findByRole("radio", { name: /Evento por Placa Fictício/ }),
    );
    await user.type(screen.getByLabelText(/Placa do veículo/), "EVT-1A23");
    await user.type(
      screen.getByLabelText(/Nome do condutor/),
      "Pessoa fictícia",
    );
    await user.type(
      screen.getByLabelText(/Objetivo do acesso/),
      "Evento fictício",
    );
    await user.click(
      screen.getByRole("button", { name: "Registrar e continuar" }),
    );
    await screen.findByText(/formulário está pronto/);

    expect(
      screen.getByRole("button", {
        name: "Vincular uma autorização de evento",
      }),
    ).toHaveAttribute("aria-expanded", "false");
    await user.click(
      screen.getByRole("button", {
        name: "Vincular uma autorização de evento",
      }),
    );
    expect(
      screen.getByRole("radio", { name: /Sem autorização de evento/ }),
    ).toBeChecked();
  });

  it("uses the consecutive flow when the form is submitted with Enter", async () => {
    vi.mocked(registerAccessEntry).mockResolvedValue(createdRecord);
    const user = userEvent.setup();
    renderPage();

    const plateField = screen.getByLabelText(/Placa do veículo/);
    await user.type(plateField, "DEM-1A23");
    await user.type(
      screen.getByLabelText(/Nome do condutor/),
      "Pessoa fictícia",
    );
    await user.type(
      screen.getByLabelText(/Objetivo do acesso/),
      "Atendimento fictício",
    );
    const consecutiveButton = screen.getByRole("button", {
      name: "Registrar e continuar",
    });
    consecutiveButton.focus();
    await user.keyboard("{Enter}");

    expect(await screen.findByText(/formulário está pronto/)).toHaveAttribute(
      "role",
      "status",
    );
    await waitFor(() => expect(plateField).toHaveFocus());
    expect(
      screen.getByRole("heading", { name: "Registrar entrada" }),
    ).toBeInTheDocument();
  });

  it("removes an earlier success when the next entry fails and keeps its values", async () => {
    vi.mocked(registerAccessEntry)
      .mockResolvedValueOnce(createdRecord)
      .mockRejectedValueOnce(new Error("network"));
    const user = userEvent.setup();
    renderPage();

    const plateField = screen.getByLabelText(/Placa do veículo/);
    const driverField = screen.getByLabelText(/Nome do condutor/);
    const objectiveField = screen.getByLabelText(/Objetivo do acesso/);

    await user.type(plateField, "DEM-1A23");
    await user.type(driverField, "Pessoa fictícia");
    await user.type(objectiveField, "Primeiro atendimento");
    await user.click(
      screen.getByRole("button", { name: "Registrar e continuar" }),
    );
    await screen.findByText(/formulário está pronto/);

    await user.type(plateField, "TST-2B34");
    await user.type(driverField, "Outra pessoa fictícia");
    await user.type(objectiveField, "Segundo atendimento");
    await user.click(
      screen.getByRole("button", { name: "Registrar e continuar" }),
    );

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(
      screen.queryByText(/formulário está pronto/),
    ).not.toBeInTheDocument();
    expect(plateField).toHaveValue("TST-2B34");
    expect(driverField).toHaveValue("Outra pessoa fictícia");
    expect(objectiveField).toHaveValue("Segundo atendimento");
  });

  it.each([
    "A autorização de evento informada não foi encontrada.",
    "A autorização de evento está cancelada.",
    "A entrada está fora da janela autorizada do evento.",
    "A placa ou o tipo do veículo não está autorizado para o evento.",
    "A cota de veículos do evento foi atingida.",
  ])(
    "preserves the form and presents the event conflict: %s",
    async (message) => {
      vi.mocked(registerAccessEntry).mockRejectedValue(
        apiError(409, {
          errors: { accessRecord: [message] },
          message: "Não foi possível registrar a entrada.",
        }),
      );
      const user = userEvent.setup();
      renderPage();

      await user.click(
        screen.getByRole("button", {
          name: "Vincular uma autorização de evento",
        }),
      );
      const eventRadio = await screen.findByRole("radio", {
        name: /Evento por Placa Fictício/,
      });
      await user.click(eventRadio);
      await user.type(screen.getByLabelText(/Placa do veículo/), "EVT-1A23");
      await user.type(
        screen.getByLabelText(/Nome do condutor/),
        "Pessoa fictícia",
      );
      await user.type(screen.getByLabelText(/Tipo do veículo/), "Automóvel");
      await user.type(
        screen.getByLabelText(/Objetivo do acesso/),
        "Evento fictício",
      );
      await user.type(
        screen.getByLabelText(/Observação/),
        "Observação fictícia",
      );
      await user.click(
        screen.getByRole("button", { name: "Registrar e continuar" }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(screen.getByLabelText(/Placa do veículo/)).toHaveValue("EVT-1A23");
      expect(screen.getByLabelText(/Nome do condutor/)).toHaveValue(
        "Pessoa fictícia",
      );
      expect(screen.getByLabelText(/Tipo do veículo/)).toHaveValue("Automóvel");
      expect(screen.getByLabelText(/Objetivo do acesso/)).toHaveValue(
        "Evento fictício",
      );
      expect(screen.getByLabelText(/Observação/)).toHaveValue(
        "Observação fictícia",
      );
      expect(eventRadio).toBeChecked();
      expect(registerAccessEntry).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByText(/formulário está pronto/),
      ).not.toBeInTheDocument();
    },
  );

  it("associates an event identifier error with the authorization group", async () => {
    vi.mocked(registerAccessEntry).mockRejectedValue(
      apiError(400, {
        errors: {
          eventAuthorizationId: ["Selecione uma autorização válida."],
        },
      }),
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", {
        name: "Vincular uma autorização de evento",
      }),
    );
    await user.click(
      await screen.findByRole("radio", { name: /Evento por Placa Fictício/ }),
    );
    await user.type(screen.getByLabelText(/Placa do veículo/), "EVT-1A23");
    await user.type(
      screen.getByLabelText(/Nome do condutor/),
      "Pessoa fictícia",
    );
    await user.type(
      screen.getByLabelText(/Objetivo do acesso/),
      "Evento fictício",
    );
    await user.click(
      screen.getByRole("button", { name: "Registrar e continuar" }),
    );

    const group = await screen.findByRole("group", {
      name: "Autorizações vigentes",
    });
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("eventAuthorizationId-error"),
    );
    expect(
      document.getElementById("eventAuthorizationId-error"),
    ).toHaveTextContent("Selecione uma autorização válida.");
  });

  it("blocks both completion paths while an entry request is pending", async () => {
    let resolveRequest: ((record: AccessRecord) => void) | undefined;
    vi.mocked(registerAccessEntry).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/Placa do veículo/), "DEM-1A23");
    await user.type(
      screen.getByLabelText(/Nome do condutor/),
      "Pessoa fictícia",
    );
    await user.type(
      screen.getByLabelText(/Objetivo do acesso/),
      "Atendimento fictício",
    );
    await user.click(
      screen.getByRole("button", { name: "Registrar e continuar" }),
    );

    expect(screen.getByRole("button", { name: "Registrando…" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Registrar e ver acessos" }),
    ).toBeDisabled();
    expect(registerAccessEntry).toHaveBeenCalledTimes(1);

    resolveRequest?.(createdRecord);
    await screen.findByText(/formulário está pronto/);
  });

  it("keeps invalid data in the browser and identifies required fields", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", { name: "Registrar e continuar" }),
    );

    expect(
      await screen.findByText("Informe a placa do veículo."),
    ).toBeInTheDocument();
    expect(screen.getByText("Informe o nome do condutor.")).toBeInTheDocument();
    expect(
      screen.getByText("Informe o objetivo do acesso."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Placa do veículo/)).toHaveAttribute(
      "aria-describedby",
      "plate-error",
    );
    expect(document.getElementById("plate-error")).toHaveTextContent(
      "Informe a placa do veículo.",
    );
    expect(registerAccessEntry).not.toHaveBeenCalled();
  });

  it("has no serious automated accessibility violations", async () => {
    const { container } = renderPage();

    await expectNoSeriousAccessibilityViolations(container);
  });

  it("has no serious accessibility violations with event choices visible", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    await user.click(
      screen.getByRole("button", {
        name: "Vincular uma autorização de evento",
      }),
    );
    await screen.findByRole("radio", { name: /Evento por Placa Fictício/ });

    await expectNoSeriousAccessibilityViolations(container);
  });
});
