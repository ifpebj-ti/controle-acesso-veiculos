import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type ProfileName,
  useAuthenticatedSession,
} from "../features/authentication";
import {
  listInstitutionalDrivers,
  type InstitutionalDriver,
} from "../features/institutional-drivers";
import {
  listInstitutionalVehicles,
  type InstitutionalVehicle,
} from "../features/institutional-vehicles";
import {
  listOpenInstitutionalUsages,
  registerInstitutionalDeparture,
  registerInstitutionalReturn,
  searchInstitutionalUsageHistory,
  type InstitutionalVehicleUsage,
  type InstitutionalVehicleUsagePage,
} from "../features/institutional-usages";
import {
  describeApiError,
  getApiValidationErrors,
} from "../services/api-errors";
import { expectNoSeriousAccessibilityViolations } from "../test/accessibility";
import { InstitutionalUsagesPage } from "./InstitutionalUsagesPage";

vi.mock("../features/authentication", () => ({
  useAuthenticatedSession: vi.fn(),
}));
vi.mock(
  "../features/institutional-drivers/services/institutionalDriversService",
  () => ({ listInstitutionalDrivers: vi.fn() }),
);
vi.mock(
  "../features/institutional-vehicles/services/institutionalVehiclesService",
  () => ({ listInstitutionalVehicles: vi.fn() }),
);
vi.mock(
  "../features/institutional-usages/services/institutionalUsagesService",
  () => ({
    listOpenInstitutionalUsages: vi.fn(),
    registerInstitutionalDeparture: vi.fn(),
    registerInstitutionalReturn: vi.fn(),
    searchInstitutionalUsageHistory: vi.fn(),
  }),
);
vi.mock("../services/api-errors", () => ({
  describeApiError: vi.fn(),
  getApiValidationErrors: vi.fn(),
}));

const vehicle: InstitutionalVehicle = {
  brand: "Marca Fictícia",
  color: "Branca",
  createdAtUtc: "2030-05-01T10:00:00Z",
  id: 4,
  identification: "FROTA-TESTE-04",
  model: "Modelo Fictício",
  plate: "TST1A23",
  vehicleType: "Automóvel",
  year: 2028,
};

const driver: InstitutionalDriver = {
  authorizedAtUtc: "2030-05-01T10:00:00Z",
  authorizedById: 1,
  id: 6,
  name: "Motorista Fictício",
  personId: 8,
  updatedAtUtc: null,
  updatedById: null,
};

const openUsage: InstitutionalVehicleUsage = {
  createdById: 3,
  departureAtUtc: "2030-06-10T11:00:00Z",
  departureMileage: 12500,
  driverId: driver.personId,
  driverName: driver.name,
  id: 12,
  itinerary: "Campus — destino fictício",
  plate: vehicle.plate,
  returnAtUtc: null,
  returnMileage: null,
  status: "EmUso",
  updatedById: null,
  vehicleId: vehicle.id,
  vehicleIdentification: vehicle.identification,
};

const historyPage: InstitutionalVehicleUsagePage = {
  items: [
    {
      ...openUsage,
      returnAtUtc: "2030-06-10T13:00:00Z",
      returnMileage: 12540,
      status: "Concluido",
      updatedById: 3,
    },
  ],
  page: 1,
  pageSize: 25,
  totalCount: 1,
  totalPages: 1,
};

const emptyHistoryPage: InstitutionalVehicleUsagePage = {
  items: [],
  page: 1,
  pageSize: 25,
  totalCount: 0,
  totalPages: 0,
};

function renderPage(profileName: ProfileName) {
  vi.mocked(useAuthenticatedSession).mockReturnValue({
    expiresAtUtc: "2030-06-10T22:00:00Z",
    login: vi.fn(),
    logout: vi.fn(),
    sessionEndReason: null,
    status: "authenticated",
    user: { email: "usuario@example.test", id: 1, profileName },
  });
  return render(
    <MemoryRouter>
      <InstitutionalUsagesPage />
    </MemoryRouter>,
  );
}

async function openAndFillDeparture(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole("button", { name: "Registrar saída" }),
  );
  await user.selectOptions(screen.getByLabelText("Veículo institucional"), "4");
  await user.selectOptions(screen.getByLabelText("Motorista autorizado"), "8");
  const mileage = screen.getByLabelText("Quilometragem de saída");
  await user.clear(mileage);
  await user.type(mileage, "12500");
  await user.type(
    screen.getByLabelText("Itinerário"),
    "Campus — destino fictício",
  );
}

