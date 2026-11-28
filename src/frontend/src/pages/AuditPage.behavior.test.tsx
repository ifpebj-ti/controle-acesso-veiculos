import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedSession } from "../features/authentication";
import { searchAuditTrail, type AuditTrailPage } from "../features/audit-trail";
import {
  describeApiError,
  getApiValidationErrors,
} from "../services/api-errors";
import { expectNoSeriousAccessibilityViolations } from "../test/accessibility";
import { selectFieldOption } from "../test/selectField";
import { AuditPage } from "./AuditPage";
vi.mock("../features/authentication", () => ({
  useAuthenticatedSession: vi.fn(),
}));
vi.mock("../features/audit-trail/services/auditTrailService", () => ({
  searchAuditTrail: vi.fn(),
}));
vi.mock("../services/api-errors", () => ({
  describeApiError: vi.fn(),
  getApiValidationErrors: vi.fn(),
}));

const auditPage: AuditTrailPage = {
  items: [
    {
      action: "Alteracao",
      actorType: "Human",
      actorUserId: 1,
      details: "Conta fictícia desativada.",
      entity: "Usuario",
      id: 31,
      newState: { active: false },
      occurredAtUtc: "2030-06-10T11:00:00Z",
      previousState: { active: true },
      recordId: 8,
    },
  ],
  page: 1,
  pageSize: 25,
  totalCount: 1,
  totalPages: 1,
};

