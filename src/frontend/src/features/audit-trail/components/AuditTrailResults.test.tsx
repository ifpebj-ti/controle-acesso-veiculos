import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoSeriousAccessibilityViolations } from "../../../test/accessibility";
import type { AuditEntry, AuditTrailPage } from "../types";
import { AuditTrailResults } from "./AuditTrailResults";

const entry: AuditEntry = {
  action: "Alteracao",
  actorType: "Human",
  actorUserId: 1,
  details:
    "Administrator changed the account profile and authentication boundary.",
  entity: "Usuario",
  id: 11,
  recordId: 2,
  occurredAtUtc: "2030-06-10T11:00:00Z",
  previousState: { profileName: "Porteiro", authenticationMethod: "Google" },
  newState: {
    profileName: "Vigilante",
    reason: "Justificativa fictícia",
    unknown: { keep: "Valor futuro" },
  },
};
const page: AuditTrailPage = {
  items: [entry],
  page: 1,
  pageSize: 25,
  totalCount: 1,
  totalPages: 1,
};

function show(item = entry) {
  return render(
    <AuditTrailResults
      onPageChange={vi.fn()}
      page={{ ...page, items: [item] }}
      status="ready"
    />,
  );
}

describe("AuditTrailResults", () => {
  it("shows a Portuguese summary and keeps canonical details in an explicit disclosure", async () => {
    show();
    expect(screen.getByText("Alteração de perfil registrada.")).toBeVisible();
    expect(screen.getByText(entry.details!)).not.toBeVisible();
    const user = userEvent.setup();
    await user.click(screen.getByText("Detalhes técnicos originais"));
    expect(screen.getByText(entry.details!)).toBeVisible();
    expect(screen.getByText("Usuario", { exact: true })).toBeVisible();
    expect(screen.getByText("Usuário #1")).toBeVisible();
    expect(screen.getByText("#11", { exact: true })).toBeVisible();
    expect(document.querySelector("time")).toHaveAttribute(
      "dateTime",
      entry.occurredAtUtc,
    );
  });

  it("keeps free reasons and unknown data accessible alongside readable state fields", async () => {
    show();
    const user = userEvent.setup();
    await user.click(screen.getByText("Novo estado", { exact: true }));
    expect(screen.getByText("Justificativa")).toBeVisible();
    expect(screen.getByText("Justificativa fictícia")).toBeVisible();
    await user.click(
      screen.getByText("Dados originais — novo estado", { exact: true }),
    );
    const raw = screen.getByLabelText("Dados originais — novo estado");
    expect(raw).toBeVisible();
    expect(raw.textContent).toBe(JSON.stringify(entry.newState, null, 2));
    expect(raw).toHaveAttribute("tabindex", "0");
  });

  it("uses neutral text for an unknown entity and preserves hostile/long content as text", async () => {
    const unsafe = '<img src=x onerror="alert(1)">';
    const value = { unknown: "X".repeat(2000), note: unsafe };
    show({
      ...entry,
      entity: "FutureEntity",
      details: unsafe,
      previousState: ["future", 0, false],
      newState: value,
    });
    expect(screen.getByText("Alteração registrada.")).toBeVisible();
    const user = userEvent.setup();
    await user.click(screen.getByText("Detalhes técnicos originais"));
    expect(screen.getByText(unsafe)).toBeVisible();
    await user.click(screen.getByText("Novo estado", { exact: true }));
    expect(
      within(
        screen.getByText("Novo estado", { exact: true }).closest("details")!,
      ).getByText("Conteúdo disponível nos dados originais."),
    ).toBeVisible();
    await user.click(
      screen.getByText("Dados originais — novo estado", { exact: true }),
    );
    expect(
      screen.getByLabelText("Dados originais — novo estado").textContent,
    ).toBe(JSON.stringify(value, null, 2));
    expect(document.querySelector("img[src='x']")).toBeNull();
  });

  it("keeps disclosures in Tab order and preserves focus on activation", async () => {
    show();
    const user = userEvent.setup();
    const technical = screen.getByText("Detalhes técnicos originais");
    await user.tab();
    expect(technical).toHaveFocus();
    // Native summary keyboard activation is checked in the real-browser run;
    // jsdom 30 does not implement that browser default action.
    await user.click(technical);
    expect(technical.closest("details")).toHaveAttribute("open");
    expect(technical).toHaveFocus();
    await user.click(technical);
    expect(technical.closest("details")).not.toHaveAttribute("open");
    await user.tab();
    expect(screen.getByText("Estado anterior", { exact: true })).toHaveFocus();
    await user.click(screen.getByText("Estado anterior", { exact: true }));
    expect(screen.getByText("Porteiro")).toBeVisible();
  });

  it("preserves null states and system authorship", async () => {
    show({
      ...entry,
      actorType: "System",
      actorUserId: null,
      previousState: null,
      newState: null,
      details: null,
    });
    expect(screen.getByText("Sistema")).toBeVisible();
    await userEvent.click(screen.getByText("Estado anterior", { exact: true }));
    const state = screen
      .getByText("Estado anterior", { exact: true })
      .closest("details")!;
    expect(within(state).getByText("Não informado")).toBeVisible();
  });

  it("preserves pagination and read states without presenting failure as empty", async () => {
    const next = vi.fn();
    const { rerender } = render(
      <AuditTrailResults
        page={{ ...page, totalPages: 2, totalCount: 26 }}
        status="ready"
        onPageChange={next}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));
    expect(next).toHaveBeenCalledExactlyOnceWith(2);
    rerender(
      <AuditTrailResults page={null} status="loading" onPageChange={next} />,
    );
    expect(screen.getByText("Carregando eventos de auditoria…")).toBeVisible();
    for (const status of ["error", "denied"] as const) {
      rerender(
        <AuditTrailResults page={null} status={status} onPageChange={next} />,
      );
      expect(
        screen.queryByText("Nenhum evento encontrado"),
      ).not.toBeInTheDocument();
    }
    rerender(
      <AuditTrailResults
        page={{ ...page, items: [], totalCount: 0, totalPages: 0 }}
        status="ready"
        onPageChange={next}
      />,
    );
    expect(screen.getByText("Nenhum evento encontrado")).toBeVisible();
  });

  it("has no serious automated accessibility violations with expanded states", async () => {
    const { container } = show();
    await userEvent.click(screen.getByText("Novo estado", { exact: true }));
    await userEvent.click(
      screen.getByText("Dados originais — novo estado", { exact: true }),
    );
    await expectNoSeriousAccessibilityViolations(container);
  });
});
