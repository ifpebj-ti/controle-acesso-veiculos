import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
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
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark focus:outline-none focus-visible:ring-3 focus-visible:ring-ink/30 disabled:cursor-wait disabled:opacity-60"
            disabled={accounts.pendingAction !== null}
            onClick={accounts.openForm}
            type="button"
          >
            <Icon name="plus" size={18} /> Nova conta
          </button>
        }
        description="Crie contas individuais e controle seu estado sem apagar a autoria histórica. Perfis e senhas existentes não são alterados por este fluxo."
        eyebrow="Administração integrada"
        title="Usuários e permissões"
      />

      {accounts.notice && (
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

      {accounts.errorMessage && accounts.status !== "loading" && (
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

      {accounts.formOpen && (
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

      <aside className="mt-6 rounded-3xl border border-[#EFD780] bg-[#EFD780]/30 p-5 text-sm leading-6 text-ink/70 sm:p-6">
        <h2 className="font-display text-xl text-ink">Limites deste fluxo</h2>
        <p className="mt-2">
          A API atual permite criar, consultar, desativar e reativar contas.
          Alterar nome, e-mail, perfil ou senha existente e recuperar senha
          ainda não possui contrato. A trilha de auditoria será integrada em uma
          entrega separada.
        </p>
      </aside>
    </div>
  );
}
