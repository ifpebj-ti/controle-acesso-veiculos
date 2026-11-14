# Preparação para a Unidade 2

> Atualização de 14/11/2026, main `6c435d4`. A hospedagem recebeu o candidato
> integrado `f7ee701` com #668/#672/#702/#704/#705. Backend e frontend AMD64
> foram conferidos por ID, com 22 migrations e Google habilitado. A release
> publicada continua `v0.4.0`, e `v0.5.0` permanece draft. O candidato instalado
> tem identidade própria e rollback preparado. Consulte o
> [registro da implantação e validação](integrated-candidate-2026-11-14.md).
>
> Passaram 961 testes frontend/78 arquivos, 521 backend, 42 verificações locais
> dos serviços frontend com API/PostgreSQL e nove verificações autenticadas HTTPS
> de consulta. Raíssa relatou tablet/Narrador locais nos snapshots dos respectivos
> PRs. As tarefas pela interface hospedada continuam pendentes. A ferramenta de
> controle do navegador falhou ao inicializar durante esta revisão.
>
> A régua permanece em 17 critérios, com 8 atendidos, 7 parciais e 2 pendentes,
> aproximadamente 68% ±5 pontos. O ensaio k6 local proposto na #515 deve ser
> avaliado e incorporado antes de atualizar sua classificação documental.

## Objetivo e critério

Esta matriz relaciona as 17 entregas consolidadas da Unidade 2 às evidências
atuais, mantendo a régua de peso igual (1 atendido, 0,5 parcial, 0 pendente).
A revisão atual parte da main `6c435d4`. A hospedagem contém a composição
identificada `f7ee701`, preparada antes da incorporação final dos cinco PRs
indicados no registro de implantação. A release estável continua `v0.4.0`.
Uma atualização de código exige promoção explícita da imagem para chegar ao site.

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

#621/#629 e #530 estão incorporados. O candidato hospedado contém tela cheia,
login Google, gestão de contas e os incrementos selecionados. A execução da
Fullscreen API depende do navegador e da ação explícita do usuário. #607/b220177 passou 449 testes completos;
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

