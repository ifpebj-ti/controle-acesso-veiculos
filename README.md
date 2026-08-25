<div align="center">

# 🚗 Controle de Acesso de Veículos

Sistema para gerenciamento e controle de acesso de veículos, desenvolvido como parte do projeto PI7 no **IFPE - Campus Belo Jardim**.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Repo Size](https://img.shields.io/github/repo-size/ifpebj-ti/controle-acesso-veiculos)
![Last Commit](https://img.shields.io/github/last-commit/ifpebj-ti/controle-acesso-veiculos)

</div>

---

## 📌 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Problema Resolvido](#-problema-resolvido)
- [Documentação e Artefatos](#-documentação-e-artefatos)
- [Stack de Tecnologias](#️-stack-de-tecnologias)
- [Como Executar](#-como-executar)
- [Colaboradores](#-colaboradores)
- [Licença](#-licença)

---

## 📖 Sobre o Projeto

O **Controle de Acesso de Veículos** é um sistema para registrar, acompanhar e auditar o acesso de veículos ao IFPE – Campus Belo Jardim, apoiando o setor de transporte, porteiros e guardas na organização dos registros e na segurança do campus.

Este sistema tem como objetivo fornecer uma forma **eficiente e segura** de gerenciar o controle de acesso de veículos, permitindo:

- cadastro de veículos e motoristas;
- monitoramento de entradas e saídas;
- validação de acesso em tempo real;
- geração de relatórios administrativos para apoio à gestão.

### ✨ Funcionalidades Planejadas

| Funcionalidade               | Status |
|-----------------------------|:-----:|
| Cadastro de veículos        | 🔲    |
| Cadastro de motoristas      | 🔲    |
| Histórico de acessos        | 🔲    |
| Controle de entrada e saída | 🔲    |
| Painel administrativo       | 🔲    |
| Relatórios de acesso        | 🔲    |

---

## 🎯 Problema Resolvido

Hoje o controle de veículos é feito com registros dispersos (anotações manuais, planilhas e comunicação informal), o que dificulta:

- localizar rapidamente quem entrou ou saiu em um determinado horário;
- ter histórico confiável para auditoria e segurança;
- gerar relatórios consolidados para o setor de transporte;
- padronizar o procedimento entre diferentes porteiros e turnos.

O sistema propõe centralizar essas informações em uma única aplicação, com registros padronizados e consultáveis.

---

## 📚 Documentação e Artefatos

- **Wiki do projeto:**  
  Documentação técnica e funcional do sistema, incluindo visão, arquitetura, segurança e operação.  
  👉 [controle-acesso-veiculos.wiki](https://github.com/ifpebj-ti/controle-acesso-veiculos/wiki)

- **Acompanhamento semanal:**  
  Apresentação usada nas weeklies / sprint report, com o progresso do projeto ao longo das sprints.  
  👉 [Sprint report / Weekly 1](https://canva.link/tjsp5iu5c5iwbdp)

- **Protótipo das telas:**  
  Protótipos de interface ainda estão em desenvolvimento e serão refinados nas próximas sprints.  
  👉 [Figma](https://www.figma.com/design/N6EOkXw8Ex7cZayyh4MJfY/Propotipagem?node-id=0-1&t=hWlwxlusfhqN3ZTP-1)

---

## 🛠️ Stack de Tecnologias

> 🚧 A definir.

---

## 🚀 Como Executar

### Pré-requisitos

- .NET SDK 10;
- PostgreSQL 16 ou superior;
- Docker Desktop, caso o banco seja executado pelo Docker;
- ferramenta `dotnet-ef` 10.

```bash
dotnet tool install --global dotnet-ef --version 10.*
```

### Connection string local

O arquivo `src/backend/ControleAcessoVeiculos.API/appsettings.Development.json` contém um exemplo com senha fictícia. Substitua `CHANGE_ME` somente no seu ambiente local ou use a variável de ambiente `ConnectionStrings__DefaultConnection`.

Exemplo:

```text
Host=localhost;Port=5432;Database=controle_acesso_dev;Username=postgres;Password=CHANGE_ME
```

No Docker Compose, a API recebe essa configuração por `ConnectionStrings__DefaultConnection`, montada a partir do arquivo local e não versionado `infrastructure/docker/.env`.

### Restaurar e compilar

Execute a partir da raiz do repositório:

```bash
dotnet restore src/backend/ControleAcessoVeiculos.slnx
dotnet build src/backend/ControleAcessoVeiculos.slnx --no-restore
```

### Criar e aplicar migrations

Para criar uma nova migration:

```bash
dotnet ef migrations add NomeDaMigration --project src/backend/ControleAcessoVeiculos.Infrastructure --startup-project src/backend/ControleAcessoVeiculos.API --output-dir Data/Migrations
```

Para aplicar as migrations pendentes:

```bash
dotnet ef database update --project src/backend/ControleAcessoVeiculos.Infrastructure --startup-project src/backend/ControleAcessoVeiculos.API
```

### Executar a API localmente

```bash
dotnet run --project src/backend/ControleAcessoVeiculos.API --launch-profile http
```

A API estará disponível em `http://localhost:5118`. Para verificar os endpoints iniciais:

```bash
curl http://localhost:5118/health
curl http://localhost:5118/weatherforecast
```

### Executar com Docker Compose

```bash
cd infrastructure/docker
docker compose build backend
docker compose up
```

---

## 👥 Colaboradores

| Nome | Papel principal | Apoio / Responsabilidades complementares |
|------|-----------------|-------------------------------------------|
| [**Raíssa Beatriz**](https://github.com/Raissa-Beatriz) | Front-end / UX/UI | DevOps / Infra / QA |
| [**José Ernandes**](https://github.com/ErnandesCosta) | Back-end / DB | DevOps / Infra / QA |
---

## 📄 Licença

Este projeto está licenciado sob a [Licença Apache 2.0](LICENSE).

<div align="center">

Feito com 💚 por alunos do IFPE - Campus Belo Jardim

</div>
