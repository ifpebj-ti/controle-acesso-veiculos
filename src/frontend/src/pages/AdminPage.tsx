import { useState } from "react";

import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { AuditTrailPanel } from "../features/audit-trail";
import { useAuthenticatedSession } from "../features/authentication";
import {
  UserAccountCatalog,
  UserAccountFiltersForm,
  UserAccountForm,
  useUserAccounts,
} from "../features/user-accounts";

export function AdminPage() {
  const { user } = useAuthenticatedSession();
  const isAdministrator = user.profileName === "Administrador";
  const [activeArea, setActiveArea] = useState<"accounts" | "audit">(
    "accounts",
  );
  const accounts = useUserAccounts(isAdministrator);

  if (!isAdministrator || accounts.status === "denied") {
    return (
      <AccessDeniedState
        message={
          accounts.errorMessage ??
          "A administração de contas é exclusiva do perfil Administrador."
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        action={
          activeArea === "accounts" ? (
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark focus:outline-none focus-visible:ring-3 focus-visible:ring-ink/30 disabled:cursor-wait disabled:opacity-60"
              disabled={
                accounts.pendingAction !== null || accounts.status !== "ready"
              }
              onClick={accounts.openForm}
              type="button"
            >
              <Icon name="plus" size={18} /> Nova conta
            </button>
          ) : undefined
        }
        description="Gerencie contas individuais e consulte a autoria histórica das ações protegidas do sistema."
        eyebrow="Administração integrada"
        title="Usuários e permissões"
      />

      <nav
        aria-label="Áreas administrativas"
        className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-ink/10 bg-white p-2 shadow-[0_8px_25px_rgba(1,36,40,0.04)]"
      >
        <AreaButton
          active={activeArea === "accounts"}
          label="Contas de acesso"
          onClick={() => setActiveArea("accounts")}
        />
        <AreaButton
          active={activeArea === "audit"}
          label="Trilha de auditoria"
          onClick={() => setActiveArea("audit")}
        />
      </nav>

      {activeArea === "accounts" && accounts.notice && (
        <div
          className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
          role="status"
        >
          <p>{accounts.notice}</p>
          <button
            className="shrink-0 rounded-md font-bold underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            onClick={() => accounts.setNotice(null)}
            type="button"
          >
            Fechar
          </button>
        </div>
      )}

      {activeArea === "accounts" &&
        accounts.errorMessage &&
        accounts.status !== "loading" && (
          <div
            className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
            role="alert"
          >
            <p>{accounts.errorMessage}</p>
            {accounts.status === "error" && (
              <button
                className="min-h-10 rounded-xl border border-red-300 px-4 font-bold focus:outline-none focus-visible:ring-3 focus-visible:ring-red-200"
                onClick={accounts.retry}
                type="button"
              >
                Tentar novamente
              </button>
            )}
          </div>
        )}

      {activeArea === "accounts" && accounts.formOpen && (
        <>
          {accounts.formError && (
            <div
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
              role="alert"
            >
              {accounts.formError}
            </div>
          )}
          <UserAccountForm
            busy={accounts.pendingAction !== null}
            onCancel={accounts.closeForm}
            onFieldChange={accounts.clearServerError}
            onSubmit={accounts.saveAccount}
            serverErrors={accounts.serverErrors}
          />
        </>
      )}

      {activeArea === "accounts" ? (
        <section className="mt-7 overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-[0_12px_35px_rgba(1,36,40,0.05)]">
          <div className="px-5 pt-5 sm:px-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
              Consulta autenticada
            </p>
            <h2 className="mt-1 font-display text-2xl text-ink">
              Contas do sistema
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/60">
              Pesquise por nome ou e-mail. Desativar revoga o acesso na próxima
              requisição protegida, mas preserva registros e autoria.
            </p>
          </div>
          <UserAccountFiltersForm
            disabled={
              accounts.pendingAction !== null || accounts.status === "loading"
            }
            draft={accounts.draft}
            error={accounts.filterError}
            onApply={accounts.applyFilters}
            onChange={accounts.setDraft}
            onClear={accounts.clearFilters}
          />
          <UserAccountCatalog
            onPageChange={accounts.goToPage}
            onToggle={(account) => void accounts.changeAccountState(account)}
            page={accounts.page}
            pendingAction={accounts.pendingAction}
            status={accounts.status}
          />
        </section>
      ) : (
        <AuditTrailPanel enabled={isAdministrator} />
      )}

      <aside className="mt-6 rounded-3xl border border-[#EFD780] bg-[#EFD780]/30 p-5 text-sm leading-6 text-ink/70 sm:p-6">
        <h2 className="font-display text-xl text-ink">Limites deste fluxo</h2>
        <p className="mt-2">
          A API atual permite criar, consultar, desativar e reativar contas.
          Alterar nome, e-mail, perfil ou senha existente e recuperar senha
          ainda não possui contrato. A auditoria é somente para consulta e não
          permite editar nem excluir eventos.
        </p>
      </aside>
    </div>
  );
}

function AreaButton({
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
      aria-current={active ? "page" : undefined}
      className={`min-h-11 rounded-xl px-4 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/30 ${
        active ? "bg-brand-soft/60 text-ink" : "text-ink/65 hover:bg-cream"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
