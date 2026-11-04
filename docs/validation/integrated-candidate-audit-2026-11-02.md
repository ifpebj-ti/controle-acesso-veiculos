# Auditoria integrada do candidato ? 02/11/2026

Rastreabilidade: Issue #602; contratos de contas #473 / PR #530; classifica??o de erros #603.

## Escopo e identifica??o

Este registro apresenta ensaios t?cnicos executados, n?o um aceite institucional,
um pentest exaustivo ou comprova??o de aus?ncia de vulnerabilidades.

| Componente avaliado                              | Fonte                                           |
| ------------------------------------------------ | ----------------------------------------------- |
| Frontend candidato em HTTPS e su?te automatizada | `d5a7ba5f6582639287934d8413d0008922b61db8`      |
| Backend candidato em HTTPS e su?te original      | `0ca897d4518dafb3c7ab127259a0dd26f71a25f1`      |
| Base dos novos testes de autoriza??o deste PR    | main `34ab8a150a3b924b09db55369cb52abb06090865` |

O candidato hospedado continua distinto da release est?vel `0.4.0`. Este PR
adiciona testes e documenta??o; n?o implanta imagens, modifica contas, executa
migrations ou incorpora os PRs de frontend ainda abertos. Os novos testes n?o
incluem a corre??o de cancelamento Google do #599, embora ela tenha sido testada
separadamente na fonte do backend candidato.

## Resultados automatizados

| Execu??o                                                 | Resultado                                       |
| -------------------------------------------------------- | ----------------------------------------------- |
| Frontend candidato, su?te completa sequencial            | 631 testes aprovados; zero falhas ou pend?ncias |
| Frontend candidato, ESLint e build                       | aprovados                                       |
| Backend candidato, integra??o com PostgreSQL descart?vel | 213 testes aprovados                            |
| Backend candidato, dom?nio                               | 78 testes aprovados                             |
| Backend candidato, aplica??o                             | 90 testes aprovados                             |
| Base main com a matriz de autoriza??o ampliada deste PR  | 222 testes de integra??o aprovados              |
| Formata??o dos dois arquivos C# alterados                | aprovada                                        |

Os 222 testes da matriz ampliada pertencem a outro snapshot e se sobrep?em aos
213 do candidato: n?o somar esses n?meros como casos ?nicos. Na fonte do backend
candidato, dom?nio + aplica??o + integra??o totalizam 381 testes aprovados.

A execu??o inicial sem restaura??o tinha somente os ativos dos testes de
integra??o. A aus?ncia dos ativos unit?rios foi corrigida com `dotnet restore`;
os unit?rios foram executados explicitamente pelo runner xUnit, com XML de
resultado. Uma tentativa intermedi?ria usou op??es MTP no runner xUnit aut?nomo
e foi rejeitada; a execu??o v?lida usou `-xml`. Nenhuma falha de asser??o foi
removida ou mascarada para obter os resultados finais.

O frontend continua emitindo o aviso conhecido de bundle acima de 500 kB e
mensagens de capacidade de canvas do JSDOM durante axe. N?o houve altera??o de
limiares, depend?ncias ou testes para silenciar esses avisos.

## Contratos reais de consulta em HTTPS

Foram efetuadas 13 consultas autenticadas ? API, com uma sess?o administrativa
fict?cia. As respostas foram submetidas, em mem?ria, aos m?dulos TypeScript e
schemas Zod originais do frontend candidato. O utilit?rio de auditoria apenas
transpilou os m?dulos para execut?-los no Node; n?o reescreveu os schemas.
Nenhum corpo com nomes, e-mails, auditoria ou credenciais foi persistido no
relat?rio p?blico. A sess?o diagn?stica foi encerrada ao final.

| Consulta                   | HTTP | Valida??o  | Limite da amostra                                          |
| -------------------------- | ---- | ---------- | ---------------------------------------------------------- |
| Contas de acesso           | 200  | **falhou** | dez objetos rejeitados pelos mesmos dois campos adicionais |
| Acessos em aberto          | 200  | passou     | um registro                                                |
| Hist?rico de acessos       | 200  | passou     | um registro                                                |
| Candidatos ? entrada       | 200  | passou     | um registro                                                |
| Cat?logo da frota          | 200  | passou     | lista vazia                                                |
| Motoristas autorizados     | 200  | passou     | lista vazia                                                |
| Utiliza??es em aberto      | 200  | passou     | lista vazia                                                |
| Hist?rico de utiliza??es   | 200  | passou     | lista vazia                                                |
| Autoriza??es de eventos    | 200  | passou     | lista vazia                                                |
| Resumo di?rio              | 200  | passou     | resposta agregada                                          |
| Relat?rio de movimenta??es | 200  | passou     | um registro                                                |
| Relat?rio da frota         | 200  | passou     | lista vazia                                                |
| Trilha de auditoria        | 200  | passou     | p?gina limitada a cinco registros                          |

Listas vazias comprovam somente a compatibilidade do envelope, n?o a de um item
populado. Frota, motoristas, eventos e utiliza??es precisam tamb?m do ensaio
integrado com dados fict?cios representativos. Os testes locais de integra??o
exercitam esses dom?nios em banco descart?vel, mas n?o substituem testar a
apresenta??o no site.

## Falhas reproduzidas e encaminhamento

### P1 ? lista de usu?rios incompat?vel com o contrato atual

A resposta can?nica inclui `authenticationMethod` e `externalIdentityLinked`.
O schema estrito do frontend candidato n?o declara esses campos e rejeita toda
a p?gina. A API respondeu 200; a falha n?o ? prova de indisponibilidade de rede.

