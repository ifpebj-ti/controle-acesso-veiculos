import type { AuditEntry, JsonValue } from "../types";

export const auditActionLabels = {
  Alteracao: "Alteração",
  Consulta: "Consulta",
  Exclusao: "Exclusão",
  Inclusao: "Inclusão",
  Login: "Login",
  Logout: "Logout",
} as const;

const outcomeLabels: Record<string, string> = {
  LoginSucceeded: "Autenticação concluída",
  LogoutSucceeded: "Saída da conta concluída",
  AccountLocked: "Conta temporariamente bloqueada",
  TokenReuseDetected: "Sessão revogada por reutilização de token de renovação",
  SessionRevoked: "Sessão revogada",
};

const fieldLabels: Record<string, string> = {
  active: "Conta ativa",
  profileName: "Perfil",
  authenticationMethod: "Método de autenticação",
  credentialVersion: "Versão da credencial",
  externalIdentityLinked: "Identidade externa vinculada",
  requiresPasswordChange: "Troca de senha obrigatória",
  reason: "Justificativa",
  outcome: "Resultado",
  provider: "Provedor",
  identityLinked: "Identidade vinculada",
  lockedUntilUtc: "Bloqueio até (valor original)",
  temporaryCredentialExpiresAtUtc: "Validade da credencial (valor original)",
  temporaryCredentialWasUsed: "Credencial temporária utilizada",
};

function lookup(labels: Record<string, string>, value: string) {
  return Object.hasOwn(labels, value) ? labels[value] : undefined;
}

function asObject(value: JsonValue | null) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value
    : null;
}

export function auditEntityLabel(entity: string) {
  if (entity === "Usuario") return "Conta de acesso";
  if (entity === "AdministrativeReport") return "Relatório administrativo";
  return "Registro de auditoria";
}

export function auditSummary(entry: AuditEntry) {
  const before = asObject(entry.previousState);
  const after = asObject(entry.newState);

  if (entry.entity === "Usuario") {
    if (entry.action === "Login" || entry.action === "Logout") {
      const outcome = after?.outcome;
      // A Login action also records failed/revoked authentication outcomes.
      if (
        typeof outcome === "string" &&
        ((entry.action === "Logout" && outcome === "LogoutSucceeded") ||
          (entry.action === "Login" && outcome !== "LogoutSucceeded"))
      ) {
        const label = lookup(outcomeLabels, outcome);
        if (label) return `${label}.`;
      }
    }
    if (entry.action === "Alteracao") {
      if (
        typeof before?.profileName === "string" &&
        typeof after?.profileName === "string" &&
        before.profileName !== after.profileName
      ) {
        return "Alteração de perfil registrada.";
      }
      if (
        typeof before?.active === "boolean" &&
        typeof after?.active === "boolean" &&
        before.active !== after.active
      ) {
        return after.active ? "Conta reativada." : "Conta desativada.";
      }
    }
  }

  switch (entry.action) {
    case "Login":
      return "Evento de autenticação registrado.";
    case "Logout":
      return "Evento de saída da conta registrado.";
    default:
      return `${auditActionLabels[entry.action]} registrada.`;
  }
}

export function auditStateFields(entity: string, value: JsonValue | null) {
  const state = asObject(value);
  if (entity !== "Usuario" || !state) return [];

  return Object.entries(state).flatMap(([key, raw]) => {
    const label = lookup(fieldLabels, key);
    if (!label || (raw !== null && typeof raw === "object")) return [];

    let display = raw === null ? "Não informado" : String(raw);
    if (typeof raw === "boolean") display = raw ? "Sim" : "Não";
    if (key === "profileName" && raw === "SetorTransporte") {
      display = "Setor de Transporte";
    }
    if (key === "authenticationMethod" && raw === "Local") {
      display = "Local (e-mail e senha)";
    }
    if (key === "outcome" && typeof raw === "string") {
      display = lookup(outcomeLabels, raw) ?? raw;
    }
    return [{ key, label, value: display }];
  });
}
