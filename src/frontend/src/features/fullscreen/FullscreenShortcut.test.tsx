import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { createPortal } from "react-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ActionFeedback } from "../../components/ui/ActionFeedback";
import { mockFullscreen } from "../../test/fullscreen";
import { FullscreenControl } from "./FullscreenControl";
import { FullscreenShortcut } from "./FullscreenShortcut";
import { useFullscreen } from "./useFullscreen";

function Harness() {
  const fullscreen = useFullscreen();
  const [dialog, setDialog] = useState(false);
  const [feedback, setFeedback] = useState(false);
  return (
    <>
      <label>
        Rascunho fictício
        <input />
      </label>
      <button onClick={() => setDialog(true)}>Abrir diálogo</button>
      <button onClick={() => setFeedback(true)}>Mostrar retorno</button>
      <button onClick={() => setFeedback(false)}>Limpar retorno</button>
      <FullscreenControl fullscreen={fullscreen} showError={false} />
      {dialog &&
        createPortal(
          <div role="dialog" aria-label="Diálogo fictício">
            <button onClick={() => setDialog(false)}>Fechar diálogo</button>
          </div>,
          document.body,
        )}
      <ActionFeedback
        floating
        message={feedback ? "Retorno fictício" : null}
        tone="success"
      />
      <FullscreenShortcut fullscreen={fullscreen} />
    </>
  );
}

describe("persistent authenticated fullscreen shortcut (mocked API)", () => {
  let mock: ReturnType<typeof mockFullscreen>;
  beforeEach(() => {
    mock = mockFullscreen();
  });
  afterEach(() => {
    cleanup();
    mock.restore();
  });

  it("provides a named icon and synchronizes state with the menu and native exit", async () => {
    render(<Harness />);
    const user = userEvent.setup();
    const shortcut = screen.getByRole("button", { name: "Ativar tela cheia" });
    expect(shortcut).toHaveAttribute("title", "Entrar em tela cheia");
    expect(shortcut).toHaveAccessibleDescription(
      "Use toda a tela para trabalhar com mais espaço.",
    );
    expect(mock.request).not.toHaveBeenCalled();
    shortcut.focus();
    await user.keyboard("{Enter}");
    expect(mock.request).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("button", { name: "Desativar tela cheia" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Sair da tela cheia" }),
    ).toHaveAttribute("aria-pressed", "true");
    act(() => mock.change(null));
    expect(
      screen.getByRole("button", { name: "Ativar tela cheia" }),
    ).toHaveFocus();
  });

  it("does not cover a portal dialog and returns after it closes", async () => {
    render(<Harness />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Abrir diálogo" }));
    expect(
      screen.queryByRole("button", { name: "Ativar tela cheia" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fechar diálogo" }));
    expect(
      await screen.findByRole("button", { name: "Ativar tela cheia" }),
    ).toBeInTheDocument();
    expect(mock.request).not.toHaveBeenCalled();
  });

  it("gives floating feedback priority without losing the form draft", async () => {
    render(<Harness />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Rascunho fictício"), "Não apagar");
    await user.click(screen.getByRole("button", { name: "Mostrar retorno" }));
    expect(
      screen.queryByRole("button", { name: "Ativar tela cheia" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpar retorno" }));
    expect(
      await screen.findByRole("button", { name: "Ativar tela cheia" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Rascunho fictício")).toHaveValue(
      "Não apagar",
    );
  });

  it("keeps normal use without native support", () => {
    mock.disable();
    render(<Harness />);
    expect(
      screen.queryByRole("button", { name: "Ativar tela cheia" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Rascunho fictício")).toBeInTheDocument();
  });

  it("ignores a dialog hidden by its container", () => {
    const container = document.createElement("div");
    container.style.display = "none";
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    container.append(dialog);
    document.body.append(container);
    try {
      render(<Harness />);
      expect(
        screen.getByRole("button", { name: "Ativar tela cheia" }),
      ).toBeInTheDocument();
    } finally {
      container.remove();
    }
  });

  it("announces rejection once and permits only an explicit retry", async () => {
    mock.request.mockRejectedValueOnce(new Error("fictitious refusal"));
    render(<Harness />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Ativar tela cheia" }));
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível abrir a tela cheia",
    );
    expect(mock.request).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "Ativar tela cheia" }));
    expect(mock.request).toHaveBeenCalledTimes(2);
    expect(
      screen.getByRole("button", { name: "Desativar tela cheia" }),
    ).toBeInTheDocument();
  });
});