| Entrega                                       | Evidência atual                                                                                                                                  | Estado                      | Próxima comprovação                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- | --------------------------------------------------------------------------------------------------- |
| Estratégia de testes                          | Wiki, CI e cobertura backend publicados em 8b61ccd, 93,50% de linhas e piso global de 70% pelo #697                                              | Parcial                     | concluir o recorte crítico de 90% e frontend na #499/#507                                           |
| Manual de uso                                 | [Wiki — Manual de Uso](https://github.com/ifpebj-ti/controle-acesso-veiculos/wiki/Manual-de-Uso)                                                 | Parcial                     | revisar após login Google, nome oficial, relatórios e validação final dos quatro perfis             |
| Ligação story → PR → testes → pipeline → demo | Issues, PRs, commits `Refs/Closes`, checks e registros semanais                                                                                  | Atendido                    | manter a rastreabilidade nas próximas entregas e anexar evidência da demonstração quando solicitada |
| Maintainability e Reliability acima de Good   | Última conferência #684 identificou nove notes e zero warnings, compatível com Good pelo critério oficial                                        | Parcial / validação externa | conferir ambos indicadores no portal e o critério acadêmico acima de Good                           |
| Tags, releases e changelog                    | [`v0.4.0`](https://github.com/ifpebj-ti/controle-acesso-veiculos/releases/tag/v0.4.0), imagens semânticas e [`CHANGELOG.md`](../../CHANGELOG.md) | Atendido                    | criar nova release somente após fechar o incremento que irá para a homologação                      |

## Segurança

| Entrega                                                   | Evidência atual                                                                                                                                                         | Estado                      | Próxima comprovação                                                                                                          |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Cobertura mínima de 90% nos componentes e fluxos críticos | a [Issue #499](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/499) e o PR #507 registram medição reproduzível, testes adicionais e gates progressivos     | Parcial                     | concluir 90% no recorte aprovado; trabalho aberto ou draft não é contado como entrega incorporada                            |
| Zero bugs críticos                                        | builds, testes, lint e CodeQL da `main` estão verdes no SHA observado                                                                                                   | Parcial / validação externa | conferir a classificação vigente no portal de qualidade e registrar evidência datada                                         |
| Zero vulnerabilidades altas e críticas no Dependabot      | consulta autenticada em 06/11/2026 retornou zero alertas abertos no Dependabot; Trivy anterior e pipelines têm seus próprios snapshots                                  | Atendido na fotografia      | repetir a consulta antes da entrega; ausência de alerta conhecido não significa risco zero                                   |
| SSL válido, domínio e proxy reverso                       | DNS, certificado público confiável, Load Balancer HTTPS, WAF e Caddy foram validados em 26/10/2026                                                                      | Atendido                    | automatizar renovação, alerta e rollback pela [Issue #509](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/509) |
| Guia de Segurança e Privacidade                           | [central de segurança](../security/README.md), [guia seguro](../security/secure-development-guide.md), [STRIDE](../security/threat-model.md) e documentação de retenção | Atendido                    | sincronizar a Wiki após os merges e anexar a validação de LGPD aplicável ao piloto                                           |

## Infraestrutura e operação

| Entrega                                     | Evidência atual                                                                                                     | Estado                                                                              | Próxima comprovação                                                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| VM IaaS em nuvem pública                    | VM privada provisionada na OCI                                                                                      | Atendido                                                                            | manter custo, acesso e configuração sob revisão                                                                                 |
| Aplicação conteinerizada na VM              | frontend/API `f7ee701`, PostgreSQL saudável, 22 migrations; release estável `0.4.0`                                 | Atendido                                                                            | promover uma nova versão somente por release revisada                                                                           |
| Nome de domínio com resolução funcional     | hostname temporário resolve publicamente para a borda protegida da homologação                                      | Atendido                                                                            | substituir pelo nome institucional somente após aprovação; isso não impede o piloto controlado                                  |
| Plataforma de gerenciamento de contêineres  | não provisionada                                                                                                    | Pendente — [#501](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/501) | selecionar Portainer, Dockge/Dockhand ou equivalente, proteger o acesso e documentar operação                                   |
| Observabilidade com métricas, logs e traces | instrumentação OTLP e logs estruturados existem; collector, armazenamento e painéis não                             | Parcial — [#500](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/500)  | implantar stack simples, comprovar CPU, memória, disco, logs e traces e definir retenção/alertas                                |
| Teste de carga com k6 e análise de gargalos | script preparado no candidato #515; nenhuma execução observada foi comprovada                                       | Pendente — [#502](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/502) | criar cenário autorizado, executar cargas baixa/média/intensa e registrar resultados e melhorias                                |
| Software implantado, acessível e utilizável | candidato HTTPS com 111 verificações técnicas; lista de contas corrigida, tarefas humanas/aceite completo pendentes | Parcial                                                                             | observar tarefas com perfis autorizados; janela sintética anterior expirada; Administrador local disponível e Google habilitado |

## Estimativa auditável

Para acompanhamento, cada um dos 17 itens obrigatórios consolidados recebe:

- `1` quando atendido;
- `0,5` quando parcial;
- `0` quando pendente.

Na reavaliação de **13/11/2026**, os 17 itens ficam em **8 atendidos,
7 parciais e 2 pendentes**. A estimativa é `(8 + 7 × 0,5) / 17 = 67,6%`, cerca
de **68% concluído e 32% restante**, com incerteza de **±5 pontos**.

O item de indicadores passa de pendente para parcial pela conferência registrada
na #684, com zero warnings e nove notes, compatível com Good. A comprovação dos
dois indicadores e do critério acadêmico acima de Good continua pendente no
portal. A cobertura publicada atualiza a evidência de outro item parcial. A
variação é uma reavaliação da matriz e corresponde a aproximadamente 3 pontos
percentuais em relação aos 64,7% anteriores.

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
