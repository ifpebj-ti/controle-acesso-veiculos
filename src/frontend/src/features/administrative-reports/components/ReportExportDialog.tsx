import {
  type FormEvent,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { Button } from "../../../components/ui/Button";
import { Icon } from "../../../components/ui/Icon";
import { TextField } from "../../../components/ui/TextField";
import { describeApiError } from "../../../services/api-errors";
import {
  ReportExportReauthenticationError,
  exportInstitutionalFleetReport,
  exportVehicleMovementReport,
} from "../services/administrativeReportsService";
import type {
  AdministrativeReportFilters,
  AdministrativeReportKind,
} from "../types";
import { downloadReport } from "../utils/downloadReport";

export function ReportExportDialog({
  applied,
  kind,
  onClose,
  onSuccess,
  returnFocusTo,
}: {
  applied: AdministrativeReportFilters;
  kind: AdministrativeReportKind;
  onClose: () => void;
  onSuccess: () => void;
  returnFocusTo: RefObject<HTMLButtonElement | null>;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const busyRef = useRef(false);
  const titleId = useId();

  useEffect(() => {
    passwordRef.current?.focus();
    const trigger = returnFocusTo.current;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busyRef.current) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [onClose, returnFocusTo]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!password || busyRef.current) return;
    const attemptPassword = password;
    setPassword("");
    busyRef.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const report =
        kind === "movements"
          ? await exportVehicleMovementReport(applied, attemptPassword)
          : await exportInstitutionalFleetReport(applied, attemptPassword);
      downloadReport(report);
      onSuccess();
      onClose();
    } catch (error) {
      const nextMessage =
        error instanceof ReportExportReauthenticationError
          ? "A senha não confirmou esta exportação. A sessão continua ativa; revise a senha e tente novamente."
          : describeApiError(error).message;
      setMessage(nextMessage);
    } finally {
      busyRef.current = false;
      setBusy(false);
      requestAnimationFrame(() => passwordRef.current?.focus());
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-overlay p-4">
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="my-auto w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-xl sm:p-6"
        ref={dialogRef}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-text" id={titleId}>
              Confirmar exportação
            </h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              A autoria e o horário do arquivo são definidos pela API.
            </p>
          </div>
          <Button
            aria-label="Fechar"
            disabled={busy}
            onClick={onClose}
            variant="secondary"
          >
            <Icon name="x" />
          </Button>
        </div>
        <form className="mt-5" onSubmit={submit}>
          <label className="grid gap-2 text-sm font-bold text-text">
            Senha atual
            <TextField
              autoComplete="current-password"
              disabled={busy}
              onChange={(event) => setPassword(event.target.value)}
              ref={passwordRef}
              required
              type="password"
              value={password}
            />
          </label>
          <p className="mt-2 text-xs leading-5 text-text-muted">
            A senha não é salva no navegador e será apagada após esta tentativa.
          </p>
          <div
            aria-atomic="true"
            aria-live="assertive"
            className="mt-3 min-h-6 text-sm font-semibold text-danger-text"
            role={message ? "alert" : undefined}
          >
            {message}
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <Button disabled={busy} onClick={onClose} variant="secondary">
              Cancelar
            </Button>
            <Button disabled={busy || !password} type="submit">
              {busy ? "Exportando…" : "Exportar PDF"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
