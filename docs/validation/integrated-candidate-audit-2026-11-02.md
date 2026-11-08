# Auditoria integrada do candidato — 02/11/2026

Rastreabilidade: Issue #602; contratos de contas #473 / PR #530; classificação de erros #603.

## Escopo e identificação

Este registro apresenta ensaios técnicos executados, não um aceite institucional,
um pentest exaustivo ou comprovação de ausência de vulnerabilidades.

| Componente avaliado                              | Fonte                                           |
| ------------------------------------------------ | ----------------------------------------------- |
| Frontend candidato em HTTPS e suíte automatizada | `d5a7ba5f6582639287934d8413d0008922b61db8`      |
| Backend candidato em HTTPS e suíte original      | `0ca897d4518dafb3c7ab127259a0dd26f71a25f1`      |
| Base dos novos testes de autorização deste PR    | main `34ab8a150a3b924b09db55369cb52abb06090865` |

O candidato hospedado continua distinto da release estável `0.4.0`. Este PR
adiciona testes e documentação; não implanta imagens, modifica contas, executa
migrations ou incorpora os PRs de frontend ainda abertos. Os novos testes não
incluem a correção de cancelamento Google do #599, embora ela tenha sido testada
separadamente na fonte do backend candidato.

## Resultados automatizados

| Execução                                                 | Resultado                                       |
| -------------------------------------------------------- | ----------------------------------------------- |
| Frontend candidato, suíte completa sequencial            | 631 testes aprovados; zero falhas ou pendências |
| Frontend candidato, ESLint e build                       | aprovados                                       |
| Backend candidato, integração com PostgreSQL descartável | 213 testes aprovados                            |
| Backend candidato, domínio                               | 78 testes aprovados                             |
| Backend candidato, aplicação                             | 90 testes aprovados                             |
| Base main com a matriz de autorização ampliada deste PR  | 222 testes de integração aprovados              |
| Formatação dos dois arquivos C# alterados                | aprovada                                        |

Os 222 testes da matriz ampliada pertencem a outro snapshot e se sobrepõem aos
213 do candidato: não somar esses números como casos únicos. Na fonte do backend
candidato, domínio + aplicação + integração totalizam 381 testes aprovados.

A execução inicial sem restauração tinha somente os ativos dos testes de
integração. A ausência dos ativos unitários foi corrigida com `dotnet restore`;
os unitários foram executados explicitamente pelo runner xUnit, com XML de
resultado. Uma tentativa intermediária usou opções MTP no runner xUnit autônomo
e foi rejeitada; a execução válida usou `-xml`. Nenhuma falha de asserção foi
removida ou mascarada para obter os resultados finais.

O frontend continua emitindo o aviso conhecido de bundle acima de 500 kB e
mensagens de capacidade de canvas do JSDOM durante axe. Não houve alteração de
limiares, dependências ou testes para silenciar esses avisos.

## Contratos reais de consulta em HTTPS

Foram efetuadas 13 consultas autenticadas à API, com uma sessão administrativa
fictícia. As respostas foram submetidas, em memória, aos módulos TypeScript e
schemas Zod originais do frontend candidato. O utilitário de auditoria apenas
transpilou os módulos para executá-los no Node; não reescreveu os schemas.
Nenhum corpo com nomes, e-mails, auditoria ou credenciais foi persistido no
relatório público. A sessão diagnóstica foi encerrada ao final.

| Consulta                   | HTTP | Validação  | Limite da amostra                                          |
| -------------------------- | ---- | ---------- | ---------------------------------------------------------- |
| Contas de acesso           | 200  | **falhou** | dez objetos rejeitados pelos mesmos dois campos adicionais |
| Acessos em aberto          | 200  | passou     | um registro                                                |
| Histórico de acessos       | 200  | passou     | um registro                                                |
| Candidatos é entrada       | 200  | passou     | um registro                                                |
| Catálogo da frota          | 200  | passou     | lista vazia                                                |
| Motoristas autorizados     | 200  | passou     | lista vazia                                                |
| Utilizações em aberto      | 200  | passou     | lista vazia                                                |
| Histórico de utilizações   | 200  | passou     | lista vazia                                                |
| Autorizações de eventos    | 200  | passou     | lista vazia                                                |
| Resumo diário              | 200  | passou     | resposta agregada                                          |
| Relatório de movimentações | 200  | passou     | um registro                                                |
| Relatório da frota         | 200  | passou     | lista vazia                                                |
| Trilha de auditoria        | 200  | passou     | página limitada a cinco registros                          |

Listas vazias comprovam somente a compatibilidade do envelope, não a de um item
populado. Frota, motoristas, eventos e utilizações precisam também do ensaio
integrado com dados fictícios representativos. Os testes locais de integração
exercitam esses domínios em banco descartável, mas não substituem testar a
apresentação no site.

## Falhas reproduzidas e encaminhamento

### P1 — lista de usuários incompatível com o contrato atual

A resposta canônica inclui `authenticationMethod` e `externalIdentityLinked`.
O schema estrito do frontend candidato não declara esses campos e rejeita toda
a página. A API respondeu 200; a falha não é prova de indisponibilidade de rede.

