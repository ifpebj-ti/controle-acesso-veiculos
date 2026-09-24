import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { expectNoSeriousAccessibilityViolations } from "../../../test/accessibility";
import { selectFieldOption } from "../../../test/selectField";
import type {
  AccessRecord,
  ExceptionallyCloseAccessRecordInput,
} from "../types";
import { ExceptionalClosureDialog } from "./ExceptionalClosureDialog";

const record: AccessRecord = {
  categoryName: "Visitante",
  createdById: 1,
  driverName: "Pessoa Fictícia",
  entryAtUtc: "2026-09-10T12:00:00.000Z",
  exitAtUtc: null,
  id: 10,
  objective: "Atendimento fictício",
  observation: null,
  personId: 2,
  plate: "DEM1A23",
  status: "Aberto",
  updatedById: null,
  vehicleId: 3,
};

const closedRecord: AccessRecord = {
  ...record,
  closureType: "Excepcional",
  exceptionalClosureObservation: "Saída confirmada posteriormente.",
  exceptionalClosureReason: "RegistroDeSaidaOmitido",
  regularizedAtUtc: "2026-09-10T15:00:00.000Z",
  status: "Encerrado",
  updatedById: 7,
};

function axiosError(status: number, data: unknown = {}) {
  return { isAxiosError: true, response: { data, status } };
}

function DialogHarness({
  onConfirm,
}: {
  onConfirm: (
    input: ExceptionallyCloseAccessRecordInput,
  ) => Promise<AccessRecord>;
}) {
  const [open, setOpen] = useState(false);
  const [closed, setClosed] = useState<AccessRecord | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={triggerRef} onClick={() => setOpen(true)} type="button">
        Abrir regularização
      </button>
      {closed && <p role="status">Regularizado: {closed.plate}</p>}
      {open && (
        <ExceptionalClosureDialog
          onCancel={() => setOpen(false)}
          onClosed={(next) => {
            setClosed(next);
            setOpen(false);
          }}
          onConfirm={onConfirm}
          record={record}
          returnFocusTo={triggerRef.current}
          successFocusRef={triggerRef}
        />
      )}
    </>
  );
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByRole("button", { name: "Abrir regularização" });
  await user.click(trigger);
  return trigger;
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await selectFieldOption(
    user,
    screen.getByLabelText("Motivo *"),
    "RegistroDeSaidaOmitido",
  );
  await user.type(
    screen.getByLabelText("Observação *"),
    "Saída confirmada posteriormente.",
  );
}

