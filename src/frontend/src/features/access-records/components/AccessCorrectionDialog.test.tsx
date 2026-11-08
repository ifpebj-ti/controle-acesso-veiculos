import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, CanceledError } from "axios";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { expectNoSeriousAccessibilityViolations } from "../../../test/accessibility";
import { selectFieldOption } from "../../../test/selectField";
import {
  correctionAccess,
  correctionKey,
  pendingCorrection,
} from "../../../test/correctionReviewFixtures";
import { CorrectionReviewScope } from "../../access-corrections/CorrectionReviewScope";
import {
  CorrectionReviewContractError,
  findOwnCorrectionRequest,
  submitCorrectionRequest,
} from "../../access-corrections/service";
import type { CorrectionRequest } from "../../access-corrections/schemas";
import { AccessCorrectionDialog } from "./AccessCorrectionDialog";

vi.mock("../../access-corrections/service", async (original) => ({
  ...(await original<typeof import("../../access-corrections/service")>()),
  submitCorrectionRequest: vi.fn(),
  findOwnCorrectionRequest: vi.fn(),
}));
function Harness({ onReload = vi.fn() }: { onReload?: () => void }) {
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState<CorrectionRequest | null>(null);
  const [returnTo, setReturnTo] = useState<HTMLButtonElement | null>(null);
  return (
    <CorrectionReviewScope>
      <button
        onClick={(event) => {
          setReturnTo(event.currentTarget);
          setOpen(true);
        }}
      >
        Abrir solicitação
      </button>
      {request && (
        <p role="status">
          Pedido #{request.id}: {request.status}
        </p>
      )}
      {open && (
        <AccessCorrectionDialog
          record={correctionAccess}
          returnFocusTo={returnTo}
          onClose={() => setOpen(false)}
          onReload={onReload}
          onRequested={(value) => {
            setRequest(value);
            setOpen(false);
          }}
        />
      )}
    </CorrectionReviewScope>
  );
}
async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.clear(screen.getByLabelText("Objetivo"));
  await user.type(
    screen.getByLabelText("Objetivo"),
    pendingCorrection.proposed.objective,
  );
  await selectFieldOption(user, screen.getByLabelText("Categoria"), "Entrega");
  await user.type(
    screen.getByLabelText(/Observação/),
    pendingCorrection.proposed.observation!,
  );
  await user.type(
    screen.getByLabelText("Justificativa da correção"),
    pendingCorrection.justification,
  );
}
describe("correction proposal dialog", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(crypto, "randomUUID").mockReturnValue(correctionKey);
  });
  it("submits the original canonical snapshot and proposed values without claiming an applied correction", async () => {
    vi.mocked(submitCorrectionRequest).mockResolvedValue(pendingCorrection);
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Abrir solicitação" }));
    expect(
      await screen.findByRole("dialog", { name: "Solicitar correção" }),
    ).toHaveTextContent("Somente a aprovação altera");
    await fill(user);
    await user.click(
      screen.getByRole("button", { name: "Enviar solicitação" }),
    );
    expect(await screen.findByText("Pedido #31: Pendente")).toBeInTheDocument();
    expect(submitCorrectionRequest).toHaveBeenCalledExactlyOnceWith(10, {
      requestKey: correctionKey,
      original: pendingCorrection.original,
      proposed: pendingCorrection.proposed,
      justification: pendingCorrection.justification,
    });
    expect(
      screen.queryByText(/corrigido com sucesso/i),
    ).not.toBeInTheDocument();
  });
  it("validates fields locally and focuses the first invalid field without a request", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Abrir solicitação" }));
    const objective = await screen.findByLabelText("Objetivo");
    await user.clear(objective);
    await user.click(
      screen.getByRole("button", { name: "Enviar solicitação" }),
    );
    expect(
      await screen.findByText("Informe o objetivo do acesso."),
    ).toBeInTheDocument();
    await waitFor(() => expect(objective).toHaveFocus());
    expect(objective).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Justificativa da correção")).toHaveAttribute(
      "maxLength",
      "500",
    );
    expect(submitCorrectionRequest).not.toHaveBeenCalled();
  });
  it("rejects an unchanged proposal rather than creating a fake request", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Abrir solicitação" }));
    await user.type(
      await screen.findByLabelText("Justificativa da correção"),
      pendingCorrection.justification,
    );
    await user.click(
      screen.getByRole("button", { name: "Enviar solicitação" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Altere ao menos um",
    );
    expect(submitCorrectionRequest).not.toHaveBeenCalled();
  });
  it.each([400, 429])(
    "preserves values and key after known recoverable HTTP %s without automatic retry",
    async (status) => {
      vi.mocked(submitCorrectionRequest).mockRejectedValue({
        isAxiosError: true,
        response: { status, data: {} },
      });
      const user = userEvent.setup();
      render(<Harness />);
      await user.click(
        screen.getByRole("button", { name: "Abrir solicitação" }),
      );
      await screen.findByLabelText("Objetivo");
      await fill(user);
      await user.click(
        screen.getByRole("button", { name: "Enviar solicitação" }),
      );
      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(screen.getByLabelText("Objetivo")).toHaveValue(
        pendingCorrection.proposed.objective,
      );
      expect(screen.getByLabelText("Justificativa da correção")).toHaveValue(
        pendingCorrection.justification,
      );
      expect(submitCorrectionRequest).toHaveBeenCalledTimes(1);
      expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
    },
  );
  it.each([
    new AxiosError("network", "ERR_NETWORK"),
    new CorrectionReviewContractError(),
    new CanceledError("fixture"),
    new DOMException("fixture", "AbortError"),
  ])(
    "retains an uncertain intention across closing/reopening after %s",
    async (error) => {
      vi.mocked(submitCorrectionRequest).mockRejectedValue(error);
      vi.mocked(findOwnCorrectionRequest).mockResolvedValue(null);
      const user = userEvent.setup();
      render(<Harness />);
      await user.click(
        screen.getByRole("button", { name: "Abrir solicitação" }),
      );
      await screen.findByLabelText("Objetivo");
      await fill(user);
      await user.click(
        screen.getByRole("button", { name: "Enviar solicitação" }),
      );
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "pode ter sido recebida",
      );
      await user.click(screen.getByRole("button", { name: "Fechar" }));
      await user.click(
        screen.getByRole("button", { name: "Abrir solicitação" }),
      );
      expect(await screen.findByLabelText("Objetivo")).toHaveValue(
        pendingCorrection.proposed.objective,
      );
      expect(screen.getByLabelText("Objetivo")).toBeDisabled();
      expect(
        screen.queryByRole("button", { name: "Enviar solicitação" }),
      ).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Consultar envio" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "não confirma",
      );
      expect(findOwnCorrectionRequest).toHaveBeenCalledWith(correctionKey);
      expect(submitCorrectionRequest).toHaveBeenCalledTimes(1);
      expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
    },
  );
  it.each([401, 403])(
    "does not repeat a denied submission on HTTP %s",
    async (status) => {
      vi.mocked(submitCorrectionRequest).mockRejectedValue({
        isAxiosError: true,
        response: { status, data: {} },
      });
      const user = userEvent.setup();
      render(<Harness />);
      await user.click(
        screen.getByRole("button", { name: "Abrir solicitação" }),
      );
      await screen.findByLabelText("Objetivo");
      await fill(user);
      await user.click(
        screen.getByRole("button", { name: "Enviar solicitação" }),
      );
      await screen.findByRole("alert");
      expect(
        screen.getByRole("button", { name: "Consultar envio" }),
      ).toBeDisabled();
      expect(submitCorrectionRequest).toHaveBeenCalledTimes(1);
    },
  );
  it("contains keyboard focus, supports Escape, returns focus and has accessible fields", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Abrir solicitação" });
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Solicitar correção" }),
    ).toHaveFocus();
    await user.tab({ shift: true });
    expect(
      within(dialog).getByRole("button", { name: "Enviar solicitação" }),
    ).toHaveFocus();
    await user.tab();
    expect(
      within(dialog).getByRole("button", { name: "Fechar janela de correção" }),
    ).toHaveFocus();
    await expectNoSeriousAccessibilityViolations(container);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
