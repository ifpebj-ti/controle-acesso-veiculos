import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type ProfileName,
  useAuthenticatedSession,
} from "../features/authentication";
import {
  authorizeInstitutionalDriver,
  deactivateInstitutionalDriver,
  listInstitutionalDrivers,
  type InstitutionalDriver,
} from "../features/institutional-drivers";
import {
  describeApiError,
  getApiValidationErrors,
} from "../services/api-errors";
import { expectNoSeriousAccessibilityViolations } from "../test/accessibility";
import { InstitutionalDriversPage } from "./InstitutionalDriversPage";

vi.mock("../features/authentication", () => ({
  useAuthenticatedSession: vi.fn(),
}));

vi.mock("../features/institutional-drivers", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../features/institutional-drivers")>();
  return {
    ...original,
    authorizeInstitutionalDriver: vi.fn(),
    deactivateInstitutionalDriver: vi.fn(),
    listInstitutionalDrivers: vi.fn(),
  };
});

vi.mock("../services/api-errors", () => ({
  describeApiError: vi.fn(),
  getApiValidationErrors: vi.fn(),
}));

const driver: InstitutionalDriver = {
  authorizedAtUtc: "2026-09-04T12:00:00Z",
  authorizedById: 1,
  id: 4,
  name: "Motorista Fictício",
  personId: 8,
  updatedAtUtc: null,
  updatedById: null,
};

function renderPage(profileName: ProfileName = "Administrador") {
  vi.mocked(useAuthenticatedSession).mockReturnValue({
    expiresAtUtc: "2026-09-06T22:00:00Z",
    login: vi.fn(),
    logout: vi.fn(),
    sessionEndReason: null,
    status: "authenticated",
    user: { email: "usuario@example.test", id: 1, profileName },
  });

  return render(
    <MemoryRouter>
      <InstitutionalDriversPage />
    </MemoryRouter>,
  );
}