A corre??o j? pertence ao PR #530 / Issue #473, que tamb?m adequa a cria??o de
conta Google com credencial tempor?ria nula. A auditoria confirmou a exist?ncia
desse ajuste no diff, mas n?o declara que o #530 esteja implantado ou homologado.
Evitar duplicar a implementa??o. Validar a composi??o antes de sua promo??o.

### P2 ? erro de contrato apresentado como erro de conex?o

`describeApiError` classifica um erro comum sem `AxiosError.response` como
`network`, inclusive o erro de contrato lan?ado pelos servi?os. A chamada ao
m?dulo real com um erro do mesmo formato reproduziu essa classifica??o. O print
fornecido por Jos? apresenta a mensagem correspondente.

A Issue #603 registra a separa??o entre falha de contrato, transporte,
cancelamento e erro inesperado. N?o resolver aceitando respostas inv?lidas ou
removendo a valida??o. A classifica??o ? compartilhada; revisar os consumidores
com testes de comportamento. Ra?ssa mant?m a responsabilidade pelo frontend.

## Negativas, filtros e PDFs hospedados

Dez casos adicionais passaram:

- P?gina zero e tamanho de p?gina acima de 100: 400.
- Intervalo de relat?rio acima do m?ximo e per?odo invertido: 400.
- Data inv?lida no resumo di?rio: 400.
- Consultas an?nimas a usu?rios, auditoria, acessos em aberto, frota e relat?rio
  de movimenta??es: 401, usando cliente separado sem cookies nem Bearer.

As exporta??es administrativas de movimenta??es e frota foram realizadas com
reauthentica??o v?lida da conta fict?cia. Ambas responderam 200,
`application/pdf`, assinatura `%PDF-`, marcador final `%%EOF`, disposi??o de
download, `Cache-Control: no-store` e `X-Content-Type-Options: nosniff`.
Os bytes foram descartados ap?s a inspe??o. Essa verifica??o n?o avalia a
apar?ncia, pagina??o ou completude visual do PDF. As consultas, exporta??es e
autentica??es geram a auditoria normal da aplica??o; n?o foram alterados
registros de neg?cio hospedados.

Senhas incorretas, bloqueio e revoga??o foram exercitados pelos testes locais,
n?o por tentativas repetidas contra contas hospedadas.

## Regress?es de autoriza??o adicionadas

Os testes existentes verificavam apenas um perfil n?o administrativo em cada
um dos cen?rios abaixo. A matriz agora cobre explicitamente os tr?s:

- Porteiro, Vigilante e Setor de Transporte n?o consultam contas de usu?rio.
- Os tr?s n?o alteram o perfil de outra conta; a asser??o existente de que o
  perfil persistido permanece intacto foi preservada.
- Os tr?s n?o consultam relat?rios de movimenta??es ou de frota e n?o exportam
  seus PDFs, mesmo enviando sua pr?pria senha v?lida. A resposta esperada ? 403
  e n?o cont?m um documento PDF.

A amplia??o acrescenta 15 casos l?quidos aos testes da main: quatro nos cen?rios
de contas e onze na matriz de relat?rios. S?o requisi??es HTTP reais ao TestServer
com persist?ncia PostgreSQL descart?vel, n?o mocks de autoriza??o.

## Limites e pr?ximos passos

O host de controle do navegador permaneceu indispon?vel ap?s a reinicializa??o.
Por isso n?o foi executado nesta auditoria um novo ensaio visual ou manual de
todas as telas, tablet f?sico, teclado, Narrador, zoom, troca de conta Google ou
callback com um titular n?o autorizado. N?o atribuir esses resultados ? su?te
de componentes ou aos relatos hist?ricos.

O Swagger/OpenAPI permanece dispon?vel apenas em Development. Os testes de
integra??o verificaram tanto a documenta??o local quanto sua indisponibilidade
fora desse ambiente. Swagger facilita conhecer contratos e disparar requisi??es;
n?o substitui testes de interface, autoriza??o, concorr?ncia e persist?ncia.
N?o foi exposta a documenta??o interativa na homologa??o para realizar esta auditoria.

Sequ?ncia recomendada:

1. Ra?ssa concluir a adequa??o do #530 e a classifica??o da #603.
2. Revisar e montar candidato identificado preservando o login Google vigente,
   sem fazer merge apenas para viabilizar o teste.
3. Validar usu?rios, filtros, cria??o de conta Google, altera??o de perfil,
   revoga??o e auditoria com contas fict?cias e plano de recupera??o.
4. Popular cen?rios fict?cios de frota/eventos no ambiente apropriado e testar
   os itens das consultas hoje vazias, al?m de revisar visualmente os PDFs.
5. Executar a homologa??o observada restante da #162 e do roteiro Google #581.

## Comandos e evid?ncias

No frontend candidato: `npm test -- --maxWorkers=1 --reporter=json`,
`npm run lint` e `npm run build`.

No backend candidato: `dotnet restore src/backend/ControleAcessoVeiculos.slnx`,
integra??o por `dotnet test` e execu??o expl?cita de Domain.Tests e
Application.Tests por `dotnet run --configuration Release --no-build -- -xml ...`.

Neste PR: `dotnet test --project
src/backend/ControleAcessoVeiculos.IntegrationTests/ControleAcessoVeiculos.IntegrationTests.csproj
--configuration Release --no-restore --report-trx`; formata??o dos arquivos
alterados por `dotnet format --verify-no-changes --no-restore --include ...`;
`git diff --check`.

JSON do Vitest, TRX, XML unit?rios e resultados sanitizados dos probes HTTPS foram
preservados no diret?rio operacional privado de QA do desenvolvedor. Dados de
contas e respostas sens?veis n?o foram anexados ao GitHub.
