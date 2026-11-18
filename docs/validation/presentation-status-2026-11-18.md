# Balanço para a apresentação de 18/11/2026

Rastreabilidade #758. Fonte incorporada de referência aa22c49, após
#751/#752/#755/#757/#738/#739/#754/#742. A Wiki acompanha os merges em tarefa própria.

## Entregas incorporadas

| Entrega                   | Evidência e efeito                                                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Pré-cadastro e permissões | #704/#705 integram cadastro/sugestões e funções de negócio de Transporte. Administrador gerencia contas e perfis.                       |
| Eventos                   | #745/#751 resolvem Todos com status=all, incluindo cancelados na paginação e nos totais do servidor.                                    |
| Relatórios                | #752 mantém placa, condutor e demais filtros por tipo, compartilhando somente o período em edição/aplicado.                             |
| Testes de histórico       | #757 inclui um registro anterior de outro condutor e isola as consultas da fixture. O cenário reproduziu a falha 3/4 antes da correção. |
| Dependências              | #738 atualiza pacotes backend e #739 atualiza os pacotes frontend. A plataforma permanece em net10.0.                                   |
| Qualidade estática        | #750 corrigiu cinco apontamentos novos. A consulta atual conserva nove achados note.                                                    |

A suíte backend passou 612 testes no snapshot da correção #757 e também na
composição da atualização #738 com a main então vigente. O #739 passou 966
testes frontend em 79 arquivos na composição revisada. #751 e #752 receberam
revisões independentes com 27 e 23 testes focados, respectivamente. As suítes
completas e os ensaios de navegador publicados por Raíssa conservam sua autoria.
Esses números pertencem a fontes específicas e não são somados como uma suíte.

## Publicação e hospedagem

A release `v0.5.0` foi publicada e promovida à homologação em 18/11, fonte
eaccd72, com imagens GHCR versionadas/digests conferidos e 23 migrations.
O pipeline de publicação passou nas duas arquiteturas. Backup restaurado,
proveniência assinada e quatro SBOMs foram conferidos. Passaram 46 verificações
HTTPS e o roteiro HTTP de redirect, frames e cache do frontend. A confirmação
de login Google pelo titular após a promoção permanece separada.

O [registro da promoção](release-050-rollout-2026-11-18.md) preserva identidades,
limites e rollback. Não houve novo ensaio físico ou aceite institucional. As
notas públicas seguem o padrão resumido anterior e incluem os comandos Docker;
o changelog completo permanece vinculado. Rótulos internos das imagens serão
corrigidos na #761, sem mover os artefatos imutáveis já publicados.

## Segurança e qualidade

A consulta autenticada de 18/11 retornou zero alertas abertos em Code Scanning
e Dependabot. Code Quality foi consultado separadamente, com nove notes. A nota
visual Maintainability/Reliability deve ser conferida no portal. A auditoria
NuGet da composição #738 não apontou pacotes vulneráveis nas fontes consultadas.
A auditoria npm adicional inicialmente excedeu o prazo. A execu??o posterior
confirmou 12 achados HIGH derivados de um ?nico advisory de picomatch, todos
na cadeia de ferramentas de desenvolvimento. `npm audit --omit=dev` retornou
zero achados. A vers?o corrigida ainda n?o estava publicada na consulta; #765
registra risco, limites e tratamento sem downgrade ou supress?o do scanner.

CAV-04/05/06 seguem na #727 para limites e recuperação de autenticação. A revisão
#607/#613, interface de papel #712 e confirmação PDF Google #699 continuam
pendentes. O balanço detalhado está no
[acompanhamento do relatório externo](professor-delivery-security-status-2026-11-15.md).

## Documentação e quadro

A varredura mecânica leu 105 Markdown versionados, verificou UTF-8 e destinos
locais de links e não encontrou erros nesses recortes. Essa contagem não
representa revisão semântica integral de cada documento. As atualizações deste
PR se concentram nos documentos de estado, release e prontidão acadêmica.

O inventário inicial do Projects #43 contou 411 itens. Cinco classificações
foram reconciliadas com o encerramento das issues. Quatro diagnósticos/itens
encerrados como não planejados receberam Not planned e #703 recebeu Done.
As evidências históricas foram preservadas. O quadro continua vinculado às
issues existentes, com as visões ativas separadas do histórico.

## Próximas evidências

1. Fechar a preparação, conferir imagens/tag e promover a release.
2. Concluir revisão de correções, papel e confirmação PDF por identidade Google.
3. Executar backup externo/recuperação, observabilidade operada, renovação TLS,
   carga em homologação e cobertura dos fluxos críticos.
4. Registrar piloto observado, feedback e aceite institucional.

A matriz da Unidade 2 continua sendo a referência dos critérios acadêmicos.
A estimativa provisória anterior é 13/15 capacidades equivalentes, cerca de
87% ±8 pontos, e 12/17 critérios equivalentes da Unidade 2, cerca de 71% ±5.
Ela não foi promovida apenas por novos merges e precisa de revisão integral
quando as evidências operacionais forem entregues.
