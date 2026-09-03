import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type AccessRecord,
  type PagedAccessRecords,
} from "../features/access-records";
import { searchAccessHistory } from "../features/access-records/services/accessRecordsService";
import { describeApiError } from "../services/api-errors";
import { HistoryPage } from "./HistoryPage";

vi.mock("../features/access-records/services/accessRecordsService", () => ({
  searchAccessHistory: vi.fn(),
}));

vi.mock("../services/api-errors", () => ({
  describeApiError: vi.fn(),
}));

const record: AccessRecord = {
  categoryName: "Visitante",
  createdById: 1,
  driverName: "Pessoa histórica fictícia",
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

function pageResult(
  items: AccessRecord[],
  page = 1,
  totalPages = items.length > 0 ? 1 : 0,
): PagedAccessRecords {
  return {
    items,
    page,
    pageSize: 25,
    totalCount: totalPages > 1 ? 26 : items.length,
    totalPages,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <HistoryPage />
    </MemoryRouter>,
  );
}

describe("HistoryPage", () => {
  beforeEach(() => {
    vi.mocked(searchAccessHistory).mockReset();
    vi.mocked(describeApiError).mockReset();
    vi.mocked(describeApiError).mockReturnValue({
      kind: "network",
      message: "Não foi possível consultar o histórico.",
    });
  });

  it("clears previous results when a new request fails", async () => {
    vi.mocked(searchAccessHistory)
      .mockResolvedValueOnce(pageResult([record], 1, 2))
      .mockRejectedValueOnce(new Error("network"));
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findAllByText("DEM1A23")).not.toHaveLength(0);
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(
      await screen.findByText("Não foi possível consultar o histórico."),
    ).toBeInTheDocument();
    expect(screen.queryByText("DEM1A23")).not.toBeInTheDocument();
    expect(screen.queryByText("0 registro(s)")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Nenhum registro encontrado"),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "2" })).not.toBeInTheDocument();
  });

  it("shows the empty state only after a successful empty response", async () => {
    vi.mocked(searchAccessHistory).mockResolvedValue(pageResult([]));

    renderPage();

    expect(
      await screen.findByText("Nenhum registro encontrado"),
    ).toBeInTheDocument();
    expect(screen.getByText("0 registro(s)")).toBeInTheDocument();
  });

  it("retries a failed history request", async () => {
    vi.mocked(searchAccessHistory)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(pageResult([]));
    const user = userEvent.setup();
    renderPage();

    expect(
      await screen.findByText("Não foi possível consultar o histórico."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Nenhum registro encontrado"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(
      await screen.findByText("Nenhum registro encontrado"),
    ).toBeInTheDocument();
    expect(searchAccessHistory).toHaveBeenCalledTimes(2);
  });

  it("sends only the filters supported by the history endpoint", async () => {
    vi.mocked(searchAccessHistory).mockResolvedValue(pageResult([]));
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Nenhum registro encontrado");

    await user.type(screen.getByLabelText("Placa"), "DEM-1A23");
    await user.type(screen.getByLabelText("Condutor"), "Pessoa fictícia");
    await user.selectOptions(screen.getByLabelText("Situação"), "Encerrado");
    await user.selectOptions(screen.getByLabelText("Categoria"), "Mototáxi");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    await waitFor(() => expect(searchAccessHistory).toHaveBeenCalledTimes(2));
    expect(searchAccessHistory).toHaveBeenLastCalledWith(
      expect.objectContaining({
        categoryName: "Mototáxi",
        driverName: "Pessoa fictícia",
        page: 1,
        pageSize: 25,
        plate: "DEM-1A23",
        status: "Encerrado",
      }),
    );
  });

  it("requests the selected server-side page", async () => {
    vi.mocked(searchAccessHistory)
      .mockResolvedValueOnce(pageResult([record], 1, 2))
      .mockResolvedValueOnce(pageResult([{ ...record, id: 11 }], 2, 2));
    const user = userEvent.setup();
    renderPage();

    await screen.findAllByText("DEM1A23");
    await user.click(screen.getByRole("button", { name: "2" }));

    await waitFor(() =>
      expect(searchAccessHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, pageSize: 25 }),
      ),
    );
    expect(await screen.findByText("Página 2 de 2")).toBeInTheDocument();
  });
});
