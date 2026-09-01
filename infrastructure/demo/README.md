# Dados fictícios para demonstração local

O script `Initialize-DemoData.ps1` prepara um conjunto representativo do MVP por
meio dos endpoints normais da API. Ele não acessa o PostgreSQL diretamente, não
cria atalhos de autenticação e não contém credenciais ou dados pessoais reais.

## Proteções

- aceita somente `localhost`, `127.0.0.1` ou outro endereço IP de loopback;
- verifica `/health/ready` antes de escrever;
- solicita credenciais e três senhas temporárias distintas como valores protegidos;
- não imprime senha, token ou corpo de erro HTTP;
- reutiliza contas e catálogos fictícios já existentes;
- preserva um acesso e um uso institucional abertos para a demonstração;
- preserva exemplos encerrados para consultas históricas e resumo diário.

Não use o script em ambiente institucional, compartilhado, de homologação real
ou produção. O banco local deve conter apenas dados fictícios e deve poder ser
descartado depois da apresentação.

## Pré-requisitos

1. Stack local iniciada e migrations aplicadas.
2. Administrador local criado pelo procedimento de bootstrap do README principal.
3. PowerShell 7 ou Windows PowerShell 5.1.

## Execução

A partir da raiz do repositório:

```powershell
./infrastructure/demo/Initialize-DemoData.ps1
```

O endereço padrão é `http://127.0.0.1:8080`. Se a API local usar outra porta:

```powershell
./infrastructure/demo/Initialize-DemoData.ps1 `
  -ApiBaseUrl http://127.0.0.1:5118
```

O primeiro prompt solicita o e-mail e a senha do Administrador local. Os três
prompts seguintes solicitam senhas temporárias diferentes para Porteiro,
Vigilante e Setor de Transporte. Os valores ficam somente na memória do processo
e não devem ser colocados na linha de comando, em captura de tela, issue, commit
ou Wiki.

O script cria ou reutiliza:

- contas fictícias de Porteiro, Vigilante e Setor de Transporte;
- acesso geral encerrado e acesso geral aberto;
- dois veículos e um motorista institucional fictícios;
- uso institucional concluído e uso institucional aberto;
- evento vigente e acesso vinculado a uma placa autorizada.

Execute novamente contra o mesmo banco e informe as mesmas três senhas
temporárias para confirmar que o conjunto não é duplicado. Como a API ainda não
possui redefinição administrativa de senha, uma senha diferente fará a validação
da respectiva conta falhar sem alterar a credencial existente.

## Limpeza

Não existe exclusão física do conjunto pela API porque o histórico e a auditoria
devem ser preservados. Para descartar uma demonstração exclusivamente local,
encerre a stack e remova o volume somente depois de confirmar o projeto Compose
e que nenhum dado necessário está nele:

```powershell
docker compose --project-directory infrastructure/docker down --volumes
```

Essa operação apaga o banco local do Compose e não deve ser executada contra
ambiente compartilhado. O roteiro manual e os testes negativos continuam em
`src/backend/ControleAcessoVeiculos.API/ControleAcessoVeiculos.Homologation.http`.
