<div align="center">

# Controle de Acesso de Veículos

Sistema web para digitalizar o registro, a consulta e a auditoria da movimentação de veículos no IFPE — Campus Belo Jardim.

[![CI Backend](https://github.com/ifpebj-ti/controle-acesso-veiculos/actions/workflows/ci-backend.yml/badge.svg)](https://github.com/ifpebj-ti/controle-acesso-veiculos/actions/workflows/ci-backend.yml)
[![CI Frontend](https://github.com/ifpebj-ti/controle-acesso-veiculos/actions/workflows/ci-frontend.yml/badge.svg)](https://github.com/ifpebj-ti/controle-acesso-veiculos/actions/workflows/ci-frontend.yml)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)

[Wiki](https://github.com/ifpebj-ti/controle-acesso-veiculos/wiki) · [Issues](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues) · [Pull Requests](https://github.com/ifpebj-ti/controle-acesso-veiculos/pulls)

</div>

## Estado atual

> Atualizado em 29 de agosto de 2026. O projeto possui dois fluxos operacionais verticais do MVP, mas ainda não está pronto para uso real na portaria.

| Área | Estado |
|---|---|
| Produto | MVP documentado para os Formulários nº 01 e nº 02; regras institucionais ainda precisam de validação |
| Frontend | Estrutura React criada, com layout, rotas, cliente HTTP e página inicial; telas operacionais pendentes |
| Backend | API .NET 10 com autenticação, contas, fluxo geral de acesso, catálogo de frota e saída/retorno de veículos institucionais |
| Dados | PostgreSQL 16, EF Core 10, nove entidades e seis migrations versionadas |
| Infraestrutura | Dockerfiles e Compose endurecidos, containers não privilegiados e CI com build e scan de imagens |
| Qualidade | 68 testes de Domain, Application, API e PostgreSQL, com cobertura publicada pela CI |
| Segurança | JWT, contas individuais, autorização operacional, controles HTTP e auditoria transacional dos fluxos geral e institucional implementados; matriz final de perfis e auditoria dos demais fluxos pendentes |
| Deploy | Homologação, OCI, HTTPS, backup, observabilidade e deploy ainda não configurados |

Os endpoints `/health`, `/health/live`, `/health/ready` e `/weatherforecast` são verificações técnicas iniciais. `/weatherforecast` exige JWT apenas para validar a fundação de segurança e será removido quando deixar de ser útil; não representa um fluxo de negócio do produto.

Os contratos operacionais e administrativos disponíveis são:

| Método e rota | Finalidade |
|---|---|
| `POST /access-records/entries` | registra entrada e cria ou reutiliza pessoa, veículo, vínculo e categoria em uma transação |
| `GET /access-records/open` | lista veículos com acesso ainda aberto |
| `POST /access-records/{id}/exit` | encerra um acesso usando horário e usuário autenticado do servidor |
| `GET /institutional-vehicles` | lista a frota institucional ativa para operação e conferência |
| `POST /institutional-vehicles` | cadastra veículo institucional para `SetorTransporte` ou `Administrador` |
| `POST /institutional-vehicle-usages/departures` | registra a saída de veículo institucional e motorista já cadastrados |
| `GET /institutional-vehicle-usages/open` | lista usos institucionais ainda sem retorno |
| `POST /institutional-vehicle-usages/{id}/returns` | registra retorno e valida a quilometragem |

A placa e a identificação de frota são normalizadas. O PostgreSQL impede duplicidades no catálogo e dois acessos ou usos institucionais abertos para o mesmo veículo, inclusive em requisições concorrentes. As operações geram trilha de auditoria com operador, horário, registro e transição de estado na mesma transação; se a auditoria falhar, a operação é revertida. Nome do condutor, placa, objetivo e categoria são obrigatórios no fluxo geral. No fluxo institucional, veículo e motorista devem estar ativos e previamente cadastrados; itinerário permanece como texto livre até validação institucional.

## Problema e escopo do MVP

O controle atual depende de formulários físicos, arquivamento manual e consultas demoradas. O projeto busca preservar a rastreabilidade necessária e reduzir repetição e erros, sem copiar automaticamente toda a burocracia do papel.

O MVP está concentrado em:

- pessoas, veículos e seus vínculos;
- registro e consulta de entrada e saída;
- identificação de acessos ainda abertos;
- uso de veículos institucionais com motorista, quilometragem e itinerário;
- perfis, usuário responsável, correções rastreáveis e auditoria.

Reconhecimento automático de placas, câmeras, RFID, cancelas, estacionamento e os fluxos gerais de pedestres permanecem fora do primeiro incremento. Uma solução observada no mercado não se torna requisito sem levantamento local e validação do cliente.

## Arquitetura e stack

O repositório utiliza um monólito modular com Clean Architecture adaptada:

```text
React + TypeScript
        |
ASP.NET Core Web API
        |
Application -> Domain
        |
Infrastructure -> EF Core -> PostgreSQL
```

| Área | Tecnologias |
|---|---|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router, Axios, React Hook Form e Zod |
| Backend | .NET 10, ASP.NET Core Web API e C# |
| Persistência | Entity Framework Core 10, Npgsql e PostgreSQL 16 |
| Testes | xUnit, Testcontainers, `WebApplicationFactory` e coverlet |
| Infraestrutura | Docker, Docker Compose, Nginx e GitHub Actions |
| Implantação futura | VM Linux na Oracle Cloud Infrastructure, ainda não configurada |

O Domain não referencia Entity Framework Core. O `DbContext`, as configurações Fluent API e as migrations permanecem em Infrastructure.

## Estrutura do repositório

```text
controle-acesso-veiculos/
├── .github/                  # workflows, templates e instruções
├── docs/                     # convenções e segurança versionada
├── infrastructure/docker/    # Dockerfiles, Compose e configuração de exemplo
├── src/backend/
│   ├── ControleAcessoVeiculos.API/
│   ├── ControleAcessoVeiculos.Application/
│   ├── ControleAcessoVeiculos.Application.Tests/
│   ├── ControleAcessoVeiculos.Domain/
│   ├── ControleAcessoVeiculos.Domain.Tests/
│   ├── ControleAcessoVeiculos.Infrastructure/
│   └── ControleAcessoVeiculos.IntegrationTests/
└── src/frontend/             # aplicação React
```

## Pré-requisitos

- Git;
- .NET SDK 10;
- Node.js 24 LTS e npm;
- Docker Desktop ou Docker Engine com o plugin Compose;
- `dotnet-ef` 10 para criar ou aplicar migrations fora do container.

Instale ou atualize a ferramenta do EF Core:

```bash
dotnet tool update --global dotnet-ef --version 10.*
```

## Início rápido com Docker Compose

Crie o arquivo local de ambiente sem alterar o exemplo versionado:

```bash
cd infrastructure/docker
cp .env.example .env
```

No PowerShell, use:

```powershell
Set-Location infrastructure/docker
Copy-Item .env.example .env
```

Os valores do `.env.example` são exclusivamente locais e fictícios. Troque a senha no arquivo `.env`, que é ignorado pelo Git, antes de usar um ambiente compartilhado.

Valide, construa e suba os serviços:

```bash
docker compose config
docker compose build backend
docker compose up --build
```

Serviços padrão:

| Serviço | Endereço local |
|---|---|
| Frontend | `http://localhost:3000` |
| API | `http://localhost:8080` |
| PostgreSQL | `localhost:5432` |

O Compose não aplica migrations automaticamente. Em outro terminal, a partir da raiz do repositório, configure a conexão com os mesmos valores do seu `.env` e execute `dotnet ef database update` conforme a seção de migrations.

Para encerrar os containers sem apagar o volume do banco:

```bash
docker compose down
```

Não use `docker compose down --volumes` sem confirmar que os dados locais podem ser descartados.

## Desenvolvimento local

### Banco PostgreSQL

Você pode executar apenas o banco pelo Compose:

```bash
cd infrastructure/docker
docker compose up -d postgresql
```

O arquivo `src/backend/ControleAcessoVeiculos.API/appsettings.Development.json` contém uma senha marcadora (`CHANGE_ME`), não uma credencial funcional. Prefira configurar a conexão apenas no ambiente local.

PowerShell:

```powershell
$env:ConnectionStrings__DefaultConnection = 'Host=localhost;Port=5432;Database=controle_acesso;Username=controle_acesso_app;Password=change_this_local_password'
```

Bash:

```bash
export ConnectionStrings__DefaultConnection='Host=localhost;Port=5432;Database=controle_acesso;Username=controle_acesso_app;Password=change_this_local_password'
```

Os valores acima correspondem ao exemplo local e devem ser substituídos fora do ambiente de desenvolvimento.

Gere uma chave JWT local sem versioná-la. No PowerShell:

```powershell
$jwtKeyBytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Fill($jwtKeyBytes)
$env:Authentication__Jwt__SigningKey = [Convert]::ToBase64String($jwtKeyBytes)
```

No Bash:

```bash
export Authentication__Jwt__SigningKey="$(openssl rand -base64 48)"
```

Essa variável também é necessária para executar comandos `dotnet ef`, pois a API valida a configuração no startup. No Docker Compose, defina `JWT_SIGNING_KEY` no `.env` local conforme `.env.example`.

### Backend

A partir da raiz:

```bash
dotnet restore src/backend/ControleAcessoVeiculos.slnx
dotnet build src/backend/ControleAcessoVeiculos.slnx --no-restore
dotnet run --project src/backend/ControleAcessoVeiculos.API --launch-profile http
```

A API ficará em `http://localhost:5118`.

### Primeira conta administrativa

Depois de aplicar as migrations, configure temporariamente nome, e-mail fictício/local e uma senha de desenvolvimento com pelo menos 12 caracteres:

```powershell
$env:BootstrapAdmin__Name = 'Administrador Local'
$env:BootstrapAdmin__Email = 'admin.local@example.test'
$env:BootstrapAdmin__Password = 'substitua-por-uma-senha-local-segura'
dotnet run --project src/backend/ControleAcessoVeiculos.API -- --bootstrap-admin
Remove-Item Env:BootstrapAdmin__Name, Env:BootstrapAdmin__Email, Env:BootstrapAdmin__Password
```

O comando funciona somente enquanto não existir nenhum usuário. Ele cria a primeira conta fora da API HTTP. Depois disso, um Administrador autenticado pode criar contas individuais em `POST /users`. Não use dados ou senhas reais nos exemplos e não versione essas variáveis.

### Frontend

Em outro terminal:

```bash
cd src/frontend
npm ci
npm run dev
```

O Vite informará a URL de desenvolvimento, normalmente `http://localhost:5173`.

O cliente HTTP do frontend está preparado para uma futura API sob `/api`, mas ainda não existe integração com endpoints de negócio. Para testar os endpoints técnicos, acesse a API diretamente.

### Testar o fluxo geral de acesso

Autentique uma conta de perfil operacional em `POST /auth/login`, copie o `accessToken` e use o arquivo [`ControleAcessoVeiculos.API.http`](src/backend/ControleAcessoVeiculos.API/ControleAcessoVeiculos.API.http) ou envie:

```bash
curl -X POST http://localhost:5118/access-records/entries \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"driverName":"Condutor Fictício","plate":"ABC-1D23","objective":"Visita técnica","categoryName":"Visitante"}'

curl http://localhost:5118/access-records/open \
  -H "Authorization: Bearer SEU_TOKEN"

curl -X POST http://localhost:5118/access-records/1/exit \
  -H "Authorization: Bearer SEU_TOKEN"
```

As categorias preliminares aceitas são: `Visitante`, `Prestador de serviço`, `Entrega`, `Evento`, `Treino ou jogo`, `Caminhada com veículo`, `Mototáxi`, `Permanência excepcional` e `Outro acesso autorizado`. Elas são hipóteses do MVP e devem ser revistas após a validação com a portaria.

### Testar o fluxo de veículos institucionais

Com uma conta `SetorTransporte` ou `Administrador`, cadastre e consulte um veículo institucional:

```bash
curl -X POST http://localhost:5118/institutional-vehicles \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plate":"IFP-1E23","identification":"FROTA-001","vehicleType":"Automóvel","brand":"Marca fictícia","model":"Modelo de teste","color":"Branco","year":2026}'

curl http://localhost:5118/institutional-vehicles \
  -H "Authorization: Bearer SEU_TOKEN"
```

`Porteiro` e `Vigilante` também podem consultar a frota ativa, mas não cadastrar veículos. Use o `id` retornado e o identificador de um motorista ativo já cadastrado para operar a saída e o retorno:

```bash
curl -X POST http://localhost:5118/institutional-vehicle-usages/departures \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":1,"driverId":1,"departureMileage":12500,"itinerary":"Campus - Unidade rural"}'

curl http://localhost:5118/institutional-vehicle-usages/open \
  -H "Authorization: Bearer SEU_TOKEN"

curl -X POST http://localhost:5118/institutional-vehicle-usages/1/returns \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"returnMileage":12542}'
```

Atualização e inativação da frota, catálogo e critérios de elegibilidade de motoristas, pesquisa histórica e correção autorizada permanecem em recortes futuros. A API não cria veículo institucional implicitamente a partir de uma saída.

## Migrations

Execute a partir da raiz, com `ConnectionStrings__DefaultConnection` configurada.

Aplicar migrations pendentes:

```bash
dotnet ef database update --project src/backend/ControleAcessoVeiculos.Infrastructure --startup-project src/backend/ControleAcessoVeiculos.API
```

Criar uma migration depois de aprovar uma mudança de modelo:

```bash
dotnet ef migrations add NomeDaMigration --project src/backend/ControleAcessoVeiculos.Infrastructure --startup-project src/backend/ControleAcessoVeiculos.API --output-dir Data/Migrations
```

Nunca edite ou remova uma migration já aplicada em ambiente compartilhado sem plano de migração e revisão.

## Validação e testes

Backend:

```bash
dotnet restore src/backend/ControleAcessoVeiculos.slnx
dotnet build src/backend/ControleAcessoVeiculos.slnx --no-restore
dotnet test src/backend/ControleAcessoVeiculos.slnx --no-build --no-restore
```

Frontend:

```bash
cd src/frontend
npm ci
npm run lint
npm run build
```

Verificações técnicas da API:

```bash
curl http://localhost:5118/health
curl http://localhost:5118/health/live
curl http://localhost:5118/health/ready
curl -i http://localhost:5118/weatherforecast
```

`/health` e `/health/live` verificam o processo HTTP. `/health/ready` também verifica o PostgreSQL e retorna HTTP 503 quando o banco não está acessível. `/weatherforecast` retorna HTTP 401 sem token e pode ser usado para verificar uma autenticação local.

## Configuração e segurança

- Toda resposta inclui `X-Correlation-ID`; somente UUIDs válidos enviados pelo cliente são reutilizados.
- Erros inesperados usam `application/problem+json` sem mensagem interna ou stack trace.
- O corpo de cada requisição é limitado globalmente a 1 MiB.
- Logs HTTP incluem correlação, método, template da rota, status e duração; não incluem valores da URL, query string, corpo nem cabeçalho de autorização.
- A auditoria dos fluxos geral, institucional e do catálogo de frota registra somente identificadores e estados necessários; não duplica nome, documento, placa, identificação patrimonial, objetivo, observação nem itinerário.
- Não versione `.env`, `.env.local`, tokens, chaves ou connection strings reais.
- Use `ConnectionStrings__DefaultConnection` para sobrescrever a configuração local.
- Não use dados pessoais reais em testes, seeds, exemplos, issues ou capturas de tela.
- O frontend recebe apenas variáveis prefixadas por `VITE_`; elas não podem conter segredos.
- Revise migrations, permissões e logs antes de usar dados institucionais.
- Os primeiros fluxos de negócio e o catálogo inicial de frota existem, mas catálogo de motoristas, manutenção de cadastros, consultas históricas, matriz final de perfis, recuperação, revogação e outros casos de uso ainda estão em desenvolvimento; o sistema não deve ser exposto publicamente.

Consulte a [modelagem de ameaças](docs/security/threat-model.md), o [guia de desenvolvimento seguro](docs/security/secure-development-guide.md) e as [instruções de segurança](.github/instructions/security.instructions.md).
As decisões e pendências da fundação de login estão em [autenticação e autorização](docs/security/authentication.md).

## Documentação

- [Wiki do projeto](https://github.com/ifpebj-ti/controle-acesso-veiculos/wiki): visão, processo, requisitos, arc42, dados, segurança, testes, operação e status.
- [Convenções de commit](docs/development/commit-conventions.md).
- [CI/CD e segurança de containers](docs/development/ci-cd.md).
- [Possibilidades de evolução acadêmica](docs/research/academic-evolution-options.md) — material exploratório para uma futura conversa com professores; não integra o escopo atual.
- [Modelagem de ameaças](docs/security/threat-model.md).
- [Guia de desenvolvimento seguro](docs/security/secure-development-guide.md).
- [Protótipo no Figma](https://www.figma.com/design/N6EOkXw8Ex7cZayyh4MJfY/Propotipagem?node-id=0-1&t=hWlwxlusfhqN3ZTP-1).
- [Sprint report / Weekly 1](https://canva.link/tjsp5iu5c5iwbdp).

A Wiki abrange o projeto completo, não apenas o backend. Documentos acadêmicos e decisões históricas devem ser atualizados de forma aditiva, preservando contexto e rastreabilidade.

## Contribuição

1. Confirme ou abra uma Issue com escopo e critérios de aceite.
2. Crie uma branch vinculada à Issue.
3. Faça commits pequenos conforme as [convenções](docs/development/commit-conventions.md).
4. Execute as validações proporcionais à mudança.
5. Abra uma Pull Request com evidências e riscos conhecidos.
6. Aguarde a revisão e os checks obrigatórios; não contorne a proteção da `main`.

Papéis principais:

| Pessoa | Responsabilidade principal | Apoio |
|---|---|---|
| [Raíssa Beatriz](https://github.com/Raissa-Beatriz) | Frontend e UX/UI | DevOps, infraestrutura e QA |
| [José Ernandes](https://github.com/ErnandesCosta) | Backend e banco de dados | DevOps, infraestrutura e QA |

## Licença

Distribuído sob a [Apache License 2.0](LICENSE).
