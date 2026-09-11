import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { expectNoSeriousAccessibilityViolations } from "../../../test/accessibility";
import {
  AccessRecordsContractError,
  correctAccessRecord,
} from "../services/accessRecordsService";
import type { AccessRecord } from "../types";
import { AccessCorrectionDialog } from "./AccessCorrectionDialog";

vi.mock("../services/accessRecordsService", async () => {
  const actual = await vi.importActual<
    typeof import("../services/accessRecordsService")
  >("../services/accessRecordsService");
  return { ...actual, correctAccessRecord: vi.fn() };
});

const record: AccessRecord = {
  categoryName: "Visitante",
  createdById: 4,
  driverName: "Pessoa histórica fictícia",
  entryAtUtc: "2026-09-02T12:00:00.000Z",
  eventAuthorizationId: 7,
  eventAuthorizationName: "Evento Fictício",
  eventVehicleRuleId: 9,
  exitAtUtc: null,
  id: 10,
  objective: "Atendimento fictício",
  observation: "Observação inicial fictícia",
  personId: 2,
  plate: "DEM1A23",
  status: "Aberto",
  updatedById: null,
  vehicleId: 3,
};

const correctedRecord: AccessRecord = {
  ...record,
  categoryName: "Entrega",
  objective: "Entrega corrigida",
  observation: "Conferido na portaria",
  updatedById: 8,
};

function axiosError(status: number, data: unknown = {}) {
  return {
    isAxiosError: true,
    response: { data, status },
  };
}

function DialogHarness({ current = record }: { current?: AccessRecord }) {
  const [open, setOpen] = useState(false);
  const [updated, setUpdated] = useState<AccessRecord | null>(null);

  return (
    <>
      <button onClick={() => setOpen(true)} type="button">
        Abrir correção
      </button>
      {updated && <p role="status">Atualizado: {updated.objective}</p>}
      {open && (
        <AccessCorrectionDialog
          onClose={() => setOpen(false)}
          onCorrected={(next) => {
            setUpdated(next);
            setOpen(false);
          }}
          record={current}
          returnFocusTo={document.activeElement as HTMLElement}
        />
      )}
    </>
  );
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByRole("button", { name: "Abrir correção" });
  trigger.focus();
  await user.click(trigger);
  return trigger;
}

async function submitValidCorrection(user: ReturnType<typeof userEvent.setup>) {
  const objective = screen.getByLabelText("Objetivo");
  await user.clear(objective);
  await user.type(objective, "Entrega corrigida");
  await user.selectOptions(screen.getByLabelText("Categoria"), "Entrega");
  const observation = screen.getByLabelText(/Observação/);
  await user.clear(observation);
  await user.type(observation, "Conferido na portaria");
  await user.type(
    screen.getByLabelText("Justificativa da correção"),
    "Correção solicitada durante conferência.",
  );
  await user.click(screen.getByRole("button", { name: "Salvar correção" }));
}

