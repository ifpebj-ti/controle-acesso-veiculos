# Preparação para a Unidade 2

## Objetivo e critério

Esta matriz relaciona as 17 entregas consolidadas da Unidade 2 às evidências
atuais, mantendo a régua de peso igual (1 atendido, 0,5 parcial, 0 pendente).
A revisão de **08/11/2026** usa main `202a913`, após #599 e os cinco merges
de testes/documentação #595/#635/#532/#512/#517.
A release estável continua `v0.4.0`. A última composição identificada instalada
é frontend `7dd02a6` e backend `5fa21bb`; PRs e novos merges não alteram o site
automaticamente.

O [balanço de 04/11](homologation-test-balance-2026-11-04.md) registra 111/111
verificações HTTPS/contrato antes e depois da limpeza autorizada, sem somar
como casos distintos. A lista de contas foi corrigida na composição hospedada;
José confirmou lista/botões e houve exercício de criação/perfil/desativação pela
API com cadastro fictício separado. Isso não comprova todas as tarefas pela UI.
Negação Google com outro titular, troca de conta, tablet e leitor de tela ainda
precisam do roteiro observado de cada fluxo.

Em 06/11, consultas autenticadas retornaram zero alertas abertos no Dependabot
e zero alertas abertos no endpoint de code scanning. Isso não estabelece os
indicadores Maintainability/Reliability do portal Code Quality nem comprova
inexistência de bugs. Esses critérios não foram promovidos por inferência.

#621/#629 estão na main; a tela cheia ainda não está no frontend hospedado.
#530 mantém critérios de homologação. #607/b220177 passou 449 testes completos;
#613/3a5b00f recebeu revisão independente com 82 testes focados, lint/build.
A composição local anterior validou solicitação/aprovação contra API real,
mas não substitui o ensaio HTTPS final e as pessoas. #611/1aad5fb passou 467
testes e tem domínio/aplicação, ainda sem store/API/DI. Esses candidatos não
foram contados como entregas adicionais de operação institucional.

