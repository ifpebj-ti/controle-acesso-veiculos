# Preparação para a Unidade 2

## Objetivo e critério

Esta matriz relaciona as entregas obrigatórias da Unidade 2, conforme o documento
acadêmico recebido em 23 de outubro de 2026, às evidências atuais do projeto. A
fotografia documental foi reconciliada em **3 de novembro de 2026** após os merges
#601 e #604. A contagem acadêmica histórica abaixo não foi recalculada apenas
pela organização do backlog.

A main auditada é `8322961`. A release publicada continua `0.4.0`, mas a
hospedagem conhecida executa frontend candidato `d5a7ba5` e backend candidato
`0ca897d`, com Google habilitado. O #601 adiciona seleção explícita de conta na
main, sem implantação automática; o #604 incorpora a auditoria e a ampliação
dos testes de autorização. Não confundir essas fontes ou inferir nova release.

A [auditoria de 02/11](integrated-candidate-audit-2026-11-02.md) registra 631
testes do frontend candidato e 381 do backend candidato aprovados, além de
consultas e PDFs reais pela API. A lista de usuários falha no frontend hospedado
por incompatibilidade de schema, tratada no #530; o erro é classificado
incorretamente como rede (#603). Seis consultas vazias não comprovam itens
populados. Sucesso Google e login administrativo pela interface foram relatados
por José; negação com outro titular e troca de conta permanecem pendentes.

O [inventário completo](backlog-inventory-2026-11-03.md) separa estabilização,
Unidade 2 e futuro; o [roteiro de decisões](pending-decisions-2026-11-03.md) evita
solicitar novamente definições já comunicadas. Backup externo, observabilidade
operada, renovação automática de TLS, carga limitada e aceite observado continuam
pendentes. O ensaio de restauração no mesmo host não comprova backup externo,
RPO de uma hora ou RTO institucional.

As classificações são:

- **Atendido:** existe evidência verificável suficiente para o item;
- **Parcial:** existe base implementada, mas falta um critério obrigatório;
- **Pendente:** a evidência obrigatória ainda não existe;
- **Validação externa:** depende do portal, da infraestrutura ou de uma pessoa
  autorizada e não pode ser inferida somente pelo código.

Itens repetidos no checklist oficial, como release, tag e changelog, são contados
uma única vez nesta estimativa para evitar percentual artificialmente elevado.

## Engenharia de Software

| Entrega                                       | Evidência atual                                                                                                                                                         | Estado                       | Próxima comprovação                                                                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Estratégia de testes                          | [Wiki — Estratégia de Testes](https://github.com/ifpebj-ti/controle-acesso-veiculos/wiki/Estrategia-de-Testes), [CI/CD](../development/ci-cd.md) e suítes automatizadas | Parcial                      | auditoria da Wiki #545 corrigiu contradições e a meta de 90%; falta comprovar medição por risco e incorporar o gate revisado |
| Manual de uso                                 | [Wiki — Manual de Uso](https://github.com/ifpebj-ti/controle-acesso-veiculos/wiki/Manual-de-Uso)                                                                        | Parcial                      | revisar após login Google, nome oficial, relatórios e validação final dos quatro perfis                                      |
| Ligação story → PR → testes → pipeline → demo | Issues, PRs, commits `Refs/Closes`, checks e registros semanais                                                                                                         | Atendido                     | manter a rastreabilidade nas próximas entregas e anexar evidência da demonstração quando solicitada                          |
| Maintainability e Reliability acima de Good   | CodeQL e checks de qualidade estão ativos                                                                                                                               | Pendente / validação externa | resolver os avisos atuais e conferir os dois indicadores no portal GitHub Security and quality                               |
| Tags, releases e changelog                    | [`v0.4.0`](https://github.com/ifpebj-ti/controle-acesso-veiculos/releases/tag/v0.4.0), imagens semânticas e [`CHANGELOG.md`](../../CHANGELOG.md)                        | Atendido                     | criar nova release somente após fechar o incremento que irá para a homologação                                               |

## Segurança

| Entrega                                                   | Evidência atual                                                                                                                                                         | Estado                      | Próxima comprovação                                                                                                          |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Cobertura mínima de 90% nos componentes e fluxos críticos | a [Issue #499](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/499) e o PR #507 registram medição reproduzível, testes adicionais e gates progressivos     | Parcial                     | concluir 90% no recorte aprovado; trabalho aberto ou draft não é contado como entrega incorporada                            |
| Zero bugs críticos                                        | builds, testes, lint e CodeQL da `main` estão verdes no SHA observado                                                                                                   | Parcial / validação externa | conferir a classificação vigente no portal de qualidade e registrar evidência datada                                         |
| Zero vulnerabilidades altas e críticas no Dependabot      | consulta autenticada à API GitHub em 31/10/2026 registrou zero alertas abertos no Dependabot; Dependency Review, Trivy e CodeQL permanecem ativos                       | Atendido na fotografia      | repetir a consulta antes da entrega; ausência de alerta conhecido não significa risco zero                                   |
| SSL válido, domínio e proxy reverso                       | DNS, certificado público confiável, Load Balancer HTTPS, WAF e Caddy foram validados em 26/10/2026                                                                      | Atendido                    | automatizar renovação, alerta e rollback pela [Issue #509](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/509) |
| Guia de Segurança e Privacidade                           | [central de segurança](../security/README.md), [guia seguro](../security/secure-development-guide.md), [STRIDE](../security/threat-model.md) e documentação de retenção | Atendido                    | sincronizar a Wiki após os merges e anexar a validação de LGPD aplicável ao piloto                                           |

## Infraestrutura e operação

| Entrega                                     | Evidência atual                                                                                                     | Estado                                                                              | Próxima comprovação                                                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| VM IaaS em nuvem pública                    | VM privada provisionada na OCI                                                                                      | Atendido                                                                            | manter custo, acesso e configuração sob revisão                                                                                 |
| Aplicação conteinerizada na VM              | frontend `d5a7ba5`, API `0ca897d` e PostgreSQL em homologação; estável `0.4.0` preservada                           | Atendido                                                                            | promover uma nova versão somente por release revisada                                                                           |
| Nome de domínio com resolução funcional     | hostname temporário resolve publicamente para a borda protegida da homologação                                      | Atendido                                                                            | substituir pelo nome institucional somente após aprovação; isso não impede o piloto controlado                                  |
| Plataforma de gerenciamento de contêineres  | não provisionada                                                                                                    | Pendente — [#501](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/501) | selecionar Portainer, Dockge/Dockhand ou equivalente, proteger o acesso e documentar operação                                   |
| Observabilidade com métricas, logs e traces | instrumentação OTLP e logs estruturados existem; collector, armazenamento e painéis não                             | Parcial — [#500](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/500)  | implantar stack simples, comprovar CPU, memória, disco, logs e traces e definir retenção/alertas                                |
| Teste de carga com k6 e análise de gargalos | script preparado no candidato #515; nenhuma execução observada foi comprovada                                       | Pendente — [#502](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/502) | criar cenário autorizado, executar cargas baixa/média/intensa e registrar resultados e melhorias                                |
| Software implantado, acessível e utilizável | candidato responde por HTTPS; houve login relatado e probes técnicos, com bug de contas e aceite completo pendentes | Parcial                                                                             | quatro contas fictícias já preparadas e verificadas; promover release compatível e observar o roteiro com os perfis autorizados |

## Estimativa auditável

Para acompanhamento, cada um dos 17 itens obrigatórios consolidados recebe:

- `1` quando atendido;
- `0,5` quando parcial;
- `0` quando pendente.

Na contagem histórica de 26/10/2026, preservada em 31/10 e ainda não recalculada
nesta revisão de 03/11/2026, existem
**8 itens atendidos, 6 parciais e 3
pendentes**, resultando em **11 / 17 = 64,7%**. A incerteza estimada é de **±5
pontos percentuais**, principalmente porque os indicadores do portal, a cobertura
real e as validações humanas ainda precisam ser aferidos.

Essa é a última estimativa histórica, não uma medição nova de 03/11. Ela mede o
marco acadêmico da Unidade 2, não o volume de código nem a
prontidão para produção. Revisão documental, novas contas de teste e PRs draft
não recebem pontos adicionais enquanto persistir um critério obrigatório.

## Evidências adicionais de 31/10/2026

- Main auditada: `ad54c41`; hospedagem conhecida: imagens `0.4.0`.
- Backend: 368 testes aprovados nos TRX da CI `41217458021`, SHA `a82c75e`;
  frontend: 572 testes aprovados em 54 arquivos na execução local da main.
- Vinte migrations versionadas; a revisão não aplicou migrations na VM.
- Quatro perfis fictícios de avaliação preparados na hospedagem, incluindo um
  Administrador separado. Verificados login administrativo, contas, auditoria
  e consultas/PDFs sem registros, sem declarar aceite visual dos documentos.
- Interface de alteração de perfis (#530), login Google (#474/#494), Google real
  (#448) e homologação de relatórios (#443/#532) permanecem em validação.
- Credenciais e artefatos privados não integram esta documentação.

O [resumo das entregas recentes](weekly-review-2026-10-31.md) explica o impacto
prático e a sequência de dependências. A auditoria ampla da Wiki está na #545.

## Ordem recomendada

1. automatizar a renovação e a recuperação do certificado confiável;
2. concluir 90% de cobertura no recorte crítico e incorporar os gates revisados;
3. corrigir e comprovar Maintainability, Reliability e inventário de
   vulnerabilidades;
4. implantar a plataforma de gerenciamento com acesso restrito;
5. implantar observabilidade mínima com métricas, logs e traces;
6. executar k6, analisar gargalos e registrar melhorias;
7. atualizar o manual, ensaiar os quatro perfis e conduzir o piloto acompanhado;
8. revisar documentação, Wiki e changelog e publicar a próxima release candidata.
