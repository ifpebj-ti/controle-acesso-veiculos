import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { expectNoSeriousAccessibilityViolations } from "../../test/accessibility";
import { mockFullscreen } from "../../test/fullscreen";
import { FullscreenControl } from "./FullscreenControl";
import { useFullscreen } from "./useFullscreen";

function Harness() {
  const fullscreen = useFullscreen();
  return (
    <>
      <FullscreenControl fullscreen={fullscreen} />
      <label>
        Rascunho fictício
        <input />
      </label>
    </>
  );
}
describe("optional fullscreen controller (mocked API)", () => {
  let mock: ReturnType<typeof mockFullscreen>;
  beforeEach(() => {
    mock = mockFullscreen();
  });
  afterEach(() => {
    cleanup();
    mock.restore();
  });

  it.each(["disabled", "request absent", "exit absent"])(
    "keeps normal use when API is %s",
    async (mode) => {
      if (mode === "disabled") mock.disable();
      if (mode === "request absent")
        Object.defineProperty(document.documentElement, "requestFullscreen", {
          configurable: true,
          value: undefined,
        });
      if (mode === "exit absent")
        Object.defineProperty(document, "exitFullscreen", {
          configurable: true,
          value: undefined,
        });
      const user = userEvent.setup();
      render(<Harness />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      await user.type(screen.getByLabelText("Rascunho fictício"), "Preservado");
      expect(screen.getByLabelText("Rascunho fictício")).toHaveValue(
        "Preservado",
      );
      expect(mock.request).not.toHaveBeenCalled();
    },
  );
  it("never requests automatically, uses the document root and retains form values/focus", async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <StrictMode>
        <Harness />
      </StrictMode>,
    );
    await user.type(screen.getByLabelText("Rascunho fictício"), "Não apagar");
    rerender(
      <StrictMode>
        <Harness />
      </StrictMode>,
    );
    expect(mock.request).not.toHaveBeenCalled();
    const enter = screen.getByRole("button", { name: "Entrar em tela cheia" });
    expect(enter).toHaveAccessibleDescription(
      "Use toda a tela para trabalhar com mais espaço.",
    );
    enter.focus();
    await user.keyboard("{Enter}");
    const exit = await screen.findByRole("button", {
      name: "Sair da tela cheia",
    });
    expect(mock.request).toHaveBeenCalledOnce();
    expect(mock.request.mock.contexts[0]).toBe(document.documentElement);
    expect(exit).toHaveAttribute("aria-pressed", "true");
    expect(exit).toHaveAccessibleDescription(
      "Para voltar, use este botão ou Esc.",
    );
    expect(exit).toHaveFocus();
    expect(screen.getByLabelText("Rascunho fictício")).toHaveValue(
      "Não apagar",
    );
    await expectNoSeriousAccessibilityViolations(container);
    await user.click(exit);
    expect(
      await screen.findByRole("button", { name: "Entrar em tela cheia" }),
    ).toHaveFocus();
    expect(mock.exit).toHaveBeenCalledOnce();
  });
  it("synchronizes native exit without stealing focus or intercepting Escape", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole("button", { name: "Entrar em tela cheia" }),
    );
    const input = screen.getByLabelText("Rascunho fictício");
    input.focus();
    const escape = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    fireEvent(window, escape);
    expect(escape.defaultPrevented).toBe(false);
    // jsdom does not implement native Escape: simulate its fullscreenchange.
    act(() => mock.change(null));
    expect(
      screen.getByRole("button", { name: "Entrar em tela cheia" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(input).toHaveFocus();
    expect(mock.exit).not.toHaveBeenCalled();
  });
  it("waits for actual fullscreenElement, blocks reentrant entry and retains focus while pending", async () => {
    let finish!: () => void;
    mock.request.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<Harness />);
    const enter = screen.getByRole("button", { name: "Entrar em tela cheia" });
    await user.click(enter);
    await user.click(enter);
    expect(enter).toHaveAttribute("aria-disabled", "true");
    expect(enter).toHaveAttribute("aria-pressed", "false");
    expect(enter).toHaveFocus();
    expect(mock.request).toHaveBeenCalledOnce();
    act(() => mock.change(document.documentElement));
    expect(
      screen.getByRole("button", { name: "Sair da tela cheia" }),
    ).toHaveAttribute("aria-pressed", "true");
    await act(async () => finish());
    expect(enter).toHaveAttribute("aria-disabled", "false");
  });
  it("does not optimistically claim fullscreen when a Promise resolves without entering", async () => {
    mock.request.mockResolvedValueOnce();
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole("button", { name: "Entrar em tela cheia" }),
    );
    expect(
      screen.getByRole("button", { name: "Entrar em tela cheia" }),
    ).toHaveAttribute("aria-pressed", "false");
  });
  it("announces a rejected request generically, preserves the form and allows explicit retry", async () => {
    mock.request.mockRejectedValueOnce(
      new TypeError("internal policy details"),
    );
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByLabelText("Rascunho fictício"), "Mantido");
    await user.click(
      screen.getByRole("button", { name: "Entrar em tela cheia" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível abrir a tela cheia",
    );
    expect(screen.queryByText(/internal policy/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Rascunho fictício")).toHaveValue("Mantido");
    expect(mock.request).toHaveBeenCalledOnce();
    await user.click(
      screen.getByRole("button", { name: "Entrar em tela cheia" }),
    );
    expect(
      await screen.findByRole("button", { name: "Sair da tela cheia" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("retains real fullscreen state after a rejected exit and offers native exit guidance", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole("button", { name: "Entrar em tela cheia" }),
    );
    mock.exit.mockRejectedValueOnce(new Error("exit rejected"));
    await user.click(
      screen.getByRole("button", { name: "Sair da tela cheia" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Use a saída do navegador",
    );
    expect(
      screen.getByRole("button", { name: "Sair da tela cheia" }),
    ).toHaveAttribute("aria-pressed", "true");
    act(() => mock.change(null));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("captures a synchronous API error too", async () => {
    mock.request.mockImplementationOnce(() => {
      throw new TypeError("request unavailable");
    });
    const { result } = renderHook(useFullscreen);
    await act(async () => result.current.toggle());
    expect(result.current.error).toMatch(/Não foi possível abrir/);
    expect(result.current.pending).toBe(false);
  });
  it("leaves owned fullscreen when the authenticated layout unmounts", async () => {
    const { result, unmount } = renderHook(useFullscreen);
    await act(async () => result.current.toggle());
    unmount();
    expect(mock.exit).toHaveBeenCalledOnce();
  });
  it("does not claim ownership of a pre-existing fullscreen session", () => {
    mock.change(document.documentElement);
    const { result, unmount } = renderHook(useFullscreen);
    expect(result.current.active).toBe(true);
    unmount();
    expect(mock.exit).not.toHaveBeenCalled();
  });
  it("releases ownership after native exit instead of exiting a later external session", async () => {
    const { result, unmount } = renderHook(useFullscreen);
    await act(async () => result.current.toggle());
    act(() => mock.change(null));
    act(() => mock.change(document.documentElement));
    unmount();
    expect(mock.exit).not.toHaveBeenCalled();
  });
  it("cleans a late entry after logout and captures cleanup rejection", async () => {
    let finish!: () => void;
    mock.request.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { result, unmount } = renderHook(useFullscreen);
    let request!: Promise<void>;
    act(() => {
      request = result.current.toggle();
    });
    unmount();
    mock.exit.mockRejectedValueOnce(new Error("cleanup rejected"));
    mock.change(document.documentElement);
    await act(async () => {
      finish();
      await request;
    });
    await waitFor(() => expect(mock.exit).toHaveBeenCalledOnce());
  });
});
