# Continuidade após os merges de 15/11/2026

## Código incorporado e homologação

Main `8e223d3` após #717/#716/#719/#702. Os incrementos incorporam retorno após
mudança obrigatória de senha, cabeçalho compacto, orientação do Google e categorias.
A hospedagem identificada na promoção anterior utiliza frontend `67ad6b8`, módulo
`/assets/index-Dqbj1ol2.js`, backend `f7ee701` e 22 migrations. O candidato compõe
#672/#702/#704/#705/#716/#717/#719. #672/#704/#705 continuam em revisão.

A promoção anterior passou 966 testes frontend, nove verificações autenticadas
HTTPS, scans AMD64/ARM64 e smoke/ZAP no run `43673499122`. Os relatos humanos
mantêm autoria/snapshot. Nesta continuidade foram realizadas sincronização de
código, testes locais e manutenção documental.

## Backend de revisão — #451/#609, PR #607

Fonte `94078c7`, após merge regular com main `8e223d3`. O backend preserva
pré-cadastro, políticas de Transporte e endpoints atuais. O registro de endpoints
inclui tanto o cadastro de condutores quanto a revisão de correções.

Passaram 561 testes completos, zero falhas/skips, usando PostgreSQL descartável.
Cobertura de linhas escritas à mão foi 9475/10120, 93,63%. Build Release com
warnings-as-errors, formatação e diff check passaram. O último commit formata
somente a tabela documental. O código backend corresponde ao snapshot testado
`e67fed9`.

A sincronização revelou uma incompatibilidade da fixture de upgrade. Ela usava
o modelo atual para inserir pessoas antes da migration que cria os campos de
pré-cadastro. A fixture passou a inserir somente as colunas existentes naquele
schema histórico. Foram preservadas as verificações de autoria inequívoca,
ausência de evidência, ambiguidade e registro aberto.

#607 permanece draft, com #613 e ensaio HTTPS integrado pendentes. A correção de
autoria da saída está incluída nesse candidato e mantém o contrato dos relatórios.

## Backend de papel — #100, PR #611

Fonte sincronizada `6e60c0a`, sobre main `8e223d3`. O backend é byte-equivalente
a `c08aff9`, cuja suíte passou 607 testes e mediu 93,60% de cobertura. A mudança
de ancestralidade acrescenta os quatro frontends incorporados e resolve o
changelog preservando os dois incrementos.

A interface está na #712. O servidor continua com 22 migrations. Os endpoints de
papel, sua nova migration e o exercício observado aguardam composição/promoção.

## Composição local de papel e correções

Branch `test/issue-100-corrections-integration-20261115`, fonte
`d23ed42a5cc191442ff7007577b0417cf339d9f4`, compõe os dois backends e a main.
As resoluções preservaram ambos endpoints, a instância transacional compartilhada
do VehicleAccessStore e o conjunto de tabelas. O schema combinado tem 16 tabelas
de negócio, com três migrations adicionais em relação às 22 da homologação.

Passaram **649 testes completos**, zero falhas/skips, build estrito e formatação.
A cobertura de linhas foi 9936/10598, **93,75%**. O teste de schema manteve contagem
exata e os nomes das três tabelas adicionadas. A consistência do modelo/migration
e upgrade/downgrade/upgrade foram exercitados em bancos descartáveis.

Dois cenários HTTP/PostgreSQL adicionais cobrem lançamento aberto/encerrado no
papel, saída operacional, proposta e aprovação descritiva e decisão de conferência.
Os asserts verificam horários, autor da transcrição, referência do autor do papel,
autor da saída, estado da conferência e repetição da intenção. As alterações
propostas preservam a proveniência. Quando a saída já consta no papel, o ator da
transcrição registra o lançamento digital, e a referência do autor do papel
continua armazenada separadamente.

A primeira tentativa encontrou Docker indisponível. Após inicializar o Docker,
a execução identificou a fixture histórica descrita acima. A repetição final
concluiu os 649 testes. A branch publicada é uma composição de verificação. Os
PRs finais continuam com seus escopos e critérios de incorporação próprios.

## Segurança e organização

A consulta autenticada de 15/11 retornou zero alertas abertos no Dependabot e
zero no code scanning. A avaliação de Maintainability/Reliability continua com
seus critérios específicos do portal. A Wiki foi sincronizada separadamente
após os quatro merges, commit `fcc498f`.

As issues #451/#609 receberam estado e critérios técnicos atuais. #581/#591/#593
receberam atualização do acompanhamento com as limitações preservadas. A causa
histórica exata de cada perda de resposta continua sem atribuição retrospectiva.
O cancelamento humano depende da opção oferecida pelo Google no ensaio disponível.

## Release, próximos passos e régua

Release publicada `0.4.0`. O draft `0.5.0` foi atualizado para a main `8e223d3`.
A #713 prepara composição/changelog. A conclusão do frontend #672 acompanha o
backend #668 já incorporado. O fluxo #686 acompanha a publicação dos manifests,
tag imutável, release e promoção da versão revisada.

Próximas aceitações são #672, #704 e #705 com Raíssa, seguidas da composição
#607/#613 e da interface de papel #712. Observabilidade operada, gestão protegida
dos containers, carga na nuvem, backup externo/PITR e renovação TLS mantêm suas
issues próprias. A execução local combinada conserva seu escopo técnico.

Régua provisória funcional em 13/15 capacidades equivalentes, cerca de 87% ±8
pontos. Unidade 2 em 8 atendidos, 7 parciais e 2 pendentes, ou 11,5/17 equivalentes,
cerca de 68% ±5 pontos. A pontuação aguarda os critérios completos de cada entrega.
