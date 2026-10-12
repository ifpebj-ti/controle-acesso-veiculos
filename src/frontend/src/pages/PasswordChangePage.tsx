import { useNavigate } from "react-router-dom";

import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Icon } from "../components/ui/Icon";
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
        variant="prominent"
      />

      <div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.75fr)]">
        <Card
          aria-labelledby="password-change-form-title"
          className="password-change-form-panel"
          role="region"
        >
          <div className="password-change-form-heading flex items-start gap-3 border-b pb-5">
            <span
              aria-hidden="true"
              className="password-change-heading-icon grid size-11 shrink-0 place-items-center rounded-full"
            >
              <Icon name="lock" size={21} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">
                Proteção da conta
              </p>
              <h2
                className="mt-1 text-xl font-semibold text-text"
                id="password-change-form-title"
              >
                Defina sua nova senha
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                {isMandatory
                  ? "Digite novamente a credencial temporária usada para entrar e escolha uma senha somente sua."
                  : "Confirme sua senha atual e escolha uma nova combinação que atenda às regras de segurança."}
              </p>
            </div>
          </div>
          <div className="mt-6 max-w-2xl">
            <PasswordChangeForm onSuccess={handleSuccess} />
          </div>
        </Card>

        <aside className="password-change-guidance min-w-0 self-start overflow-hidden rounded-2xl border p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="password-change-guidance__icon grid size-10 shrink-0 place-items-center rounded-full"
            >
              <Icon name="shield" size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold text-primary">
                Depois da alteração
              </p>
              <h2 className="mt-1 text-xl font-semibold text-text">
                Entre novamente
              </h2>
            </div>
          </div>
          <div className="password-change-guidance__body mt-5 border-t pt-5">
            <p className="text-sm leading-6 text-text-muted">
              Por segurança, todas as sessões anteriores serão encerradas. Você
              voltará à tela de entrada para acessar o sistema com a nova senha.
            </p>
            <div className="mt-4 flex items-start gap-2.5 text-sm leading-6 text-text-muted">
              <Icon
                aria-hidden="true"
                className="mt-1 shrink-0 text-primary"
                name="lock"
                size={16}
              />
              <p>
                Não compartilhe sua senha nem a registre em mensagens, anotações
                do sistema ou solicitações de suporte.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
