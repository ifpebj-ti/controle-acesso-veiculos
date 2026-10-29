# Preparação para a Unidade 2

## Objetivo e critério

Esta matriz relaciona as entregas obrigatórias da Unidade 2, conforme o documento
acadêmico recebido em 23 de outubro de 2026, às evidências atuais do projeto. A
fotografia documental foi revisada em **28 de outubro de 2026** e deve ser revisada a cada
entrega relevante.

Os PRs #520, #524 e #521 incorporaram as correções de hostname, protocolo HTTPS
e callback Google. Readiness, login fictício, CSRF, refresh e logout foram
validados no domínio público após os ajustes operacionais. A VM continua na
release `v0.4.0`, com correção temporária de proxy; a próxima release precisa
incorporar a configuração definitiva. O
[guia de implantação](../operations/versioned-container-deployment.md#primeira-promoção-após-os-ajustes-de-https)
detalha a promoção e a compatibilidade dos segredos. Essas correções consolidam
um item já atendido e não acrescentam pontos à estimativa acadêmica.

As classificações são:

- **Atendido:** existe evidência verificável suficiente para o item;
- **Parcial:** existe base implementada, mas falta um critério obrigatório;
- **Pendente:** a evidência obrigatória ainda não existe;
- **Validação externa:** depende do portal, da infraestrutura ou de uma pessoa
  autorizada e não pode ser inferida somente pelo código.

Itens repetidos no checklist oficial, como release, tag e changelog, são contados
uma única vez nesta estimativa para evitar percentual artificialmente elevado.

## Engenharia de Software

| Entrega                                       | Evidência atual                                                                                                                                                         | Estado                       | Próxima comprovação                                                                                        |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Estratégia de testes                          | [Wiki — Estratégia de Testes](https://github.com/ifpebj-ti/controle-acesso-veiculos/wiki/Estrategia-de-Testes), [CI/CD](../development/ci-cd.md) e suítes automatizadas | Parcial                      | eliminar trechos históricos contraditórios, registrar a meta oficial de 90% por risco e publicar a medição |
| Manual de uso                                 | [Wiki — Manual de Uso](https://github.com/ifpebj-ti/controle-acesso-veiculos/wiki/Manual-de-Uso)                                                                        | Parcial                      | revisar após login Google, nome oficial, relatórios e validação final dos quatro perfis                    |
| Ligação story → PR → testes → pipeline → demo | Issues, PRs, commits `Refs/Closes`, checks e registros semanais                                                                                                         | Atendido                     | manter a rastreabilidade nas próximas entregas e anexar evidência da demonstração quando solicitada        |
| Maintainability e Reliability acima de Good   | CodeQL e checks de qualidade estão ativos                                                                                                                               | Pendente / validação externa | resolver os avisos atuais e conferir os dois indicadores no portal GitHub Security and quality             |
| Tags, releases e changelog                    | [`v0.4.0`](https://github.com/ifpebj-ti/controle-acesso-veiculos/releases/tag/v0.4.0), imagens semânticas e [`CHANGELOG.md`](../../CHANGELOG.md)                        | Atendido                     | criar nova release somente após fechar o incremento que irá para a homologação                             |

## Segurança

| Entrega                                                   | Evidência atual                                                                                                                                                         | Estado                      | Próxima comprovação                                                                                                          |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Cobertura mínima de 90% nos componentes e fluxos críticos | a [Issue #499](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/499) e o PR #507 registram medição reproduzível, testes adicionais e gates progressivos     | Parcial                     | concluir 90% no recorte aprovado; trabalho aberto ou draft não é contado como entrega incorporada                            |
| Zero bugs críticos                                        | builds, testes, lint e CodeQL da `main` estão verdes no SHA observado                                                                                                   | Parcial / validação externa | conferir a classificação vigente no portal de qualidade e registrar evidência datada                                         |
| Zero vulnerabilidades altas e críticas no Dependabot      | consulta autenticada ao portal em 26/10/2026 registrou zero alertas abertos no Dependabot; Dependency Review, Trivy e CodeQL permanecem ativos                          | Atendido na fotografia      | repetir a consulta antes da entrega; ausência de alerta conhecido não significa risco zero                                   |
| SSL válido, domínio e proxy reverso                       | DNS, certificado público confiável, Load Balancer HTTPS, WAF e Caddy foram validados em 26/10/2026                                                                      | Atendido                    | automatizar renovação, alerta e rollback pela [Issue #509](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/509) |
| Guia de Segurança e Privacidade                           | [central de segurança](../security/README.md), [guia seguro](../security/secure-development-guide.md), [STRIDE](../security/threat-model.md) e documentação de retenção | Atendido                    | sincronizar a Wiki após os merges e anexar a validação de LGPD aplicável ao piloto                                           |

## Infraestrutura e operação

| Entrega                                     | Evidência atual                                                                               | Estado                                                                              | Próxima comprovação                                                                                     |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| VM IaaS em nuvem pública                    | VM privada provisionada na OCI                                                                | Atendido                                                                            | manter custo, acesso e configuração sob revisão                                                         |
| Aplicação conteinerizada na VM              | frontend, API e PostgreSQL `v0.4.0` saudáveis                                                 | Atendido                                                                            | promover uma nova versão somente por release revisada                                                   |
| Nome de domínio com resolução funcional     | hostname temporário resolve publicamente para a borda protegida da homologação                | Atendido                                                                            | substituir pelo nome institucional somente após aprovação; isso não impede o piloto controlado          |
| Plataforma de gerenciamento de contêineres  | não provisionada                                                                              | Pendente — [#501](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/501) | selecionar Portainer, Dockge/Dockhand ou equivalente, proteger o acesso e documentar operação           |
| Observabilidade com métricas, logs e traces | instrumentação OTLP e logs estruturados existem; collector, armazenamento e painéis não       | Parcial — [#500](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/500)  | implantar stack simples, comprovar CPU, memória, disco, logs e traces e definir retenção/alertas        |
| Teste de carga com k6 e análise de gargalos | não existe script ou execução versionada                                                      | Pendente — [#502](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/502) | criar cenário autorizado, executar cargas baixa/média/intensa e registrar resultados e melhorias        |
| Software implantado, acessível e utilizável | stack responde pela borda OCI com HTTPS confiável, mas o piloto acompanhado ainda não começou | Parcial                                                                             | promover uma release revisada, preparar contas fictícias e executar o roteiro com os perfis autorizados |

## Estimativa auditável

Para acompanhamento, cada um dos 17 itens obrigatórios consolidados recebe:

- `1` quando atendido;
- `0,5` quando parcial;
- `0` quando pendente.

Na contagem de 26/10/2026, preservada nesta revisão de 28/10/2026, existem
**8 itens atendidos, 6 parciais e 3
pendentes**, resultando em **11 / 17 = 64,7%**. A incerteza estimada é de **±5
pontos percentuais**, principalmente porque os indicadores do portal, a cobertura
real e as validações humanas ainda precisam ser aferidos.

Esse percentual mede o marco acadêmico da Unidade 2, não o volume de código nem a
prontidão para produção.

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
