# Pedidos de correção do histórico — Issue #610

## Fonte e limite da integração

Implementação de frontend baseada no contrato candidato do PR #607,
`b220177118af5e76bf63b18293fda7ab450ad468`, e em
`docs/operations/access-correction-review.md` nessa branch. A base deste trabalho
foi sincronizada por merge regular com a main
`202a9133696109e317cd20e1a12e3d80ebed7a0a`, que contém a base informada
`5db10221966a816a882b19ccaf4cf69a99054728` e a incorporação do #599. O backend
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

Os testes automatizados usam dados fictícios e respostas controladas: não são
prova de API hospedada. Cobrem contrato estrito, submissão única, cancelamento,
consulta sem resultado, concorrência GET/POST, preservação de campos/chave,
revisão própria/por outro perfil, filtros/página, foco, Escape e avisos acessíveis.
Os ensaios de navegador local devem indicar snapshot, dimensões e uso de API
simulada. Axe/teclado não equivalem a leitor de tela humano.

Permanecem obrigatórios antes do aceite: composição HTTPS identificada com a API
candidata, integração autenticada com solicitante e revisor distintos, conflitos
reais, tablet físico, zoom real e leitor de tela. Evidências antigas do login não
homologam estas telas. Não houve merge, deploy ou homologação institucional.

Fora do recorte: papel (#100), horários retroativos, placa, pessoa, documento,
novos perfis, mudanças em API, migrations, contas ou infraestrutura.
