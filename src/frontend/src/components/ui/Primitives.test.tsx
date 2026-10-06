import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { expectNoSeriousAccessibilityViolations } from "../../test/accessibility";
import { Button } from "./Button";
import { Card } from "./Card";
import { TextArea, TextField } from "./TextField";
import { StatusBadge } from "./StatusBadge";

describe("semantic primitives", () => {
  it("preserves the consumer's semantics on a card without creating a landmark", () => {
    render(
      <Card role="status" aria-label="Resultado da consulta">
        Nenhum registro fictício.
      </Card>,
    );
    expect(
      screen.getByRole("status", { name: "Resultado da consulta" }),
    ).toHaveTextContent("Nenhum registro fictício.");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
  it("does not accidentally submit a form and preserves explicit submissions", async () => {
    const user = userEvent.setup();
    const submit = vi.fn((event) => event.preventDefault());
    render(
      <form onSubmit={submit}>
        <Button>Consultar</Button>
        <Button type="submit">Salvar</Button>
      </form>,
    );
    await user.click(screen.getByRole("button", { name: "Consultar" }));
    expect(submit).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(submit).toHaveBeenCalledOnce();
  });

  it("keeps disabled actions native, non-interactive and out of the tab order", async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    render(
      <>
        <Button disabled onClick={click}>
          Indisponível
        </Button>
        <Button variant="secondary">Voltar</Button>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Indisponível" }));
    await user.tab();
    expect(screen.getByRole("button", { name: "Voltar" })).toHaveFocus();
    expect(click).not.toHaveBeenCalled();
  });

  it("preserves field labels, descriptions, validation, refs and keyboard order", async () => {
    const user = userEvent.setup();
    const inputRef = createRef<HTMLInputElement>();
    const { container } = render(
      <form>
        <label htmlFor="plate">Placa fictícia</label>
        <TextField
          id="plate"
          ref={inputRef}
          aria-invalid="true"
          aria-describedby="plate-error"
        />
        <p id="plate-error">Confira a placa informada.</p>
        <label htmlFor="note">Observação</label>
        <TextArea id="note" />
        <Button type="submit">Salvar exemplo</Button>
      </form>,
    );
    await user.tab();
    expect(inputRef.current).toHaveFocus();
    expect(inputRef.current).toHaveAccessibleName("Placa fictícia");
    expect(inputRef.current).toHaveAccessibleDescription(
      "Confira a placa informada.",
    );
    expect(inputRef.current).toBeInvalid();
    await user.type(inputRef.current!, "ABC1D23");
    await user.tab();
    expect(screen.getByRole("textbox", { name: "Observação" })).toHaveFocus();
    await user.tab();
    expect(
      screen.getByRole("button", { name: "Salvar exemplo" }),
    ).toHaveFocus();
    await expectNoSeriousAccessibilityViolations(container);
  });

  it.each(["neutral", "success", "warning", "danger"] as const)(
    "keeps an explicit label in the %s badge",
    (tone) => {
      render(<StatusBadge label="Situação fictícia" tone={tone} />);
      expect(screen.getByText("Situação fictícia")).toBeVisible();
    },
  );
});