O [rollout #628](backend-runtime-security-2026-11-08.md) foi verificado no host:
APT corrigido, frontend/banco preservados, backup restaurável no mesmo host e
111 verificações HTTPS aprovadas. Nenhum registro operacional foi criado/excluído.
Backup externo/PITR, RPO/RTO e homologação humana continuam pendentes.

O inventário e as decisões de [03/11](pending-decisions-2026-11-03.md) permanecem
referência histórica. Backup externo/recuperação pontual, observabilidade
operada, gestão protegida dos containers, renovação automática de TLS e carga
com medição ainda não têm evidências completas. Restauração no mesmo host não
comprova backup externo, RPO de uma hora ou RTO institucional.

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
| Zero vulnerabilidades altas e críticas no Dependabot      | consulta autenticada em 06/11/2026 retornou zero alertas abertos no Dependabot; Trivy anterior e pipelines têm seus próprios snapshots                                  | Atendido na fotografia      | repetir a consulta antes da entrega; ausência de alerta conhecido não significa risco zero                                   |
| SSL válido, domínio e proxy reverso                       | DNS, certificado público confiável, Load Balancer HTTPS, WAF e Caddy foram validados em 26/10/2026                                                                      | Atendido                    | automatizar renovação, alerta e rollback pela [Issue #509](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/509) |
| Guia de Segurança e Privacidade                           | [central de segurança](../security/README.md), [guia seguro](../security/secure-development-guide.md), [STRIDE](../security/threat-model.md) e documentação de retenção | Atendido                    | sincronizar a Wiki após os merges e anexar a validação de LGPD aplicável ao piloto                                           |

## Infraestrutura e operação

| Entrega                                     | Evidência atual                                                                                                     | Estado                                                                              | Próxima comprovação                                                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| VM IaaS em nuvem pública                    | VM privada provisionada na OCI                                                                                      | Atendido                                                                            | manter custo, acesso e configuração sob revisão                                                                                   |
| Aplicação conteinerizada na VM              | frontend `7dd02a6`, API `5fa21bb` e PostgreSQL em homologação; estável `0.4.0` preservada                           | Atendido                                                                            | promover uma nova versão somente por release revisada                                                                             |
| Nome de domínio com resolução funcional     | hostname temporário resolve publicamente para a borda protegida da homologação                                      | Atendido                                                                            | substituir pelo nome institucional somente após aprovação; isso não impede o piloto controlado                                    |
| Plataforma de gerenciamento de contêineres  | não provisionada                                                                                                    | Pendente — [#501](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/501) | selecionar Portainer, Dockge/Dockhand ou equivalente, proteger o acesso e documentar operação                                     |
| Observabilidade com métricas, logs e traces | instrumentação OTLP e logs estruturados existem; collector, armazenamento e painéis não                             | Parcial — [#500](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/500)  | implantar stack simples, comprovar CPU, memória, disco, logs e traces e definir retenção/alertas                                  |
| Teste de carga com k6 e análise de gargalos | script preparado no candidato #515; nenhuma execução observada foi comprovada                                       | Pendente — [#502](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/502) | criar cenário autorizado, executar cargas baixa/média/intensa e registrar resultados e melhorias                                  |
| Software implantado, acessível e utilizável | candidato HTTPS com 111 verificações técnicas; lista de contas corrigida, tarefas humanas/aceite completo pendentes | Parcial                                                                             | observar tarefas com perfis autorizados; janela sintética explícita até 12/11 às 23h59 de Brasília; Google real continua distinto |

## Estimativa auditável

Para acompanhamento, cada um dos 17 itens obrigatórios consolidados recebe:

- `1` quando atendido;
- `0,5` quando parcial;
- `0` quando pendente.

Na reavaliação de **08/11/2026**, a classificação continua com **8 itens
atendidos, 6 parciais e 3 pendentes**: `(8 + 6 × 0,5) / 17 = 64,7%`, cerca de
**65% concluído e 35% restante**, com incerteza de **±5 pontos**. O número é igual
à estimativa anterior, agora com evidências atualizadas. Correções de integração
e testes ampliados melhoram a base, mas não concluem requisitos ainda dependentes
de operação, cobertura ou validação externa.

Essa régua mede critérios consolidados da matéria, não esforço, linhas de código,
segurança absoluta ou nota garantida. Os 17 itens e pesos foram mantidos para não
inflar o indicador. Aprovação da apresentação não substitui evidência de um item
específico. Pedestres, leitura de placa por câmera e nome comercial futuro não
foram incluídos silenciosamente no denominador.

## Caminho para fechar a Unidade 2

Os principais blocos restantes são: comprovar cobertura de 90% no recorte crítico;
obter a evidência dos indicadores de qualidade; concluir manual/homologação;
implantar gestão protegida e observabilidade; executar carga e interpretar seus
resultados. Uma proposta em draft não vale como implantação. Os testes com
professores ajudam a descobrir defeitos, mas não substituem métricas de operação.

Backup externo, recuperação, contingência, acesso administrativo e renovação TLS
são gates adicionais de segurança/continuidade da operação institucional, mesmo
quando não aparecem como uma linha independente no cálculo acadêmico.

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

## Ordem histórica recomendada (reavaliar dependências atuais)

1. automatizar a renovação e a recuperação do certificado confiável;
2. concluir 90% de cobertura no recorte crítico e incorporar os gates revisados;
3. corrigir e comprovar Maintainability, Reliability e inventário de
   vulnerabilidades;
4. implantar a plataforma de gerenciamento com acesso restrito;
5. implantar observabilidade mínima com métricas, logs e traces;
6. executar k6, analisar gargalos e registrar melhorias;
7. atualizar o manual, ensaiar os quatro perfis e conduzir o piloto acompanhado;
8. revisar documentação, Wiki e changelog e publicar a próxima release candidata.
