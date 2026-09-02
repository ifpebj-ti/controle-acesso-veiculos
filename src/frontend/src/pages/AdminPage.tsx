import { useState, type FormEvent } from "react";

import { Icon } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { RestrictedDemoState } from "../components/ui/RestrictedDemoState";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useDemo } from "../demo";

interface DemoAccount {
  id: number;
  name: string;
  username: string;
  role: "Administrador" | "Porteiro" | "Setor de Transporte" | "Vigilante";
  active: boolean;
}

const initialAccounts: DemoAccount[] = [
  {
    id: 1,
    name: "Conta administrativa",
    username: "admin.demo",
    role: "Administrador",
    active: true,
  },
  {
    id: 2,
    name: "Conta da portaria 01",
    username: "porteiro.demo",
    role: "Porteiro",
    active: true,
  },
  {
    id: 3,
    name: "Conta da vigilância 01",
    username: "vigilante.demo",
    role: "Vigilante",
    active: true,
  },
  {
    id: 4,
    name: "Conta do transporte",
    username: "transporte.demo",
    role: "Setor de Transporte",
    active: true,
  },
];

const permissionRows = [
  ["Registrar entrada e saída", "Permitido", "Permitido", "—", "—"],
  [
    "Consultar histórico geral",
    "Permitido",
    "Permitido",
    "Permitido",
    "Permitido",
  ],
  ["Conferir frota e eventos", "Leitura", "Leitura", "Gerencia", "—"],
  ["Gerenciar pessoas autorizadas", "—", "—", "—", "Permitido"],
  ["Gerenciar contas e permissões", "—", "—", "—", "Permitido"],
];

