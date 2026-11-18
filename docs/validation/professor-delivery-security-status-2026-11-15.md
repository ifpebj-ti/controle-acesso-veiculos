# Balanço das entregas e da segurança — 15/11/2026

## Atualização atual em 18/11/2026

Main `a4ffcc5`, após #764/#767. Release `0.5.0` publicada e instalada,
fonte `eaccd72`, imagens GHCR por digest e 23 migrations. O registro da
[promoção](release-050-rollout-2026-11-18.md) identifica backup, restauração,
SQL idempotente e 46 verificações HTTPS. Não somar execuções antigas como novos
casos. Os trechos datados de 15/11, 17/11 e a consulta pública anterior ao rollout
são históricos e não descrevem a versão atual.

Em 18/11 às 13h23 BRT, a borda recebeu somente o ajuste de Referrer-Policy
no-referrer (#772/PR #774), preservando imagens, containers e banco. Validação
pelo Caddy instalado, backup, reload e reteste público passaram. O verificador
confirmou redirect relativo, DENY único, cache e política de referência única;
providers retorna googleEnabled=true. Não houve nova autenticação do titular
nessa alteração. O aceite do professor continua separado do reteste técnico.

Os PRs #769 (metadados OCI) e #770 (notas revisadas de release) estão ready com
20 e 18 checks aprovados, respectivamente, nos SHAs 225c5e4 e 6213f87. Isso não
muda retroativamente as imagens 0.5.0. O #773 trata sete notes de caminhos nas
fixtures, sem remover catches protetores; o efeito remoto depende da análise
da main após incorporação. A consulta anterior conserva nove notes abertas.

O relatório externo ainda não pode ser considerado integralmente encerrado.
CAV-04/05/06 dependem da política coordenada #727; CAV-08/18 dependem da revisão
integrada #607/#613. Outros recortes de privacidade, correlação, mensagens e
borda continuam explicitados na tabela. O achado npm de desenvolvimento #765
é separado dos 28 IDs do professor e do audit de dependências de produção.

Consulte o [balanço consolidado de 18/11](delivery-closure-2026-11-18.md)
e a [matriz da Unidade 2](unit-2-readiness.md). A régua não foi inflada por PRs
ou correções ainda candidatas.

## Referência histórica de 15/11/2026

Rastreabilidade #728/#732. Main `2fe61b1`, após #722/#725/#729.
Homologação identificada com frontend `67ad6b8`, backend `f7ee701` e 22 migrations.

Este balanço cruza o documento de pendências da Unidade 1, a matriz da Unidade 2
e os 28 IDs do relatório externo v1.2. O relatório contém fotografias de fases
diferentes. O preâmbulo atualizado e a tabela canônica incluem CAV-28.
O original permanece privado. As descrições abaixo são sanitizadas.

## Atualização após os merges de 17/11/2026

A referência atual desta atualização é a main `202b787`, após #750 e #749.
As tabelas abaixo conservam o balanço de 15/11 e devem ser lidas junto aos
seguintes avanços e pendências.

| Tema                               | Estado confirmado e continuidade                                                                                                                                                                                                         |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CAV-07/CAV-28, reativação de conta | Backend #668 e interface #672 incorporados. A homologação identificada contém a composição de reativação. Entrega da credencial, finalidade, retenção e governança continuam exigindo o procedimento institucional.                      |
| CAV-26, funções de Transporte      | #704 e #705 incorporados após os ensaios registrados. Transporte dispõe das ações de negócio, relatórios e auditoria. Gestão de contas/perfis continua exclusiva do Administrador. Confirmação de exportação Google permanece na #699.   |
| Qualidade estática                 | #750 corrigiu os cinco apontamentos novos. A consulta posterior da API de Code Quality retorna nove achados abertos, todos note. A nota visual do painel deve ser conferida separadamente.                                               |
| Contingência em papel              | Backend #611 incorporado com migration aditiva 20261114132630_AddPaperReconciliation. A UI #712 e o exercício institucional permanecem pendentes. A próxima promoção deve revisar a passagem de 22 para 23 migrations e sua recuperação. |
| Eventos e relatórios               | Contrato status=all incorporado em #745. As interfaces #751/#752 estão em revisão, com ensaios locais atribuídos a Raíssa. A última API hospedada identificada f7ee701 ainda requer promoção compatível para esse contrato.              |
| CAV-04/CAV-05/CAV-06               | A #727 continua aberta para política coordenada de disponibilidade, limites e falhas de confirmação de senha. Os merges recentes não encerram esses três achados.                                                                        |
| CAV-17/CAV-22/CAV-23/CAV-27        | Configuração Nginx #725 incorporada. Promoção e reteste público permanecem na #686, incluindo redirects, headers, cache e política efetiva das camadas.                                                                                  |

A última hospedagem identificada continua frontend `67ad6b8`, backend `f7ee701`
e 22 migrations, conforme a última conferência administrativa. O rascunho
`0.5.0` está em preparação na #713, com PR #754. O encerramento dos itens
operacionais depende das respectivas evidências de implantação e uso.

## Consulta pública em 18/11/2026

Cinco GETs sem autenticação, com validação TLS e redirects desabilitados,
confirmaram login 200, readiness 200 e googleEnabled=true. O módulo público
index-Dqbj1ol2.js manteve SHA-256
a1a84cc6f0de37e82a2ae3cef530c1bda1068f27e958706bab419212b75795e4,
igual ao artefato público anteriormente identificado.

GET /api respondeu 308 com Location para HTTP e porta 8080. Login e bundle
continuaram sem Cache-Control explícito; a política Referrer-Policy observada
foi strict-origin-when-cross-origin. CAV-17/CAV-23/CAV-27 seguem aguardando a
promoção da configuração revisada e novo reteste. Readiness e providers
conservaram no-store. A consulta não autenticada não inspecionou imagens,
banco, cookies de sessão ou permissões de usuários.

## Solicitações dos professores

| Solicitação                                   | Evidência e estado atual                                                                                                                       | Continuidade                                                                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| README, Wiki, arquitetura, dados e protótipos | Documentados e vinculados. #721 atualizou prontidão e contratos atuais.                                                                        | Revisar os fluxos novos após incorporação e homologação.                                                                |
| Backlog no GitHub Projects                    | Quadro privado da organização, número 43, conferido pela API. A consulta desta revisão encontrou 397 itens.                                    | Manter estados coerentes e conferir o acesso dos avaliadores ao quadro privado.                                         |
| Cobertura numérica e gate de 70%              | #697 incorporou consolidação e piso backend na CI. A evidência da main `8b61ccd` mediu 93,50% de linhas.                                       | O recorte crítico/frontend de 90% continua nas #499/#507.                                                               |
| Automação de tag, release e changelog         | #701 incorporou o ciclo revisável, com testes do helper.                                                                                       | Executar sua primeira publicação completa nas #713/#686.                                                                |
| Releases frequentes e VM atualizada           | Imagens semânticas publicadas até `0.4.0`. Draft `0.5.0` preparado. A VM recebeu candidatos identificados.                                     | Publicar a próxima versão revisada e promovê-la com sua tag e evidências.                                               |
| Alertas verificáveis                          | Consulta autenticada de 15/11 retornou zero alertas abertos no Dependabot e zero no code scanning.                                             | Repetir a fotografia na entrega e conservar a triagem de novos alertas.                                                 |
| Gate de qualidade obrigatório                 | #722 implementa e testa o contexto `Quality Gate`.                                                                                             | Ativado em 15/11: Quality Gate do GitHub Actions e strict=true; exceção administrativa preservada (#661).               |
| Compose de produção com imagens do GHCR       | `docker-compose.production.yml` referencia imagens versionadas e usa configuração protegida.                                                   | Usar a versão efetivamente publicada no próximo rollout.                                                                |
| Backend/frontend com a mesma versão legível   | Tags semânticas e validação de manifests existem nas publicações.                                                                              | Fechar e publicar `0.5.0`; atualizar referências após a publicação.                                                     |
| Apagar branches após merge                    | `delete_branch_on_merge=true` conferido na API.                                                                                                | Manter limpeza limitada aos ramos incorporados ou ensaios encerrados.                                                   |
| URL no About e compartilhamento               | Homepage do repositório aponta para `https://dat.ernandescosta.me`.                                                                            | Fornecer o endereço e o roteiro aos avaliadores pelo canal escolhido por José.                                          |
| Fullscreen API                                | Controles e convite incorporados, com comportamento dependente do navegador e ação explícita.                                                  | Conservar a validação no tablet e nos navegadores do piloto.                                                            |
| Contas de teste por perfil                    | Houve ensaios locais/HTTPS com os quatro perfis e janelas fictícias delimitadas.                                                               | Agendar nova janela quando os avaliadores estiverem disponíveis. A fixture de Transporte de 15/11 expirou às 03h01 BRT. |
| Swagger/OpenAPI                               | Configurados na API em Development, com esquema Bearer e documentação dos endpoints.                                                           | Usar o ambiente de desenvolvimento no estudo/teste do contrato.                                                         |
| Reliability e Maintainability                 | API em 15/11: nove notes de Reliability e três de manutenção, sem warnings; três imports tratados no #731.                                     | Atualizar a evidência do portal e atender o critério da Unidade 2 acima de Good.                                        |
| WAF e HTTPS                                   | Borda OCI, origem privada, proxy e certificado público foram aplicados. A consulta HTTPS desta revisão funcionou com validação de certificado. | Concluir os retestes de borda e a renovação automática #509.                                                            |
| k6, monitoramento e operação                  | Há candidatos e instrumentação, com ensaios locais atribuídos.                                                                                 | Executar carga na nuvem #502, observabilidade #500 e gestão protegida #501.                                             |

O documento anterior que não encontrou Projects e não conseguiu ler alertas
usou outra visibilidade/permissão de API. A consulta autenticada desta revisão
comprovou o quadro existente e as contagens acima. A cadência de publicação
continua exigindo conclusão operacional.

## Controles já aplicados

- Google confirma a identidade dos operadores. A aplicação exige pré-autorização
  e aplica permissões no backend. O Administrador possui autenticação local.
- Senhas locais usam hash com salt e custo configurado de 210 mil iterações.
  Renovação de sessão, cookies protegidos, CSRF e revogação têm controles próprios.
- HTTPS protege o transporte. WAF, origem privada e proxy compõem a borda.
  Containers usam usuário sem privilégios, filesystem restrito e capabilities
  removidas. Segredos e chaveiro de proteção usam configuração protegida.
- A auditoria registra os atores das ações. Os candidatos de revisão/papel
  acrescentam proveniência e decisões independentes com gravação transacional.
- CodeQL realiza SAST. ZAP executa baseline passivo em stack descartável na CI.
  Trivy, Dependency Review e Dependabot cobrem componentes. SBOM identifica os
  pacotes dos artefatos. Cada execução conserva fonte e alcance registrados.

## Relatório externo — cinco achados médios

| ID                                       | Situação conferida                                                                                                                | O que falta                                                                     |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| CAV-01 — revogação do access token       | Correção incorporada e instalada. Validação da sessão, logout/reuso e isolamento de famílias receberam regressões e ensaio HTTPS. | Reteste independente do avaliador na versão revisada.                           |
| CAV-02 — filtros LIKE/ILIKE              | Escape literal incorporado e instalado, com regressões e ensaio dos filtros/relatórios.                                           | Revalidar os caminhos novos e o reteste independente.                           |
| CAV-03 — identidade histórica do veículo | Contenção instalada impede renomear identidade de veículo com registros vinculados.                                               | Snapshot histórico completo e estratégia de legado continuam além da contenção. |
| CAV-04 — indisponibilidade por lockout   | O login local conserva cinco falhas e 15 minutos de bloqueio. A recuperação Local recebeu backend seguro.                         | Revisar disponibilidade, contadores e recuperação de forma coordenada na #727.  |
| CAV-05 — limites aplicação/borda         | Aplicação limita login por IP e possui resposta 429 própria. A borda tem configuração e comportamento específicos.                | Comprovar o conjunto efetivo e tratar limitação por conta/origem na #727.       |

## Relatório externo — treze achados baixos

| ID                                           | Situação conferida                                                                                                                                 | O que falta                                                                                  |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| CAV-06 — tentativa de senha atual            | Troca autenticada possui limiter por usuário. A senha atual incorreta ainda não participa de um contador adicional na conta.                       | Política, implementação e ensaio da #727.                                                    |
| CAV-07 — reativação Local                    | #668/#672 incorporados. Backend de recuperação segura, obrigatoriedade de troca e interface têm evidências na composição HTTPS identificada.       | Revalidar o procedimento de recuperação e a nova versão com o avaliador.                     |
| CAV-08 — conteúdo da correção na auditoria   | #607 contém snapshots, proposta/decisão e auditoria transacional. #613 contém a interface candidata.                                               | Composição HTTPS e aceite da interface antes da promoção desse fluxo.                        |
| CAV-09 — paridade Porteiro/Vigilante         | A mesma operação para os dois perfis foi aprovada como regra do produto. A API mantém autorização e autoria.                                       | Concluir revisão independente de correções #451 e observar o fluxo operacional.              |
| CAV-10 — texto livre na auditoria            | Consulta restrita e no-store existem. Motivos e estados continuam exigindo finalidade e minimização.                                               | Revisão de privacidade e governança do conteúdo consultável.                                 |
| CAV-11 — cache sensível                      | No-store incorporado, instalado e exercitado nos endpoints protegidos do recorte.                                                                  | Conservar a cobertura nos endpoints novos e no reteste independente.                         |
| CAV-12 — health público                      | Readiness/liveness públicos permanecem no desenho de operação e respondem sem detalhes internos de banco.                                          | Revisar custo, escopo de borda e limites específicos com evidência operacional.              |
| CAV-13 — logout anônimo                      | O código tem proteção CSRF e caminho de saída quando não há cookie de sessão.                                                                      | Comprovar custo e limitação do conjunto exposto nos cenários do relatório.                   |
| CAV-14 — datas extremas                      | Validação incorporada e instalada, com respostas 400 e testes nos limites do resumo operacional.                                                   | Reteste independente e regressões para novos filtros de data.                                |
| CAV-15 — NUL em texto                        | Validações incorporadas para os recortes de entrada, consultas e campos revisados. A implantação posterior preservou essas correções.              | Conservar a validação nos campos novos e executar o reteste do avaliador.                    |
| CAV-16 — correlação fornecida pelo cliente   | A consulta de 15/11 confirmou que um GUID de correlação válido enviado pelo cliente é refletido.                                                   | Separar identidade interna e correlação externa, com análise de observabilidade.             |
| CAV-17 — redirect para HTTP/porta interna    | Correção #725 instalada em 0.5.0. Reteste público de 18/11 confirmou redirect relativo /api/.                                                      | Reteste independente do avaliador e regressão nas próximas versões.                          |
| CAV-28 — credencial temporária e soft-delete | Entrega única, prazo, troca obrigatória e desativação preservando autoria são controles existentes. A reativação Local recebeu recuperação segura. | Concluir a interface, o procedimento de entrega e a governança da limpeza fictícia/retenção. |

## Relatório externo — dez achados informativos

| ID                                      | Situação conferida                                                                                                                     | O que falta                                                                 |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| CAV-18 — sobrescrita concorrente        | #607 valida a base original, serializa decisões e preserva proposta/decisão, com testes PostgreSQL.                                    | Implantar o fluxo integrado de revisão com #613.                            |
| CAV-19 — antiforgery no login           | Login local continua com seu desenho próprio; refresh/logout/troca possuem controles CSRF.                                             | Registrar a análise específica do login e o risco residual.                 |
| CAV-20 — traceId em erros               | Correlação técnica segue no contrato de erro. Os identificadores auxiliam a investigação.                                              | Formalizar o conteúdo público e os limites de exposição da observabilidade. |
| CAV-21 — fallback SPA                   | A configuração mantém o fallback das rotas do cliente. #725 acrescenta 404 para recursos estáticos ausentes.                           | Avaliar o status HTTP das demais rotas inexistentes do SPA.                 |
| CAV-22 — frames duplicados              | Reteste público de 18/11 confirmou DENY único, incluindo CSRF, com no-store preservado.                                                | Reteste independente e preservação nas respostas novas.                     |
| CAV-23 — cache dos bundles/HTML         | 0.5.0 instalada; verificador público aprovou HTML no-cache, bundle imutável por hash e 404 de recurso ausente.                         | Reteste independente e preservação nas próximas promoções.                  |
| CAV-24 — respostas e cobertura de borda | WAF/proxy estão aplicados e possuem contrato operacional próprio. A aplicação trata validação literal.                                 | Conferir erros 400/403/413/429, headers e limites efetivos por camada.      |
| CAV-25 — mensagem de validação          | O login ainda agrupa entrada ausente, inválida ou excessiva em mensagem de obrigatoriedade.                                            | Ajustar validação de formato preservando negação genérica e acessibilidade. |
| CAV-26 — menu e policy                  | Permissões de negócio e interface do Transporte foram incorporadas em #693/#705, com auditoria e restrição de contas ao Administrador. | Revalidar as permissões na próxima versão promovida.                        |
| CAV-27 — configuração efetiva           | Política Caddy ajustada em 18/11 às 13h23 BRT; reteste público confirmou no-referrer único. Aplicação 0.5.0 preservada.                | Aceite independente do avaliador. Fonte/rollout específicos no PR #774.     |

## Trabalho novo desta revisão

- #722 agrega os resultados de qualidade com token de leitura. Passou no PR
  real de código. O ensaio #724 comprovou documento aprovado, falha recusada e
  cancelamento recusado, com fontes e conclusões registradas na #726.
- O primeiro ensaio detectou que CodeQL pode emitir `neutral` enquanto ainda
  recebe uma configuração. O agregador passou a aguardar um resultado definitivo,
  com regressão específica. A suíte local possui 47 testes, incluindo 20 do gate.
- Após o merge humano, a proteção da main passou a exigir `Quality Gate` do
  GitHub Actions e branch atualizada, preservando uma revisão obrigatória. A
  #661 registra a ativação e a exceção administrativa que já existia.
- #725 corrige três achados de resposta e o recurso estático ausente. Cinco
  verificações falharam com a configuração anterior e passaram na candidata,
  usando Nginx real e upstream de teste. O smoke da CI usa a API real.
- O conjunto papel/revisão teve 649 testes completos aprovados, com 93,75%
  de cobertura de linhas, na composição local `d23ed42`. As interfaces e a
  promoção desse conjunto continuam nos seus critérios próprios.

## Unidade 2 e conclusão do produto

A [matriz da Unidade 2](unit-2-readiness.md) conserva 17 critérios, com 8
atendidos, 7 parciais e 2 pendentes. Pela régua de 1/0,5/0, são 11,5/17,
aproximadamente 68% ±5 pontos. O inventário funcional provisório conserva
13/15 capacidades equivalentes, aproximadamente 87% ±8 pontos.

Os oito critérios acadêmicos atendidos cobrem rastreabilidade, existência de
versões/changelog, fotografia de alertas, SSL/proxy, guia de segurança, VM,
containers implantados e DNS. Os sete parciais cobrem estratégia/cobertura,
manual, métricas do portal, componentes críticos, bugs críticos, observabilidade
e uso integrado observado. Gestão de containers e carga medida na nuvem estão
pendentes. A nova cadência de release e os novos candidatos têm seu próprio aceite.

Para a operação institucional, também faltam backup externo/PITR, exercício de
recuperação com RPO/RTO, renovação automática TLS, métricas/alertas operados e
piloto acompanhado. As correções de papel, revisão e PDF federado precisam da
conclusão dos respectivos fluxos.

## Evidências e referências

- [Promoção de segurança e 162 verificações HTTPS](backend-security-rollout-2026-11-10.md).
- [Composição atual e testes de papel/revisão](continuity-2026-11-15.md).
- [Correções de resposta do frontend](https://github.com/ifpebj-ti/controle-acesso-veiculos/blob/10abedce01b3be08df3228c9d2e8e6360e01ef7f/docs/security/frontend-response-hardening.md), incorporadas no #725.
- [Gate obrigatório e configuração consultada](https://github.com/ifpebj-ti/controle-acesso-veiculos/blob/3aaf16974c1287558660c65aac542636e27cc437/docs/development/required-quality-gate.md), incorporado no #722.
- [Análises SAST, DAST e componentes](../security/security-analysis.md).
- [Quadro da organização](https://github.com/orgs/ifpebj-ti/projects/43), acesso privado.

Os dois documentos candidatos acima passam a integrar suas referências após a
incorporação dos respectivos PRs. O avaliador poderá repetir os cenários do
relatório na versão promovida e registrar seu parecer de encerramento.

## Complemento de governança após os merges

#722, #725 e #729 foram incorporados por José. A proteção efetiva agora exige
Quality Gate do GitHub Actions e branch atualizada, preservando uma revisão e a
exceção administrativa anterior. Isso não promove imagens nem atualiza a VM.
A consulta do Code Quality retornou 12 notes: três imports de testes Python
(#730/#731) e nove de Reliability. Os sete caminhos de arquivos dos testes usam
componentes controlados; os dois catches preservam cancelamento e convertem
falhas em respostas seguras nas fronteiras de relatórios/readiness. Não houve
supressão de regras nem retirada desses controles para elevar a nota.

O Projects #43 continua privado. As visões de trabalho ocultam itens encerrados;
o histórico completo continua disponível. O inventário inicial continha 400
itens, 357 encerrados/finalizados e 43 abertos, sem divergência de estado. Nenhum
item foi apagado e nenhuma validação institucional foi marcada por organização.
