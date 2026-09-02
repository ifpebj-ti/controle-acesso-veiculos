# Homologação do backend do MVP

**Status:** roteiro técnico preliminar para validação com usuários<br>
**Escopo:** backend, PostgreSQL, infraestrutura local e QA<br>
**Rastreabilidade:** Issues #88, #108 e #112

Este documento transforma as funcionalidades já integradas à `main` em uma
sessão reproduzível de validação. Ele não comprova aceitação institucional e não
autoriza uso em produção. O objetivo é apresentar o comportamento existente,
registrar o entendimento dos usuários e converter ajustes aprovados em issues
separadas.

## 1. Regras da sessão

- Utilize somente nomes, documentos, placas, e-mails e itinerários fictícios.
- Não projete `.env`, connection strings, senhas, tokens ou logs durante a reunião.
- Não execute a sessão em banco que contenha dados reais.
- Não altere regras ou código durante a demonstração.
- Classifique cada retorno como `Aceito`, `Ajustar`, `Rejeitado` ou `Pendente`.
- Registre uma nova issue para cada mudança aprovada; não amplie a Issue #88.
- Trate jornada de 12 horas e fechamento por volta das 23h como contexto
  operacional, não como bloqueios automáticos já aprovados.

O arquivo-modelo
[`ControleAcessoVeiculos.Homologation.http`](../../src/backend/ControleAcessoVeiculos.API/ControleAcessoVeiculos.Homologation.http)
contém as requisições na ordem recomendada. Os identificadores retornados e os
tokens devem existir somente em uma cópia local ignorada pelo Git:

```powershell
Copy-Item `
  src/backend/ControleAcessoVeiculos.API/ControleAcessoVeiculos.Homologation.http `
  src/backend/ControleAcessoVeiculos.API/ControleAcessoVeiculos.Homologation.local.http
```

Execute e edite apenas `ControleAcessoVeiculos.Homologation.local.http`. O padrão
`*.local.http` está no `.gitignore`; confirme mesmo assim com `git status` antes
de cada commit.

## 2. Participantes e responsabilidades

| Participante | O que deve validar |
|---|---|
| Porteiro | rapidez do registro, dados necessários, consulta de abertos, saída e continuidade do turno |
| Vigilante | substituição do Porteiro, consulta e correção descritiva justificada |
| Setor de Transporte | supervisão, históricos, frota, motoristas, eventos e resumo diário |
| Administrador | contas, trilha de auditoria e acesso excepcional |
| Equipe | comportamento técnico, evidências, dúvidas e decisões sem induzir respostas |

Uma pessoa pode representar mais de um papel na reunião, mas a avaliação deve
continuar separada por perfil.

## 3. Preparação do ambiente

### 3.1. Pré-condições

- branch `main` sincronizada e árvore de trabalho limpa;
- .NET SDK 10 e `dotnet-ef` 10;
- Docker Desktop ou Docker Engine com Compose;
- arquivo `infrastructure/docker/.env` criado a partir de `.env.example`, fora do Git;
- senha local do PostgreSQL e chave JWT diferentes dos marcadores do exemplo;
- banco local exclusivo para desenvolvimento ou homologação;
- nenhuma informação institucional real no ambiente.

Não use `docker compose down --volumes` para “limpar” um ambiente sem confirmar
explicitamente que o volume pode ser descartado. Quando for necessário um banco
novo, crie um ambiente local separado e documente a decisão.

### 3.2. Validação técnica anterior

Execute a partir da raiz:

```powershell
dotnet restore src/backend/ControleAcessoVeiculos.slnx
dotnet format src/backend/ControleAcessoVeiculos.slnx --no-restore --verify-no-changes
dotnet build src/backend/ControleAcessoVeiculos.slnx --no-restore
dotnet test src/backend/ControleAcessoVeiculos.slnx --no-build --no-restore
git diff --check

Set-Location infrastructure/docker
docker compose config
docker compose build backend
docker compose up -d postgresql
Set-Location ../..
```

Resultado esperado: formatação e build sem erros, 176 testes aprovados e
PostgreSQL saudável. Os testes de integração exigem acesso ao Docker porque usam
PostgreSQL real e descartável via Testcontainers.

### 3.3. Migrations e administrador inicial

Configure `ConnectionStrings__DefaultConnection` e
`Authentication__Jwt__SigningKey` no terminal local, com os mesmos valores do
ambiente de demonstração, sem imprimi-los. Aplique as migrations:

```powershell
dotnet ef database update `
  --project src/backend/ControleAcessoVeiculos.Infrastructure `
  --startup-project src/backend/ControleAcessoVeiculos.API
```

