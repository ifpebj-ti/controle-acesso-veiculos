import { profileLabels } from "../../authentication";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import type { UserAccount, UserAccountPage } from "../types";

interface UserAccountCatalogProps {
  onPageChange: (page: number) => void;
  onToggle: (account: UserAccount) => void;
  page: UserAccountPage | null;
  pendingAction: string | null;
  status: "idle" | "loading" | "ready" | "error" | "denied" | "filter-error";
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
});

export function UserAccountCatalog({
  onPageChange,
  onToggle,
  page,
  pendingAction,
  status,
}: UserAccountCatalogProps) {
  if (status === "loading") {
    return (
      <p className="p-6 text-sm font-semibold text-ink/60" role="status">
        Carregando contas…
      </p>
    );
  }
  if (status !== "ready" || !page) return null;
  if (page.items.length === 0) {
    return (
      <div className="p-8 text-center">
        <h3 className="font-display text-2xl text-ink">
          Nenhuma conta encontrada
        </h3>
        <p className="mt-2 text-sm text-ink/60">
          Ajuste os filtros ou crie uma nova conta individual.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="px-5 pt-5 text-sm text-ink/60 sm:px-6">
        {page.totalCount} conta(s) encontrada(s)
      </p>
      <div className="space-y-3 p-4 md:hidden">
        {page.items.map((account) => (
          <AccountCard
            account={account}
            key={account.id}
            onToggle={onToggle}
            pendingAction={pendingAction}
          />
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[54rem] border-collapse text-left text-sm">
          <caption className="sr-only">Contas de acesso do sistema</caption>
          <thead>
            <tr className="border-b border-ink/10 text-[0.68rem] uppercase tracking-[0.12em] text-ink/50">
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
                  <span className="text-xs text-ink/55">{account.email}</span>
                </td>
                <td className="px-4 py-4 text-ink/70">
                  {profileLabels[account.profileName]}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge
                    label={account.active ? "Ativa" : "Desativada"}
                    tone={account.active ? "success" : "neutral"}
                  />
                </td>
                <td className="px-4 py-4 text-ink/65">
                  {dateFormatter.format(new Date(account.createdAtUtc))}
                </td>
                <td className="px-6 py-4 text-right">
                  <ToggleButton
                    account={account}
                    onToggle={onToggle}
                    pendingAction={pendingAction}
                  />
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
          <span className="text-sm text-ink/60">
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
  onToggle,
  pendingAction,
}: {
  account: UserAccount;
  onToggle: (account: UserAccount) => void;
  pendingAction: string | null;
}) {
  return (
    <article className="rounded-2xl border border-ink/10 bg-cream/25 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <strong className="block text-ink">{account.name}</strong>
          <span className="break-all text-xs text-ink/55">{account.email}</span>
        </div>
        <StatusBadge
          label={account.active ? "Ativa" : "Desativada"}
          tone={account.active ? "success" : "neutral"}
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-ink/8 pt-3">
        <span className="text-sm font-semibold text-brand-dark">
          {profileLabels[account.profileName]}
        </span>
        <ToggleButton
          account={account}
          onToggle={onToggle}
          pendingAction={pendingAction}
        />
      </div>
    </article>
  );
}
