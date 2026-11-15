# Balanço das entregas e da segurança — 15/11/2026

Rastreabilidade #728. Main `b2b922b`, após a incorporação do #721.
Homologação identificada com frontend `67ad6b8`, backend `f7ee701` e 22 migrations.

Este balanço cruza o documento de pendências da Unidade 1, a matriz da Unidade 2
e os 28 IDs do relatório externo v1.2. O relatório contém fotografias de fases
diferentes. O preâmbulo atualizado e a tabela canônica incluem CAV-28.
O original permanece privado. As descrições abaixo são sanitizadas.

## Solicitações dos professores

| Solicitação                                   | Evidência e estado atual                                                                                                                       | Continuidade                                                                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| README, Wiki, arquitetura, dados e protótipos | Documentados e vinculados. #721 atualizou prontidão e contratos atuais.                                                                        | Revisar os fluxos novos após incorporação e homologação.                                                                |
| Backlog no GitHub Projects                    | Quadro privado da organização, número 43, conferido pela API. A consulta desta revisão encontrou 397 itens.                                    | Manter estados coerentes e conferir o acesso dos avaliadores ao quadro privado.                                         |
| Cobertura numérica e gate de 70%              | #697 incorporou consolidação e piso backend na CI. A evidência da main `8b61ccd` mediu 93,50% de linhas.                                       | O recorte crítico/frontend de 90% continua nas #499/#507.                                                               |
| Automação de tag, release e changelog         | #701 incorporou o ciclo revisável, com testes do helper.                                                                                       | Executar sua primeira publicação completa nas #713/#686.                                                                |
| Releases frequentes e VM atualizada           | Imagens semânticas publicadas até `0.4.0`. Draft `0.5.0` preparado. A VM recebeu candidatos identificados.                                     | Publicar a próxima versão revisada e promovê-la com sua tag e evidências.                                               |
| Alertas verificáveis                          | Consulta autenticada de 15/11 retornou zero alertas abertos no Dependabot e zero no code scanning.                                             | Repetir a fotografia na entrega e conservar a triagem de novos alertas.                                                 |
| Gate de qualidade obrigatório                 | #722 implementa e testa o contexto `Quality Gate`.                                                                                             | Após incorporação, ativar o contexto obrigatório e branch atualizada na #661.                                           |
| Compose de produção com imagens do GHCR       | `docker-compose.production.yml` referencia imagens versionadas e usa configuração protegida.                                                   | Usar a versão efetivamente publicada no próximo rollout.                                                                |
| Backend/frontend com a mesma versão legível   | Tags semânticas e validação de manifests existem nas publicações.                                                                              | Fechar e publicar `0.5.0`; atualizar referências após a publicação.                                                     |
| Apagar branches após merge                    | `delete_branch_on_merge=true` conferido na API.                                                                                                | Manter limpeza limitada aos ramos incorporados ou ensaios encerrados.                                                   |
| URL no About e compartilhamento               | Homepage do repositório aponta para `https://dat.ernandescosta.me`.                                                                            | Fornecer o endereço e o roteiro aos avaliadores pelo canal escolhido por José.                                          |
| Fullscreen API                                | Controles e convite incorporados, com comportamento dependente do navegador e ação explícita.                                                  | Conservar a validação no tablet e nos navegadores do piloto.                                                            |
| Contas de teste por perfil                    | Houve ensaios locais/HTTPS com os quatro perfis e janelas fictícias delimitadas.                                                               | Agendar nova janela quando os avaliadores estiverem disponíveis. A fixture de Transporte de 15/11 expirou às 03h01 BRT. |
| Swagger/OpenAPI                               | Configurados na API em Development, com esquema Bearer e documentação dos endpoints.                                                           | Usar o ambiente de desenvolvimento no estudo/teste do contrato.                                                         |
| Reliability e Maintainability                 | A conferência #684 registrou nove notes e zero warnings, compatível com Good naquele snapshot.                                                 | Atualizar a evidência do portal e atender o critério da Unidade 2 acima de Good.                                        |
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
| CAV-07 — reativação Local                    | #668 incorporado. Backend de recuperação segura e obrigatoriedade de troca estão no candidato HTTPS. Interface #672 segue em revisão.              | Concluir as tarefas integradas restantes e o reteste do achado.                              |
| CAV-08 — conteúdo da correção na auditoria   | #607 contém snapshots, proposta/decisão e auditoria transacional. #613 contém a interface candidata.                                               | Composição HTTPS e aceite da interface antes da promoção desse fluxo.                        |
| CAV-09 — paridade Porteiro/Vigilante         | A mesma operação para os dois perfis foi aprovada como regra do produto. A API mantém autorização e autoria.                                       | Concluir revisão independente de correções #451 e observar o fluxo operacional.              |
| CAV-10 — texto livre na auditoria            | Consulta restrita e no-store existem. Motivos e estados continuam exigindo finalidade e minimização.                                               | Revisão de privacidade e governança do conteúdo consultável.                                 |
| CAV-11 — cache sensível                      | No-store incorporado, instalado e exercitado nos endpoints protegidos do recorte.                                                                  | Conservar a cobertura nos endpoints novos e no reteste independente.                         |
| CAV-12 — health público                      | Readiness/liveness públicos permanecem no desenho de operação e respondem sem detalhes internos de banco.                                          | Revisar custo, escopo de borda e limites específicos com evidência operacional.              |
| CAV-13 — logout anônimo                      | O código tem proteção CSRF e caminho de saída quando não há cookie de sessão.                                                                      | Comprovar custo e limitação do conjunto exposto nos cenários do relatório.                   |
| CAV-14 — datas extremas                      | Validação incorporada e instalada, com respostas 400 e testes nos limites do resumo operacional.                                                   | Reteste independente e regressões para novos filtros de data.                                |
| CAV-15 — NUL em texto                        | Validações incorporadas para os recortes de entrada, consultas e campos revisados. A implantação posterior preservou essas correções.              | Conservar a validação nos campos novos e executar o reteste do avaliador.                    |
| CAV-16 — correlação fornecida pelo cliente   | A consulta de 15/11 confirmou que um GUID de correlação válido enviado pelo cliente é refletido.                                                   | Separar identidade interna e correlação externa, com análise de observabilidade.             |
| CAV-17 — redirect para HTTP/porta interna    | Confirmado no site em 15/11. Correção candidata #725 usa redirect relativo e passou no Nginx real local.                                           | Incorporar, promover e repetir a consulta pública pela #686.                                 |
| CAV-28 — credencial temporária e soft-delete | Entrega única, prazo, troca obrigatória e desativação preservando autoria são controles existentes. A reativação Local recebeu recuperação segura. | Concluir a interface, o procedimento de entrega e a governança da limpeza fictícia/retenção. |