Se o banco ainda não possuir usuários, configure temporariamente
`BootstrapAdmin__Name`, `BootstrapAdmin__Email` e
`BootstrapAdmin__Password`, execute o provisionamento e remova as variáveis do
processo:

```powershell
dotnet run --project src/backend/ControleAcessoVeiculos.API -- --bootstrap-admin
Remove-Item Env:BootstrapAdmin__Name, Env:BootstrapAdmin__Email, Env:BootstrapAdmin__Password
```

O bootstrap deve informar que criou o primeiro Administrador. Se já houver
usuários, ele deve recusar uma nova inicialização. Nunca registre a senha no
documento, terminal compartilhado, gravação ou captura de tela.

### 3.4. Inicialização da API

Para executar localmente:

```powershell
dotnet run --project src/backend/ControleAcessoVeiculos.API --launch-profile http
```

Confirme em outro terminal:

```powershell
Invoke-RestMethod http://localhost:5118/health/ready
```

Resultado esperado: `status` igual a `Healthy`. Para usar a API pelo Compose,
substitua a URL do arquivo HTTP por `http://localhost:8080` e confirme primeiro
que as migrations já foram aplicadas.

### 3.5. Dados fictícios representativos

Para preparar previamente contas e cenários visíveis na demonstração, execute em
outro terminal:

```powershell
./infrastructure/demo/Initialize-DemoData.ps1 `
  -ApiBaseUrl http://127.0.0.1:5118
