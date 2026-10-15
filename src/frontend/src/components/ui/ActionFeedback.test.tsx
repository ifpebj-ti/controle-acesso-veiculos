import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ActionFeedback } from "./ActionFeedback";

describe("ActionFeedback", () => {
  it("announces a persistent error without relying on color", () => {
    render(
      <ActionFeedback
        message="Revise os campos destacados e tente novamente."
        tone="error"
      />,
    );

    const feedback = screen.getByRole("alert");
    expect(feedback).toHaveAttribute("aria-live", "assertive");
    expect(feedback).toHaveAttribute("aria-atomic", "true");
    expect(feedback).toHaveTextContent(
      "Revise os campos destacados e tente novamente.",
    );
  });

  it("focuses a success whose action control was removed and supports dismissal", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(
      <ActionFeedback
        floating
        focusOnChange
        message="Cadastro concluído com sucesso."
        onDismiss={onDismiss}
        tone="success"
      />,
    );

    const feedback = screen.getByRole("status");
    expect(feedback).toHaveFocus();
    expect(feedback).toHaveAttribute("aria-live", "polite");
    expect(feedback).toHaveClass("fixed");
    await user.click(screen.getByRole("button", { name: "Fechar mensagem" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
