import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { expectNoSeriousAccessibilityViolations } from "../../../test/accessibility";
import { selectFieldOption } from "../../../test/selectField";
import type {
  PreregistrationCatalogStatus,
  PreregistrationListItem,
} from "../model/preregistrationPresentation";
import { PreregistrationView } from "./PreregistrationView";

const people = [
  { key: "fixture-1", name: "Pessoa Aluna Fictícia", classification: "Aluno" },
  {
    key: "fixture-2",
    name: "Pessoa Federal Fictícia",
    classification: "Federal",
  },
] as const;

function renderView({
  onCreate = vi.fn(async () => {}),
  onSearch = vi.fn(),
  onRetry = vi.fn(),
  status = "ready" as PreregistrationCatalogStatus,
  items = people as readonly PreregistrationListItem[],
} = {}) {
  return {
    ...render(
      <main>
        <PreregistrationView
          items={items}
          onCreate={onCreate}
          onRetry={onRetry}
          onSearch={onSearch}
          status={status}
        />
      </main>,
    ),
    onCreate,
    onSearch,
    onRetry,
  };
}

async function openForm(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByRole("button", { name: "Novo pré-cadastro" });
  await user.click(trigger);
  return {
    trigger,
    form: screen.getByRole("region", { name: "Novo pré-cadastro" }),
  };
}