describe("AccessCorrectionDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("presents immutable context and initializes only correctable values", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await openDialog(user);

    expect(
      screen.getByRole("dialog", { name: "Corrigir registro" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Objetivo")).toHaveValue(
      "Atendimento fictício",
    );
    expect(screen.getByLabelText("Categoria")).toHaveValue("Visitante");
    expect(screen.getByLabelText(/Observação/)).toHaveValue(
      "Observação inicial fictícia",
    );
    expect(screen.getByLabelText("Justificativa da correção")).toHaveValue("");
    expect(screen.getByText("DEM1A23")).not.toBeInstanceOf(HTMLInputElement);
    expect(screen.getByText("Pessoa histórica fictícia")).not.toBeInstanceOf(
      HTMLInputElement,
    );
    expect(screen.getByText("Usuário #4")).toBeInTheDocument();
    expect(screen.getByText("Evento Fictício")).toBeInTheDocument();
    expect(
      screen.getByText(
        "A correção e sua justificativa serão registradas na trilha de auditoria.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Objetivo")).toHaveFocus();
  });

  it("closes with Escape and returns focus to the opening action", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    const trigger = await openDialog(user);

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("validates required values and limits before calling the API", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await openDialog(user);
    await user.clear(screen.getByLabelText("Objetivo"));
    await user.type(
      screen.getByLabelText("Justificativa da correção"),
      "curta",
    );
    await user.click(screen.getByRole("button", { name: "Salvar correção" }));

    expect(
      await screen.findByText("Informe o objetivo do acesso."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "A justificativa deve possuir pelo menos 10 caracteres.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Objetivo")).toHaveAttribute(
      "aria-describedby",
      "correction-objective-error",
    );
    expect(correctAccessRecord).not.toHaveBeenCalled();
  });

  it("submits only the correction data and uses the canonical API response", async () => {
    vi.mocked(correctAccessRecord).mockResolvedValue(correctedRecord);
    const user = userEvent.setup();
    render(<DialogHarness />);
    await openDialog(user);
    await submitValidCorrection(user);

    expect(correctAccessRecord).toHaveBeenCalledWith(10, {
      categoryName: "Entrega",
      justification: "Correção solicitada durante conferência.",
      objective: "Entrega corrigida",
      observation: "Conferido na portaria",
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Atualizado: Entrega corrigida",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("associates API validation errors and preserves all values", async () => {
    vi.mocked(correctAccessRecord).mockRejectedValue(
      axiosError(400, {
        errors: {
          categoryName: ["Informe uma categoria suportada pelo MVP."],
          justification: [
            "A justificativa deve possuir entre 10 e 500 caracteres.",
          ],
          objective: ["O objetivo deve possuir até 500 caracteres."],
          observation: ["O campo deve possuir até 1000 caracteres."],
        },
      }),
    );
    const user = userEvent.setup();
    render(<DialogHarness />);
    await openDialog(user);
    await submitValidCorrection(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Revise os campos destacados",
    );
    for (const label of [
      "Objetivo",
      "Categoria",
      "Observação (opcional)",
      "Justificativa da correção",
    ]) {
      expect(screen.getByLabelText(label)).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(screen.getByLabelText(label)).toHaveAttribute("aria-describedby");
    }
    expect(screen.getByLabelText("Objetivo")).toHaveValue("Entrega corrigida");
    expect(screen.getByLabelText("Categoria")).toHaveValue("Entrega");
    expect(screen.getByLabelText(/Observação/)).toHaveValue(
      "Conferido na portaria",
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it.each([
    [401, {}, "Sua sessão não é mais válida. Entre novamente."],
    [403, {}, "Seu perfil não possui permissão para realizar esta ação."],
    [
      404,
      {},
      "O registro não existe mais ou não está disponível para correção.",
    ],
    [
      409,
      {
        errors: {
          accessRecord: ["A correção não altera os dados do registro."],
        },
      },
      "A correção não altera os dados do registro.",
    ],
  ])(
    "presents HTTP %s without closing the form",
    async (status, data, message) => {
      vi.mocked(correctAccessRecord).mockRejectedValue(
        axiosError(status, data),
      );
      const user = userEvent.setup();
      render(<DialogHarness />);
      await openDialog(user);
      await submitValidCorrection(user);

      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    },
  );

  it("distinguishes network and response-contract failures", async () => {
    vi.mocked(correctAccessRecord)
      .mockRejectedValueOnce(new Error("network"))
      .mockRejectedValueOnce(new AccessRecordsContractError());
    const user = userEvent.setup();
    render(<DialogHarness />);
    await openDialog(user);
    await submitValidCorrection(user);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível conectar ao sistema",
    );

    await user.click(screen.getByRole("button", { name: "Salvar correção" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A resposta da correção não pôde ser validada",
    );
    expect(correctAccessRecord).toHaveBeenCalledTimes(2);
  });

  it("blocks duplicate submission while the request is pending", async () => {
    let resolveRequest: ((value: AccessRecord) => void) | undefined;
    vi.mocked(correctAccessRecord).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<DialogHarness />);
    await openDialog(user);
    await submitValidCorrection(user);

    const pendingButton = screen.getByRole("button", {
      name: "Salvando correção…",
    });
    expect(pendingButton).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    await user.click(pendingButton);
    expect(correctAccessRecord).toHaveBeenCalledTimes(1);

    resolveRequest?.(correctedRecord);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Entrega corrigida",
    );
  });

  it("has no serious accessibility violations", async () => {
    const user = userEvent.setup();
    const { container } = render(<DialogHarness />);
    await openDialog(user);

    await expectNoSeriousAccessibilityViolations(container);
  });
});
