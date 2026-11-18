# Preparação para a Unidade 2

## Atualização em 18/11/2026

A release `0.5.0` está publicada e instalada na homologação, fonte `eaccd72`,
frontend/backend GHCR fixados por digest e 23 migrations. Backup restaurado,
SQL transacional/idempotente, 46 verificações HTTPS e controles HTTP do
frontend passaram. Google e dados foram preservados. A autenticação Google
pelo titular após a promoção e as demais evidências operacionais mantêm seus
limites próprios. Consulte o [registro da promoção](release-050-rollout-2026-11-18.md).

> Atualização de 15/11/2026 após os merges #717/#716/#719/#702, main `8e223d3`.
> Homologação com frontend `67ad6b8`, backend `f7ee701` e 22 migrations.
> A composição inclui #672/#702/#704/#705/#716/#717/#719. Passaram 966 testes
> frontend/79 arquivos, CI Containers AMD64/ARM64, smoke e baseline ZAP.
> Nove verificações autenticadas HTTPS passaram após a promoção. Relatos humanos
> anteriores mantêm seus autores e snapshots. O
> [registro de continuidade](continuity-2026-11-15.md) detalha as dependências.
>
> #611/c08aff9 recebeu persistência, API, DI e migration candidata para papel,
> com 607 testes e 93,60% de cobertura de linhas. Interface #712, composição com
> #607/#613 e ensaio observado continuam pendentes. O servidor mantém 22 migrations.
>
> A régua permanece em 17 critérios, com 8 atendidos, 8 parciais e 1 pendente,
> aproximadamente 71% ±5 pontos. A publicação `v0.5.0`, a carga na nuvem e as
> evidências de operação continuam em acompanhamento.

> Complemento técnico desta continuidade — #607/94078c7 passou 561 testes e
> 93,63% de cobertura. A composição local `d23ed42` entre revisão e papel passou
> 649 testes e 93,75%. Os dois cenários adicionais verificam a preservação da
> proveniência e autoria da saída. A matriz acadêmica conserva os critérios de
> integração, implantação e observação registrados abaixo.

## Conferência da régua oficial em 18/11/2026

A página 21 do documento acadêmico original foi conferida, inclusive visualmente.
São cinco critérios de Engenharia, cinco de Segurança e sete de Infraestrutura.
O texto exige Maintainability e Reliability **acima de Good**; apenas Good não
encerra esse critério. O quadro continua com 8 atendidos, 8 parciais e 1 pendente:
(8 + 8 × 0,5) / 17 = 70,6%, arredondado para 71% ±5 pontos. A incerteza é de
classificação/evidência, não estatística nem estimativa de horas.