describe("PreregistrationView presentation candidate", () => {
  it("keeps distinct supplied records even when names match", () => {
    renderView({
      items: [
        { key: "fixture-1", name: "Pessoa Fictícia", classification: "Aluno" },
        {
          key: "fixture-2",
          name: "Pessoa Fictícia",
          classification: "Federal",
        },
      ],
    });
    expect(
      screen.getAllByRole("heading", { name: "Pessoa Fictícia" }),
    ).toHaveLength(2);
  });

  it("labels the preview and shows only the approved personal information", () => {
    renderView();
    expect(screen.getByText(/Prévia de interface #689/)).toBeInTheDocument();
    const list = screen.getByRole("list", { name: "Pessoas pré-cadastradas" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(
      screen.queryByLabelText(/senha|documento|placa|matrícula|e-mail/i),
    ).not.toBeInTheDocument();
  });

  it("validates required fields with announcements and focus, then returns focus on cancel", async () => {
    const user = userEvent.setup();
    const { onCreate } = renderView();
    const { trigger, form } = await openForm(user);
    const name = within(form).getByLabelText("Nome completo");
    const classification = within(form).getByRole("combobox", {
      name: "Classificação",
    });
    expect(name).toHaveFocus();
    await user.click(
      within(form).getByRole("button", { name: "Pré-cadastrar" }),
    );
    expect(name).toHaveFocus();
    expect(name).toHaveAccessibleDescription("Informe o nome completo.");
    expect(classification).toHaveAccessibleDescription(
      "Selecione a classificação.",
    );
    expect(within(form).getAllByRole("alert")).toHaveLength(2);
    await user.type(name, "Pessoa Fictícia");
    await user.click(
      within(form).getByRole("button", { name: "Pré-cadastrar" }),
    );
    expect(classification).toHaveFocus();
    expect(onCreate).not.toHaveBeenCalled();
    await user.click(within(form).getByRole("button", { name: "Cancelar" }));
    expect(
      screen.queryByRole("region", { name: "Novo pré-cadastro" }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it.each(["Aluno", "Terceirizado", "Federal"])(
    "passes the explicitly selected %s to its host without creating other fields",
    async (classification) => {
      const user = userEvent.setup();
      const { onCreate } = renderView();
      const { form, trigger } = await openForm(user);
      await user.type(
        within(form).getByLabelText("Nome completo"),
        " Pessoa Fictícia ",
      );
      await selectFieldOption(
        user,
        within(form).getByRole("combobox", { name: "Classificação" }),
        classification,
      );
      await user.click(
        within(form).getByRole("button", { name: "Pré-cadastrar" }),
      );
      await waitFor(() => expect(onCreate).toHaveBeenCalledOnce());
      expect(onCreate).toHaveBeenCalledWith({
        name: "Pessoa Fictícia",
        classification,
      });
      await waitFor(() => expect(trigger).toHaveFocus());
    },
  );

  it("preserves values and announces a generic error without exposing the rejected content", async () => {
    const user = userEvent.setup();
    const { onCreate } = renderView({
      onCreate: vi
        .fn()
        .mockRejectedValue(new Error("technical fixture detail")),
    });
    const { form } = await openForm(user);
    await user.type(
      within(form).getByLabelText("Nome completo"),
      "Pessoa Fictícia",
    );
    await selectFieldOption(
      user,
      within(form).getByRole("combobox", { name: "Classificação" }),
      "Federal",
    );
    await user.click(
      within(form).getByRole("button", { name: "Pré-cadastrar" }),
    );
    expect(await within(form).findByRole("alert")).toHaveTextContent(
      "Não foi possível concluir o pré-cadastro. Os campos foram mantidos.",
    );
    expect(within(form).getByLabelText("Nome completo")).toHaveValue(
      "Pessoa Fictícia",
    );
    expect(
      within(form).getByRole("combobox", { name: "Classificação" }),
    ).toHaveTextContent("Federal");
    expect(
      screen.queryByText("technical fixture detail"),
    ).not.toBeInTheDocument();
    expect(onCreate).toHaveBeenCalledOnce();
  });

  it("does not start concurrent submissions or close while its callback is pending", async () => {
    let resolve!: () => void;
    const onCreate = vi.fn(
      () =>
        new Promise<void>((complete) => {
          resolve = complete;
        }),
    );
    const user = userEvent.setup();
    renderView({ onCreate });
    const { form } = await openForm(user);
    await user.type(
      within(form).getByLabelText("Nome completo"),
      "Pessoa Fictícia",
    );
    await selectFieldOption(
      user,
      within(form).getByRole("combobox", { name: "Classificação" }),
      "Aluno",
    );
    const formElement = form.querySelector("form")!;
    fireEvent.submit(formElement);
    fireEvent.submit(formElement);
    expect(onCreate).toHaveBeenCalledOnce();
    expect(
      within(form).getByRole("button", { name: "Cancelar" }),
    ).toBeDisabled();
    expect(within(form).getByLabelText("Nome completo")).toBeDisabled();
    await act(async () => {
      resolve();
    });
    expect(
      screen.queryByRole("region", { name: "Novo pré-cadastro" }),
    ).not.toBeInTheDocument();
  });

  it("applies and clears explicit filters without treating matching names as duplicates", async () => {
    const user = userEvent.setup();
    const { onSearch } = renderView();
    await user.type(
      screen.getByRole("searchbox", { name: "Nome completo" }),
      " Fictícia ",
    );
    await selectFieldOption(
      user,
      screen.getByRole("combobox", { name: "Classificação" }),
      "Terceirizado",
    );
    expect(onSearch).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(onSearch).toHaveBeenLastCalledWith({
      name: "Fictícia",
      classification: "Terceirizado",
    });
    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(onSearch).toHaveBeenLastCalledWith({ name: "", classification: "" });
    expect(
      screen.getByRole("searchbox", { name: "Nome completo" }),
    ).toHaveValue("");
    expect(
      screen.getByRole("combobox", { name: "Classificação" }),
    ).toHaveTextContent("Todas");
  });

  it("announces loading, prevents repeated searches and does not show stale results", () => {
    const { onSearch } = renderView({ status: "loading" });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Consultando pré-cadastros",
    );
    expect(screen.queryByText(people[0].name)).not.toBeInTheDocument();
    const apply = screen.getByRole("button", { name: "Aplicar filtros" });
    expect(apply).toBeDisabled();
    fireEvent.submit(apply.closest("form")!);
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("offers a read retry for a catalog error without submitting a registration", async () => {
    const user = userEvent.setup();
    const { onRetry, onCreate } = renderView({ status: "error" });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Consulta indisponível",
    );
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("hides the form, controls and records for the supplied denied state", () => {
    renderView({ status: "denied" });
    expect(screen.getByRole("alert")).toHaveTextContent("Acesso não permitido");
    expect(
      screen.queryByRole("button", { name: "Novo pré-cadastro" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByText(people[0].name)).not.toBeInTheDocument();
  });

  it("renders a clear empty state", () => {
    renderView({ items: [] });
    expect(
      screen.getByRole("heading", { name: "Nenhuma pessoa encontrada" }),
    ).toBeInTheDocument();
  });

  it("has no serious automated accessibility violations in the catalog and form", async () => {
    const user = userEvent.setup();
    const { container } = renderView();
    await expectNoSeriousAccessibilityViolations(container);
    await openForm(user);
    await expectNoSeriousAccessibilityViolations(container);
  });
});
