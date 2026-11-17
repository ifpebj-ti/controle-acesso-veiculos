# Contrato candidato de contingência em papel — #100/#611

## Estado em 14/11/2026

O backend candidato contém domínio, aplicação, PostgreSQL, migration e endpoints.
Os testes usam exclusivamente bancos e contas fictícios descartáveis. A hospedagem
continua na composição f7ee701 com 22 migrations. Esta branch acrescenta a migration
20261114132630_AddPaperReconciliation, ainda sem implantação ou interface integrada.

## Fluxo e permissões

1. Transporte ou Administrador registra o incidente, período observado e referência
   da folha preservada. A chave UUID da intenção identifica o incidente.
2. Um perfil operacional transcreve cada linha, mantendo chave UUID da intenção,
   incidente, número da linha, referência do autor do papel, entrada/saída observadas
   e justificativa. Os quatro perfis podem importar, conforme a ampliação das funções
   de negócio autorizada em 12/11. O fluxo habitual é Porteiro/Vigilante digitarem.
3. Transporte ou Administrador confere com motivo. Quem digitou fica impedido de
   conferir a própria linha, inclusive após mudar de perfil.
4. Um acesso sem saída observada fica operacionalmente aberto. Pode receber a saída
   normal antes da conferência. Conferência recusada preserva os fatos e o histórico.
   Divergência exige a correção apropriada, acompanhada na #451/#607/#613.

A referência do autor do papel conserva a atribuição escrita na folha. Ela não
comprova identidade digital nem concede acesso. A autorização pertence à sessão
ativa do digitador/revisor. Horários ilegíveis devem ser esclarecidos antes de
importar, com preservação da folha. A API exige datas observadas válidas.

## Endpoints

Todos exigem autenticação e respondem com Cache-Control no-store.

| Método e caminho                                           | Permissão e resposta                                                       |
| ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| POST /paper-reconciliation/incidents                       | Transporte/Admin, 200 com incidente canônico                               |
| GET /paper-reconciliation/incidents                        | Quatro perfis, lista paginada, ordem por início descendente e ID           |
| POST /paper-reconciliation/imports                         | Quatro perfis, 200 com recibo canônico                                     |
| GET /paper-reconciliation/imports                          | Operador vê as próprias linhas; Transporte/Admin vê a fila, página e total |
| POST /paper-reconciliation/imports/{accessRecordId}/review | Transporte/Admin diferente do digitador, 200 com recibo                    |

A autenticação e autorização são revalidadas pelo pipeline existente. Gestão
de contas permanece exclusiva do Administrador. A conferência não altera essa regra.

### Incidente

```json
{
  "incidentId": "11111111-1111-4111-8111-111111111111",
  "paperReference": "Folha fictícia QA 01",
  "startedAt": "2026-11-14T07:00:00-03:00",
  "endedAt": "2026-11-14T08:00:00-03:00"
}
```

Datas ISO 8601 exigem offset explícito ou Z. Fim não pode anteceder início ou
estar no futuro. Referência tem de 3 a 120 caracteres. A repetição da mesma chave,
ator e conteúdo retorna o cadastro original. Repetição divergente recebe 409.
A listagem aceita page de 1 a 100000 e pageSize de 1 a 100, com padrão 1/25.

### Importação

```json
{
  "requestKey": "22222222-2222-4222-8222-222222222222",
  "incidentId": "11111111-1111-4111-8111-111111111111",
  "lineNumber": 1,
  "paperAuthorReference": "Operador da folha fictícia",
  "observedEntryAt": "2026-11-14T07:10:00-03:00",
  "observedExitAt": "2026-11-14T07:30:00-03:00",
  "justification": "Transcrição da folha fictícia após indisponibilidade.",
  "entry": {
    "driverName": "Condutor fictício",
    "plate": "ABC1D23",
    "objective": "Entrega fictícia",
    "categoryName": "Visitante",
    "vehicleType": "Automóvel"
  }
}
```

ObservedExitAt pode ser null. Entrada e eventual saída devem pertencer ao período
do incidente, sem horário futuro. Referência do autor tem de 1 a 120 caracteres,
e justificativa de 10 a 500. Caracteres de controle são recusados. Entry reutiliza
as validações e os campos da entrada normal, incluindo evento ou pessoa/veículo
explicitamente selecionados. A seleção é revalidada pelo servidor.

Datas são normalizadas para UTC e precisão de microssegundos do PostgreSQL.
Importação e conferência recebem ator e instante pelo servidor. O payload não
escolhe esses valores. A chave da intenção deve ser preservada em nova tentativa
explícita após falha incerta. O cliente não pode gerar outra chave e presumir que
uma nova mutação é necessária.

```json
{
  "accessRecordId": 123,
  "reviewStatus": "Pendente",
  "importedAtUtc": "2026-11-14T11:00:00Z"
}
```

