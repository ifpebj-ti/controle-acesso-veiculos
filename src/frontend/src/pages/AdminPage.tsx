import { useState } from "react";

import { AccessDeniedState } from "../components/ui/AccessDeniedState";
import { ActionFeedback } from "../components/ui/ActionFeedback";
import { Button } from "../components/ui/Button";
import { ContentState } from "../components/ui/ContentState";
import { Icon } from "../components/ui/Icon";
import { MetricCard, type MetricCardTone } from "../components/ui/MetricCard";
import { PageHeader } from "../components/ui/PageHeader";
import { SectionHeader } from "../components/ui/SectionHeader";
import { AuditTrailPanel } from "../features/audit-trail";
import {
  profileLabels,
  useAuthenticatedSession,
} from "../features/authentication";
import {
  CredentialResetDialog,
  TemporaryCredentialDialog,
  UserAccountCatalog,
  UserAccountFiltersForm,
  UserAccountForm,
  type UserAccountPage,
  useUserAccounts,
} from "../features/user-accounts";
import { profileHasCapability } from "../routes/routeMetadata";

export function AdminPage() {
  const { user } = useAuthenticatedSession();
  const isAdministrator = profileHasCapability(
    user.profileName,
    "manage-administration",
  );

  if (!isAdministrator) {
    return (
      <AccessDeniedState message="A administração de contas é exclusiva do perfil Administrador." />
    );
  }

  return <AdministratorPage currentUserId={user.id} />;
}

function AdministratorPage({ currentUserId }: { currentUserId: number }) {
  const [activeArea, setActiveArea] = useState<"accounts" | "audit">(
    "accounts",
  );
  const accounts = useUserAccounts();

  if (accounts.status === "denied") {
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
            <Button
              disabled={
                accounts.pendingAction !== null || accounts.status !== "ready"
              }
              onClick={(event) => accounts.openForm(event.currentTarget)}
            >
              <Icon name="plus" size={18} /> Nova conta
            </Button>
          ) : undefined
        }
        description="Gerencie contas individuais e consulte a autoria histórica das ações protegidas do sistema."
        eyebrow="Administração integrada"
        title="Usuários e permissões"
        variant="prominent"
      />

      <nav
        aria-label="Áreas administrativas"
        className="admin-area-tabs mt-6 flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1"
      >
        <AreaButton
          active={activeArea === "accounts"}
          icon="users"
          label="Contas de acesso"
          onClick={() => setActiveArea("accounts")}
        />
        <AreaButton
          active={activeArea === "audit"}
          icon="history"
          label="Trilha de auditoria"
          onClick={() => setActiveArea("audit")}
        />
      </nav>

      {activeArea === "accounts" && accounts.notice && (
        <ActionFeedback
          className="mt-6"
          floating
          focusOnChange
          message={accounts.notice}
          onDismiss={() => accounts.setNotice(null)}
          tone="success"
        />
      )}

      {activeArea === "accounts" &&
        accounts.errorMessage &&
        accounts.status !== "loading" && (
          <ContentState
            action={
              accounts.status === "error" ? (
                <button
                  className="min-h-10 rounded-xl border border-red-300 px-4 font-bold focus:outline-none focus-visible:ring-3 focus-visible:ring-red-700/30"
                  onClick={accounts.retry}
                  type="button"
                >
                  Tentar novamente
                </button>
              ) : undefined
            }
            className="mt-6"
            title={accounts.errorMessage}
            variant="error"
          />
        )}

      {activeArea === "accounts" && accounts.formOpen && (
        <UserAccountForm
          busy={accounts.pendingAction !== null}
          formError={accounts.formError}
          onCancel={accounts.closeForm}
          onFieldChange={accounts.clearServerError}
          onSubmit={accounts.saveAccount}
          serverErrors={accounts.serverErrors}
        />
      )}

      {activeArea === "accounts" ? (
        <>
          <UserAccountSummary page={accounts.page} status={accounts.status} />
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
          <section className="institutional-catalog mt-4 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_24px_rgba(1,36,40,0.035)]">
            <SectionHeader
              className="px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6"
              description="Pesquise por nome ou e-mail. Desativar revoga o acesso na próxima requisição protegida, mas preserva registros e autoria."
              eyebrow="Administração de acessos"
              title="Contas do sistema"
            />
            <UserAccountCatalog
              currentUserId={currentUserId}
              onPageChange={accounts.goToPage}
              onResetCredential={accounts.openCredentialReset}
              onToggle={(account) => void accounts.changeAccountState(account)}
              page={accounts.page}
              pendingAction={accounts.pendingAction}
              status={accounts.status}
            />
          </section>
        </>
      ) : (
        <AuditTrailPanel enabled />
      )}

      <aside className="admin-guidance mt-6 rounded-2xl border border-warning-border bg-warning-surface p-5 text-sm leading-6 text-ink-soft sm:p-6">
        <h2 className="font-display text-xl text-ink">Orientação importante</h2>
        <p className="mt-2">
          Ao criar uma conta ou redefinir uma credencial, entregue a credencial
          temporária diretamente à pessoa responsável, usando o canal
          institucional definido pela equipe. O histórico de atividades fica
          disponível apenas para consulta e não pode ser alterado ou apagado.
        </p>
      </aside>

      {accounts.resetTarget && (
        <CredentialResetDialog
          account={accounts.resetTarget}
          busy={accounts.pendingAction === `reset-${accounts.resetTarget.id}`}
          errorMessage={accounts.resetError}
          onCancel={accounts.closeCredentialReset}
          onConfirm={accounts.confirmCredentialReset}
          returnFocusTo={accounts.resetReturnFocusTo}
        />
      )}

      {accounts.credentialDisclosure && (
        <TemporaryCredentialDialog
          accountId={accounts.credentialDisclosure.accountId}
          accountName={accounts.credentialDisclosure.accountName}
          credential={accounts.credentialDisclosure.credential}
          onClose={accounts.closeCredentialDisclosure}
          returnFocusTo={accounts.credentialDisclosure.returnFocusTo}
        />
      )}
    </div>
  );
}

function AreaButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: "history" | "users";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-5 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/30 ${
        active
          ? "bg-primary text-primary-text shadow-sm"
          : "text-primary hover:bg-primary/5"
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon name={icon} size={17} />
      {label}
    </button>
  );
}

function UserAccountSummary({
  page,
  status,
}: {
  page: UserAccountPage | null;
  status: "idle" | "loading" | "ready" | "error" | "denied" | "filter-error";
}) {
  if (status !== "ready" || !page) return null;

  const activeOnPage = page.items.filter((account) => account.active).length;
  const inactiveOnPage = page.items.length - activeOnPage;
  const profileNames = Object.values(profileLabels);
  const metrics = [
    {
      description: "nos filtros aplicados",
      icon: "users" as const,
      label: "Total de contas",
      tone: "forest" as MetricCardTone,
      value: page.totalCount,
    },
    {
      description: "na página atual",
      icon: "user" as const,
      label: "Contas ativas",
      tone: "leaf" as MetricCardTone,
      value: activeOnPage,
    },
    {
      description: "na página atual",
      icon: "x" as const,
      label: "Contas inativas",
      tone: "red" as MetricCardTone,
      value: inactiveOnPage,
    },
    {
      description: profileNames.join(", "),
      icon: "shield" as const,
      label: "Perfis de acesso",
      tone: "teal" as MetricCardTone,
      value: profileNames.length,
    },
  ];

  return (
    <section
      aria-label="Resumo das contas de acesso"
      className="institutional-metric-grid mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {metrics.map((metric) => (
        <MetricCard
          description={metric.description}
          icon={metric.icon}
          key={metric.label}
          label={metric.label}
          tone={metric.tone}
          value={metric.value}
        />
      ))}
    </section>
  );
}
