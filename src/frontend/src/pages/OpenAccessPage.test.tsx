import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  closeAccessRecord,
  listOpenAccessRecords,
  type AccessRecord,
} from "../features/access-records";
import { describeApiError } from "../services/api-errors";
import { OpenAccessPage } from "./OpenAccessPage";

vi.mock("../features/access-records", async () => {
  const actual = await vi.importActual<
    typeof import("../features/access-records")
  >("../features/access-records");
  return {
    ...actual,
    closeAccessRecord: vi.fn(),
    listOpenAccessRecords: vi.fn(),
  };
});

vi.mock("../services/api-errors", () => ({
  describeApiError: vi.fn(),
}));

const record: AccessRecord = {
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
    <MemoryRouter>
      <OpenAccessPage />
    </MemoryRouter>,
  );
}

describe("OpenAccessPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(describeApiError).mockReturnValue({
      kind: "network",
      message: "Falha de rede.",
    });
  });

  it("loads records and closes an access only after confirmation", async () => {
    vi.mocked(listOpenAccessRecords).mockResolvedValue([record]);
    vi.mocked(closeAccessRecord).mockResolvedValue({
      ...record,
      exitAtUtc: "2026-09-02T13:00:00.000Z",
      status: "Encerrado",
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();

    renderPage();

    expect(await screen.findByText("DEM1A23")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Registrar saída" }));

    await waitFor(() => expect(closeAccessRecord).toHaveBeenCalledWith(10));
    expect(
      await screen.findByText(
        "Saída do veículo DEM1A23 registrada com sucesso.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("DEM1A23")).not.toBeInTheDocument();
  });

  it("shows an empty state returned by the API", async () => {
    vi.mocked(listOpenAccessRecords).mockResolvedValue([]);

    renderPage();

    expect(
      await screen.findByText("Nenhum acesso aberto encontrado"),
    ).toBeInTheDocument();
  });

  it("shows an observable error and allows retry", async () => {
    vi.mocked(listOpenAccessRecords)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([]);
    const user = userEvent.setup();

    renderPage();

    expect(await screen.findByText("Falha de rede.")).toBeInTheDocument();
    expect(
      screen.queryByText("Nenhum acesso aberto encontrado"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Resumo dos acessos abertos" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("0 registro(s)")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(
      await screen.findByText("Nenhum acesso aberto encontrado"),
    ).toBeInTheDocument();
    expect(listOpenAccessRecords).toHaveBeenCalledTimes(2);
  });

  it("clears previous open accesses when a refresh fails", async () => {
    vi.mocked(listOpenAccessRecords)
      .mockResolvedValueOnce([record])
      .mockRejectedValueOnce(new Error("network"));
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText("DEM1A23")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Atualizar lista" }));

    expect(await screen.findByText("Falha de rede.")).toBeInTheDocument();
    expect(screen.queryByText("DEM1A23")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Nenhum acesso aberto encontrado"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("0 registro(s)")).not.toBeInTheDocument();
  });

  it("renders the explicit access denied state for a 403 response", async () => {
    vi.mocked(listOpenAccessRecords).mockRejectedValue(new Error("forbidden"));
    vi.mocked(describeApiError).mockReturnValue({
      kind: "access-denied",
      message: "Perfil sem permissão.",
      status: 403,
    });

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Acesso negado" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Perfil sem permissão.")).toBeInTheDocument();
  });
});