describe("InstitutionalDriversPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listInstitutionalDrivers).mockResolvedValue([driver]);
    vi.mocked(describeApiError).mockReturnValue({
      kind: "network",
      message: "Não foi possível consultar os motoristas.",
    });
    vi.mocked(getApiValidationErrors).mockReturnValue({});
  });

  it("allows operational profiles to confer drivers without maintenance actions", async () => {
    renderPage("Porteiro");

    expect(await screen.findByText(driver.name)).toBeInTheDocument();
    expect(
      screen.getByText("Consulta para conferência operacional"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Nova autorização" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Desativar autorização" }),
    ).not.toBeInTheDocument();
  });

  it("authorizes a driver without retaining the submitted document in the catalog", async () => {
    const created = { ...driver, id: 5, name: "Condutora de Teste" };
    vi.mocked(authorizeInstitutionalDriver).mockResolvedValue(created);
    const user = userEvent.setup();
    renderPage("SetorTransporte");
    await screen.findByText(driver.name);

    await user.click(screen.getByRole("button", { name: "Nova autorização" }));
    await user.type(screen.getByLabelText("Nome completo"), created.name);
    await user.type(screen.getByLabelText(/Tipo de documento/), "ID");
    await user.type(
      screen.getByLabelText(/Número do documento/),
      "DOC-FICTICIO",
    );
    await user.click(
      screen.getByRole("button", { name: "Autorizar motorista" }),
    );

    await waitFor(() =>
      expect(authorizeInstitutionalDriver).toHaveBeenCalledWith({
        documentNumber: "DOC-FICTICIO",
        documentType: "ID",
        name: created.name,
      }),
    );
    expect(
      await screen.findByText(
        "Motorista institucional autorizado com sucesso.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(created.name)).toBeInTheDocument();
    expect(screen.queryByText("DOC-FICTICIO")).not.toBeInTheDocument();
  });

  it("associates a local document-pair error with the invalid field", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(driver.name);
    await user.click(screen.getByRole("button", { name: "Nova autorização" }));
    await user.type(screen.getByLabelText("Nome completo"), "Pessoa de Teste");
    await user.type(screen.getByLabelText(/Tipo de documento/), "ID");
    await user.click(
      screen.getByRole("button", { name: "Autorizar motorista" }),
    );

    const field = screen.getByLabelText(/Número do documento/);
    const error = await screen.findByText(
      "Informe o tipo e o número do documento juntos.",
    );
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAttribute(
      "aria-describedby",
      "driver-documentNumber-error",
    );
    expect(error).toHaveAttribute("id", "driver-documentNumber-error");
    expect(authorizeInstitutionalDriver).not.toHaveBeenCalled();
  });

  it("associates a document error returned by the API with both fields", async () => {
    vi.mocked(authorizeInstitutionalDriver).mockRejectedValue(
      new Error("validation"),
    );
    vi.mocked(getApiValidationErrors).mockReturnValue({
      document: "Documento fictício inválido.",
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(driver.name);
    await user.click(screen.getByRole("button", { name: "Nova autorização" }));
    await user.type(screen.getByLabelText("Nome completo"), "Pessoa de Teste");
    await user.type(screen.getByLabelText(/Tipo de documento/), "ID");
    await user.type(
      screen.getByLabelText(/Número do documento/),
      "DOC-FICTICIO",
    );
    await user.click(
      screen.getByRole("button", { name: "Autorizar motorista" }),
    );

    const typeField = screen.getByLabelText(/Tipo de documento/);
    const numberField = screen.getByLabelText(/Número do documento/);
    expect(
      await screen.findAllByText("Documento fictício inválido."),
    ).toHaveLength(2);
    expect(typeField).toHaveAttribute(
      "aria-describedby",
      "driver-documentType-error",
    );
    expect(numberField).toHaveAttribute(
      "aria-describedby",
      "driver-documentNumber-error",
    );
  });

  it("removes an earlier success message before a later authorization fails", async () => {
    vi.mocked(authorizeInstitutionalDriver)
      .mockResolvedValueOnce({ ...driver, id: 5, name: "Primeira Pessoa" })
      .mockRejectedValueOnce(new Error("network"));
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(driver.name);

    await user.click(screen.getByRole("button", { name: "Nova autorização" }));
    await user.type(screen.getByLabelText("Nome completo"), "Primeira Pessoa");
    await user.click(
      screen.getByRole("button", { name: "Autorizar motorista" }),
    );
    expect(
      await screen.findByText(
        "Motorista institucional autorizado com sucesso.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nova autorização" }));
    expect(
      screen.queryByText("Motorista institucional autorizado com sucesso."),
    ).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Nome completo"), "Segunda Pessoa");
    await user.click(
      screen.getByRole("button", { name: "Autorizar motorista" }),
    );

    expect(
      await screen.findByText("Não foi possível consultar os motoristas."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Motorista institucional autorizado com sucesso."),
    ).not.toBeInTheDocument();
  });

  it("blocks form actions while an authorization is pending", async () => {
    let resolveAuthorization:
      ((value: InstitutionalDriver) => void) | undefined;
    vi.mocked(authorizeInstitutionalDriver).mockReturnValue(
      new Promise((resolve) => {
        resolveAuthorization = resolve;
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(driver.name);
    await user.click(screen.getByRole("button", { name: "Nova autorização" }));
    await user.type(screen.getByLabelText("Nome completo"), "Pessoa de Teste");
    await user.click(
      screen.getByRole("button", { name: "Autorizar motorista" }),
    );

    expect(
      await screen.findByRole("button", { name: "Autorizando…" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(
      screen.getAllByRole("button", { name: "Desativar autorização" })[0],
    ).toBeDisabled();
    expect(authorizeInstitutionalDriver).toHaveBeenCalledTimes(1);

    resolveAuthorization?.({ ...driver, id: 5, name: "Pessoa de Teste" });
    expect(
      await screen.findByText(
        "Motorista institucional autorizado com sucesso.",
      ),
    ).toBeInTheDocument();
  });

  it("requires confirmation before deactivating an authorization", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(deactivateInstitutionalDriver).mockResolvedValue();
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(driver.name);

    await user.click(
      screen.getByRole("button", { name: "Desativar autorização" }),
    );

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining(driver.name),
    );
    await waitFor(() =>
      expect(deactivateInstitutionalDriver).toHaveBeenCalledWith(driver.id),
    );
    expect(
      await screen.findByText(
        `Autorização de ${driver.name} desativada com sucesso.`,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(driver.name)).not.toBeInTheDocument();
  });

  it("distinguishes a failed query from a successful empty catalog and retries", async () => {
    vi.mocked(listInstitutionalDrivers)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([]);
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível consultar os motoristas.",
    );
    expect(
      screen.queryByText("0 motorista(s) autorizado(s)"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Nenhum motorista autorizado"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(
      await screen.findByText("0 motorista(s) autorizado(s)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Nenhum motorista autorizado")).toBeInTheDocument();
  });

  it("presents an explicit access-denied state", async () => {
    vi.mocked(listInstitutionalDrivers).mockRejectedValue(
      new Error("forbidden"),
    );
    vi.mocked(describeApiError).mockReturnValue({
      kind: "access-denied",
      message: "Você não possui permissão para consultar motoristas.",
    });
    renderPage();

    expect(
      await screen.findByText(
        "Você não possui permissão para consultar motoristas.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(driver.name)).not.toBeInTheDocument();
  });

  it("has no serious or critical automated accessibility violations", async () => {
    const { container } = renderPage();
    await screen.findByText(driver.name);
    await expectNoSeriousAccessibilityViolations(container);
  });
});
