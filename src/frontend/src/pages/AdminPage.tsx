import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { RestrictedDemoState } from '../components/ui/RestrictedDemoState';
import { useDemo } from '../demo';

export function AdminPage() {
  const { profile } = useDemo();

  if (profile !== 'administrador') {
    return <RestrictedDemoState message="Gestão de usuários, permissões e auditoria é uma área exclusiva do perfil Administrador." />;
  }

  return (
    <div>
      <PageHeader description="Estrutura inicial para validar o agrupamento das funções administrativas, ainda sem integração." eyebrow="Administração" title="Usuários e auditoria" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ['Contas do sistema', 'Criar, ativar e desativar acessos.', 'users'],
          ['Perfis e permissões', 'Consultar a matriz aplicada pelo backend.', 'shield'],
          ['Trilha de auditoria', 'Investigar eventos e alterações rastreáveis.', 'history'],
        ].map(([title, description, icon]) => (
          <article className="rounded-2xl border border-ink/10 bg-white p-6" key={title}>
            <span className="grid size-11 place-items-center rounded-xl bg-brand-soft/65 text-ink"><Icon name={icon as 'users' | 'shield' | 'history'} /></span>
            <h2 className="mt-5 font-bold text-ink">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">{description}</p>
            <span className="mt-5 inline-flex rounded-full border border-ink/10 bg-cream px-3 py-1 text-xs font-bold text-ink/60">Fluxo futuro</span>
          </article>
        ))}
      </div>
    </div>
  );
}
