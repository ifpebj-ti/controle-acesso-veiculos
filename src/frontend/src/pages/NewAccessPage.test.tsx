import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  registerAccessEntry,
  type AccessRecord,
} from "../features/access-records";
import { NewAccessPage } from "./NewAccessPage";

vi.mock("../features/access-records", async () => {
  const actual = await vi.importActual<
    typeof import("../features/access-records")
  >("../features/access-records");
  return { ...actual, registerAccessEntry: vi.fn() };
});

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
  beforeEach(() => vi.clearAllMocks());

  it("submits documented fields once and navigates after API success", async () => {
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
    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));

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

  it("keeps invalid data in the browser and identifies required fields", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));

    expect(
      await screen.findByText("Informe a placa do veículo."),
    ).toBeInTheDocument();
    expect(screen.getByText("Informe o nome do condutor.")).toBeInTheDocument();
    expect(
      screen.getByText("Informe o objetivo do acesso."),
    ).toBeInTheDocument();
    expect(registerAccessEntry).not.toHaveBeenCalled();
  });
});
