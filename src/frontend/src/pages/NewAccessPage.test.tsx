import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  registerAccessEntry,
  type AccessRecord,
} from "../features/access-records";
import { expectNoSeriousAccessibilityViolations } from "../test/accessibility";
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
    plateField.focus();
    await user.keyboard("{Enter}");

    expect(await screen.findByText(/formulário está pronto/)).toHaveAttribute(
      "role",
      "status",
    );
    expect(plateField).toHaveFocus();
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
});
