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
const people: readonly PreregistrationListItem[] = [
  {
    personId: 1,
    vehicleId: 2,
    name: "Pessoa Aluna Fictícia",
    affiliation: "Aluno",
    plate: "ABC1D23",
    vehicleType: "Automóvel",
    active: true,
    verifiedAtUtc: "2026-11-12T12:00:00Z",
  },
  {
    personId: 3,
    vehicleId: 4,
    name: "Pessoa Federal Fictícia",
    affiliation: "Federal",
    plate: "DEF4G56",
    vehicleType: "Motocicleta",
    active: true,
    verifiedAtUtc: "2026-11-12T12:00:00Z",
  },
];
function renderView({
  onCreate = vi.fn(async () => true),
  onSearch = vi.fn(),
  onRetry = vi.fn(),
  status = "ready" as PreregistrationCatalogStatus,
  items = people,
  possibleDuplicate = false,
} = {}) {
  return {
    ...render(
      <main>
        <PreregistrationView
          items={items}
          onCreate={onCreate}
          onRetry={onRetry}
          onSearch={onSearch}
          possibleDuplicate={possibleDuplicate}
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
async function fillVehicleAndBirth(
  user: ReturnType<typeof userEvent.setup>,
  form: HTMLElement,
) {
  fireEvent.change(within(form).getByLabelText("Data de nascimento"), {
    target: { value: "2000-01-01" },
  });
  await user.click(
    within(form).getByRole("checkbox", {
      name: /Conferi a data de nascimento/,
    }),
  );
  await user.type(within(form).getByLabelText("Placa do veículo"), "ABC-1D23");
  await selectFieldOption(
    user,
    within(form).getByRole("combobox", { name: "Tipo do veículo" }),
    "Automóvel",
  );
}
describe("PreregistrationView published registry contract", () => {
  it("requires conscious homonym confirmation and clears consent when the form changes", async () => {
    const user = userEvent.setup();
    const { onCreate } = renderView({ possibleDuplicate: true });
    const { form } = await openForm(user);
    await user.type(
      within(form).getByLabelText("Nome completo"),
      "Pessoa Fictícia",
    );
    await selectFieldOption(
      user,
      within(form).getByRole("combobox", { name: "Vínculo" }),
      "Federal",
    );
    await fillVehicleAndBirth(user, form);
    const confirmation = within(form).getByRole("checkbox", {
      name: /Conferi o cadastro existente/,
    });
    await user.click(
      within(form).getByRole("button", { name: "Pré-cadastrar" }),
    );
    expect(onCreate).not.toHaveBeenCalled();
    await user.click(confirmation);
    await user.type(within(form).getByLabelText("Nome completo"), " Homônimo");
    expect(confirmation).not.toBeChecked();
    await user.click(confirmation);
    await user.click(
      within(form).getByRole("button", { name: "Pré-cadastrar" }),
    );
    await waitFor(() => expect(onCreate).toHaveBeenCalledOnce());
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmPossibleDuplicate: true,
        affiliation: "Federal",
      }),
    );
  });
  it("keeps distinct supplied records even when names match", () => {
    renderView({
      items: people.map((p) => ({ ...p, name: "Pessoa Fictícia" })),
    });
    expect(
      screen.getAllByRole("heading", { name: "Pessoa Fictícia" }),
    ).toHaveLength(2);
  });
  it("shows only operational listing fields, not birth dates or documents", () => {
    renderView();
    expect(screen.queryByText(/Prévia de interface/)).not.toBeInTheDocument();
    const list = screen.getByRole("list", {
      name: "Condutores pré-cadastrados",
    });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText(/Servidor federal/)).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/senha|documento|matrícula|e-mail/i),
    ).not.toBeInTheDocument();
  });
  it("validates required fields with announcements and focus, then returns focus on cancel", async () => {
    const user = userEvent.setup();
    const { onCreate } = renderView();
    const { trigger, form } = await openForm(user);
    const name = within(form).getByLabelText("Nome completo"),
      affiliation = within(form).getByRole("combobox", { name: "Vínculo" });
    expect(name).toHaveFocus();
    await user.click(
      within(form).getByRole("button", { name: "Pré-cadastrar" }),
    );
    await waitFor(() => expect(name).toHaveFocus());
    expect(name).toHaveAccessibleDescription("Informe o nome completo.");
    expect(affiliation).toHaveAccessibleDescription("Selecione o vínculo.");
    expect(within(form).getAllByRole("alert")).toHaveLength(6);
    await user.type(name, "Pessoa Fictícia");
    await user.click(
      within(form).getByRole("button", { name: "Pré-cadastrar" }),
    );
    await waitFor(() => expect(affiliation).toHaveFocus());
    expect(onCreate).not.toHaveBeenCalled();
    await user.click(within(form).getByRole("button", { name: "Cancelar" }));
    expect(
      screen.queryByRole("region", { name: "Novo pré-cadastro" }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
  it.each(["Aluno", "Terceirizado", "Federal"])(
    "passes explicitly selected %s and the exact published fields to the host",
    async (affiliation) => {
      const user = userEvent.setup();
      const { onCreate } = renderView();
      const { form, trigger } = await openForm(user);
      await user.type(
        within(form).getByLabelText("Nome completo"),
        " Pessoa Fictícia ",
      );
      await selectFieldOption(
        user,
        within(form).getByRole("combobox", { name: "Vínculo" }),
        affiliation,
      );
      await fillVehicleAndBirth(user, form);
      expect(
        within(form).queryByRole("checkbox", { name: /outra pessoa/ }),
      ).not.toBeInTheDocument();
      await user.click(
        within(form).getByRole("button", { name: "Pré-cadastrar" }),
      );
      await waitFor(() => expect(onCreate).toHaveBeenCalledOnce());
      expect(onCreate).toHaveBeenCalledWith({
        name: "Pessoa Fictícia",
        affiliation,
        birthDate: "2000-01-01",
        birthDateConfirmed: true,
        plate: "ABC1D23",
        vehicleType: "Automóvel",
        confirmPossibleDuplicate: false,
      });
      await waitFor(() => expect(trigger).toHaveFocus());
    },
  );
  it("preserves values and announces a generic error without exposing rejected technical content", async () => {
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
      within(form).getByRole("combobox", { name: "Vínculo" }),
      "Federal",
    );
    await fillVehicleAndBirth(user, form);
    await user.click(
      within(form).getByRole("button", { name: "Pré-cadastrar" }),
    );
    expect(await within(form).findByRole("alert")).toHaveTextContent(
      "Não foi possível concluir o pré-cadastro. Os campos foram mantidos.",
    );
    expect(within(form).getByLabelText("Nome completo")).toHaveValue(
      "Pessoa Fictícia",
    );
    expect(within(form).getByLabelText("Data de nascimento")).toHaveValue(
      "2000-01-01",
    );
    expect(
      within(form).getByRole("combobox", { name: "Vínculo" }),
    ).toHaveTextContent("Servidor federal");
    expect(
      screen.queryByText("technical fixture detail"),
    ).not.toBeInTheDocument();
    expect(onCreate).toHaveBeenCalledOnce();
  });
  it("does not start concurrent submissions or close while its callback is pending", async () => {
    let resolve!: (value: boolean) => void;
    const onCreate = vi.fn(
      () =>
        new Promise<boolean>((complete) => {
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
      within(form).getByRole("combobox", { name: "Vínculo" }),
      "Aluno",
    );
    await fillVehicleAndBirth(user, form);
    const element = form.querySelector("form")!;
    fireEvent.submit(element);
    fireEvent.submit(element);
    expect(onCreate).toHaveBeenCalledOnce();
    expect(
      within(form).getByRole("button", { name: "Cancelar" }),
    ).toBeDisabled();
    expect(within(form).getByLabelText("Nome completo")).toBeDisabled();
    await act(async () => {
      resolve(true);
    });
    expect(
      screen.queryByRole("region", { name: "Novo pré-cadastro" }),
    ).not.toBeInTheDocument();
  });
  it("applies and clears explicit filters without guessing a classification query unsupported by the API", async () => {
    const user = userEvent.setup();
    const { onSearch } = renderView();
    await user.type(
      screen.getByRole("searchbox", { name: "Nome ou placa" }),
      " Fictícia ",
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Incluir inativos" }),
    );
    expect(onSearch).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(onSearch).toHaveBeenLastCalledWith({
      query: "Fictícia",
      includeInactive: true,
    });
    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(onSearch).toHaveBeenLastCalledWith({
      query: "",
      includeInactive: false,
    });
    expect(
      screen.getByRole("searchbox", { name: "Nome ou placa" }),
    ).toHaveValue("");
    expect(
      screen.getByRole("checkbox", { name: "Incluir inativos" }),
    ).not.toBeChecked();
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