A correção já pertence ao PR #530 / Issue #473, que também adequa a criação de
conta Google com credencial temporária nula. A auditoria confirmou a existência
desse ajuste no diff, mas não declara que o #530 esteja implantado ou homologado.
Evitar duplicar a implementação. Validar a composição antes de sua promoção.

### P2 — erro de contrato apresentado como erro de conexão

`describeApiError` classifica um erro comum sem `AxiosError.response` como
`network`, inclusive o erro de contrato lançado pelos serviços. A chamada ao
módulo real com um erro do mesmo formato reproduziu essa classificação. O print
fornecido por José apresenta a mensagem correspondente.

A Issue #603 registra a separação entre falha de contrato, transporte,
cancelamento e erro inesperado. Não resolver aceitando respostas inválidas ou
removendo a validação. A classificação é compartilhada; revisar os consumidores
com testes de comportamento. Raíssa mantém a responsabilidade pelo frontend.

## Negativas, filtros e PDFs hospedados

Dez casos adicionais passaram:

- Página zero e tamanho de página acima de 100: 400.
- Intervalo de relatório acima do máximo e período invertido: 400.
- Data inválida no resumo diário: 400.
- Consultas anônimas a usuários, auditoria, acessos em aberto, frota e relatório
  de movimentações: 401, usando cliente separado sem cookies nem Bearer.

As exportações administrativas de movimentações e frota foram realizadas com
reautenticação válida da conta fictícia. Ambas responderam 200,
`application/pdf`, assinatura `%PDF-`, marcador final `%%EOF`, disposição de
download, `Cache-Control: no-store` e `X-Content-Type-Options: nosniff`.
Os bytes foram descartados após a inspeção. Essa verificação não avalia a
aparência, paginação ou completude visual do PDF. As consultas, exportações e
autenticações geram a auditoria normal da aplicação; não foram alterados
registros de negócio hospedados.

Senhas incorretas, bloqueio e revogação foram exercitados pelos testes locais,
não por tentativas repetidas contra contas hospedadas.

## Regressões de autorização adicionadas

Os testes existentes verificavam apenas um perfil não administrativo em cada
um dos cenários abaixo. A matriz agora cobre explicitamente os três:

- Porteiro, Vigilante e Setor de Transporte não consultam contas de usuário.
- Os três não alteram o perfil de outra conta; a asserção existente de que o
  perfil persistido permanece intacto foi preservada.
- Os três não consultam relatórios de movimentações ou de frota e não exportam
  seus PDFs, mesmo enviando sua própria senha válida. A resposta esperada é 403
  e não contém um documento PDF.

A ampliação acrescenta 15 casos líquidos aos testes da main: quatro nos cenários
de contas e onze na matriz de relatórios. São requisições HTTP reais ao TestServer
com persistência PostgreSQL descartável, não mocks de autorização.

## Limites e próximos passos

O host de controle do navegador permaneceu indisponível após a reinicialização.
Por isso não foi executado nesta auditoria um novo ensaio visual ou manual de
todas as telas, tablet físico, teclado, Narrador, zoom, troca de conta Google ou
callback com um titular não autorizado. Não atribuir esses resultados à suíte
de componentes ou aos relatos históricos.

O Swagger/OpenAPI permanece disponível apenas em Development. Os testes de
integração verificaram tanto a documentação local quanto sua indisponibilidade
fora desse ambiente. Swagger facilita conhecer contratos e disparar requisições;
não substitui testes de interface, autorização, concorrência e persistência.
Não foi exposta a documentação interativa na homologação para realizar esta auditoria.

Sequência recomendada:

1. Raíssa concluir a adequação do #530 e a classificação da #603.
2. Revisar e montar candidato identificado preservando o login Google vigente,
   sem fazer merge apenas para viabilizar o teste.
3. Validar usuários, filtros, criação de conta Google, alteração de perfil,
   revogação e auditoria com contas fictícias e plano de recuperação.
4. Popular cenários fictícios de frota/eventos no ambiente apropriado e testar
   os itens das consultas hoje vazias, além de revisar visualmente os PDFs.
5. Executar a homologação observada restante da #162 e do roteiro Google #581.

## Comandos e evidências

No frontend candidato: `npm test -- --maxWorkers=1 --reporter=json`,
`npm run lint` e `npm run build`.

No backend candidato: `dotnet restore src/backend/ControleAcessoVeiculos.slnx`,
integração por `dotnet test` e execução explícita de Domain.Tests e
Application.Tests por `dotnet run --configuration Release --no-build -- -xml ...`.

Neste PR: `dotnet test --project
src/backend/ControleAcessoVeiculos.IntegrationTests/ControleAcessoVeiculos.IntegrationTests.csproj
--configuration Release --no-restore --report-trx`; formatação dos arquivos
alterados por `dotnet format --verify-no-changes --no-restore --include ...`;
`git diff --check`.

JSON do Vitest, TRX, XML unitários e resultados sanitizados dos probes HTTPS foram
preservados no diretório operacional privado de QA do desenvolvedor. Dados de
contas e respostas sensíveis não foram anexados ao GitHub.
