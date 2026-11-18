# Pedidos de correção do histórico — Issue #610

## Fonte e limite da integração

Implementação de frontend baseada no contrato candidato do PR #607,
`94078c77badbc71ae55fb4dcafdd5dd61758f387`, e em
`docs/operations/access-correction-review.md` nessa branch. A base deste trabalho
foi sincronizada por merge regular com a main
`8089eb4de22533e6ebfca06f74d520d528572c64`, que já contém os PRs #751 e #752,
além das categorias Aluno, Terceirizado e Federal. O runbook consultado no
backend é idêntico ao snapshot anterior `b220177`. O backend
candidato não foi incorporado a esta branch: nenhum arquivo de backend ou
infraestrutura faz parte do diff. A promoção das duas partes precisa ser
coordenada por José. O frontend antigo de PUT direto não é compatível com o
bloqueio padrão da API candidata.

## Fluxo

- O histórico mantém uma única lista efetiva. “Solicitar correção” abre original
  canônico, proposta de categoria/objetivo/observação e justificativa.
- O POST em `/access-records/{id}/correction-requests` envia uma `requestKey` por
  intenção. A resposta cria pedido; não confirma aplicação da correção. A saída
  normal não consulta nem depende do estado desse pedido.
- “Consultar pedidos” usa `/access-correction-requests`, filtro real de estado e
  paginação. A visibilidade efetiva é definida pelo servidor.
- Administrador/Transporte conferem pedidos de outra pessoa; o solicitante pode
  cancelar o próprio pedido pendente. Cada ação exige justificativa. A interface
  orienta a operação, sem substituir autorização, autoria ou conflitos da API.
- Original, proposta, motivo, estado e decisão permanecem consultáveis. A API
  fornece identificadores dos autores; a interface não inventa nomes.
- Aprovação reconsulta o histórico com os filtros aplicados. Mantém a página
  quando válida, consulta a última página válida quando necessário e apresenta
  aviso com foco quando o registro deixa do resultado. Recusa/cancelamento não
  alteram localmente o acesso efetivo.
- A aprovação confirmada também revalida as contagens de categorias antes da
  consulta do histórico, inclusive quando a página deixa de existir ou a consulta
  falha. Enviar uma proposta pendente, apenas trocar categoria ou paginar não
  dispara essa recontagem. Os filtros das contagens continuam independentes da
  categoria e da página selecionadas.
- O catálogo canônico inclui as 12 categorias atuais. A seleção apresenta
  “Servidor federal” e envia `Federal`, preservando a regra do contrato.

## Resultado incerto

Falha de transporte, resposta incompatível, `CanceledError` e `AbortError` não
comprovam rollback. A intenção fica bloqueada para novo envio e preserva campos,
original, chave e motivo. “Consultar envio” usa somente
`GET /access-correction-requests/by-key/{requestKey}`. Um 404 momentâneo mantém a
incerteza, inclusive com POST ainda em andamento. Não há retry automático de
mutação, PUT de contingência ou geração silenciosa de outra chave. Decisões usam
GET do pedido para reconciliar o resultado, sem repetir a decisão.

Erros definitivos de validação/limite de requisições mantêm os campos para
correção explícita. 401/403 bloqueiam a ação, sem contornar o escopo. Após conflito
e consulta sem pedido próprio, somente uma ação explícita encerra a intenção e
atualiza os registros antes de preparar outra proposta.

O estado fica **somente em memória**, no layout autenticado por usuário; sobrevive
ao fechamento do diálogo e à navegação interna, sem storage de dados operacionais.
Recarregar ou sair da conta descarta rascunhos. Durante envio/resultado incerto,
há proteção `beforeunload`, sujeita ao suporte do navegador. Antes de recarregar,
o operador deve consultar o resultado; após uma recarga, conferir a fila própria
antes de iniciar outra intenção. Não há garantia de retenção de rascunho após
encerramento forçado do navegador. Nenhum token, documento, segredo ou conteúdo
de resposta é registrado em log por esta feature.