## Relatório externo — dez achados informativos

| ID                                      | Situação conferida                                                                                                                                               | O que falta                                                                    |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| CAV-18 — sobrescrita concorrente        | #607 valida a base original, serializa decisões e preserva proposta/decisão, com testes PostgreSQL.                                                              | Implantar o fluxo integrado de revisão com #613.                               |
| CAV-19 — antiforgery no login           | Login local continua com seu desenho próprio; refresh/logout/troca possuem controles CSRF.                                                                       | Registrar a análise específica do login e o risco residual.                    |
| CAV-20 — traceId em erros               | Correlação técnica segue no contrato de erro. Os identificadores auxiliam a investigação.                                                                        | Formalizar o conteúdo público e os limites de exposição da observabilidade.    |
| CAV-21 — fallback SPA                   | A configuração mantém o fallback das rotas do cliente. #725 acrescenta 404 para recursos estáticos ausentes.                                                     | Avaliar o status HTTP das demais rotas inexistentes do SPA.                    |
| CAV-22 — frames duplicados              | Confirmado no CSRF público. #725 passou no ensaio local com um único DENY e no-store preservado.                                                                 | Promoção e reteste da resposta pública.                                        |
| CAV-23 — cache dos bundles/HTML         | Ausência de política explícita confirmada em 15/11. #725 passou com HTML revalidável e bundles com hash imutáveis.                                               | Promoção e reteste dos assets servidos.                                        |
| CAV-24 — respostas e cobertura de borda | WAF/proxy estão aplicados e possuem contrato operacional próprio. A aplicação trata validação literal.                                                           | Conferir erros 400/403/413/429, headers e limites efetivos por camada.         |
| CAV-25 — mensagem de validação          | O login ainda agrupa entrada ausente, inválida ou excessiva em mensagem de obrigatoriedade.                                                                      | Ajustar validação de formato preservando negação genérica e acessibilidade.    |
| CAV-26 — menu e policy                  | Permissões de negócio do Transporte foram ampliadas no backend. #705 adequa a interface e continua em revisão.                                                   | Concluir as tarefas autenticadas do Transporte e a incorporação do frontend.   |
| CAV-27 — configuração efetiva           | A implantação tem fonte/imagem identificadas. A borda pública devolveu strict-origin-when-cross-origin em 15/11, enquanto o Nginx versionado define no-referrer. | Alinhar e registrar a política efetiva das camadas, com reteste após promoção. |

## Trabalho novo desta revisão

- #722 agrega os resultados de qualidade com token de leitura. Passou no PR
  real de código. O ensaio #724 comprovou documento aprovado, falha recusada e
  cancelamento recusado, com fontes e conclusões registradas na #726.
- O primeiro ensaio detectou que CodeQL pode emitir `neutral` enquanto ainda
  recebe uma configuração. O agregador passou a aguardar um resultado definitivo,
  com regressão específica. A suíte local possui 47 testes, incluindo 20 do gate.
- A leitura da proteção da main encontrou uma revisão obrigatória e nenhum
  check obrigatório. A #661 acompanha a ativação de `Quality Gate` após o merge
  humano do workflow e a decisão institucional sobre exceções administrativas.
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
- [Correções de resposta do frontend](https://github.com/ifpebj-ti/controle-acesso-veiculos/blob/10abedce01b3be08df3228c9d2e8e6360e01ef7f/docs/security/frontend-response-hardening.md), no candidato #725.
- [Gate obrigatório e configuração consultada](https://github.com/ifpebj-ti/controle-acesso-veiculos/blob/3aaf16974c1287558660c65aac542636e27cc437/docs/development/required-quality-gate.md), no candidato #722.
- [Análises SAST, DAST e componentes](../security/security-analysis.md).
- [Quadro da organização](https://github.com/orgs/ifpebj-ti/projects/43), acesso privado.

Os dois documentos candidatos acima passam a integrar suas referências após a
incorporação dos respectivos PRs. O avaliador poderá repetir os cenários do
relatório na versão promovida e registrar seu parecer de encerramento.
