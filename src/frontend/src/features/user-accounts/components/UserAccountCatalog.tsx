import { useEffect, useState } from "react";

import { profileLabels } from "../../authentication";
import { Button } from "../../../components/ui/Button";
import { ContentState } from "../../../components/ui/ContentState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import type { UserAccount, UserAccountPage } from "../types";

interface UserAccountCatalogProps {
  onChangeProfile: (account: UserAccount, trigger: HTMLElement) => void;
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

const maximumTimerDelay = 2_147_483_647;

function accountInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("pt-BR") ?? "")
    .join("");
}

export function UserAccountCatalog({
  onChangeProfile,
  currentUserId,
  onPageChange,
  onResetCredential,
  onToggle,
  page,
  pendingAction,
  status,
}: UserAccountCatalogProps) {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    if (status !== "ready" || !page) return;

    const now = Date.now();
    const expirations = page.items.flatMap((account) => {
      if (
        !account.requiresPasswordChange ||
        !account.temporaryCredentialExpiresAtUtc
      ) {
        return [];
      }
      const timestamp = new Date(
        account.temporaryCredentialExpiresAtUtc,
      ).getTime();
      return Number.isFinite(timestamp) ? [timestamp] : [];
    });
    const stateIsBehind = expirations.some(
      (expiration) => expiration <= now && expiration > currentTime,
    );
    const nextExpiration = Math.min(
      ...expirations.filter((expiration) => expiration > now),
    );

    if (!stateIsBehind && !Number.isFinite(nextExpiration)) return;

    const delay = stateIsBehind
      ? 0
      : Math.min(maximumTimerDelay, Math.max(0, nextExpiration - now + 1));
    const timer = window.setTimeout(() => setCurrentTime(Date.now()), delay);
    return () => window.clearTimeout(timer);
  }, [currentTime, page, status]);

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
      <div className="account-catalog-grid grid gap-3 p-4 sm:p-5 md:grid-cols-2 2xl:hidden">
        {page.items.map((account) => (
          <AccountCard
            onChangeProfile={onChangeProfile}
            account={account}
            currentUserId={currentUserId}
            key={account.id}
            onResetCredential={onResetCredential}
            onToggle={onToggle}
            pendingAction={pendingAction}
            currentTime={currentTime}
          />
        ))}
      </div>
      <div className="account-table-shell hidden overflow-x-auto 2xl:block">
        <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
          <caption className="sr-only">Contas de acesso do sistema</caption>
          <thead>
            <tr className="account-table-heading border-b border-border bg-surface-subtle/55 text-[0.68rem] uppercase tracking-[0.12em] text-ink-soft">
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
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {page.items.map((account) => (
              <tr
                className="account-table-row border-b border-border/70 last:border-0 hover:bg-primary/[0.025]"
                data-account-status={account.active ? "active" : "inactive"}
                key={account.id}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="account-avatar grid size-9 shrink-0 place-items-center rounded-full bg-surface-subtle text-xs font-extrabold text-primary">
                      {accountInitials(account.name)}
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-ink">{account.name}</strong>
                      <span className="break-all text-xs text-ink-soft">
                        {account.email}
                      </span>
                    </span>
                  </div>
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
                  <CredentialStatus
                    account={account}
                    currentTime={currentTime}
                  />
                </td>
                <td className="px-4 py-4 text-ink-soft">
                  {dateFormatter.format(new Date(account.createdAtUtc))}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    {account.active && account.id !== currentUserId && (
                      <ProfileButton
                        account={account}
                        onChangeProfile={onChangeProfile}
                        pendingAction={pendingAction}
                      />
                    )}
                    {account.active &&
                      account.id !== currentUserId &&
                      account.authenticationMethod === "Local" && (
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
      <div className="institutional-catalog__footer flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
        <p aria-live="polite" className="text-sm text-ink-soft">
          Mostrando {page.items.length} de {page.totalCount} conta(s)
        </p>
        <p className="text-xs font-semibold text-ink-soft">
          Página {page.page} de {Math.max(page.totalPages, 1)}
        </p>
      </div>
      {page.totalPages > 1 && (
        <nav
          aria-label="Paginação das contas"
          className="flex items-center justify-between gap-4 border-t border-border px-5 py-4 sm:px-6"
        >
          <Button
            disabled={page.page <= 1 || pendingAction !== null}
            onClick={() => onPageChange(page.page - 1)}
            variant="secondary"
          >
            Anterior
          </Button>
          <Button
            disabled={page.page >= page.totalPages || pendingAction !== null}
            onClick={() => onPageChange(page.page + 1)}
            variant="secondary"
          >
            Próxima
          </Button>
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
    <Button
      className="px-3 text-xs"
      disabled={pendingAction !== null}
      onClick={() => onToggle(account)}
      variant={account.active ? "danger" : "secondary"}
    >
      {pending ? "Processando…" : account.active ? "Desativar" : "Reativar"}
    </Button>
  );
}

function AccountCard({
  onChangeProfile,
  account,
  currentUserId,
  onResetCredential,
  onToggle,
  pendingAction,
  currentTime,
}: {
  onChangeProfile: UserAccountCatalogProps["onChangeProfile"];
  account: UserAccount;
  currentUserId: number;
  onResetCredential: (account: UserAccount, trigger: HTMLElement) => void;
  onToggle: (account: UserAccount) => void;
  pendingAction: string | null;
  currentTime: number;
}) {
  return (
    <article
      className="account-card rounded-2xl border border-border bg-surface p-4"
      data-account-status={account.active ? "active" : "inactive"}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="account-avatar grid size-10 shrink-0 place-items-center rounded-full bg-surface-subtle text-xs font-extrabold text-primary">
            {accountInitials(account.name)}
          </span>
          <div className="min-w-0">
            <strong className="block text-ink">{account.name}</strong>
            <span className="break-all text-xs text-ink-soft">
              {account.email}
            </span>
          </div>
        </div>
        <StatusBadge
          label={account.active ? "Ativa" : "Desativada"}
          tone={account.active ? "success" : "neutral"}
        />
      </div>
      <div className="mt-3 border-t border-border pt-3">
        <CredentialStatus account={account} currentTime={currentTime} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className="text-sm font-semibold text-brand-dark">
          {profileLabels[account.profileName]}
        </span>
        <div className="flex flex-wrap justify-end gap-2">
          {account.active && account.id !== currentUserId && (
            <ProfileButton
              account={account}
              onChangeProfile={onChangeProfile}
              pendingAction={pendingAction}
            />
          )}
          {account.active &&
            account.id !== currentUserId &&
            account.authenticationMethod === "Local" && (
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
  currentTime,
}: {
  account: UserAccount;
  currentTime: number;
}) {
  if (account.authenticationMethod === "Google") {
    return (
      <span className="text-xs text-ink-soft">
        {account.externalIdentityLinked
          ? "Google vinculado"
          : "Google: vínculo pendente"}
      </span>
    );
  }
  if (!account.requiresPasswordChange) {
    return <span className="text-xs text-ink-soft">Sem troca pendente</span>;
  }

  const expiration = account.temporaryCredentialExpiresAtUtc;
  const expired = expiration
    ? new Date(expiration).getTime() <= currentTime
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

function ProfileButton({
  account,
  onChangeProfile,
  pendingAction,
}: {
  account: UserAccount;
  onChangeProfile: UserAccountCatalogProps["onChangeProfile"];
  pendingAction: string | null;
}) {
  return (
    <Button
      className="px-3 text-xs"
      data-profile-account-id={account.id}
      disabled={pendingAction !== null}
      onClick={(event) => onChangeProfile(account, event.currentTarget)}
      variant="secondary"
    >
      Alterar perfil
    </Button>
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
    <Button
      className="px-3 text-xs"
      data-reset-account-id={account.id}
      disabled={pendingAction !== null}
      onClick={(event) => onResetCredential(account, event.currentTarget)}
      variant="secondary"
    >
      {pending ? "Redefinindo…" : "Redefinir credencial"}
    </Button>
  );
}
