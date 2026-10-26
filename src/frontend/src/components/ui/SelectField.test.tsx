import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { expectNoSeriousAccessibilityViolations } from "../../test/accessibility";
import { SelectField } from "./SelectField";

function Example({ onSubmit = vi.fn() }: { onSubmit?: () => void }) {
  const [value, setValue] = useState("");

  return (
    <form onSubmit={onSubmit}>
      <button type="button">Anterior</button>
      <label htmlFor="example-select">Categoria fictícia</label>
      <SelectField
        className="min-h-12 w-full rounded-xl border border-ink/20 px-4"
        id="example-select"
        onValueChange={setValue}
        options={[
          { label: "Todas", value: "" },
          { label: "Visitante", value: "visitante" },
          {
            disabled: true,
            label: "Prestador indisponível",
            value: "prestador",
          },
          { label: "Entrega", value: "entrega" },
        ]}
        value={value}
      />
      <button type="button">Próximo</button>
      <button type="submit">Enviar</button>
      <output>{value || "sem filtro"}</output>
    </form>
  );
}

describe("SelectField", () => {
  it("keeps a disabled field associated with its label and does not open", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <>
        <label htmlFor="disabled-select">Categoria indisponível</label>
        <SelectField
          id="disabled-select"
          disabled
          onValueChange={change}
          options={[{ label: "Todas", value: "" }]}
          value=""
        />
      </>,
    );
    const trigger = screen.getByRole("combobox", {
      name: "Categoria indisponível",
    });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(change).not.toHaveBeenCalled();
  });

  it("opens a branded listbox and selects the highlighted option by keyboard", async () => {
    const user = userEvent.setup();
    render(<Example />);

    const trigger = screen.getByRole("combobox", {
      name: "Categoria fictícia",
    });
    await user.click(trigger);

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{ArrowDown}{Enter}");

    expect(trigger).toHaveTextContent("Visitante");
    expect(screen.getByText("visitante", { selector: "output" })).toBeVisible();
  });

  it.each(["{Enter}", " "])("opens with %s", async (key) => {
    const user = userEvent.setup();
    render(<Example />);

    const trigger = screen.getByRole("combobox", {
      name: "Categoria fictícia",
    });
    trigger.focus();
    await user.keyboard(key);

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("navigates with Home and End without selecting a disabled option", async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(
      screen.getByRole("combobox", { name: "Categoria fictícia" }),
    );
    await user.keyboard("{End}{Enter}");
    expect(screen.getByRole("combobox")).toHaveTextContent("Entrega");

    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{Home}{ArrowDown}{ArrowDown}{Enter}");
    expect(screen.getByRole("combobox")).toHaveTextContent("Entrega");
  });

  it("locates an option by typed characters", async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(
      screen.getByRole("combobox", { name: "Categoria fictícia" }),
    );
    await user.keyboard("ent{Enter}");

    expect(screen.getByRole("combobox")).toHaveTextContent("Entrega");
  });

  it.each([
    { key: "{Tab}", target: "Próximo" },
    { key: "{Shift>}{Tab}{/Shift}", target: "Anterior" },
  ])("closes with $key and moves focus to $target", async ({ key, target }) => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(
      screen.getByRole("combobox", { name: "Categoria fictícia" }),
    );
    await user.keyboard(key);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: target })).toHaveFocus();
    expect(screen.getByRole("combobox")).toHaveTextContent("Todas");
  });

  it("closes on an outside interaction without changing the value", async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(
      screen.getByRole("combobox", { name: "Categoria fictícia" }),
    );
    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("Todas");
  });

  it("does not submit its form while opening or selecting", async () => {
    const user = userEvent.setup();
    const submit = vi.fn((event?: Event) => event?.preventDefault());
    render(<Example onSubmit={submit} />);

    const trigger = screen.getByRole("combobox", {
      name: "Categoria fictícia",
    });
    trigger.focus();
    await user.keyboard("{Enter}{ArrowDown}{Enter}");

    expect(submit).not.toHaveBeenCalled();
    expect(trigger).toHaveTextContent("Visitante");
  });

  it("closes with Escape and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Example />);

    const trigger = screen.getByRole("combobox", {
      name: "Categoria fictícia",
    });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("has no serious accessibility violations while open", async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(
      screen.getByRole("combobox", { name: "Categoria fictícia" }),
    );

    await expectNoSeriousAccessibilityViolations(document.body);
  });
});
