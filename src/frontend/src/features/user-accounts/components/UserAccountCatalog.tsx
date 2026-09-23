import { useState } from "react";

import { profileLabels } from "../../authentication";
import { ContentState } from "../../../components/ui/ContentState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import type { UserAccount, UserAccountPage } from "../types";

interface UserAccountCatalogProps {
  currentUserId: number;
  onPageChange: (page: number) => void;
  onResetCredential: (account: UserAccount, trigger: HTMLElement) => void;
  onToggle: (account: UserAccount) => void;
  page: UserAccountPage | null;
  pendingAction: string | null;
  status: "idle" | "loading" | "ready" | "error" | "denied" | "filter-error";
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
});

const credentialExpirationFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function UserAccountCatalog({
  currentUserId,
  onPageChange,
  onResetCredential,
  onToggle,
  page,
  pendingAction,
  status,
}: UserAccountCatalogProps) {
  const [renderedAt] = useState(() => Date.now());
  if (status === "loading") {
    return (
      <ContentState
        className="m-5 sm:m-6"
        title="Carregando contas…"
        variant="loading"
      />
    );
  }
  if (status !== "ready" || !page) return null;
  if (page.items.length === 0) {
    return (
      <ContentState
        className="m-5 sm:m-6"
        description="Ajuste os filtros ou crie uma nova conta individual."
        icon="users"
        title="Nenhuma conta encontrada"
        variant="empty"
      />
    );
  }

  return (
    <>
      <p className="px-5 pt-5 text-sm text-ink-soft sm:px-6">
        {page.totalCount} conta(s) encontrada(s)
      </p>
      <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-2 xl:hidden">
        {page.items.map((account) => (
          <AccountCard
            account={account}
            currentUserId={currentUserId}
            key={account.id}
            onResetCredential={onResetCredential}
            onToggle={onToggle}
            pendingAction={pendingAction}
            renderedAt={renderedAt}
          />
        ))}
      </div>
      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
          <caption className="sr-only">Contas de acesso do sistema</caption>
          <thead>
            <tr className="border-b border-ink/10 text-[0.68rem] uppercase tracking-[0.12em] text-ink-soft">
              <th className="px-6 py-3" scope="col">
                Usuário
              </th>
              <th className="px-4 py-3" scope="col">
                Perfil
              </th>
              <th className="px-4 py-3" scope="col">
                Situação
              </th>
              <th className="px-4 py-3" scope="col">
                Credencial
              </th>
              <th className="px-4 py-3" scope="col">
                Criada em
              </th>
              <th className="px-6 py-3 text-right" scope="col">
                Ação
              </th>
            </tr>
          </thead>
          <tbody>
            {page.items.map((account) => (
              <tr
                className="border-b border-ink/6 last:border-0"
                key={account.id}
              >
                <td className="px-6 py-4">
                  <strong className="block text-ink">{account.name}</strong>
                  <span className="text-xs text-ink-soft">{account.email}</span>
                </td>
                <td className="px-4 py-4 text-ink-soft">
                  {profileLabels[account.profileName]}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge
                    label={account.active ? "Ativa" : "Desativada"}
                    tone={account.active ? "success" : "neutral"}
                  />
                </td>
                <td className="px-4 py-4">
                  <CredentialStatus account={account} renderedAt={renderedAt} />
                </td>
                <td className="px-4 py-4 text-ink-soft">
                  {dateFormatter.format(new Date(account.createdAtUtc))}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {account.active && account.id !== currentUserId && (
                      <ResetButton
                        account={account}
                        onResetCredential={onResetCredential}
                        pendingAction={pendingAction}
                      />
                    )}
                    <ToggleButton
                      account={account}
                      onToggle={onToggle}
                      pendingAction={pendingAction}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {page.totalPages > 1 && (
        <nav
          aria-label="Paginação das contas"
          className="flex items-center justify-between gap-4 border-t border-ink/8 px-5 py-4 sm:px-6"
        >
          <button
            className="min-h-10 rounded-xl border border-ink/15 px-4 text-sm font-bold disabled:opacity-45"
            disabled={page.page <= 1 || pendingAction !== null}
            onClick={() => onPageChange(page.page - 1)}
            type="button"
          >
            Anterior
          </button>
          <span className="text-sm text-ink-soft">
            Página {page.page} de {page.totalPages}
          </span>
          <button
            className="min-h-10 rounded-xl border border-ink/15 px-4 text-sm font-bold disabled:opacity-45"
            disabled={page.page >= page.totalPages || pendingAction !== null}
            onClick={() => onPageChange(page.page + 1)}
            type="button"
          >
            Próxima
          </button>
        </nav>
      )}
    </>
  );
}

function ToggleButton({
  account,
  onToggle,
  pendingAction,
}: {
  account: UserAccount;
  onToggle: (account: UserAccount) => void;
  pendingAction: string | null;
}) {
  const pending = pendingAction?.endsWith(`-${account.id}`) ?? false;
  return (
    <button
      className="min-h-10 rounded-xl border border-ink/15 px-3 text-xs font-bold text-ink hover:bg-cream disabled:cursor-wait disabled:opacity-60"
      disabled={pendingAction !== null}
      onClick={() => onToggle(account)}
      type="button"
    >
      {pending ? "Processando…" : account.active ? "Desativar" : "Reativar"}
    </button>
  );
}

function AccountCard({
  account,
  currentUserId,
  onResetCredential,
  onToggle,
  pendingAction,
  renderedAt,
}: {
  account: UserAccount;
  currentUserId: number;
  onResetCredential: (account: UserAccount, trigger: HTMLElement) => void;
  onToggle: (account: UserAccount) => void;
  pendingAction: string | null;
  renderedAt: number;
}) {
  return (
    <article className="rounded-2xl border border-ink/10 bg-cream/25 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <strong className="block text-ink">{account.name}</strong>
          <span className="break-all text-xs text-ink-soft">
            {account.email}
          </span>
        </div>
        <StatusBadge
          label={account.active ? "Ativa" : "Desativada"}
          tone={account.active ? "success" : "neutral"}
        />
      </div>
      <div className="mt-3 border-t border-ink/8 pt-3">
        <CredentialStatus account={account} renderedAt={renderedAt} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-ink/8 pt-3">
        <span className="text-sm font-semibold text-brand-dark">
          {profileLabels[account.profileName]}
        </span>
        <div className="flex flex-wrap justify-end gap-2">
          {account.active && account.id !== currentUserId && (
            <ResetButton
              account={account}
              onResetCredential={onResetCredential}
              pendingAction={pendingAction}
            />
          )}
          <ToggleButton
            account={account}
            onToggle={onToggle}
            pendingAction={pendingAction}
          />
        </div>
      </div>
    </article>
  );
}

function CredentialStatus({
  account,
  renderedAt,
}: {
  account: UserAccount;
  renderedAt: number;
}) {
  if (!account.requiresPasswordChange) {
    return <span className="text-xs text-ink-soft">Sem troca pendente</span>;
  }

  const expiration = account.temporaryCredentialExpiresAtUtc;
  const expired = expiration
    ? new Date(expiration).getTime() <= renderedAt
    : false;
  return (
    <div className="space-y-1">
      <StatusBadge
        label={expired ? "Credencial expirada" : "Troca obrigatória pendente"}
        tone={expired ? "warning" : "neutral"}
      />
      {expiration && (
        <p className="text-xs text-ink-soft">
          {expired ? "Expirou em" : "Expira em"}{" "}
          {credentialExpirationFormatter.format(new Date(expiration))}
        </p>
      )}
    </div>
  );
}

function ResetButton({
  account,
  onResetCredential,
  pendingAction,
}: {
  account: UserAccount;
  onResetCredential: (account: UserAccount, trigger: HTMLElement) => void;
  pendingAction: string | null;
}) {
  const pending = pendingAction === `reset-${account.id}`;
  return (
    <button
      className="min-h-10 rounded-xl border border-brand-dark/25 px-3 text-xs font-bold text-ink hover:bg-brand-soft/25 focus:outline-none focus-visible:ring-3 focus-visible:ring-brand/30 disabled:cursor-wait disabled:opacity-60"
      data-reset-account-id={account.id}
      disabled={pendingAction !== null}
      onClick={(event) => onResetCredential(account, event.currentTarget)}
      type="button"
    >
      {pending ? "Redefinindo…" : "Redefinir credencial"}
    </button>
  );
}