## Evidências e critérios pendentes

### Ensaio local de 18/11/2026

Frontend `d48975491f8b9eb7d3d791228802dfddd79b40c9`, após merge regular da main
`8089eb4`, e API candidata `94078c77`, sem modificações no backend. O banco
PostgreSQL e as contas eram exclusivos de QA local; solicitante e revisor eram
dois Administradores Local fictícios distintos. Não foi usada a hospedagem ou
uma conta compartilhada.

- Suíte frontend sequencial: 1.020 testes em 84 arquivos; lint, build,
  Prettier dos arquivos do PR e diff check aprovados nesse contexto.
- Pela interface autenticada: envio criou pedido pendente sem mudar o registro;
  aprovação por outro usuário reconsultou as 12 contagens e o histórico usando
  os filtros aplicados, preservando um rascunho de filtro ainda não aplicado.
  O registro saiu da categoria consultada, com aviso e foco acessíveis.
- Por chamadas reais à API local: autoaprovação retornou 403, original
  desatualizado retornou 409, recusa e cancelamento próprio foram confirmados.
  A saída normal funcionou com pedido pendente e seu horário foi preservado
  após aprovação. Esses casos de API não equivalem a todos os passos pela UI.
- Perda de resposta provocada somente no cliente após POST real confirmado:
  campos e chave preservados, novo envio bloqueado e reconciliação do mesmo
  pedido por um GET. Não houve repetição automática nem queda observada da API.
  O pedido fictício foi cancelado explicitamente após sua reconciliação.
- Brave automatizado: 390×844, 768×1024 e 1440×1000, temas Claro/Escuro,
  teclado, contenção de foco, Escape e retorno de foco após o frame do navegador,
  sem overflow horizontal. Zoom nativo de 200% manteve a janela física e reduziu
  a largura CSS de 1.424 para 712 px; não foi usado CSS zoom. Isso não comprova
  tablet físico nem uso humano de leitor de tela.
- As tentativas iniciais do roteiro de QA falharam por compartilhamento de
  cookies com o preparador de fixtures e verificação de foco antes do frame.
  O roteiro foi separado e corrigido sem alterar login, sessão ou foco do produto.
- `npm audit` reportou 12 pacotes com severidade alta na cadeia de ferramentas
  de desenvolvimento ligada a picomatch/Vite/Vitest/ESLint, recebida da main.
  Não houve alteração de lockfile, audit fix, downgrade ou redução de gate
  neste PR. A coordenação dessa dependência permanece separada.

Os acessos fictícios usados foram encerrados e o revisor local desativado. Os
roteiros, perfis descartáveis e registros privados do ensaio ficam fora do Git.
O complemento posterior a esse snapshot altera somente esta documentação e o
README; não representa nova execução humana nem ensaio HTTPS.

Os testes unitários e de componentes usam dados fictícios e respostas controladas:
não são prova de API hospedada. Cobrem contrato estrito, submissão única, cancelamento,
consulta sem resultado, concorrência GET/POST, preservação de campos/chave,
revisão própria/por outro perfil, filtros/página, foco, Escape e avisos acessíveis.
Os ensaios de navegador local devem indicar snapshot, dimensões e uso de API
simulada. Axe/teclado não equivalem a leitor de tela humano.

Permanecem obrigatórios antes do aceite: composição HTTPS identificada com a API
candidata, tarefas autenticadas e conferência de auditoria nesse candidato,
tablet físico e leitor de tela. A integração local e o zoom nativo automatizado
acima conservam seu ambiente e autoria. Evidências antigas do login não
homologam estas telas. Não houve incorporação deste PR, deploy ou homologação
institucional.

O contrato HTTP de papel já existe na main, com o guia
`docs/development/paper-reconciliation-contract.md` e a ADR 0011. Sua interface
pertence à #712 e não faz parte desta entrega. Fora do recorte: papel (#100/#712),
horários retroativos, placa, pessoa, documento, novos perfis, mudanças em API,
migrations, contas reais/compartilhadas ou infraestrutura hospedada.