A repetição exata da mesma intenção devolve identidade e instante originais.
ReviewStatus reflete o estado canônico atual. A mesma chave com conteúdo
normalizado divergente recebe paper_request_changed. Outra intenção/ator usando
a mesma linha recebe paper_line_already_imported. Conflitos de veículo, período,
evento ou quota também recebem 409 com código sanitizado.

Um acesso fechado de papel pode anteceder um acesso atual já aberto. Intervalos
sobrepostos são recusados. Autorização e quota do evento são revalidadas sob lock,
com o horário de entrada observado. Replay exato não consome outra quota.

### Conferência e fila

```json
{ "accept": true, "reason": "Conferência da folha fictícia concluída." }
```

Motivo tem de 10 a 500 caracteres. Recusa também exige motivo. A mesma decisão,
ator e motivo repetidos preservam o primeiro instante e geram somente uma auditoria.
Decisão divergente ou outra pessoa tentando sobrescrever decisão terminal recebe 409. Autoaprovação recebe 403.

GET imports aceita status Pendente, Conferida ou Recusada, além de page/pageSize.
Retorna items, totalCount, page e pageSize. Cada item inclui proveniência, estado
atual, decisão atribuída, placa e condutor para conferência. Operadores têm filtro
obrigatório pelo próprio ator no servidor. Não existe exclusão de proveniência.

As respostas de acessos em aberto, histórico e saída acrescentam o campo opcional
paperReviewStatus, com Pendente, Conferida ou Recusada; acessos comuns recebem
null. Essa informação mínima permite exibir a pendência aos operadores sem
expor justificativa/autoria completa de outra pessoa. A consulta usa o join da
projeção existente, sem requisição adicional por registro. A interface precisa
integrar o campo no seu schema/componente antes de apresentar o selo.

## Transação e integridade

O store usa locks transacionais por intenção, linha e veículo. Constraints únicas
protegem incidente/linha e digitador/chave. A gravação de pessoa/veículo, acesso,
saída já anotada, proveniência e auditoria ocorre na mesma transação. A entrada
normal conserva sua transação própria e seu relógio. O núcleo de cadastro é
reutilizado internamente, sem chamar endpoints ou encadear commits independentes.

A conferência usa lock da linha. Constraints também impedem autoaprovação e datas
incoerentes. FKs usam Restrict para preservar referências. O hash da intenção serve
à comparação e não é devolvido nas consultas. Auditoria mínima não replica nomes,
documentos ou referências integrais do papel.

## Implantação e limites

Revisar migration e backup antes da promoção. O downgrade remove as duas tabelas
novas e suas evidências, por isso foi ensaiado somente em banco descartável. Em
ambiente com dados importados, preferir rollback de aplicação com schema preservado
e plano de recuperação revisado. Não executar downgrade sobre evidência institucional.

A importação, a confirmação de posse da folha e a conferência diária precisam de
interface, roteiro humano e piloto. Integração com a revisão #607 e atribuição de
encerramento deve ser ensaiada em composição identificada. Este contrato permite
coordenação com o frontend e não declara esses fluxos disponíveis no site atual.

## Evidência local consolidada

O código backend de 426fa80 passou 607 testes completos, sem falhas ou skips,
com PostgreSQL descartável. O consolidado Cobertura registrou 9488/10137 linhas
executáveis escritas à mão, 93,60%, acima do piso global de 70%. Migrations
geradas são excluídas dessa medição. A meta de branches/recortes críticos e
frontend permanece na #499/#507.

Foram exercitados replay exato/divergente, linha concorrente, conferências
concorrentes, impedimento de autoaprovação também pelo PostgreSQL, isolamento
da fila, evento/quota no horário observado, saída normal pendente, rollback
por falha da auditoria e upgrade/downgrade/upgrade em banco separado com cadastro
preexistente. O teste do schema foi atualizado para conferir as duas tabelas
adicionadas, mantendo a verificação explícita do total e das tabelas antigas.

O primeiro ensaio apontou a diferença de precisão dos instantes entre C# e
PostgreSQL. A normalização para microssegundos preserva o recibo canônico. A
primeira suíte completa também apontou o total histórico de 13 tabelas no teste
de schema, ajustado para 15 com verificação das tabelas novas.

Divergências de horário, pessoa ou placa exigem tratamento próprio acompanhado
na #100. A revisão descritiva da #607 não altera esses campos. O módulo atual
preserva a recusa e a evidência e não oferece uma edição irrestrita desses fatos.
A integração visual segue na #712, separada da hospedagem atual e da release 0.5.0.

## Entrega técnica e aceite operacional

A #737 acompanha a revisão/incorporação do backend aditivo no #611. A #100
continua aberta para a contingência integrada e observada; a #712 entrega a
interface. Incorporar o contrato não aplica a migration na VM, não implanta a
tela e não confirma treinamento ou rotina de conferência diária.

A composição isolada `d23ed42` verificou revisão + papel em PostgreSQL, com
649 testes e preservação de proveniência/autoria da saída. Essa evidência não
significa que #607/#613 ou a composição foram incorporados. A promoção futura
precisa de backup, migration revisada e ensaio próprio no candidato identificado.