export function AdminPage() {
  const {
    addAuthorizedPerson,
    authorizedPeople,
    profile,
    toggleAuthorizedPerson,
  } = useDemo();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [formOpen, setFormOpen] = useState(false);
  const [personFormOpen, setPersonFormOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (profile !== "administrador") {
    return (
      <RestrictedDemoState message="Gestão de usuários e permissões é uma área exclusiva do perfil Administrador." />
    );
  }

  function addAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setAccounts((current) => [
      ...current,
      {
        active: true,
        id: Date.now(),
        name: String(data.get("name")),
        role: String(data.get("role")) as DemoAccount["role"],
        username: String(data.get("username"))
          .trim()
          .toLocaleLowerCase("pt-BR"),
      },
    ]);
    setFormOpen(false);
    setNotice(
      "Conta adicionada somente ao protótipo. Nenhuma credencial foi criada.",
    );
  }

  function toggleAccount(account: DemoAccount) {
    setAccounts((current) =>
      current.map((item) =>
        item.id === account.id ? { ...item, active: !item.active } : item,
      ),
    );
    setNotice(
      `Conta ${account.active ? "desativada" : "reativada"} somente nesta demonstração.`,
    );
  }

  function addPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    addAuthorizedPerson({
      category: String(data.get("category")) as
        "Servidor" | "Terceirizado" | "Cadastrado",
      name: String(data.get("name")),
      registration: String(data.get("registration")),
      sector: String(data.get("sector")),
      vehicles: [
        {
          label: String(data.get("vehicleLabel")),
          plate: String(data.get("plate")).trim().toUpperCase(),
        },
      ],
    });
    setPersonFormOpen(false);
    setNotice(
      "Pessoa e veículo adicionados somente ao protótipo. Nenhum dado foi enviado.",
    );
  }

  const fieldClass =
    "mt-2 min-h-11 w-full rounded-xl border border-ink/18 bg-cream/45 px-3.5 text-sm text-ink outline-none focus:border-brand-dark focus:bg-white focus:ring-3 focus:ring-brand/20";

  return (
    <div>
      <PageHeader
        action={
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand-dark/25 bg-white px-5 text-sm font-bold text-brand-dark hover:bg-[#B8C9A4]/25 focus:outline-none focus-visible:ring-3 focus-visible:ring-ink/30"
              onClick={() => setPersonFormOpen((current) => !current)}
              type="button"
            >
              <Icon name="plus" size={18} />
              Cadastrar pessoa
            </button>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark focus:outline-none focus-visible:ring-3 focus-visible:ring-ink/30"
              onClick={() => setFormOpen((current) => !current)}
              type="button"
            >
              <Icon name="plus" size={18} />
              Nova conta
            </button>
          </div>
        }
        description="Mantenha separadamente as pessoas autorizadas a entrar no campus e as contas dos funcionários que utilizam o sistema."
        eyebrow="Administração"
        title="Usuários e permissões"
      />

      {notice && (
        <div
          className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
          role="status"
        >
          <p>{notice}</p>
          <button
            className="font-bold underline underline-offset-4"
            onClick={() => setNotice(null)}
            type="button"
          >
            Fechar
          </button>
        </div>
      )}

      <section
        className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Resumo de contas"
      >
        {[
          [
            "Contas ativas",
            accounts.filter((account) => account.active).length,
            "users",
            "bg-[#BDD8F1]/45",
          ],
          ["Perfis configurados", 4, "shield", "bg-[#C8CE72]/30"],
          [
            "Contas desativadas",
            accounts.filter((account) => !account.active).length,
            "history",
            "bg-[#EFD780]/30",
          ],
          [
            "Pessoas autorizadas",
            authorizedPeople.filter((person) => person.active).length,
            "user",
            "bg-[#B8C9A4]/35",
          ],
        ].map(([label, value, icon, surface]) => (
          <article
            className={`rounded-2xl border border-ink/8 p-5 ${surface}`}
            key={label}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink/65">{label}</p>
              <span className="grid size-10 place-items-center rounded-xl bg-white/75 text-ink">
                <Icon name={icon as "history" | "shield" | "user" | "users"} />
              </span>
            </div>
            <p className="mt-4 font-display text-4xl text-ink">{value}</p>
          </article>
        ))}
      </section>

      {personFormOpen && (
        <form
          className="mt-6 rounded-[2rem] border border-brand-dark/20 bg-[#B8C9A4]/25 p-5 sm:p-6"
          onSubmit={addPerson}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
                Cadastro de acesso recorrente
              </p>
              <h2 className="mt-1 font-display text-2xl text-ink">
                Pessoa com acesso recorrente
              </h2>
              <p className="mt-2 text-sm text-ink/60">
                O porteiro localizará esta pessoa pelo nome e apenas conferirá o
                veículo na entrada.
              </p>
            </div>
            <button
              aria-label="Fechar formulário"
              className="grid size-10 place-items-center rounded-full bg-white text-ink"
              onClick={() => setPersonFormOpen(false)}
              type="button"
            >
              <Icon name="x" />
            </button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label
                className="text-sm font-semibold text-ink"
                htmlFor="person-name"
              >
                Nome completo
              </label>
              <input
                className={fieldClass}
                id="person-name"
                name="name"
                placeholder="Pessoa demonstrativa"
                required
              />
            </div>
            <div>
              <label
                className="text-sm font-semibold text-ink"
                htmlFor="person-category"
              >
                Vínculo
              </label>
              <select
                className={fieldClass}
                id="person-category"
                name="category"
                required
              >
                <option>Servidor</option>
                <option>Terceirizado</option>
                <option>Cadastrado</option>
              </select>
            </div>
            <div>
              <label
                className="text-sm font-semibold text-ink"
                htmlFor="person-registration"
              >
                Matrícula funcional
              </label>
              <input
                className={fieldClass}
                id="person-registration"
                name="registration"
                placeholder="Matrícula demonstrativa"
                required
              />
            </div>
            <div>
              <label
                className="text-sm font-semibold text-ink"
                htmlFor="person-sector"
              >
                Setor ou empresa
              </label>
              <input
                className={fieldClass}
                id="person-sector"
                name="sector"
                placeholder="Setor demonstrativo"
                required
              />
            </div>
            <div>
              <label
                className="text-sm font-semibold text-ink"
                htmlFor="person-plate"
              >
                Placa do veículo
              </label>
              <input
                autoCapitalize="characters"
                className={fieldClass}
                id="person-plate"
                maxLength={8}
                name="plate"
                placeholder="DEM-0000"
                required
              />
            </div>
            <div>
              <label
                className="text-sm font-semibold text-ink"
                htmlFor="person-vehicle-label"
              >
                Identificação do veículo
              </label>
              <input
                className={fieldClass}
                id="person-vehicle-label"
                name="vehicleLabel"
                placeholder="Automóvel pessoal"
                required
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              className="min-h-11 rounded-xl bg-ink px-5 text-sm font-bold text-white hover:bg-brand-dark"
              type="submit"
            >
              Salvar pessoa e veículo
            </button>
          </div>
        </form>
      )}

      {formOpen && (
        <form
          className="mt-6 rounded-[2rem] border border-brand-dark/20 bg-[#B8C9A4]/25 p-5 sm:p-6"
          onSubmit={addAccount}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
                Nova conta
              </p>
              <h2 className="mt-1 font-display text-2xl text-ink">
                Identificação do funcionário
              </h2>
            </div>
            <button
              aria-label="Fechar formulário"
              className="grid size-10 place-items-center rounded-full bg-white text-ink"
              onClick={() => setFormOpen(false)}
              type="button"
            >
              <Icon name="x" />
            </button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div>
              <label
                className="text-sm font-semibold text-ink"
                htmlFor="account-name"
              >
                Nome de exibição
              </label>
              <input
                className={fieldClass}
                id="account-name"
                name="name"
                placeholder="Funcionário de demonstração"
                required
              />
            </div>
            <div>
              <label
                className="text-sm font-semibold text-ink"
                htmlFor="account-username"
              >
                Usuário
              </label>
              <input
                autoCapitalize="none"
                className={fieldClass}
                id="account-username"
                name="username"
                placeholder="usuario.demo"
                required
              />
            </div>
            <div>
              <label
                className="text-sm font-semibold text-ink"
                htmlFor="account-role"
              >
                Tipo de acesso
              </label>
              <select
                className={fieldClass}
                id="account-role"
                name="role"
                required
              >
                <option>Porteiro</option>
                <option>Vigilante</option>
                <option>Setor de Transporte</option>
                <option>Administrador</option>
              </select>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              className="min-h-11 rounded-xl bg-ink px-5 text-sm font-bold text-white hover:bg-brand-dark"
              type="submit"
            >
              Criar conta demonstrativa
            </button>
          </div>
        </form>
      )}

      <section className="mt-6 overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-[0_12px_35px_rgba(1,36,40,0.05)]">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink/8 px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
              Acesso recorrente ao campus
            </p>
            <h2 className="mt-1 font-display text-2xl text-ink">
              Servidores, terceirizados e cadastrados
            </h2>
            <p className="mt-2 text-sm text-ink/55">
              Estes cadastros não criam usuário ou senha para o sistema.
            </p>
          </div>
          <p className="text-xs text-ink/55">Dados inteiramente fictícios</p>
        </div>

        <div className="grid gap-3 p-4 md:hidden">
          {authorizedPeople.map((person) => (
            <article
              className="rounded-2xl border border-ink/10 bg-cream/25 p-4"
              key={person.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong className="block text-ink">{person.name}</strong>
                  <span className="text-xs text-ink/55">
                    {person.category} • {person.sector}
                  </span>
                </div>
                <StatusBadge
                  label={person.active ? "Ativo" : "Inativo"}
                  tone={person.active ? "success" : "neutral"}
                />
              </div>
              <p className="mt-3 text-sm font-semibold text-brand-dark">
                {person.vehicles.map((vehicle) => vehicle.plate).join(" • ")}
              </p>
              <button
                className="mt-4 min-h-9 w-full rounded-xl border border-ink/15 px-3 text-xs font-bold text-ink"
                onClick={() => toggleAuthorizedPerson(person.id)}
                type="button"
              >
                {person.active ? "Desativar cadastro" : "Reativar cadastro"}
              </button>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              Pessoas autorizadas e veículos previamente cadastrados
            </caption>
            <thead>
              <tr className="border-b border-ink/10 text-[0.68rem] uppercase tracking-[0.12em] text-ink/50">
                <th className="px-6 py-3" scope="col">
                  Pessoa
                </th>
                <th className="px-4 py-3" scope="col">
                  Vínculo
                </th>
                <th className="px-4 py-3" scope="col">
                  Setor ou empresa
                </th>
                <th className="px-4 py-3" scope="col">
                  Veículo(s)
                </th>
                <th className="px-4 py-3" scope="col">
                  Situação
                </th>
                <th className="px-6 py-3 text-right" scope="col">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {authorizedPeople.map((person) => (
                <tr
                  className="border-b border-ink/6 last:border-0 hover:bg-cream/25"
                  key={person.id}
                >
                  <td className="px-6 py-4">
                    <strong className="block text-ink">{person.name}</strong>
                    <span className="text-xs text-ink/50">
                      {person.registration}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-ink/70">{person.category}</td>
                  <td className="px-4 py-4 text-ink/70">{person.sector}</td>
                  <td className="px-4 py-4 font-semibold text-brand-dark">
                    {person.vehicles.map((vehicle) => vehicle.plate).join(", ")}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge
                      label={person.active ? "Ativo" : "Inativo"}
                      tone={person.active ? "success" : "neutral"}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="min-h-9 rounded-xl border border-ink/15 px-3 text-xs font-bold text-ink hover:bg-cream"
                      onClick={() => toggleAuthorizedPerson(person.id)}
                      type="button"
                    >
                      {person.active ? "Desativar" : "Reativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-[0_12px_35px_rgba(1,36,40,0.05)]">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink/8 px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
              Acesso individual
            </p>
            <h2 className="mt-1 font-display text-2xl text-ink">
              Contas do sistema
            </h2>
          </div>
          <p className="text-xs text-ink/55">Dados inteiramente fictícios</p>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {accounts.map((account) => (
            <article
              className="rounded-2xl border border-ink/10 bg-cream/25 p-4"
              key={account.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong className="block text-ink">{account.name}</strong>
                  <span className="text-xs text-ink/55">
                    @{account.username}
                  </span>
                </div>
                <StatusBadge
                  label={account.active ? "Ativa" : "Desativada"}
                  tone={account.active ? "success" : "neutral"}
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-ink/8 pt-3">
                <span className="text-sm font-semibold text-brand-dark">
                  {account.role}
                </span>
                <button
                  className="min-h-9 rounded-xl border border-ink/15 px-3 text-xs font-bold text-ink"
                  onClick={() => toggleAccount(account)}
                  type="button"
                >
                  {account.active ? "Desativar" : "Reativar"}
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
            <caption className="sr-only">Contas fictícias do sistema</caption>
            <thead>
              <tr className="border-b border-ink/10 text-[0.68rem] uppercase tracking-[0.12em] text-ink/50">
                <th className="px-6 py-3" scope="col">
                  Funcionário
                </th>
                <th className="px-4 py-3" scope="col">
                  Usuário
                </th>
                <th className="px-4 py-3" scope="col">
                  Perfil
                </th>
                <th className="px-4 py-3" scope="col">
                  Situação
                </th>
                <th className="px-6 py-3 text-right" scope="col">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr
                  className="border-b border-ink/6 last:border-0 hover:bg-cream/25"
                  key={account.id}
                >
                  <td className="px-6 py-4 font-semibold text-ink">
                    {account.name}
                  </td>
                  <td className="px-4 py-4 text-ink/65">@{account.username}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-[#B8C9A4]/35 px-3 py-1 text-xs font-bold text-ink">
                      {account.role}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge
                      label={account.active ? "Ativa" : "Desativada"}
                      tone={account.active ? "success" : "neutral"}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="min-h-9 rounded-xl border border-ink/15 px-3 text-xs font-bold text-ink hover:bg-cream"
                      onClick={() => toggleAccount(account)}
                      type="button"
                    >
                      {account.active ? "Desativar" : "Reativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-ink/10 bg-white p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
          Referência
        </p>
        <h2 className="mt-1 font-display text-2xl text-ink">
          Matriz de permissões proposta
        </h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[48rem] border-collapse text-center text-sm">
            <caption className="sr-only">
              Permissões propostas por perfil
            </caption>
            <thead>
              <tr className="border-b border-ink/10 text-xs text-ink/55">
                <th className="px-3 py-3 text-left" scope="col">
                  Função
                </th>
                <th className="px-3 py-3" scope="col">
                  Porteiro
                </th>
                <th className="px-3 py-3" scope="col">
                  Vigilante
                </th>
                <th className="px-3 py-3" scope="col">
                  Transporte
                </th>
                <th className="px-3 py-3" scope="col">
                  Administrador
                </th>
              </tr>
            </thead>
            <tbody>
              {permissionRows.map((row) => (
                <tr
                  className="border-b border-ink/6 last:border-0"
                  key={row[0]}
                >
                  {row.map((cell, index) => (
                    <td
                      className={`px-3 py-3 ${index === 0 ? "text-left font-semibold text-ink" : cell === "—" ? "text-ink/35" : "text-ink/70"}`}
                      key={cell + index}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
