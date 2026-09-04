import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type ProfileName,
  useAuthenticatedSession,
} from "../features/authentication";
import {
  createInstitutionalVehicle,
  deactivateInstitutionalVehicle,
  listInstitutionalVehicles,
  updateInstitutionalVehicle,
  type InstitutionalVehicle,
} from "../features/institutional-vehicles";
import {
  describeApiError,
  getApiValidationErrors,
} from "../services/api-errors";
import { expectNoSeriousAccessibilityViolations } from "../test/accessibility";
import { FleetPage } from "./FleetPage";

vi.mock("../features/authentication", () => ({
  useAuthenticatedSession: vi.fn(),
}));

vi.mock("../features/institutional-vehicles", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../features/institutional-vehicles")>();
  return {
    ...original,
    createInstitutionalVehicle: vi.fn(),
    deactivateInstitutionalVehicle: vi.fn(),
    listInstitutionalVehicles: vi.fn(),
    updateInstitutionalVehicle: vi.fn(),
  };
});

vi.mock("../services/api-errors", () => ({
  describeApiError: vi.fn(),
  getApiValidationErrors: vi.fn(),
}));

const vehicle: InstitutionalVehicle = {
  brand: "Marca fictícia",
  color: "Branca",
  createdAtUtc: "2026-09-03T12:00:00Z",
  id: 4,
  identification: "VEICULO 04",
  model: "Modelo fictício",
  plate: "DEM1A23",
  vehicleType: "Automóvel",
  year: 2024,
};

function renderPage(profileName: ProfileName = "Administrador") {
  vi.mocked(useAuthenticatedSession).mockReturnValue({
    expiresAtUtc: "2026-09-03T22:00:00Z",
    login: vi.fn(),
    logout: vi.fn(),
    sessionEndReason: null,
    status: "authenticated",
    user: { email: "usuario@example.test", id: 1, profileName },
  });

  return render(
    <MemoryRouter>
      <FleetPage />
    </MemoryRouter>,
  );
}

describe("FleetPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listInstitutionalVehicles).mockResolvedValue([vehicle]);
    vi.mocked(describeApiError).mockReturnValue({
      kind: "network",
      message: "Não foi possível consultar a frota.",
    });
    vi.mocked(getApiValidationErrors).mockReturnValue({});
  });

  it("allows operational profiles to confer the active catalog without maintenance actions", async () => {
    renderPage("Porteiro");

    expect(await screen.findByText("DEM1A23")).toBeInTheDocument();
    expect(
      screen.getByText("Consulta para conferência operacional"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Novo veículo" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Editar" }),
    ).not.toBeInTheDocument();
  });

  it("creates a vehicle from the management form", async () => {
    const created = { ...vehicle, id: 5, identification: "VEICULO 05" };
    vi.mocked(createInstitutionalVehicle).mockResolvedValue(created);
    const user = userEvent.setup();
    renderPage("SetorTransporte");
    await screen.findByText("DEM1A23");

    await user.click(screen.getByRole("button", { name: "Novo veículo" }));
    await user.type(
      screen.getByLabelText("Identificação institucional"),
      "VEICULO 05",
    );
    await user.click(screen.getByRole("button", { name: "Cadastrar veículo" }));

    await waitFor(() =>
      expect(createInstitutionalVehicle).toHaveBeenCalledWith({
        brand: null,
        color: null,
        identification: "VEICULO 05",
        model: null,
        plate: null,
        vehicleType: null,
        year: null,
      }),
    );
    expect(
      await screen.findByText("Veículo institucional cadastrado com sucesso."),
    ).toBeInTheDocument();
  });

  it("blocks duplicate submissions while a vehicle is being created", async () => {
    let resolveCreation: ((value: InstitutionalVehicle) => void) | undefined;
    vi.mocked(createInstitutionalVehicle).mockReturnValue(
      new Promise((resolve) => {
        resolveCreation = resolve;
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("DEM1A23");

    await user.click(screen.getByRole("button", { name: "Novo veículo" }));
    await user.type(
      screen.getByLabelText("Identificação institucional"),
      "VEICULO 05",
    );
    await user.click(screen.getByRole("button", { name: "Cadastrar veículo" }));

    const pendingButton = await screen.findByRole("button", {
      name: "Salvando…",
    });
    expect(pendingButton).toBeDisabled();
    expect(createInstitutionalVehicle).toHaveBeenCalledTimes(1);

    resolveCreation?.({ ...vehicle, id: 5, identification: "VEICULO 05" });
    expect(
      await screen.findByText("Veículo institucional cadastrado com sucesso."),
    ).toBeInTheDocument();
  });

  it("edits and deactivates vehicles with explicit confirmation", async () => {
    vi.mocked(updateInstitutionalVehicle).mockResolvedValue({
      ...vehicle,
      color: "Prata",
    });
    vi.mocked(deactivateInstitutionalVehicle).mockResolvedValue();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("DEM1A23");

    await user.click(screen.getByRole("button", { name: "Editar" }));
    await user.clear(screen.getByLabelText("Cor (opcional)"));
    await user.type(screen.getByLabelText("Cor (opcional)"), "Prata");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByText("Prata · 2024")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Desativar" }));
    await waitFor(() =>
      expect(deactivateInstitutionalVehicle).toHaveBeenCalledWith(4),
    );
    expect(
      await screen.findByText("Nenhum veículo ativo cadastrado"),
    ).toBeInTheDocument();
  });

  it("does not present a failed query as an empty catalog and retries", async () => {
    vi.mocked(listInstitutionalVehicles)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([]);
    const user = userEvent.setup();
    renderPage();

    expect(
      await screen.findByText("Não foi possível consultar a frota."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Nenhum veículo ativo cadastrado"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("0 veículo(s) ativo(s)")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(
      await screen.findByText("Nenhum veículo ativo cadastrado"),
    ).toBeInTheDocument();
    expect(screen.getByText("0 veículo(s) ativo(s)")).toBeInTheDocument();
  });

  it("shows API field validation and keeps the form available", async () => {
    vi.mocked(createInstitutionalVehicle).mockRejectedValue(
      new Error("invalid"),
    );
    vi.mocked(getApiValidationErrors).mockReturnValue({
      identification: "A identificação informada já está em uso.",
    });
    vi.mocked(describeApiError).mockReturnValue({
      kind: "validation",
      message: "Revise os dados.",
      status: 400,
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("DEM1A23");

    await user.click(screen.getByRole("button", { name: "Novo veículo" }));
    await user.type(
      screen.getByLabelText("Identificação institucional"),
      "VEICULO 04",
    );
    await user.click(screen.getByRole("button", { name: "Cadastrar veículo" }));

    expect(
      await screen.findByText("A identificação informada já está em uso."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Revise os campos destacados e tente novamente."),
    ).toBeInTheDocument();
  });

  it("shows an explicit access-denied barrier", async () => {
    vi.mocked(listInstitutionalVehicles).mockRejectedValue(new Error("denied"));
    vi.mocked(describeApiError).mockReturnValue({
      kind: "access-denied",
      message: "Seu perfil não possui acesso ao catálogo.",
      status: 403,
    });
    renderPage();

    expect(await screen.findByText("Acesso negado")).toBeInTheDocument();
    expect(
      screen.getByText("Seu perfil não possui acesso ao catálogo."),
    ).toBeInTheDocument();
  });

  it("has no serious accessibility violations in the catalog", async () => {
    const { container } = renderPage();
    await screen.findByText("DEM1A23");

    await expectNoSeriousAccessibilityViolations(container);
  });
});