```

O script aceita somente uma API em loopback e solicita interativamente a conta
administrativa e três senhas temporárias distintas. Ele usa os endpoints normais
para preservar autorização, validações e auditoria e deixa exemplos abertos e
encerrados. Não projete os prompts durante a reunião. Em uma segunda execução,
informe as mesmas senhas para comprovar que os dados não são duplicados.

A CI repete automaticamente esse preparo em infraestrutura descartável sempre
que seus contratos técnicos mudam. Mesmo com o workflow aprovado, execute este
roteiro manual durante a preparação da sessão: automação detecta regressões, mas
não observa compreensão, esforço, dúvidas ou adequação do fluxo aos usuários.

José Ernandes é o responsável técnico provisório pelo ambiente local enquanto
mantiver vínculo com o campus. Isso não o torna autoridade para aprovar política
institucional de retenção, proteção de dados ou produção. Antes da transferência
do projeto, o responsável sucessor e o procedimento de entrega devem ser
registrados.

## 4. Ordem da demonstração

Antes de iniciar, substitua na cópia `*.local.http`:

- credenciais locais de demonstração;
- tokens retornados pelos quatro logins;
- IDs retornados pelas criações;
- data local da sessão;
- início e fim UTC do evento, envolvendo o horário real da demonstração.

Não versione essas substituições. Ao final, exclua a cópia local quando os
valores não forem mais necessários.

### Cenário 1 — disponibilidade e autenticação

| Campo | Valor |
|---|---|
| Perfil | Anônimo e Administrador |
| Ação | consultar readiness, autenticar e acessar endpoint protegido |
| Esperado | readiness 200; login válido 200; requisição protegida sem token 401 |
| Pergunta | contas individuais e troca de operador representam o processo real? |

O Administrador cria contas fictícias para `Porteiro`, `Vigilante` e
`SetorTransporte`. Confirme que os usuários não compartilham credenciais.

### Cenário 2 — acesso geral e troca de turno

| Campo | Valor |
|---|---|
| Perfil | Porteiro; depois Vigilante |
| Ação | com cada perfil, registrar entrada, listar abertos, consultar histórico, registrar saída e corrigir descrição com justificativa |
| Esperado | horário e ator definidos no servidor; placa normalizada; um único acesso aberto; saída preserva autoria; correção não altera placa, pessoa ou horários |
| Pergunta | os campos e a lista de abertos são suficientes para a troca de turno? |

O Vigilante usa a própria conta ao assumir a portaria e possui as mesmas
permissões operacionais do Porteiro. Não simule transferência de autoria do
registro original.

### Cenário 3 — fronteira do Setor de Transporte

| Campo | Valor |
|---|---|
| Perfil | SetorTransporte |
| Ação | consultar histórico e resumo; tentar registrar entrada geral |
| Esperado | consultas 200; tentativa de operação geral 403 |
| Pergunta | supervisão sem alteração do fluxo geral corresponde à responsabilidade do setor? |

Se o cliente disser que o setor também opera a portaria, registre a observação;
não altere a permissão durante a sessão.

### Cenário 4 — frota e motoristas autorizados

| Campo | Valor |
|---|---|
| Perfil | SetorTransporte para cadastros; Porteiro para saída e retorno |
| Ação | cadastrar veículo, autorizar motorista, registrar saída, listar uso aberto, registrar retorno e consultar histórico |
| Esperado | apenas motorista explicitamente autorizado inicia viagem; retorno exige quilometragem válida; histórico fica preservado |
| Pergunta | quem deve registrar saída e retorno e quais dados realmente ajudam na conferência? |

Documento do motorista é opcional no MVP. Não use essa demonstração para
decidir CNH, categoria, validade ou escala sem o responsável institucional.

### Cenário 5 — autorização de evento

| Campo | Valor |
|---|---|
| Perfil | SetorTransporte para gestão; Porteiro para consulta e entrada |
| Ação | criar evento vigente, consultar, registrar entrada vinculada e verificar consumo da regra |
| Esperado | evento ativo e vigente; placa específica tem precedência; cota não é excedida; saída não devolve a vaga consumida |
| Pergunta | o setor normalmente conhece placas, tipos/quantidades ou ambos? |

Pernoite informa uma autorização administrativa, mas não abre portão
automaticamente nem cria um bloqueio fixo às 23h.

### Cenário 6 — resumo operacional diário

| Campo | Valor |
|---|---|
| Perfil | os quatro perfis |
| Ação | consultar a data local da demonstração |
| Esperado | totais gerais, institucionais e de evento; `openAtStart` e `openAtEnd`; nenhuma pessoa, documento, placa, itinerário ou observação |
| Pergunta | os totais ajudam a troca de turno e a conferência? Os nomes dos campos são compreensíveis? |

O resumo não classifica atraso ou irregularidade e não representa assinatura de
fechamento. Essas possibilidades só entram no backlog se forem solicitadas e
justificadas.

### Cenário 7 — contas e auditoria

| Campo | Valor |
|---|---|
| Perfil | Administrador |
| Ação | pesquisar contas e consultar auditoria por período, entidade e ator |
| Esperado | somente Administrador; sem hash, senha, token ou dados pessoais duplicados; ações críticas rastreáveis |
| Pergunta | quem exercerá a administração e quem poderá revisar a trilha no ambiente real? |

Desativação e reativação podem ser demonstradas somente em conta fictícia que
não será usada nos demais cenários. O Administrador não pode desativar a própria
conta nem remover o último Administrador ativo.

## 5. Matriz de rastreabilidade

| Capacidade do MVP | Contratos principais | Evidência automatizada |
|---|---|---|
| Saúde técnica | `GET /health`, `/health/live`, `/health/ready` | `TechnicalEndpointsTests` |
| Login e bloqueio | `POST /auth/login` | `AuthenticationTests`, `UsuarioTests` |
| Administração de contas | `GET/POST/DELETE /users`, reativação | `UserAccountLifecycleTests`, `CreateUserAccountServiceTests`, `UserAccountLifecycleServiceTests` |
| Entrada, abertos e saída geral | `/access-records/entries`, `/open`, `/{id}/exit` | `VehicleAccessTests`, `VehicleAccessServiceTests`, `RegistroAcessoTests` |
| Histórico e correção geral | `/access-records/history`, `/{id}/correction` | `VehicleAccessTests`, `VehicleAccessServiceTests` |
| Catálogo de frota | `/institutional-vehicles` | `InstitutionalVehicleCatalogTests`, `InstitutionalVehicleCatalogServiceTests`, `VeiculoTests` |
| Motoristas autorizados | `/institutional-drivers` | `InstitutionalDriverTests`, `InstitutionalDriverServiceTests`, `MotoristaInstitucionalTests` |
| Uso institucional | `/institutional-vehicle-usages` | `InstitutionalVehicleUsageTests`, `InstitutionalVehicleUsageServiceTests`, `UsoVeiculoInstitucionalTests` |
| Autorizações de eventos | `/event-authorizations` | `EventAuthorizationTests`, `EventAuthorizationServiceTests`, `EventoAcessoTests` |
| Entrada vinculada ao evento | `POST /access-records/entries` com `eventAuthorizationId` | `EventAccessAssociationTests` |
| Resumo diário | `GET /operations/daily-summary` | `OperationalSummaryTests`, `OperationalSummaryServiceTests` |
| Auditoria administrativa | `GET /audits` | `AuditTrailTests`, `AuditTrailServiceTests`, `AuditoriaTests` |
| Segurança das requisições | middleware, Problem Details e rate limiting | `RequestSafetyTests`, `RateLimitingTests` |
| PostgreSQL e migrations | schema `dbo`, constraints e índices | `PostgreSqlPersistenceTests`, setup de `ApiFactory` |
| Fronteiras arquiteturais | dependências entre projetos | `ArchitectureTests` |

A suíte automatizada reduz regressões técnicas, mas não substitui a avaliação de
clareza, utilidade e adequação do processo pelos usuários.

### Continuidade operacional

- [ ] Simular indisponibilidade e ativar o
      [formulário de contingência](../operations/contingency-record-template.md) numerado.
- [ ] Registrar no papel uma entrada, uma saída e um veículo ainda presente.
- [ ] Confirmar os campos mínimos e se documento pessoal pode continuar opcional.
- [ ] Confirmar quem aciona TI e Setor de Transporte e por qual canal.
- [ ] Validar dupla conferência e fechamento da reconciliação pelo setor responsável.
- [ ] Aprovar ou revisar RPO de 24 horas e RTO de 4 horas propostos.
- [ ] Definir responsáveis nominais, retenção e descarte do formulário reconciliado.
- [ ] Não usar os endpoints atuais para simular horários históricos; registrar a
      necessidade do fluxo específico de reconciliação.

O roteiro completo e o registro das decisões ficam no
[plano de retenção, backup e continuidade](../operations/data-retention-and-continuity.md).

## 6. Checklist por perfil

### Porteiro

- [ ] Consegue autenticar com conta individual.
- [ ] Entende os campos obrigatórios da entrada.
- [ ] Localiza registros abertos sem consultar papel.
- [ ] Registra saída sem reescrever o registro.
- [ ] Corrige somente dados descritivos, com justificativa e auditoria.
- [ ] Consulta frota, motoristas e eventos sem gerenciá-los.
- [ ] Entende o resumo diário.
- [ ] Confirma que o fluxo é viável em horário de pico.

### Vigilante

- [ ] Assume o fluxo com a própria conta.
- [ ] Enxerga os registros deixados pelo turno anterior.
- [ ] Possui as mesmas permissões operacionais do Porteiro.
- [ ] Corrige somente dados descritivos, com justificativa e auditoria.
- [ ] Não consegue gerenciar contas, frota, motoristas ou eventos.
- [ ] Confirma as exceções após o fechamento operacional da portaria.

### Setor de Transporte

- [ ] Consulta históricos geral e institucional.
- [ ] Mantém frota e autorizações de motoristas.
- [ ] Mantém autorizações de eventos.
- [ ] Não altera registros gerais da portaria.
- [ ] Avalia se o resumo reduz a conferência manual.
- [ ] Define quais decisões precisam de relatório ou exportação futura.

### Administrador

- [ ] Cria e pesquisa contas sem visualizar hashes.
- [ ] Desativa e reativa conta fictícia com preservação do histórico.
- [ ] Consulta auditoria com filtros.
- [ ] Confirma quem terá esse papel no ambiente institucional.
- [ ] Reconhece que recuperação de senha e produção ainda possuem pendências.

## 7. Registro do feedback

Copie uma linha por observação durante ou imediatamente após a sessão:

| Data | Perfil | Cenário | Resultado | Observação | Decisão | Prioridade | Responsável | Issue |
|---|---|---|---|---|---|---|---|---|
| AAAA-MM-DD | Porteiro | Acesso geral | Aceito/Ajustar/Rejeitado/Pendente | descrição objetiva, sem dado pessoal | decisão ou pergunta | Alta/Média/Baixa | nome ou setor | `#NN` |

