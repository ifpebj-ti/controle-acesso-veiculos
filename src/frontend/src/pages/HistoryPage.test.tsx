import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type AccessRecord,
  type PagedAccessRecords,
} from "../features/access-records";
import {
  correctAccessRecord,
  searchAccessHistory,
} from "../features/access-records/services/accessRecordsService";
import {
  useAuthenticatedSession,
  type ProfileName,
} from "../features/authentication";
import { describeApiError } from "../services/api-errors";
import { expectNoSeriousAccessibilityViolations } from "../test/accessibility";
import { HistoryPage } from "./HistoryPage";

vi.mock("../features/access-records/services/accessRecordsService", () => ({
  correctAccessRecord: vi.fn(),
  searchAccessHistory: vi.fn(),
}));

vi.mock("../features/authentication", () => ({
  useAuthenticatedSession: vi.fn(),
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
  totalCount = totalPages > 1 ? 26 : items.length,
): PagedAccessRecords {
  return {
    items,
    page,
    pageSize: 25,
    totalCount,
    totalPages,
  };
}

function renderPage(profileName: ProfileName = "Porteiro") {
  vi.mocked(useAuthenticatedSession).mockReturnValue({
    expiresAtUtc: "2099-01-01T00:00:00Z",
    login: vi.fn(),
    logout: vi.fn(),
    sessionEndReason: null,
    status: "authenticated",
    user: {
      email: "operador.ficticio@example.test",
      id: 1,
      profileName,
    },
  });

  return render(
    <MemoryRouter>
      <HistoryPage />
    </MemoryRouter>,
  );
}

describe("HistoryPage", () => {
  beforeEach(() => {
    vi.mocked(correctAccessRecord).mockReset();
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

  it("keeps filter submission focus while the request is pending", async () => {
    let resolveRequest: ((value: PagedAccessRecords) => void) | undefined;
    const pendingRequest = new Promise<PagedAccessRecords>((resolve) => {
      resolveRequest = resolve;
    });
    vi.mocked(searchAccessHistory)
      .mockResolvedValueOnce(pageResult([]))
      .mockReturnValueOnce(pendingRequest);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Nenhum registro encontrado");

    const applyButton = screen.getByRole("button", {
      name: "Aplicar filtros",
    });
    await user.click(applyButton);

    expect(applyButton).toHaveFocus();
    expect(applyButton).toHaveAttribute("aria-disabled", "true");
    expect(applyButton).not.toBeDisabled();
    await user.click(applyButton);
    expect(searchAccessHistory).toHaveBeenCalledTimes(2);

    resolveRequest?.(pageResult([]));
    await waitFor(() =>
      expect(applyButton).toHaveAttribute("aria-disabled", "false"),
    );
    expect(applyButton).toHaveFocus();
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

  it("shows the associated event in desktop and mobile history views", async () => {
    vi.mocked(searchAccessHistory).mockResolvedValue(
      pageResult([
        {
          ...record,
          eventAuthorizationId: 7,
          eventAuthorizationName: "Evento Fictício de Demonstração",
          eventVehicleRuleId: 9,
        },
      ]),
    );

    renderPage();

    expect(
      await screen.findAllByText("Evento Fictício de Demonstração"),
    ).toHaveLength(2);
    expect(screen.getAllByText("Evento:")).toHaveLength(2);
  });

  it("omits event details when the access has no named association", async () => {
    vi.mocked(searchAccessHistory).mockResolvedValue(
      pageResult([
        record,
        {
          ...record,
          eventAuthorizationId: 8,
          eventAuthorizationName: "   ",
          id: 11,
        },
      ]),
    );

    renderPage();

    await screen.findAllByText("DEM1A23");
    expect(screen.queryByText("Evento:")).not.toBeInTheDocument();
    expect(screen.queryByText("8")).not.toBeInTheDocument();
  });

  it.each<ProfileName>(["Porteiro", "Vigilante", "Administrador"])(
    "allows %s to correct a record using the canonical response",
    async (profileName) => {
      const correctedRecord = {
        ...record,
        categoryName: "Entrega",
        objective: "Objetivo devolvido pela API",
        updatedById: 9,
      };
      vi.mocked(searchAccessHistory)
        .mockResolvedValueOnce(pageResult([record]))
        .mockResolvedValueOnce(pageResult([correctedRecord]));
      vi.mocked(correctAccessRecord).mockResolvedValue(correctedRecord);
      const user = userEvent.setup();
      renderPage(profileName);

      await screen.findAllByText("DEM1A23");
      const correctionButton = screen.getAllByRole("button", {
        name: /Corrigir registro/,
      })[0];
      await user.click(correctionButton);
      const objective = screen.getByLabelText("Objetivo");
      await user.clear(objective);
      await user.type(objective, "Valor enviado pelo formulário");
      await user.type(
        screen.getByLabelText("Justificativa da correção"),
        "Justificativa fictícia válida.",
      );
      await user.click(screen.getByRole("button", { name: "Salvar correção" }));

      expect(correctAccessRecord).toHaveBeenCalledTimes(1);
      expect(
        await screen.findAllByText("Objetivo devolvido pela API"),
      ).toHaveLength(2);
      expect(screen.getByRole("status")).toHaveTextContent(
        "Registro #10 corrigido com sucesso.",
      );
      expect(searchAccessHistory).toHaveBeenCalledTimes(2);
      expect(searchAccessHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({ categoryName: undefined, page: 1 }),
      );
      expect(correctionButton).toHaveFocus();
    },
  );

  it("keeps the current result and focus during background revalidation", async () => {
    let resolveRevalidation: ((value: PagedAccessRecords) => void) | undefined;
    const correctedRecord = {
      ...record,
      objective: "Resultado canônico durante atualização",
      updatedById: 8,
    };
    const pendingRevalidation = new Promise<PagedAccessRecords>((resolve) => {
      resolveRevalidation = resolve;
    });
    vi.mocked(searchAccessHistory)
      .mockResolvedValueOnce(pageResult([record]))
      .mockReturnValueOnce(pendingRevalidation);
    vi.mocked(correctAccessRecord).mockResolvedValue(correctedRecord);
    const user = userEvent.setup();
    renderPage();

    await screen.findAllByText("DEM1A23");
    const correctionButton = screen.getAllByRole("button", {
      name: /Corrigir registro/,
    })[0];
    await user.click(correctionButton);
    await user.type(
      screen.getByLabelText("Justificativa da correção"),
      "Justificativa fictícia válida.",
    );
    await user.click(screen.getByRole("button", { name: "Salvar correção" }));

    expect(
      await screen.findAllByText("Resultado canônico durante atualização"),
    ).toHaveLength(2);
    expect(screen.queryByText("Carregando histórico…")).not.toBeInTheDocument();
    expect(correctionButton).toHaveFocus();
    expect(correctAccessRecord).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRevalidation?.(pageResult([correctedRecord]));
    });
    expect(correctionButton).toHaveFocus();
  });

  it("revalidates applied category filters after a correction", async () => {
    const correctedRecord = {
      ...record,
      categoryName: "Entrega",
      objective: "Entrega fictícia corrigida",
      updatedById: 8,
    };
    vi.mocked(searchAccessHistory)
      .mockResolvedValueOnce(pageResult([record]))
      .mockResolvedValueOnce(pageResult([record]))
      .mockResolvedValueOnce(pageResult([]));
    vi.mocked(correctAccessRecord).mockResolvedValue(correctedRecord);
    const user = userEvent.setup();
    renderPage();

    await screen.findAllByText("DEM1A23");
    await user.selectOptions(screen.getByLabelText("Categoria"), "Visitante");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() => expect(searchAccessHistory).toHaveBeenCalledTimes(2));
    await user.selectOptions(screen.getByLabelText("Categoria"), "Entrega");

    await user.click(
      screen.getAllByRole("button", { name: /Corrigir registro/ })[0],
    );
    await user.selectOptions(
      screen.getByLabelText("Categoria", {
        selector: "select#correction-category",
      }),
      "Entrega",
    );
    await user.type(
      screen.getByLabelText("Justificativa da correção"),
      "Ajuste fictício da categoria do registro.",
    );
    await user.click(screen.getByRole("button", { name: "Salvar correção" }));

    await waitFor(() => expect(searchAccessHistory).toHaveBeenCalledTimes(3));
    expect(searchAccessHistory).toHaveBeenLastCalledWith(
      expect.objectContaining({ categoryName: "Visitante", page: 1 }),
    );
    expect(correctAccessRecord).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("DEM1A23")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Entrega fictícia corrigida"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("0 registro(s)")).toBeInTheDocument();
    expect(screen.getByText("Página 1 de 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Categoria")).toHaveValue("Entrega");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Registro #10 corrigido com sucesso.",
    );
    await waitFor(() => expect(screen.getByRole("status")).toHaveFocus());
  });

  it("keeps Setor de Transporte in read-only mode", async () => {
    vi.mocked(searchAccessHistory).mockResolvedValue(pageResult([record]));
    renderPage("SetorTransporte");

    await screen.findAllByText("DEM1A23");
    expect(
      screen.queryByRole("button", { name: /Corrigir registro/ }),
    ).not.toBeInTheDocument();
  });

  it("offers correction for both open and closed records", async () => {
    vi.mocked(searchAccessHistory).mockResolvedValue(
      pageResult([
        record,
        {
          ...record,
          exitAtUtc: "2026-09-02T13:00:00.000Z",
          id: 11,
          status: "Encerrado",
        },
      ]),
    );
    const user = userEvent.setup();
    renderPage();

    expect(
      await screen.findAllByRole("button", { name: /Corrigir registro/ }),
    ).toHaveLength(4);
    await user.click(
      screen.getAllByRole("button", { name: /Corrigir registro/ })[1],
    );
    expect(screen.getByRole("dialog")).toHaveTextContent("Registro #11");
    expect(screen.getByRole("dialog")).toHaveTextContent("Encerrado");
    expect(screen.getByRole("dialog")).not.toHaveTextContent(
      "Ainda não registrada",
    );
  });

  it("preserves applied filters and pagination after correction", async () => {
    const correctedRecord = {
      ...record,
      objective: "Resultado canônico corrigido",
      updatedById: 8,
    };
    vi.mocked(searchAccessHistory)
      .mockResolvedValueOnce(pageResult([record], 1, 2))
      .mockResolvedValueOnce(pageResult([record], 1, 2))
      .mockResolvedValueOnce(pageResult([record], 2, 2))
      .mockResolvedValueOnce(pageResult([correctedRecord], 2, 2));
    vi.mocked(correctAccessRecord).mockResolvedValue(correctedRecord);
    const user = userEvent.setup();
    renderPage();

    await screen.findAllByText("DEM1A23");
    await user.type(screen.getByLabelText("Placa"), "DEM-1A23");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() => expect(searchAccessHistory).toHaveBeenCalledTimes(2));
    await user.click(screen.getByRole("button", { name: "2" }));
    expect(await screen.findByText("Página 2 de 2")).toBeInTheDocument();

    await user.click(
      screen.getAllByRole("button", { name: /Corrigir registro/ })[0],
    );
    await user.type(
      screen.getByLabelText("Justificativa da correção"),
      "Justificativa fictícia válida.",
    );
    await user.click(screen.getByRole("button", { name: "Salvar correção" }));

    expect(
      await screen.findAllByText("Resultado canônico corrigido"),
    ).toHaveLength(2);
    expect(screen.getByLabelText("Placa")).toHaveValue("DEM-1A23");
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
    expect(searchAccessHistory).toHaveBeenCalledTimes(4);
    expect(searchAccessHistory).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, plate: "DEM-1A23" }),
    );
    expect(correctAccessRecord).toHaveBeenCalledTimes(1);
  });

  it("loads the last valid page when correction reduces pagination", async () => {
    const remainingRecord = { ...record, id: 11, plate: "DEM1A24" };
    const correctedRecord = {
      ...record,
      categoryName: "Entrega",
      updatedById: 8,
    };
    vi.mocked(searchAccessHistory)
      .mockResolvedValueOnce(pageResult([record], 1, 2, 26))
      .mockResolvedValueOnce(pageResult([record], 1, 2, 26))
      .mockResolvedValueOnce(pageResult([record], 2, 2, 26))
      .mockResolvedValueOnce(pageResult([], 2, 1, 25))
      .mockResolvedValueOnce(pageResult([remainingRecord], 1, 1, 25));
    vi.mocked(correctAccessRecord).mockResolvedValue(correctedRecord);
    const user = userEvent.setup();
    renderPage();

    await screen.findAllByText("DEM1A23");
    await user.selectOptions(screen.getByLabelText("Categoria"), "Visitante");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() => expect(searchAccessHistory).toHaveBeenCalledTimes(2));
    await user.click(screen.getByRole("button", { name: "2" }));
    expect(await screen.findByText("Página 2 de 2")).toBeInTheDocument();

    await user.click(
      screen.getAllByRole("button", { name: /Corrigir registro/ })[0],
    );
    await user.selectOptions(
      screen.getByLabelText("Categoria", {
        selector: "select#correction-category",
      }),
      "Entrega",
    );
    await user.type(
      screen.getByLabelText("Justificativa da correção"),
      "Ajuste fictício que reduz a paginação.",
    );
    await user.click(screen.getByRole("button", { name: "Salvar correção" }));

    expect(await screen.findByText("Página 1 de 1")).toBeInTheDocument();
    expect(screen.getByText("25 registro(s)")).toBeInTheDocument();
    expect(screen.queryByText("DEM1A23")).not.toBeInTheDocument();
    expect(screen.getAllByText("DEM1A24")).toHaveLength(2);
    expect(searchAccessHistory).toHaveBeenCalledTimes(5);
    expect(searchAccessHistory).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({ categoryName: "Visitante", page: 2 }),
    );
    expect(searchAccessHistory).toHaveBeenLastCalledWith(
      expect.objectContaining({ categoryName: "Visitante", page: 1 }),
    );
    expect(correctAccessRecord).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByRole("status")).toHaveFocus());
  });

  it("has no serious accessibility violations in the empty state", async () => {
    vi.mocked(searchAccessHistory).mockResolvedValue(pageResult([]));
    const { container } = renderPage();

    await screen.findByText("Nenhum registro encontrado");
    await expectNoSeriousAccessibilityViolations(container);
  });
});
