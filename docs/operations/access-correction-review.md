# Revisão auditada de correções de acesso

**Rastreabilidade:** #451 / PR #607, ADR 0007. Estado: candidato de backend,
sem implantação ou aceite da interface. Não é fluxo de contingência em papel.

## Regra operacional

Um pedido pendente não altera o acesso atual nem impede registrar a saída ou
atender outros veículos. O solicitante informa uma justificativa. Transporte ou
Administrador distinto do solicitante aprova/rejeita com motivo. Cancelar pedido
próprio pendente preserva o histórico. A fila não usa exclusão como rejeição.

Na aprovação, a API confere se os dados originais ainda correspondem ao registro
atual. Uma base alterada gera conflito; não sobrescrever a mudança mais recente.
Somente categoria, objetivo e observação pertencem a este contrato.

## Endpoints

Todos exigem sessão da aplicação e usam Bearer conforme o mecanismo existente.
Não aceitar ator, perfil ou autorização enviados no payload. As respostas usam
`Cache-Control: no-store`.

| Método e rota                                               | Autorização                                             | Resultado                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| `POST /access-records/{accessRecordId}/correction-requests` | quatro perfis com capacidade descritiva já existente    | 201 novo pedido; 200 repetição idêntica                            |
| `GET /access-correction-requests`                           | quatro perfis                                           | página de pedidos próprios; Transporte/Admin acessam fila revisora |
| `GET /access-correction-requests/{id}`                      | mesmo escopo da consulta                                | 200 ou 404, sem revelar pedido alheio a operador                   |
| `GET /access-correction-requests/by-key/{requestKey}`       | somente o próprio solicitante, inclusive quando revisor | reconciliação somente leitura após resposta perdida                |
| `POST /access-correction-requests/{id}/decision`            | Transporte/Admin, sem autoavaliação                     | 200 decisão ou repetição idêntica                                  |
| `POST /access-correction-requests/{id}/cancellation`        | solicitante, enquanto pendente                          | 200 cancelamento ou repetição idêntica                             |

O `PUT /access-records/{id}/correction` legado retorna
409/`CorrectionApprovalRequired` no modo padrão. A aplicação recusa a configuração
`AccessCorrections:RequireApproval=false` fora de Development/Testing. Não orientar
operadores a mudar configuração de segurança para contornar o novo fluxo.

## Solicitação

```json
{
  "requestKey": "c90b7d33-46fd-40bf-9cab-3230b650849f",
  "original": {
    "categoryName": "Visitante",
    "objective": "Objetivo original",
    "observation": null
  },
  "proposed": {
    "categoryName": "Entrega",
    "objective": "Entrega de material",
    "observation": "Observação fictícia."
  },
  "justification": "Correção após conferência dos dados fictícios."
}
```

Os valores são fictícios; a categoria deve ser um nome canônico do catálogo
vigente. Gere uma UUID nova por intenção de pedido e preserve a chave se a mesma
intenção precisar ser reconciliada/repetida. Não gerar outra chave automaticamente
após resposta perdida. Consulte `by-key` antes de decidir nova tentativa; não é
necessário reenviar o POST para descobrir se ele foi recebido. Categoria, objetivo e observação originais devem vir da
última resposta canônica, nunca de campos já editados.

A chave é única por solicitante. Reutilizar com outro registro, proposta,
justificativa ou base gera 409. Outra solicitação pendente para o mesmo acesso
também gera conflito. Ausência de mudança não cria um pedido.

## Decisão e cancelamento

Decisão: `{ "decision": "Approve", "justification": "Conferência fictícia concluída." }`.
Use `Reject` para recusar. O cancelamento recebe somente `justification` e
identifica o solicitante pela sessão. Motivos têm entre 10 e 500 caracteres.

Os estados retornados são `Pendente`, `Aprovada`, `Rejeitada` e `Cancelada`.
Repetir a mesma decisão, ator e motivo retorna o resultado existente, sem nova
auditoria. Outra decisão sobre um estado terminal gera 409. Autoavaliação ou
cancelamento por terceiro gera 403.

A resposta inclui `id`, `accessRecordId`, `plate` anulável, `driverName`,
`vehicleIdentification` anulável, `requestKey`, `status`, `requestedByUserId`,
`requestedAtUtc`, `original`, `proposed`, `justification`, `decidedByUserId`,
`decidedAtUtc` e `decisionReason`. Os identificadores de veículo e condutor são
lidos da origem canônica para apresentação; não são copiados para a solicitação.
Não são retornados documentos pessoais, segredos ou tokens.

## Consultas e erros

Filtros: `status` opcional com um dos quatro estados exatos, `page` de 1 a
1000000 e `pageSize` de 1 a 100. A ordem é data do pedido e id decrescentes.
Resposta: `items`, `page`, `pageSize`, `totalCount`, `totalPages`.

- 400: validação ou paginação inválida; preservar campos para correção.
- 401/403: autenticação ou autorização; não repetir a mutação.
- 404: solicitação inexistente ou fora do escopo de consulta.
- 409: chave divergente, proposta pendente, base alterada, ausência de mudança,
  categoria inativa ou decisão incompatível. Reconsultar antes de nova intenção.
- 500/resultado de transporte incerto: não afirmar sucesso ou rollback;
  reconciliar pela consulta e pela chave antes de repetir.

## Integridade e implantação

A migration `20261103160537_AddAccessCorrectionReview` cria uma tabela, sem
reescrever acessos ou auditorias anteriores. Chaves estrangeiras restringem
exclusão; constraints cobrem estado, autoria de decisão, motivo e cronologia.
A auditoria armazena ação e referência ao pedido, evitando duplicar seus textos.

A migration `20261103164228_PreserveAccessClosureActor` separa quem registrou o
encerramento de quem fez a última edição descritiva (#609). A aprovação posterior
não muda a autoria da saída nos relatórios. Para registros antigos, a atribuição
somente é recuperada de auditorias de encerramento com um único autor identificável.
Ausência de evidência, autores conflitantes e acessos ainda abertos permanecem sem
autor de saída; não se usa o último editor como substituto. Revisar esses casos
pela trilha existente, sem inventar autoria. O contrato público do relatório é preservado.

Antes de promover: concluir a interface com Raíssa, testar a composição, fazer
backup verificável, revisar/aplicar as duas migrations em janela controlada e publicar
imagens versionadas compatíveis. O banco de homologação ainda permanece intacto.
Downgrade remove a nova tabela e a coluna dedicada de autoria: testar somente em banco descartável; após uso
real, planejar restauração/compatibilidade sem apagar solicitações existentes.
Manter #607 draft/Refs #451 enquanto integração e critérios restantes faltarem.
