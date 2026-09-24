import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { expectNoSeriousAccessibilityViolations } from "../../test/accessibility";
import { useConfirmation } from "./confirmationContext";
import { ConfirmationProvider } from "./ConfirmationProvider";

function ConfirmationHarness({ onConfirm }: { onConfirm: () => void }) {
  const requestConfirmation = useConfirmation();

  async function openDialog() {
    const confirmed = await requestConfirmation({
      confirmLabel: "Desativar item",
      description:
        "O item fictício deixará a lista ativa. O histórico será preservado.",
      eyebrow: "Catálogo de teste",
      title: "Desativar item?",
      tone: "danger",
    });
    if (confirmed) onConfirm();
  }

  return (
    <button onClick={() => void openDialog()} type="button">
      Abrir confirmação
    </button>
  );
}

function renderHarness(onConfirm = vi.fn()) {
  const view = render(
    <ConfirmationProvider>
      <ConfirmationHarness onConfirm={onConfirm} />
    </ConfirmationProvider>,
  );
  return { ...view, onConfirm };
}

describe("ConfirmationProvider", () => {
  it("presents an accessible dialog with the safe option focused", async () => {
    const user = userEvent.setup();
    const { container } = renderHarness();
    await user.click(screen.getByRole("button", { name: "Abrir confirmação" }));

    const dialog = screen.getByRole("alertdialog", {
      name: "Desativar item?",
    });
    expect(dialog).toHaveAccessibleDescription(
      "O item fictício deixará a lista ativa. O histórico será preservado.",
    );
    expect(
      within(dialog).getByRole("button", { name: "Manter como está" }),
    ).toHaveFocus();
    await expectNoSeriousAccessibilityViolations(container);
  });

  it("traps Tab in both directions and cancels with Escape", async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderHarness();
    const trigger = screen.getByRole("button", { name: "Abrir confirmação" });
    await user.click(trigger);
    const dialog = screen.getByRole("alertdialog");
    const cancel = within(dialog).getByRole("button", {
      name: "Manter como está",
    });
    const confirm = within(dialog).getByRole("button", {
      name: "Desativar item",
    });

    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("confirms once and restores focus even after repeated activation", async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderHarness();
    const trigger = screen.getByRole("button", { name: "Abrir confirmação" });
    await user.dblClick(trigger);

    expect(screen.getAllByRole("alertdialog")).toHaveLength(1);
    const confirm = within(screen.getByRole("alertdialog")).getByRole(
      "button",
      { name: "Desativar item" },
    );
    await user.dblClick(confirm);

    await waitFor(() => expect(onConfirm).toHaveBeenCalledOnce());
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