function renderAuditPage() {
  vi.mocked(useAuthenticatedSession).mockReturnValue({
    user: { id: 1, profileName: "Administrador" },
  } as ReturnType<typeof useAuthenticatedSession>);
  return render(
    <MemoryRouter>
      <AuditPage />
    </MemoryRouter>,
  );
}
describe("dedicated audit page behavior migrated from administration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchAuditTrail).mockResolvedValue(auditPage);
    vi.mocked(describeApiError).mockReturnValue({
      kind: "network",
      message: "Não foi possível consultar a auditoria.",
    });
    vi.mocked(getApiValidationErrors).mockReturnValue({});
  });

  it("loads the dedicated audit page without account management", async () => {
    renderAuditPage();

    expect(
      await screen.findByRole("heading", { name: "Alteração" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Usuário #1")).toBeInTheDocument();
    expect(searchAuditTrail).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: "Nova conta" }),
    ).not.toBeInTheDocument();

    const auditSummary = screen.getByRole("region", {
      name: "Resumo da trilha de auditoria",
    });
    expect(
      within(auditSummary).getByText("Total de registros").nextSibling,
    ).toHaveTextContent("1");
    expect(
      within(auditSummary).getByText("Alterações").nextSibling,
    ).toHaveTextContent("1");
    expect(
      within(auditSummary).getByText("Logins").nextSibling,
    ).toHaveTextContent("0");
  });
  it("keeps valid audit results when a local period is invalid", async () => {
    const user = userEvent.setup();
    renderAuditPage();
    await screen.findByRole("heading", { name: "Alteração" });
    const from = screen.getByLabelText("Início do período");
    const to = screen.getByLabelText("Fim do período");
    await user.clear(from);
    await user.type(from, "2030-06-11T08:00");
    await user.clear(to);
    await user.type(to, "2030-06-10T08:00");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    const error = screen.getByText(/O início deve ser anterior ao fim/);
    expect(from).toHaveAttribute("aria-invalid", "true");
    expect(from).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining(error.id),
    );
    expect(
      screen.getByRole("heading", { name: "Alteração" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Tentar novamente" }),
    ).not.toBeInTheDocument();
    expect(searchAuditTrail).toHaveBeenCalledTimes(1);
  });
  it("associates API validation errors and clears them after correction", async () => {
    vi.mocked(searchAuditTrail)
      .mockResolvedValueOnce(auditPage)
      .mockRejectedValueOnce(new Error("validation"));
    vi.mocked(describeApiError).mockReturnValue({
      kind: "validation",
      message: "Revise os filtros.",
      status: 400,
    });
    vi.mocked(getApiValidationErrors).mockReturnValue({
      entity: "A entidade informada é inválida.",
    });
    const user = userEvent.setup();
    renderAuditPage();
    await screen.findByRole("heading", { name: "Alteração" });
    const entity = screen.getByLabelText("Entidade");
    await user.type(entity, "Invalida");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    const error = await screen.findByText("A entidade informada é inválida.");
    expect(entity).toHaveAttribute("aria-invalid", "true");
    expect(entity).toHaveAttribute("aria-describedby", error.id);
    expect(
      screen.getByRole("heading", { name: "Alteração" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Tentar novamente" }),
    ).not.toBeInTheDocument();

    await user.type(entity, " corrigida");
    expect(error).not.toBeInTheDocument();
    expect(entity).toHaveAttribute("aria-invalid", "false");
  });
  it("clears stale audit results after a real failure and retries the query", async () => {
    vi.mocked(searchAuditTrail)
      .mockResolvedValueOnce(auditPage)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(auditPage);
    const user = userEvent.setup();
    renderAuditPage();
    await screen.findByRole("heading", { name: "Alteração" });
    await user.type(screen.getByLabelText("Entidade"), "Usuario");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível consultar a auditoria.",
    );
    expect(
      screen.queryByRole("heading", { name: "Alteração" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/0 evento/)).not.toBeInTheDocument();
    expect(
      screen.queryByText("Nenhum evento encontrado"),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(
      await screen.findByRole("heading", { name: "Alteração" }),
    ).toBeInTheDocument();
    expect(searchAuditTrail).toHaveBeenCalledTimes(3);
  });
  it("renders audit states as text and preserves applied filters on pagination", async () => {
    const unsafeValue = '<img src=x onerror="alert(1)">';
    vi.mocked(searchAuditTrail).mockResolvedValue({
      ...auditPage,
      items: [
        {
          ...auditPage.items[0],
          details: unsafeValue,
          newState: { note: unsafeValue },
        },
      ],
      totalCount: 26,
      totalPages: 2,
    });
    const user = userEvent.setup();
    renderAuditPage();
    await screen.findByText(unsafeValue);
    expect(document.querySelector("img[src='x']")).toBeNull();
    await user.type(screen.getByLabelText("Entidade"), "Usuario");
    await selectFieldOption(user, screen.getByLabelText("Ação"), "Alteracao");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() => expect(searchAuditTrail).toHaveBeenCalledTimes(2));
    await user.click(screen.getByRole("button", { name: "Próxima" }));

    await waitFor(() =>
      expect(searchAuditTrail).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: "Alteracao",
          entity: "Usuario",
          page: 2,
        }),
      ),
    );
  });
  it("shows the empty state only after a successful audit response", async () => {
    vi.mocked(searchAuditTrail).mockResolvedValue({
      ...auditPage,
      items: [],
      totalCount: 0,
      totalPages: 0,
    });
    renderAuditPage();

    expect(
      await screen.findByRole("heading", { name: "Nenhum evento encontrado" }),
    ).toBeInTheDocument();
    expect(screen.getByText("0 evento(s) encontrado(s)")).toBeInTheDocument();
  });
  it("presents the API access barrier without audit data", async () => {
    vi.mocked(searchAuditTrail).mockRejectedValue(new Error("forbidden"));
    vi.mocked(describeApiError).mockReturnValue({
      kind: "access-denied",
      message: "Seu perfil não possui permissão para consultar a auditoria.",
      status: 403,
    });
    renderAuditPage();

    expect(
      await screen.findByRole("heading", { name: "Acesso negado" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Alteração" }),
    ).not.toBeInTheDocument();
  });
  it("has no serious automated accessibility violations in the audit area", async () => {
    const { container } = renderAuditPage();
    await screen.findByRole("heading", { name: "Alteração" });

    await expectNoSeriousAccessibilityViolations(container);
  });
});
