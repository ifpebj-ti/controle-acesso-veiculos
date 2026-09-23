import { useNavigate } from "react-router-dom";

import { PageHeader } from "../components/ui/PageHeader";
import {
  PasswordChangeForm,
  useAuthenticatedSession,
} from "../features/authentication";

export function PasswordChangePage() {
  const navigate = useNavigate();
  const { completePasswordChange, user } = useAuthenticatedSession();
  const isMandatory = user.requiresPasswordChange;

  function handleSuccess() {
    completePasswordChange();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-w-0 pb-8">
      <PageHeader
        description={
          isMandatory
            ? "Substitua a credencial temporária por uma senha permanente antes de acessar o sistema."
            : "Confirme sua senha atual e escolha uma nova senha para proteger sua conta."
        }
        eyebrow={isMandatory ? "Primeiro acesso" : "Segurança da conta"}
        title={isMandatory ? "Crie sua senha permanente" : "Alterar senha"}
      />

      <div className="mt-7 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)]">
        <section
          aria-labelledby="password-change-form-title"
          className="min-w-0 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-sm sm:p-7"
        >
          <h2
            className="font-display text-2xl text-ink"
            id="password-change-form-title"
          >
            Defina sua nova senha
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            {isMandatory
              ? "Digite novamente a credencial temporária usada para entrar e escolha uma senha somente sua."
              : "O servidor confirmará a senha atual e aplicará a política de segurança antes de concluir a alteração."}
          </p>
          <div className="mt-6 max-w-2xl">
            <PasswordChangeForm onSuccess={handleSuccess} />
          </div>
        </section>

        <aside className="min-w-0 rounded-[2rem] border border-brand/20 bg-brand-soft/35 p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark">
            Depois da alteração
          </p>
          <h2 className="mt-3 font-display text-2xl text-ink">
            Entre novamente
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Por segurança, todas as sessões anteriores serão encerradas. Você
            voltará à tela de entrada para acessar o sistema com a nova senha.
          </p>
          <p className="mt-4 text-sm leading-6 text-ink-soft">
            Não compartilhe sua senha nem a registre em mensagens, anotações do
            sistema ou solicitações de suporte.
          </p>
        </aside>
      </div>
    </div>
  );
}
