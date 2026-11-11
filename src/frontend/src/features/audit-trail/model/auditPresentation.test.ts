import { describe, expect, it } from "vitest";
import type { AuditEntry } from "../types";
import {
  auditEntityLabel,
  auditStateFields,
  auditSummary,
} from "./auditPresentation";

const entry: AuditEntry = {
  action: "Alteracao",
  actorType: "Human",
  actorUserId: 1,
  details:
    "Administrator changed the account profile and authentication boundary.",
  entity: "Usuario",
  id: 1,
  recordId: 2,
  occurredAtUtc: "2030-06-10T11:00:00Z",
  previousState: { profileName: "Porteiro" },
  newState: { profileName: "Vigilante", reason: "Justificativa fictícia" },
};

describe("audit presentation", () => {
  it("uses canonical state transitions, not the free description", () => {
    expect(auditSummary(entry)).toBe("Alteração de perfil registrada.");
    expect(
      auditSummary({ ...entry, previousState: null, newState: null }),
    ).toBe("Alteração registrada.");
    expect(auditSummary({ ...entry, entity: "Unknown" })).toBe(
      "Alteração registrada.",
    );
    expect(
      auditSummary({
        ...entry,
        previousState: { profileName: "Porteiro" },
        newState: { profileName: "Porteiro" },
      }),
    ).toBe("Alteração registrada.");
  });

  it.each([true, false])(
    "presents an actual active transition to %s",
    (active) => {
      expect(
        auditSummary({
          ...entry,
          previousState: { active: !active },
          newState: { active },
        }),
      ).toBe(active ? "Conta reativada." : "Conta desativada.");
    },
  );

  it.each([
    ["LoginSucceeded", "Autenticação concluída."],
    ["AccountLocked", "Conta temporariamente bloqueada."],
    [
      "TokenReuseDetected",
      "Sessão revogada por reutilização de token de renovação.",
    ],
    ["SessionRevoked", "Sessão revogada."],
    ["UnexpectedOutcome", "Evento de autenticação registrado."],
    ["LogoutSucceeded", "Evento de autenticação registrado."],
  ])(
    "presents login outcome %s without assuming success",
    (outcome, expected) => {
      expect(
        auditSummary({
          ...entry,
          action: "Login",
          newState: { outcome },
          details: "Authentication succeeded.",
        }),
      ).toBe(expected);
    },
  );

  it("does not parse free JSON details as a new structured contract", () => {
    expect(
      auditSummary({
        ...entry,
        entity: "AdministrativeReport",
        action: "Consulta",
        details: '{"Operation":"Export","Result":"Success"}',
      }),
    ).toBe("Consulta registrada.");
    expect(auditSummary({ ...entry, action: "Logout", newState: null })).toBe(
      "Evento de saída da conta registrado.",
    );
    expect(
      auditSummary({
        ...entry,
        action: "Logout",
        newState: { outcome: "LogoutSucceeded" },
      }),
    ).toBe("Saída da conta concluída.");
  });

  it("labels known fields without translating free values or mutating the source", () => {
    const source = {
      profileName: "SetorTransporte",
      authenticationMethod: "Local",
      active: false,
      reason: "Keep this reason as entered",
      provider: "Google",
      requiresPasswordChange: true,
      extraField: { future: true },
    };
    const snapshot = JSON.stringify(source);
    const fields = auditStateFields("Usuario", source);
    expect(fields).toEqual(
      expect.arrayContaining([
        { key: "profileName", label: "Perfil", value: "Setor de Transporte" },
        {
          key: "authenticationMethod",
          label: "Método de autenticação",
          value: "Local (e-mail e senha)",
        },
        { key: "active", label: "Conta ativa", value: "Não" },
        { key: "reason", label: "Justificativa", value: source.reason },
        {
          key: "requiresPasswordChange",
          label: "Troca de senha obrigatória",
          value: "Sim",
        },
      ]),
    );
    expect(fields.some((field) => field.key === "extraField")).toBe(false);
    expect(JSON.stringify(source)).toBe(snapshot);
  });

  it("preserves unknown primitive values and declines unknown/nested state formats", () => {
    expect(
      auditStateFields("Usuario", { authenticationMethod: "FutureProvider" })[0]
        .value,
    ).toBe("FutureProvider");
    expect(auditStateFields("Unknown", { active: true })).toEqual([]);
    expect(auditStateFields("Usuario", ["future"])).toEqual([]);
    expect(auditStateFields("Usuario", { reason: { future: true } })).toEqual(
      [],
    );
    expect(
      auditStateFields("Usuario", JSON.parse('{"__proto__":"future"}')),
    ).toEqual([]);
    expect(auditEntityLabel("Usuario")).toBe("Conta de acesso");
    expect(auditEntityLabel("AdministrativeReport")).toBe(
      "Relatório administrativo",
    );
    expect(auditEntityLabel("__proto__")).toBe("Registro de auditoria");
  });
});
