import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type ProfileName,
  useAuthenticatedSession,
} from "../features/authentication";
import {
  cancelEventAuthorization,
  createEventAuthorization,
  searchEventAuthorizations,
  updateEventAuthorization,
  type EventAuthorization,
  type EventAuthorizationPage,
} from "../features/event-authorizations";
import {
  describeApiError,
  getApiValidationErrors,
} from "../services/api-errors";
import { expectNoSeriousAccessibilityViolations } from "../test/accessibility";
import { EventsPage } from "./EventsPage";

vi.mock("../features/authentication", () => ({
  useAuthenticatedSession: vi.fn(),
}));
vi.mock(
  "../features/event-authorizations/services/eventAuthorizationsService",
  () => ({
    cancelEventAuthorization: vi.fn(),
    createEventAuthorization: vi.fn(),
    searchEventAuthorizations: vi.fn(),
    updateEventAuthorization: vi.fn(),
  }),
);
vi.mock("../services/api-errors", () => ({
  describeApiError: vi.fn(),
  getApiValidationErrors: vi.fn(),
}));

const authorization: EventAuthorization = {
  active: true,
  area: "Pátio de Teste",
  createdAtUtc: "2030-05-01T12:00:00Z",
  createdById: 1,
  endsAtUtc: "2030-05-10T20:00:00Z",
  id: 7,
  name: "Evento Fictício",
  notes: "Dados exclusivos para teste.",
  overnightAllowed: false,
  responsible: "Coordenação Fictícia",
  startsAtUtc: "2030-05-10T12:00:00Z",
  updatedAtUtc: null,
  updatedById: null,
  vehicleRules: [
    {
      consumedQuantity: 1,
      id: 9,
      plate: null,
      quantity: 3,
      remainingQuantity: 2,
      vehicleType: "AUTOMÓVEL",
    },
    {
      consumedQuantity: 1,
      id: 10,
      plate: "TST1A23",
      quantity: 1,
      remainingQuantity: 0,
      vehicleType: "AUTOMÓVEL",
    },
  ],
};

const populatedPage: EventAuthorizationPage = {
  items: [authorization],
  page: 1,
  pageSize: 10,
  totalCount: 1,
  totalPages: 1,
};
const emptyPage: EventAuthorizationPage = {
  items: [],
  page: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 0,
};

function renderPage(profileName: ProfileName = "Administrador") {
  vi.mocked(useAuthenticatedSession).mockReturnValue({
    expiresAtUtc: "2030-05-01T22:00:00Z",
    login: vi.fn(),
    logout: vi.fn(),
    sessionEndReason: null,
    status: "authenticated",
    user: { email: "usuario@example.test", id: 1, profileName },
  });
  return render(
    <MemoryRouter>
      <EventsPage />
    </MemoryRouter>,
  );
}

async function fillRequiredForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nome do evento"), "Encontro de Teste");
  await user.type(screen.getByLabelText("Responsável"), "Setor de Teste");
  await user.type(screen.getByLabelText("Local ou área"), "Pátio Fictício");
  await user.type(screen.getByLabelText("Início"), "2030-06-10T08:00");
  await user.type(screen.getByLabelText("Fim"), "2030-06-10T18:00");
  await user.type(screen.getByLabelText("Tipo do veículo"), "Automóvel");
}