describe("InstitutionalUsagesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listInstitutionalVehicles).mockResolvedValue([vehicle]);
    vi.mocked(listInstitutionalDrivers).mockResolvedValue([driver]);
    vi.mocked(listOpenInstitutionalUsages).mockResolvedValue([openUsage]);
    vi.mocked(searchInstitutionalUsageHistory).mockResolvedValue(historyPage);
    vi.mocked(describeApiError).mockReturnValue({
      kind: "network",
      message: "Não foi possível consultar as utilizações.",
    });
    vi.mocked(getApiValidationErrors).mockReturnValue({});
  });

  it("lets doormen operate without requesting the restricted history", async () => {
    renderPage("Porteiro");
    expect(await screen.findAllByText(openUsage.driverName)).not.toHaveLength(
      0,
    );
    expect(
      screen.getByRole("button", { name: "Registrar saída" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Histórico institucional" }),
    ).not.toBeInTheDocument();
    expect(searchInstitutionalUsageHistory).not.toHaveBeenCalled();
  });

  it("lets transportation review history without requesting operations", async () => {
    renderPage("SetorTransporte");
    expect(
      await screen.findByRole("heading", { name: "Histórico institucional" }),
    ).toBeInTheDocument();
    expect(await screen.findAllByText(openUsage.driverName)).not.toHaveLength(
      0,
    );
    expect(
      screen.queryByRole("heading", { name: "Veículos em uso" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Registrar saída" }),
    ).not.toBeInTheDocument();
    expect(listOpenInstitutionalUsages).not.toHaveBeenCalled();
  });

  it("registers a departure with catalog identifiers", async () => {
    vi.mocked(registerInstitutionalDeparture).mockResolvedValue(openUsage);
    const user = userEvent.setup();
    renderPage("Porteiro");
    await screen.findAllByText(openUsage.driverName);
    await openAndFillDeparture(user);
    await user.click(
      screen.getAllByRole("button", { name: "Registrar saída" })[1],
    );

    await waitFor(() =>
      expect(registerInstitutionalDeparture).toHaveBeenCalledWith({
        departureMileage: 12500,
        driverId: driver.personId,
        itinerary: "Campus — destino fictício",
        vehicleId: vehicle.id,
      }),
    );
    expect(
      await screen.findByText("Saída institucional registrada com sucesso."),
    ).toBeInTheDocument();
  });

  it("blocks duplicate departures while the request is pending", async () => {
    let resolveDeparture!: (usage: InstitutionalVehicleUsage) => void;
    vi.mocked(registerInstitutionalDeparture).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDeparture = resolve;
        }),
    );
    const user = userEvent.setup();
    renderPage("Porteiro");
    await screen.findByText(openUsage.driverName);
    await openAndFillDeparture(user);
    const submit = screen.getAllByRole("button", {
      name: "Registrar saída",
    })[1];
    await user.click(submit);

    await waitFor(() =>
      expect(registerInstitutionalDeparture).toHaveBeenCalledTimes(1),
    );
    expect(submit).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Registrar saída" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Registrando…" })).toBeDisabled();
    await user.click(submit);
    expect(registerInstitutionalDeparture).toHaveBeenCalledTimes(1);

    await act(async () => resolveDeparture(openUsage));
    expect(
      await screen.findByText("Saída institucional registrada com sucesso."),
    ).toBeInTheDocument();
  });

  it("associates API departure errors with the corresponding field", async () => {
    vi.mocked(registerInstitutionalDeparture).mockRejectedValue(
      new Error("validation"),
    );
    vi.mocked(getApiValidationErrors).mockReturnValue({
      itinerary: "O itinerário fictício não é válido.",
    });
    const user = userEvent.setup();
    renderPage("Porteiro");
    await screen.findAllByText(openUsage.driverName);
    await openAndFillDeparture(user);
    await user.click(
      screen.getAllByRole("button", { name: "Registrar saída" })[1],
    );

    const itinerary = screen.getByLabelText("Itinerário");
    const error = await screen.findByText(
      "O itinerário fictício não é válido.",
    );
    expect(itinerary).toHaveAttribute("aria-invalid", "true");
    expect(itinerary).toHaveAttribute(
      "aria-describedby",
      "usage-itinerary-error",
    );
    expect(error).toHaveAttribute("id", "usage-itinerary-error");
  });

  it("validates and confirms a return before calling the API", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(registerInstitutionalReturn).mockResolvedValue({
      ...openUsage,
      returnAtUtc: "2030-06-10T13:00:00Z",
      returnMileage: 12540,
      status: "Concluido",
      updatedById: 3,
    });
    const user = userEvent.setup();
    renderPage("Vigilante");
    await screen.findByText(openUsage.driverName);
    await user.click(screen.getByRole("button", { name: "Registrar retorno" }));
    const mileage = screen.getByLabelText("Quilometragem no retorno");
    await user.clear(mileage);
    await user.type(mileage, "12540");
    await user.click(screen.getByRole("button", { name: "Confirmar retorno" }));

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("12540 km"),
    );
    await waitFor(() =>
      expect(registerInstitutionalReturn).toHaveBeenCalledWith(12, {
        returnMileage: 12540,
      }),
    );
  });

  it("keeps history results when the local period is invalid", async () => {
    const user = userEvent.setup();
    renderPage("SetorTransporte");
    await screen.findAllByText(openUsage.driverName);
    const from = screen.getByLabelText("Início do período");
    const to = screen.getByLabelText("Fim do período");
    fireEvent.change(from, { target: { value: "2030-06-11T08:00" } });
    fireEvent.change(to, { target: { value: "2030-06-10T08:00" } });
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(screen.getByText(/ordem cronológica/)).toBeInTheDocument();
    expect(from).toHaveAttribute("aria-invalid", "true");
    expect(to).toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByText(openUsage.driverName)).not.toHaveLength(0);
    expect(searchInstitutionalUsageHistory).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: "Tentar novamente" }),
    ).not.toBeInTheDocument();
  });

  it("applies catalog filters and paginates the institutional history", async () => {
    vi.mocked(searchInstitutionalUsageHistory).mockResolvedValue({
      ...historyPage,
      totalCount: 26,
      totalPages: 2,
    });
    const user = userEvent.setup();
    renderPage("SetorTransporte");
    await screen.findAllByText(openUsage.driverName);
    await user.type(screen.getByLabelText("Placa"), vehicle.plate ?? "");
    await user.selectOptions(
      screen.getByLabelText("Veículo ativo"),
      String(vehicle.id),
    );
    await user.selectOptions(
      screen.getByLabelText("Motorista ativo"),
      String(driver.personId),
    );
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    await waitFor(() =>
      expect(searchInstitutionalUsageHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({
          driverId: driver.personId,
          page: 1,
          plate: vehicle.plate,
          vehicleId: vehicle.id,
        }),
      ),
    );
    await user.click(screen.getByRole("button", { name: "Próxima" }));
    await waitFor(() =>
      expect(searchInstitutionalUsageHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
      ),
    );
  });

  it("distinguishes a history request failure from an empty response", async () => {
    vi.mocked(searchInstitutionalUsageHistory)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(emptyHistoryPage);
    const user = userEvent.setup();
    renderPage("SetorTransporte");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível consultar as utilizações.",
    );
    expect(screen.queryByText(/0 utilização/)).not.toBeInTheDocument();
    expect(
      screen.queryByText("Nenhuma utilização encontrada"),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText(/0 utilização/)).toBeInTheDocument();
    expect(
      screen.getByText("Nenhuma utilização encontrada"),
    ).toBeInTheDocument();
  });

  it("shows an explicit barrier when the API denies an operation", async () => {
    vi.mocked(listOpenInstitutionalUsages).mockRejectedValue(
      new Error("forbidden"),
    );
    vi.mocked(describeApiError).mockReturnValue({
      kind: "access-denied",
      message: "Seu perfil não possui permissão para esta operação.",
    });

    renderPage("Porteiro");

    expect(
      await screen.findByRole("heading", { name: "Acesso negado" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Seu perfil não possui permissão para esta operação.",
    );
  });

  it("retries a failed refresh without repeating a saved departure", async () => {
    vi.mocked(listOpenInstitutionalUsages)
      .mockResolvedValueOnce([openUsage])
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([openUsage]);
    vi.mocked(registerInstitutionalDeparture).mockResolvedValue(openUsage);
    const user = userEvent.setup();
    renderPage("Porteiro");
    await screen.findByText(openUsage.driverName);
    await openAndFillDeparture(user);
    await user.click(
      screen.getAllByRole("button", { name: "Registrar saída" })[1],
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A saída foi registrada, mas não foi possível recarregar",
    );
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText(openUsage.driverName)).toBeInTheDocument();
    expect(registerInstitutionalDeparture).toHaveBeenCalledTimes(1);
    expect(listOpenInstitutionalUsages).toHaveBeenCalledTimes(3);
  });

  it("retries a failed refresh without repeating a saved return", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(listOpenInstitutionalUsages)
      .mockResolvedValueOnce([openUsage])
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([]);
    vi.mocked(registerInstitutionalReturn).mockResolvedValue({
      ...openUsage,
      returnAtUtc: "2030-06-10T13:00:00Z",
      returnMileage: 12540,
      status: "Concluido",
      updatedById: 3,
    });
    const user = userEvent.setup();
    renderPage("Vigilante");
    await screen.findByText(openUsage.driverName);
    await user.click(screen.getByRole("button", { name: "Registrar retorno" }));
    const mileage = screen.getByLabelText("Quilometragem no retorno");
    await user.clear(mileage);
    await user.type(mileage, "12540");
    await user.click(screen.getByRole("button", { name: "Confirmar retorno" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "O retorno foi registrado, mas não foi possível recarregar",
    );
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(
      await screen.findByText("Nenhum veículo institucional em uso"),
    ).toBeInTheDocument();
    expect(registerInstitutionalReturn).toHaveBeenCalledTimes(1);
    expect(listOpenInstitutionalUsages).toHaveBeenCalledTimes(3);
  });

  it("renders the administrator workflow without serious accessibility violations", async () => {
    const { container } = renderPage("Administrador");
    await waitFor(() =>
      expect(searchInstitutionalUsageHistory).toHaveBeenCalledTimes(1),
    );
    await screen.findAllByText(openUsage.driverName);
    await expectNoSeriousAccessibilityViolations(container);
  });
});
