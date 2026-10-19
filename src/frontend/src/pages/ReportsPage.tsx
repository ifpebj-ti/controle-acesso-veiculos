import {
  type FormEvent,
  type RefObject,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { Button } from "../components/ui/Button";
import { ContentState } from "../components/ui/ContentState";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { SelectField, type SelectOption } from "../components/ui/SelectField";
import { TextField } from "../components/ui/TextField";
import {
  type AdministrativeReportFilters,
  type AdministrativeReportKind,
  type AdministrativeReportPage,
  type InstitutionalFleetReportItem,
  ReportExportReauthenticationError,
  type VehicleMovementReportItem,
  exportInstitutionalFleetReport,
  exportVehicleMovementReport,
  searchInstitutionalFleetReport,
  searchVehicleMovementReport,
} from "../features/administrative-reports";
import { useAuthenticatedSession } from "../features/authentication";
import { profileHasCapability } from "../routes/routeMetadata";
import { describeApiError } from "../services/api-errors";

type ReportPage =
  | AdministrativeReportPage<VehicleMovementReportItem>
  | AdministrativeReportPage<InstitutionalFleetReportItem>;
type LoadStatus = "loading" | "ready" | "error" | "denied";

const movementStatusOptions: SelectOption[] = [
  { label: "Todas", value: "" },
  { label: "Aberto", value: "Aberto" },
  { label: "Encerrado", value: "Encerrado" },
  { label: "Pendente", value: "Pendente" },
];
const fleetStatusOptions: SelectOption[] = [
  { label: "Todas", value: "" },
  { label: "Em uso", value: "EmUso" },
  { label: "Concluído", value: "Concluido" },
  { label: "Pendente de retorno", value: "PendenteRetorno" },
  { label: "Corrigido", value: "Corrigido" },
];

function localDate(offsetDays = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function initialFilters(): AdministrativeReportFilters {
  return {
    from: localDate(-6),
    to: localDate(),
    plate: "",
    driverName: "",
    categoryName: "",
    vehicleIdentification: "",
    status: "",
    page: 1,
    pageSize: 25,
  };
}

function periodError(filters: AdministrativeReportFilters) {
  if (!filters.from || !filters.to) return "Informe as duas datas do período.";
  const from = Date.parse(`${filters.from}T00:00:00Z`);
  const to = Date.parse(`${filters.to}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) {
    return "A data final deve ser igual ou posterior à data inicial.";
  }
  if ((to - from) / 86_400_000 + 1 > 31) {
    return "O período máximo permitido é de 31 dias.";
  }
  return null;
}

function formatDateTime(value: string | null, timeZone: string) {
  if (!value) return "Não registrado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

function actorLabel(actor: { name: string; profile: string } | null) {
  return actor ? `${actor.name} (${actor.profile})` : "Não registrado";
}

export function ReportsPage() {
  const { user } = useAuthenticatedSession();

  if (
    !profileHasCapability(user.profileName, "review-administrative-reports")
  ) {
    return (
      <AccessDeniedState message="Os relatórios são exclusivos do perfil Administrador." />
    );
  }

  return <AdministratorReports />;
}

function AdministratorReports() {
  const [kind, setKind] = useState<AdministrativeReportKind>("movements");
  const [draft, setDraft] = useState(initialFilters);
  const [applied, setApplied] = useState(initialFilters);
  const [page, setPage] = useState<ReportPage | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const [exportOpen, setExportOpen] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const exportTriggerRef = useRef<HTMLButtonElement>(null);
  const closeExport = useCallback(() => setExportOpen(false), []);

  useEffect(() => {
    let active = true;
    const request =
      kind === "movements"
        ? searchVehicleMovementReport(applied)
        : searchInstitutionalFleetReport(applied);

    void request
      .then((result) => {
        if (!active) return;
        setPage(result);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        const described = describeApiError(error);
        setPage(null);
        setErrorMessage(described.message);
        setStatus(described.kind === "access-denied" ? "denied" : "error");
      });
    return () => {
      active = false;
    };
  }, [applied, kind]);

  if (status === "denied") {
    return <AccessDeniedState message={errorMessage ?? undefined} />;
  }

  function changeKind(nextKind: AdministrativeReportKind) {
    if (nextKind === kind) return;
    setKind(nextKind);
    setStatus("loading");
    setErrorMessage(null);
    setDraft((current) => ({ ...current, page: 1, status: "" }));
    setApplied((current) => ({ ...current, page: 1, status: "" }));
    setValidationMessage(null);
  }

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    const error = periodError(draft);
    setValidationMessage(error);
    if (error) return;
    setStatus("loading");
    setErrorMessage(null);
    setApplied({ ...draft, page: 1 });
  }

  function goToPage(nextPage: number) {
    setStatus("loading");
    setErrorMessage(null);
    setApplied((current) => ({ ...current, page: nextPage }));
  }

  function retry() {
    setStatus("loading");
    setErrorMessage(null);
    setApplied((current) => ({ ...current }));
  }

  return (
    <div>
      <PageHeader
        action={
          <Button
            disabled={status === "loading"}
            onClick={() => setExportOpen(true)}
            ref={exportTriggerRef}
          >
            <Icon name="clipboard" size={18} /> Exportar PDF
          </Button>
        }
        description="Consulte registros reais por período e exporte uma cópia identificada pela API."
        eyebrow="Administração"
        title="Relatórios"
        variant="prominent"
      />

      <div
        aria-label="Tipo de relatório"
        className="mt-6 grid gap-2 rounded-2xl border border-border bg-surface p-2 sm:grid-cols-2"
        role="group"
      >
        <ReportKindButton
          active={kind === "movements"}
          label="Movimentações gerais"
          onClick={() => changeKind("movements")}
        />
        <ReportKindButton
          active={kind === "fleet"}
          label="Frota institucional"
          onClick={() => changeKind("fleet")}
        />
      </div>

      {exportNotice && (
        <div
          aria-atomic="true"
          className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-success-border bg-success-surface p-4 text-sm text-success-text"
          role="status"
        >
          <p>{exportNotice}</p>
          <button
            className="min-h-10 font-bold underline underline-offset-4"
            onClick={() => setExportNotice(null)}
            type="button"
          >
            Fechar
          </button>
        </div>
      )}

      <ReportFilters
        draft={draft}
        kind={kind}
        onChange={setDraft}
        onSubmit={applyFilters}
        validationMessage={validationMessage}
      />

      <p className="mt-4 text-sm text-text-muted">
        Período aplicado: <strong>{applied.from}</strong> a{" "}
        <strong>{applied.to}</strong>, inclusive. Máximo de 31 dias.
      </p>

      {status === "loading" && (
        <ContentState
          className="mt-5"
          title="Carregando relatório"
          variant="loading"
        />
      )}
      {status === "error" && (
        <ContentState
          action={
            <Button onClick={retry} variant="secondary">
              Tentar novamente
            </Button>
          }
          className="mt-5"
          description="Os filtros e o período foram preservados."
          title={errorMessage ?? "O relatório está indisponível agora."}
          variant="error"
        />
      )}
      {status === "ready" && page?.items.length === 0 && (
        <ContentState
          className="mt-5"
          description="Altere o período ou os filtros para realizar outra consulta."
          icon="search"
          title="Nenhum registro encontrado"
          variant="empty"
        />
      )}
      {status === "ready" && page && page.items.length > 0 && (
        <ReportResults kind={kind} page={page} />
      )}

      {status === "ready" && page && page.totalPages > 0 && (
        <nav
          aria-label="Paginação do relatório"
          className="mt-5 flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm text-text-muted">
            Página {page.page} de {page.totalPages} · {page.totalCount}{" "}
            registro(s)
          </p>
          <div className="flex gap-2">
            <Button
              disabled={page.page <= 1}
              onClick={() => goToPage(page.page - 1)}
              variant="secondary"
            >
              Anterior
            </Button>
            <Button
              disabled={page.page >= page.totalPages}
              onClick={() => goToPage(page.page + 1)}
              variant="secondary"
            >
              Próxima
            </Button>
          </div>
        </nav>
      )}

      <aside className="mt-6 rounded-2xl border border-warning-border bg-warning-surface p-5 text-sm leading-6 text-text-muted">
        <h2 className="font-bold text-text">Confirmação da exportação</h2>
        <p className="mt-1">
          A senha é enviada somente na tentativa de exportação e apagada do
          formulário logo em seguida. A confirmação por Google ainda depende da
          evolução do backend; nenhuma reautenticação Google é simulada nesta
          tela.
        </p>
      </aside>

      {exportOpen && (
        <ReportExportDialog
          applied={applied}
          kind={kind}
          onClose={closeExport}
          onSuccess={() =>
            setExportNotice("O download do relatório foi iniciado.")
          }
          returnFocusTo={exportTriggerRef}
        />
      )}
    </div>
  );
}

function ReportKindButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`min-h-12 rounded-xl px-4 text-sm font-bold focus:outline-none focus-visible:ring-3 focus-visible:ring-focus ${active ? "bg-primary text-primary-text" : "text-text hover:bg-surface-subtle"}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function ReportFilters({
  draft,
  kind,
  onChange,
  onSubmit,
  validationMessage,
}: {
  draft: AdministrativeReportFilters;
  kind: AdministrativeReportKind;
  onChange: (filters: AdministrativeReportFilters) => void;
  onSubmit: (event: FormEvent) => void;
  validationMessage: string | null;
}) {
  const errorId = useId();
  const update = (field: keyof AdministrativeReportFilters, value: string) =>
    onChange({ ...draft, [field]: value });

  return (
    <form
      className="mt-5 rounded-2xl border border-border bg-surface p-4 sm:p-6"
      onSubmit={onSubmit}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FilterField label="Data inicial">
          <TextField
            aria-describedby={validationMessage ? errorId : undefined}
            aria-invalid={Boolean(validationMessage)}
            max={draft.to}
            onChange={(event) => update("from", event.target.value)}
            required
            type="date"
            value={draft.from}
          />
        </FilterField>
        <FilterField label="Data final">
          <TextField
            aria-describedby={validationMessage ? errorId : undefined}
            aria-invalid={Boolean(validationMessage)}
            min={draft.from}
            onChange={(event) => update("to", event.target.value)}
            required
            type="date"
            value={draft.to}
          />
        </FilterField>
        <FilterField label="Placa">
          <TextField
            onChange={(event) => update("plate", event.target.value)}
            placeholder="Busca parcial"
            value={draft.plate}
          />
        </FilterField>
        <FilterField label="Condutor">
          <TextField
            onChange={(event) => update("driverName", event.target.value)}
            placeholder="Nome do condutor"
            value={draft.driverName}
          />
        </FilterField>
        {kind === "movements" ? (
          <FilterField label="Categoria">
            <TextField
              onChange={(event) => update("categoryName", event.target.value)}
              placeholder="Busca parcial"
              value={draft.categoryName}
            />
          </FilterField>
        ) : (
          <FilterField label="Identificação interna">
            <TextField
              onChange={(event) =>
                update("vehicleIdentification", event.target.value)
              }
              placeholder="Não é uma placa"
              value={draft.vehicleIdentification}
            />
          </FilterField>
        )}
        <FilterField label="Situação">
          <SelectField
            id="report-status"
            onValueChange={(value) => update("status", value)}
            options={
              kind === "movements" ? movementStatusOptions : fleetStatusOptions
            }
            value={draft.status}
          />
        </FilterField>
      </div>
      {validationMessage && (
        <p
          className="mt-3 text-sm font-semibold text-danger-text"
          id={errorId}
          role="alert"
        >
          {validationMessage}
        </p>
      )}
      <div className="mt-5 flex justify-end">
        <Button type="submit">
          <Icon name="search" size={18} /> Aplicar filtros
        </Button>
      </div>
    </form>
  );
}

function FilterField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-bold text-text">
      {label}
      {children}
    </label>
  );
}

function ReportResults({
  kind,
  page,
}: {
  kind: AdministrativeReportKind;
  page: ReportPage;
}) {
  return (
    <section aria-labelledby="report-results-title" className="mt-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-xl font-bold text-text" id="report-results-title">
          Registros encontrados
        </h2>
        <p className="text-sm text-text-muted">Fuso: {page.timeZoneId}</p>
      </div>
      <ul className="mt-3 grid gap-3">
        {kind === "movements"
          ? (page.items as VehicleMovementReportItem[]).map((item) => (
              <MovementResult
                item={item}
                key={item.id}
                timeZone={page.timeZoneId}
              />
            ))
          : (page.items as InstitutionalFleetReportItem[]).map((item) => (
              <FleetResult
                item={item}
                key={item.id}
                timeZone={page.timeZoneId}
              />
            ))}
      </ul>
    </section>
  );
}

function VehicleIdentity({
  plate,
  vehicleIdentification,
}: {
  plate: string | null;
  vehicleIdentification: string | null;
}) {
  return (
    <div>
      <p>
        <strong>Placa:</strong> {plate ?? "Não informada"}
      </p>
      <p>
        <strong>Identificação interna:</strong>{" "}
        {vehicleIdentification ?? "Não informada"}
      </p>
    </div>
  );
}

function MovementResult({
  item,
  timeZone,
}: {
  item: VehicleMovementReportItem;
  timeZone: string;
}) {
  return (
    <li className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="grid min-w-0 gap-4 text-sm leading-6 sm:grid-cols-2 xl:grid-cols-4">
        <VehicleIdentity
          plate={item.plate}
          vehicleIdentification={item.vehicleIdentification}
        />
        <div>
          <p>
            <strong>Condutor:</strong> {item.driverName}
          </p>
          <p>
            <strong>Categoria:</strong> {item.categoryName}
          </p>
          <p>
            <strong>Tipo de veículo:</strong>{" "}
            {item.vehicleType ?? "Não informado"}
          </p>
        </div>
        <div>
          <p>
            <strong>Entrada:</strong>{" "}
            {formatDateTime(item.entryAtUtc, timeZone)}
          </p>
          <p>
            <strong>Saída:</strong> {formatDateTime(item.exitAtUtc, timeZone)}
          </p>
        </div>
        <div>
          <p>
            <strong>Situação:</strong> {item.status}
          </p>
          <p>
            <strong>Objetivo:</strong> {item.objective}
          </p>
          {item.eventName && (
            <p>
              <strong>Evento:</strong> {item.eventName}
            </p>
          )}
          {item.closureType && (
            <p>
              <strong>Encerramento:</strong> {item.closureType}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 border-t border-border pt-3 text-sm text-text-muted">
        <p>
          <strong>Entrada registrada por:</strong>{" "}
          {actorLabel(item.entryRecordedBy)}
        </p>
        <p>
          <strong>Saída registrada por:</strong>{" "}
          {actorLabel(item.exitRecordedBy)}
        </p>
      </div>
    </li>
  );
}

function FleetResult({
  item,
  timeZone,
}: {
  item: InstitutionalFleetReportItem;
  timeZone: string;
}) {
  return (
    <li className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="grid min-w-0 gap-4 text-sm leading-6 sm:grid-cols-2 xl:grid-cols-4">
        <VehicleIdentity
          plate={item.plate}
          vehicleIdentification={item.vehicleIdentification}
        />
        <div>
          <p>
            <strong>Condutor:</strong> {item.driverName}
          </p>
          <p>
            <strong>Itinerário:</strong> {item.itinerary}
          </p>
        </div>
        <div>
          <p>
            <strong>Saída:</strong>{" "}
            {formatDateTime(item.departureAtUtc, timeZone)}
          </p>
          <p>
            <strong>Retorno:</strong>{" "}
            {formatDateTime(item.returnAtUtc, timeZone)}
          </p>
          <p>
            <strong>Quilometragem:</strong> {item.departureMileage} km →{" "}
            {item.returnMileage === null
              ? "Não registrada"
              : `${item.returnMileage} km`}
          </p>
        </div>
        <div>
          <p>
            <strong>Situação:</strong> {item.status}
          </p>
          <p>
            <strong>Distância:</strong>{" "}
            {item.distance === null ? "Não calculada" : `${item.distance} km`}
          </p>
        </div>
      </div>
      <div className="mt-4 border-t border-border pt-3 text-sm text-text-muted">
        <p>
          <strong>Saída registrada por:</strong>{" "}
          {actorLabel(item.departureRecordedBy)}
        </p>
        <p>
          <strong>Retorno registrado por:</strong>{" "}
          {actorLabel(item.returnRecordedBy)}
        </p>
      </div>
    </li>
  );
}

function ReportExportDialog({
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
    if (!password || busy) return;
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
      const url = URL.createObjectURL(report.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = report.fileName;
      link.click();
      URL.revokeObjectURL(url);
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
