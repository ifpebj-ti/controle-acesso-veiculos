# Diretrizes do backend

## Stack

- Utilizar C#, ASP.NET Core Web API e .NET 10.
- Manter projetos com target framework `net10.0`.
- Utilizar a solução `ControleAcessoVeiculos.slnx`.

## Arquitetura

- Domain não deve depender de ASP.NET Core, Entity Framework Core ou PostgreSQL.
- Application concentra casos de uso, DTOs e interfaces.
- Infrastructure concentra DbContext, mapeamentos, repositórios, integrações e migrations.
- API concentra endpoints, injeção de dependência, middlewares e configuração HTTP.
- Não implementar regras de negócio diretamente em controllers.
- Não colocar regras de negócio no DbContext.

## Persistência

- Utilizar Entity Framework Core com PostgreSQL.
- Configurações de entidades devem usar Fluent API na Infrastructure.
- Migrations devem permanecer versionadas e revisadas.
- Não editar migrations já aplicadas em banco compartilhado.
- Não usar `EnsureCreated` quando o projeto utilizar migrations.
- Não aplicar migrations automaticamente no startup da API.
- Não expor detalhes de banco em respostas HTTP ou logs.