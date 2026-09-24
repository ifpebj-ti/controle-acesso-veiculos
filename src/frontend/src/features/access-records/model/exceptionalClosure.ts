export const exceptionalClosureReasons = [
  "RegistroDeSaidaOmitido",
  "IndisponibilidadeDoSistema",
  "OperacaoEmContingencia",
  "Outro",
] as const;

export const exceptionalClosureReasonLabels = {
  IndisponibilidadeDoSistema: "Indisponibilidade do sistema",
  OperacaoEmContingencia: "Operação em contingência",
  Outro: "Outro motivo",
  RegistroDeSaidaOmitido: "Registro de saída omitido",
} as const satisfies Record<(typeof exceptionalClosureReasons)[number], string>;

export type ExceptionalClosureReason =
  (typeof exceptionalClosureReasons)[number];