describe("EventsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchEventAuthorizations).mockResolvedValue(populatedPage);
    vi.mocked(describeApiError).mockReturnValue({
      kind: "network",
      message: "Não foi possível consultar as autorizações.",
    });
    vi.mocked(getApiValidationErrors).mockReturnValue({});
  });

  it("lets operational profiles confer events without maintenance actions", async () => {
    renderPage("Porteiro");
    expect(await screen.findByText(authorization.name)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Conferir autorizações" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Nova autorização" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Editar" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancelar autorização" }),
    ).not.toBeInTheDocument();
  });

  it("separates planned capacity, recorded entries and remaining capacity", async () => {
    renderPage();
    await screen.findByText(authorization.name);
    expect(screen.getByText("Previstos").nextSibling).toHaveTextContent("4");
    expect(
      screen.getByText("Entradas registradas").nextSibling,
    ).toHaveTextContent("2");
    expect(screen.getByText("Restantes").nextSibling).toHaveTextContent("2");
    expect(screen.getByText("Placa TST1A23")).toBeInTheDocument();
    expect(screen.getByText("1 de 3 entrada(s)")).toBeInTheDocument();
  });

  it("distinguishes query failure from a successful empty result and retries", async () => {
    vi.mocked(searchEventAuthorizations)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(emptyPage);
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível consultar as autorizações.",
    );
    expect(
      screen.queryByText("0 autorização(ões) encontrada(s)"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Nenhuma autorização encontrada"),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(
      await screen.findByText("0 autorização(ões) encontrada(s)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Nenhuma autorização encontrada"),
    ).toBeInTheDocument();
  });

  it("associates local validation errors with event fields", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(authorization.name);
    await user.click(screen.getByRole("button", { name: "Nova autorização" }));
    await user.click(screen.getByRole("button", { name: "Criar autorização" }));
    const name = screen.getByLabelText("Nome do evento");
    const error = await screen.findByText("Informe o nome do evento.");
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAttribute("aria-describedby", "event-name-error");
    expect(error).toHaveAttribute("id", "event-name-error");
    expect(createEventAuthorization).not.toHaveBeenCalled();
  });

  it("associates validation errors returned by the API with their fields", async () => {
    vi.mocked(createEventAuthorization).mockRejectedValue(
      new Error("validation"),
    );
    vi.mocked(getApiValidationErrors).mockReturnValue({
      name: "Nome fictício inválido.",
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(authorization.name);
    await user.click(screen.getByRole("button", { name: "Nova autorização" }));
    await fillRequiredForm(user);
    await user.click(screen.getByRole("button", { name: "Criar autorização" }));

    const name = screen.getByLabelText("Nome do evento");
    const error = await screen.findByText("Nome fictício inválido.");
    expect(name).toHaveAttribute("aria-describedby", "event-name-error");
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(error).toHaveAttribute("id", "event-name-error");
  });

  it("creates an authorization through the real feature boundary", async () => {
    vi.mocked(createEventAuthorization).mockResolvedValue({
      ...authorization,
      id: 11,
      name: "Encontro de Teste",
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(authorization.name);
    await user.click(screen.getByRole("button", { name: "Nova autorização" }));
    await fillRequiredForm(user);
    await user.click(screen.getByRole("button", { name: "Criar autorização" }));
    await waitFor(() =>
      expect(createEventAuthorization).toHaveBeenCalledTimes(1),
    );
    expect(
      await screen.findByText("Autorização criada com sucesso."),
    ).toBeInTheDocument();
  });

  it("edits an active authorization and preserves the API identifier", async () => {
    vi.mocked(updateEventAuthorization).mockResolvedValue({
      ...authorization,
      name: "Evento Atualizado",
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(authorization.name);
    await user.click(screen.getByRole("button", { name: "Editar" }));
    const name = screen.getByLabelText("Nome do evento");
    await user.clear(name);
    await user.type(name, "Evento Atualizado");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() =>
      expect(updateEventAuthorization).toHaveBeenCalledWith(
        authorization.id,
        expect.objectContaining({ name: "Evento Atualizado" }),
      ),
    );
    expect(
      await screen.findByText("Autorização atualizada com sucesso."),
    ).toBeInTheDocument();
  });

  it("applies server filters and changes page without mixing draft state", async () => {
    vi.mocked(searchEventAuthorizations).mockResolvedValue({
      ...populatedPage,
      totalCount: 12,
      totalPages: 2,
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(authorization.name);
    await user.type(
      screen.getByLabelText("Buscar pelo nome do evento"),
      "Encontro",
    );
    await user.selectOptions(screen.getByLabelText("Situação"), "all");
    await user.click(screen.getByRole("button", { name: "Aplicar" }));
    await waitFor(() =>
      expect(searchEventAuthorizations).toHaveBeenLastCalledWith(
        expect.objectContaining({ active: "all", name: "Encontro", page: 1 }),
      ),
    );
    await user.click(screen.getByRole("button", { name: "Próxima" }));
    await waitFor(() =>
      expect(searchEventAuthorizations).toHaveBeenLastCalledWith(
        expect.objectContaining({ active: "all", name: "Encontro", page: 2 }),
      ),
    );
  });

  it("blocks other actions while a creation is pending", async () => {
    let resolveCreation: ((value: EventAuthorization) => void) | undefined;
    vi.mocked(createEventAuthorization).mockReturnValue(
      new Promise((resolve) => {
        resolveCreation = resolve;
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(authorization.name);
    await user.click(screen.getByRole("button", { name: "Nova autorização" }));
    await fillRequiredForm(user);
    await user.click(screen.getByRole("button", { name: "Criar autorização" }));
    expect(
      await screen.findByRole("button", { name: "Salvando…" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Nova autorização" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Editar" })).toBeDisabled();
    expect(createEventAuthorization).toHaveBeenCalledTimes(1);
    resolveCreation?.({ ...authorization, id: 11 });
    expect(
      await screen.findByText("Autorização criada com sucesso."),
    ).toBeInTheDocument();
  });

  it("confirms logical cancellation before calling the API", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(cancelEventAuthorization).mockResolvedValue();
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(authorization.name);
    await user.click(
      screen.getByRole("button", { name: "Cancelar autorização" }),
    );
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("histórico será preservado"),
    );
    await waitFor(() =>
      expect(cancelEventAuthorization).toHaveBeenCalledWith(authorization.id),
    );
    expect(
      await screen.findByText(/cancelada com sucesso/),
    ).toBeInTheDocument();
  });

  it("has no serious or critical automated accessibility violations", async () => {
    const { container } = renderPage();
    await screen.findByText(authorization.name);
    await expectNoSeriousAccessibilityViolations(container);
  });
});