A release 0.5.0 e a promoção já foram concluídas. O reteste público de borda
passou, incluindo a correção de Referrer-Policy aplicada separadamente em 18/11
(#772/PR #774). Isso não comprova carga na OCI, observabilidade operada,
restauração externa, 90% em todos os fluxos críticos ou aceite institucional.
As notas históricas abaixo mantêm seu snapshot. O
[balanço atual](delivery-closure-2026-11-18.md) distingue cada pendência.

## Objetivo e critério

Esta matriz relaciona as 17 entregas consolidadas da Unidade 2 às evidências
atuais, mantendo a régua de peso igual (1 atendido, 0,5 parcial, 0 pendente).
A revisão documental atual parte da main `a4ffcc5`; a homologação executa
frontend/backend `0.5.0`, fonte `eaccd72`, com 23 migrations. Os trechos datados
abaixo preservam os snapshots anteriores; a promoção não substitui as evidências
operacionais de cada critério.

O [balanço de 04/11](homologation-test-balance-2026-11-04.md) registra 111/111
verificações HTTPS/contrato antes e depois da limpeza autorizada, sem somar
como casos distintos. A lista de contas foi corrigida na composição hospedada;
José confirmou lista/botões e houve exercício de criação/perfil/desativação pela
API com cadastro fictício separado. Isso não comprova todas as tarefas pela UI.
Negação Google com outro titular, troca de conta, tablet e leitor de tela ainda
precisam do roteiro observado de cada fluxo.

Em 15/11, consultas autenticadas retornaram zero alertas abertos no Dependabot
e zero alertas abertos no endpoint de code scanning. Isso não estabelece os
indicadores Maintainability/Reliability do portal Code Quality nem comprova
inexistência de bugs. Esses critérios não foram promovidos por inferência.

#621/#629 e #530 estão incorporados. O candidato hospedado contém tela cheia,
login Google, gestão de contas e os incrementos selecionados. A execução da
Fullscreen API depende do navegador e da ação explícita do usuário. #607/b220177 passou 449 testes completos;
#613/3a5b00f recebeu revisão independente com 82 testes focados, lint/build.
A composição local anterior validou solicitação/aprovação contra API real,
e o ensaio HTTPS final permanece pendente. #611/c08aff9 passou 607 testes e
recebeu persistência/API/DI. Os candidatos de revisão e papel aguardam interface
e validação integrada. A classificação acadêmica considera os critérios completos.

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

| Entrega                                       | Evidência atual                                                                                                                                  | Estado                      | Próxima comprovação                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- | --------------------------------------------------------------------------------------------------- |
| Estratégia de testes                          | Wiki, CI e cobertura backend publicados em 8b61ccd, 93,50% de linhas e piso global de 70% pelo #697                                              | Parcial                     | concluir o recorte crítico de 90% e frontend na #499/#507                                           |
| Manual de uso                                 | [Wiki — Manual de Uso](https://github.com/ifpebj-ti/controle-acesso-veiculos/wiki/Manual-de-Uso)                                                 | Parcial                     | revisar após login Google, nome oficial, relatórios e validação final dos quatro perfis             |
| Ligação story → PR → testes → pipeline → demo | Issues, PRs, commits `Refs/Closes`, checks e registros semanais                                                                                  | Atendido                    | manter a rastreabilidade nas próximas entregas e anexar evidência da demonstração quando solicitada |
| Maintainability e Reliability acima de Good   | Última conferência #684 identificou nove notes e zero warnings, compatível com Good pelo critério oficial                                        | Parcial / validação externa | conferir ambos indicadores no portal e o critério acadêmico acima de Good                           |
| Tags, releases e changelog                    | [`v0.5.0`](https://github.com/ifpebj-ti/controle-acesso-veiculos/releases/tag/v0.5.0), imagens semânticas e [`CHANGELOG.md`](../../CHANGELOG.md) | Atendido                    | manter incrementos revisados e promover imagens semânticas com rollback e evidências                |

## Segurança

| Entrega                                                   | Evidência atual                                                                                                                                                         | Estado                      | Próxima comprovação                                                                                                          |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Cobertura mínima de 90% nos componentes e fluxos críticos | a [Issue #499](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/499) e o PR #507 registram medição reproduzível, testes adicionais e gates progressivos     | Parcial                     | concluir 90% no recorte aprovado; trabalho aberto ou draft não é contado como entrega incorporada                            |
| Zero bugs críticos                                        | builds, testes, lint e CodeQL da `main` estão verdes no SHA observado                                                                                                   | Parcial / validação externa | conferir a classificação vigente no portal de qualidade e registrar evidência datada                                         |
| Zero vulnerabilidades altas e críticas no Dependabot      | consulta autenticada em 15/11/2026 retornou zero alertas abertos no Dependabot; Trivy anterior e pipelines têm seus próprios snapshots                                  | Atendido na fotografia      | repetir a consulta antes da entrega; ausência de alerta conhecido não significa risco zero                                   |
| SSL válido, domínio e proxy reverso                       | DNS, certificado público confiável, Load Balancer HTTPS, WAF e Caddy foram validados em 26/10/2026                                                                      | Atendido                    | automatizar renovação, alerta e rollback pela [Issue #509](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/509) |
| Guia de Segurança e Privacidade                           | [central de segurança](../security/README.md), [guia seguro](../security/secure-development-guide.md), [STRIDE](../security/threat-model.md) e documentação de retenção | Atendido                    | sincronizar a Wiki após os merges e anexar a validação de LGPD aplicável ao piloto                                           |

## Infraestrutura e operação

| Entrega                                     | Evidência atual                                                                                                     | Estado                                                                              | Próxima comprovação                                                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| VM IaaS em nuvem pública                    | VM privada provisionada na OCI                                                                                      | Atendido                                                                            | manter custo, acesso e configuração sob revisão                                                                                 |
| Aplicação conteinerizada na VM              | frontend/API `0.5.0` (`eaccd72`), PostgreSQL preservado, 23 migrations                                              | Atendido                                                                            | promover uma nova versão somente por release revisada                                                                           |
| Nome de domínio com resolução funcional     | hostname temporário resolve publicamente para a borda protegida da homologação                                      | Atendido                                                                            | substituir pelo nome institucional somente após aprovação; isso não impede o piloto controlado                                  |
| Plataforma de gerenciamento de contêineres  | não provisionada                                                                                                    | Pendente — [#501](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/501) | selecionar Portainer, Dockge/Dockhand ou equivalente, proteger o acesso e documentar operação                                   |
| Observabilidade com métricas, logs e traces | instrumentação OTLP e logs estruturados existem; collector, armazenamento e painéis não                             | Parcial — [#500](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/500)  | implantar stack simples, comprovar CPU, memória, disco, logs e traces e definir retenção/alertas                                |
| Teste de carga com k6 e análise de gargalos | três perfis locais fictícios executados: 975 requisições, zero erro/429, thresholds aprovados (#515/#736)           | Parcial — [#502](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/502)  | executar na OCI com janela, WAF/LB e recursos medidos; o ensaio local não comprova capacidade do piloto                         |
| Software implantado, acessível e utilizável | candidato HTTPS com 111 verificações técnicas; lista de contas corrigida, tarefas humanas/aceite completo pendentes | Parcial                                                                             | observar tarefas com perfis autorizados; janela sintética anterior expirada; Administrador local disponível e Google habilitado |

## Estimativa auditável

Para acompanhamento, cada um dos 17 itens obrigatórios consolidados recebe:

- `1` quando atendido;
- `0,5` quando parcial;
- `0` quando pendente.

Na consolidação de **15/11/2026**, com evidência local de 13/11, os 17 itens ficam em **8 atendidos,
8 parciais e 1 pendente**. A estimativa é `(8 + 8 × 0,5) / 17 = 70,6%`, cerca
de **71% concluído e 29% restante**, com incerteza de **±5 pontos**.

O item de indicadores passa de pendente para parcial pela conferência registrada
na #684, com zero warnings e nove notes, compatível com Good. A comprovação dos
dois indicadores e do critério acadêmico acima de Good continua pendente no
portal. A cobertura publicada atualiza a evidência de outro item parcial. O k6 local acrescenta meio critério à fotografia anterior de 67,6%, chegando
a 70,6%; o teste OCI continua pendente na parte operacional da #502.

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

## Evidência local k6 incorporada ao recorte técnico

O candidato #515/#736 acrescenta o [ensaio local de 13/11](k6-local-baseline-2026-11-13.md).
Os três perfis completaram 975 requisições, zero erros/429 e thresholds aprovados.
A evidência pertence à API local 8b61ccd, sem WAF/LB nem medição de recursos da
VM. Esse resultado torna carga parcial na régua (8 atendidos, 8 parciais e 1
pendente, 12/17 ou 70,6% ±5 pontos). A #502 continua aberta para a execução OCI.
Não é medição nova da hospedagem nem aumento de capacidade declarado.