Perguntas que precisam de resposta explícita:

1. Quem registra saídas e retornos dos veículos institucionais na prática?
2. O resumo diário atende à troca de turno e à conferência do Transporte?
3. Quais exceções após o fechamento operacional precisam apenas de registro?
4. Para eventos, são informadas placas, tipos e quantidades ou uma combinação?
5. Quais correções podem ser feitas e por qual perfil?
6. Há necessidade comprovada de exportação? Para quem e com quais dados?
7. Quem será Administrador e quem poderá consultar auditoria?
8. Quais decisões da Issue #30 possuem responsáveis e prazo?

## 8. Critério de encerramento

A homologação técnica está pronta para ser registrada quando:

- [ ] ambiente e readiness foram verificados;
- [ ] os sete cenários foram executados ou justificados como não aplicáveis;
- [ ] cada perfil relevante participou ou teve representante identificado;
- [ ] cada resultado foi classificado;
- [ ] dúvidas sem resposta foram mantidas como pendentes;
- [ ] mudanças aprovadas receberam issues independentes;
- [ ] nenhuma credencial ou dado pessoal foi incluído nas evidências;
- [ ] a data, os participantes e a versão/commit demonstrado foram registrados;
- [ ] o sistema permaneceu classificado como não produtivo até concluir a Issue #30.

Depois da reunião, publique na Wiki apenas decisões consolidadas. Anotações
brutas, credenciais, tokens, documentos e dados pessoais não devem ser
versionados.
