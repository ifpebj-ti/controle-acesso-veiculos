# ADR 0007 — Revisão auditada de correções de acesso

**Data:** 03/11/2026. **Rastreabilidade:** #451, #100 e #162.

**Estado:** direção técnica autorizada; implementação incremental em andamento.
O primeiro incremento contém somente o modelo de domínio e suas regressões.
Não existem novos endpoints, migration, persistência ou interface entregues por
esse incremento. A correção direta atualmente publicada não foi alterada.

## Contexto e autorização

José relatou que Eurico deu liberdade à equipe e autorizou a implementação de
uma solução para corrigir erros, exigir justificativa e permitir análise pelo
Setor de Transporte. A escolha abaixo é uma decisão técnica da equipe dentro
dessa autorização; não equivale à observação ou ao aceite da interface final.

O sistema já possui correção descritiva direta auditada. Alterar silenciosamente
esse contrato produziria confirmação falsa na interface atual. A troca de fluxo
deve ser coordenada com Raíssa e testada antes de ativação conjunta.

## Decisão

1. Cada acesso continua aparecendo uma única vez na operação e no histórico
   principal, com os valores efetivos.
2. Porteiro ou Vigilante solicita a correção com justificativa. O original e a
   proposta ficam preservados; a solicitação não altera o acesso efetivo.
3. Transporte ou Administrador decide com motivo explícito. O solicitante não
   pode aprovar ou rejeitar a própria solicitação, mesmo tendo perfil revisor.
4. Aprovar aplica a proposta e registra a decisão; rejeitar conserva o original,
   a proposta, o motivo e os atores. Não excluir o erro nem ocultar a rejeição.
5. O solicitante pode cancelar uma proposta ainda pendente, com motivo, sem
   apagar sua existência. Uma decisão terminal não pode ser sobrescrita.
6. Uma proposta baseada em valores já alterados não pode ser aplicada por cima
   de outra correção. O revisor deve recarregar o registro e avaliar nova proposta.
7. A primeira etapa cobre somente categoria, objetivo e observação do acesso
   geral, limites do contrato atual. Não edita horários, placa, condutor,
   documentos, eventos, frota ou quilometragem por um payload genérico.
8. Falta de registro durante indisponibilidade pertence ao fluxo #100, que
   distingue horário observado, autoria no papel e momento da digitação. Não
   usar correção descritiva para fabricar entrada ou saída retroativa.

Motorista é uma informação do acesso, não um quinto perfil autenticado. Não
introduzir conta, login ou poder de aprovação por essa denominação.

## Estados e invariantes de domínio

`Pendente → Aprovada | Rejeitada | Cancelada`.

Os dados originais e propostos são snapshots imutáveis, normalizados e limitados
às três propriedades descritivas. Não há cópia de documento, senha ou identidade
Google. Justificativa e motivo têm de 10 a 500 caracteres; objetivo tem até 500 e
observação até 1000. Datas técnicas são UTC e uma decisão não antecede o pedido.

O domínio recebe identificadores de atores, não claims HTTP ou permissões. A
proibição de autoaprovação é uma invariante adicional, não autorização suficiente:
a Application/API ainda deverão verificar os perfis e o escopo de cada consulta.

## Persistência, aplicação e contrato ainda necessários

- Mapear solicitações com referências restritas ao acesso e aos atores; definir
  migration, índices e unicidade de uma proposta pendente por acesso.
- Usar chave de requisição por solicitante para idempotência. A propriedade no
  domínio, sozinha, não deduplica chamadas HTTP nem impede concorrência.
- Ler a versão atual e aplicar aprovação, alteração efetiva e auditoria na
  mesma transação. Serializar decisões concorrentes e impedir perda de atualização.
  Comparação de snapshots em memória, sozinha, não resolve uma corrida no banco.
- Preservar os snapshots na solicitação; a auditoria deve apontar pedido, atores,
  ação e campos alterados, evitando duplicar texto livre sensível sem finalidade.
- Oferecer consulta paginada e filtrada de pedidos próprios para solicitantes e
  fila de revisão para os perfis autorizados, com autorização no servidor.
- Definir respostas de conflito, validação e repetição, sem repetir uma mutação
  automaticamente após resultado de rede incerto.
- Migrar a correção direta e a interface juntas. Nenhuma ativação poderá deixar
  o endpoint antigo como caminho para contornar a revisão obrigatória.
- Testar migração limpa/upgrade/downgrade, API, PostgreSQL, duplicidade, corrida,
  autoaprovação, rejeição e rollback quando a auditoria falha.
- Atualizar OpenAPI, permissões, modelo visual de ameaças, manual e Wiki com o
  estado efetivamente entregue. Manter #451 aberta/draft enquanto esses itens faltarem.

Não foi definida autorização irrestrita para revisar pedidos ou visualizar
documentos. A decisão final deve preservar as capacidades existentes e o menor
privilégio, com destaque acessível entre versão efetiva e proposta pendente.

## Referências de produto e engenharia

O padrão adaptado de produtos existentes é solicitação com estado e decisão
explícita, em vez de apagar o erro ou deixar correção informal sem responsável.
Não são adotadas assinaturas comerciais, aprovação por e-mail ou cadeias
multinível: um revisor autorizado distinto do solicitante atende ao recorte.

- [Odoo — regras de aprovação](https://www.odoo.com/documentation/18.0/applications/studio/approval_rules.html): controle prévio de uma ação e decisões de revisão.
- [Microsoft Power Automate — aprovações](https://learn.microsoft.com/en-us/power-automate/get-started-approvals): solicitação e respostas explícitas de aprovação/rejeição.
- [EF Core — concorrência](https://learn.microsoft.com/en-us/ef/core/saving/concurrency): detectar alterações concorrentes e tratar conflitos, sem sobrescrever silenciosamente.
- [OWASP — logging](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html): trilha atribuível e minimização de dados sensíveis.

As fontes orientam a decisão técnica; não constituem aprovação institucional.