describe("ExceptionalClosureDialog", () => {
  it("shows immutable context, all reasons and safe time guidance", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const { container } = render(<DialogHarness onConfirm={onConfirm} />);
    await openDialog(user);

    expect(
      screen.getByRole("dialog", { name: "Regularizar saída não registrada" }),
    ).toHaveTextContent("DEM1A23");
    expect(screen.getByRole("dialog")).toHaveTextContent("Pessoa Fictícia");
    expect(screen.getByLabelText("Motivo *")).toHaveFocus();
    await user.click(screen.getByLabelText("Motivo *"));
    for (const label of [
      "Registro de saída omitido",
      "Indisponibilidade do sistema",
      "Operação em contingência",
      "Outro motivo",
    ]) {
      expect(screen.getByRole("option", { name: label })).toBeInTheDocument();
    }
    await user.click(screen.getByRole("option", { name: "Outro motivo" }));
    expect(
      screen.getByText(/somente quando a saída não foi registrada/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/o sistema não estima esse horário/i),
    ).toBeInTheDocument();
    await expectNoSeriousAccessibilityViolations(container);
  });

  it("requires a reason and observation without calling the API", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<DialogHarness onConfirm={onConfirm} />);
    await openDialog(user);
    await user.click(
      screen.getByRole("button", {
        name: "Confirmar regularização excepcional",
      }),
    );

    expect(
      await screen.findByText("Selecione o motivo da regularização."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("A observação deve possuir pelo menos 10 caracteres."),
    ).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("sends null when no reliable exit time is available", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(closedRecord);
    render(<DialogHarness onConfirm={onConfirm} />);
    await openDialog(user);
    await fillRequiredFields(user);
    await user.click(
      screen.getByRole("button", {
        name: "Confirmar regularização excepcional",
      }),
    );

    expect(onConfirm).toHaveBeenCalledWith({
      observation: "Saída confirmada posteriormente.",
      observedExitAtUtc: null,
      reason: "RegistroDeSaidaOmitido",
    });
    expect(await screen.findByRole("status")).toHaveTextContent("DEM1A23");
  });

  it("converts an explicitly observed local time to UTC", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue({
      ...closedRecord,
      exitAtUtc: "2026-09-10T13:30:00.000Z",
    });
    render(<DialogHarness onConfirm={onConfirm} />);
    await openDialog(user);
    await fillRequiredFields(user);
    const localTime = "2026-09-10T10:30";
    await user.type(
      screen.getByLabelText("Horário observado da saída (opcional)"),
      localTime,
    );
    await user.click(
      screen.getByRole("button", {
        name: "Confirmar regularização excepcional",
      }),
    );

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        observedExitAtUtc: new Date(localTime).toISOString(),
      }),
    );
  });

  it("traps focus, cancels with Escape and restores the trigger", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<DialogHarness onConfirm={onConfirm} />);
    const trigger = await openDialog(user);
    const dialog = screen.getByRole("dialog");
    const close = within(dialog).getByRole("button", {
      name: "Fechar regularização",
    });
    const confirm = within(dialog).getByRole("button", {
      name: "Confirmar regularização excepcional",
    });

    close.focus();
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("prevents duplicate submission while preserving values", async () => {
    let resolveRequest: ((value: AccessRecord) => void) | undefined;
    const onConfirm = vi.fn(
      () =>
        new Promise<AccessRecord>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<DialogHarness onConfirm={onConfirm} />);
    await openDialog(user);
    await fillRequiredFields(user);
    const confirm = screen.getByRole("button", {
      name: "Confirmar regularização excepcional",
    });
    await user.dblClick(confirm);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "Regularizando saída…" }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Observação *")).toHaveValue(
      "Saída confirmada posteriormente.",
    );

    resolveRequest?.(closedRecord);
    expect(await screen.findByRole("status")).toBeInTheDocument();
  });

  it("associates HTTP 400 errors and preserves the form", async () => {
    const onConfirm = vi.fn().mockRejectedValue(
      axiosError(400, {
        errors: {
          observation: ["A observação informada é inválida."],
          observedExitAtUtc: ["O horário observado não pode estar no futuro."],
          reason: ["Informe um motivo válido."],
        },
      }),
    );
    const user = userEvent.setup();
    render(<DialogHarness onConfirm={onConfirm} />);
    await openDialog(user);
    await fillRequiredFields(user);
    await user.click(
      screen.getByRole("button", {
        name: "Confirmar regularização excepcional",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Revise os campos destacados",
    );
    expect(screen.getByLabelText("Observação *")).toHaveValue(
      "Saída confirmada posteriormente.",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it.each([
    [401, {}, "Sua sessão não é mais válida. Entre novamente."],
    [403, {}, "Seu perfil não possui permissão"],
    [404, {}, "O acesso não existe mais"],
    [
      409,
      { message: "O registro de acesso já foi encerrado." },
      "já foi encerrado",
    ],
  ])(
    "presents HTTP %s safely without closing",
    async (status, data, message) => {
      const onConfirm = vi.fn().mockRejectedValue(axiosError(status, data));
      const user = userEvent.setup();
      render(<DialogHarness onConfirm={onConfirm} />);
      await openDialog(user);
      await fillRequiredFields(user);
      await user.click(
        screen.getByRole("button", {
          name: "Confirmar regularização excepcional",
        }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(onConfirm).toHaveBeenCalledTimes(1);
    },
  );

  it("presents a network failure without clearing values", async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error("network"));
    const user = userEvent.setup();
    render(<DialogHarness onConfirm={onConfirm} />);
    await openDialog(user);
    await fillRequiredFields(user);
    await user.click(
      screen.getByRole("button", {
        name: "Confirmar regularização excepcional",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível conectar ao sistema",
    );
    expect(screen.getByLabelText("Observação *")).toHaveValue(
      "Saída confirmada posteriormente.",
    );
  });
});
