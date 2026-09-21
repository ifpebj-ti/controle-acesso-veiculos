import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SelectField } from "./SelectField";

function Example() {
  const [value, setValue] = useState("");

  return (
    <div>
      <label htmlFor="example-select">Categoria fictícia</label>
      <SelectField
        className="min-h-12 w-full rounded-xl border border-ink/20 px-4"
        id="example-select"
        onValueChange={setValue}
        options={[
          { label: "Todas", value: "" },
          { label: "Visitante", value: "visitante" },
          { label: "Entrega", value: "entrega" },
        ]}
        value={value}
      />
      <output>{value || "sem filtro"}</output>
    </div>
  );
}

describe("SelectField", () => {
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
});
