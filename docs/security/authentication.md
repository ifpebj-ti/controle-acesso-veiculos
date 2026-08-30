# Autenticação e autorização

## Estado

A fundação técnica da Issue #29 implementa login individual, provisionamento inicial controlado, criação administrativa de contas, hash de senha, bloqueio temporário, access token JWT, negação por padrão e políticas preliminares. A issue não deve ser encerrada até a matriz de perfis e o restante do ciclo de contas serem validados.

## Decisões implementadas

- Senhas usam `PasswordHasher` do ASP.NET Core Identity no formato V3, PBKDF2-HMAC-SHA512, salt aleatório por senha e 210.000 iterações.
- A API nunca recebe nem persiste senha em texto simples fora da duração da requisição de login.
- Usuário desconhecido, inativo, bloqueado, perfil inativo e senha incorreta recebem a mesma resposta HTTP 401.
- Cinco senhas incorretas bloqueiam a conta por 15 minutos.
- O login também possui limite padrão de 30 requisições por minuto por endereço da conexão, sem fila; excesso retorna HTTP 429 sem revelar a existência da conta.
- O login válido zera as tentativas anteriores.
- O access token é assinado com HMAC-SHA256 e expira em 15 minutos.
- O token contém apenas identificador do usuário, e-mail, perfil e identificador único do token.
- A política global exige autenticação. Login, health checks e OpenAPI em desenvolvimento são exceções explícitas.
- OpenAPI não é publicado fora do ambiente `Development`.
- O primeiro administrador é criado somente por comando explícito, fora da superfície HTTP.
- Depois do bootstrap, somente `users:manage` pode criar uma conta individual em `POST /users`.
- Login bem-sucedido e o momento do bloqueio temporário geram auditoria `Login` associada ao usuário, na mesma unidade de trabalho da mudança de estado.

Não existem refresh token, revogação ou logout no servidor neste incremento. Até essa decisão, o frontend deve manter o access token somente em memória e solicitar novo login após a expiração. Não armazenar token em `localStorage`, logs ou mensagens de erro. A auditoria de autenticação não guarda e-mail, senha, hash, token, IP ou tentativas para usuário inexistente. Se a auditoria obrigatória de um login válido falhar, a API não emite o token.

## Configuração

Os valores públicos de emissor, audiência e validade ficam em `appsettings.json`. A chave de assinatura é obrigatória, deve possuir pelo menos 32 caracteres e deve ser fornecida por secret manager ou variável de ambiente:

```text
Authentication__Jwt__SigningKey
```

Nunca versionar a chave real. Ambientes diferentes devem usar chaves diferentes. Uma troca de chave invalida os tokens emitidos anteriormente.

Os limites de login são configuráveis por `RateLimiting__LoginPermitLimit` e
`RateLimiting__LoginWindowSeconds`. Alterações para produção devem considerar
NAT compartilhado, observabilidade e teste de carga. A aplicação usa somente o
endereço da conexão e não confia em cabeçalhos encaminhados antes da configuração
explícita de proxies conhecidos.

## Provisionamento inicial

Depois de aplicar as migrations, configure temporariamente `BootstrapAdmin__Name`, `BootstrapAdmin__Email` e `BootstrapAdmin__Password` e execute:

```bash
dotnet run --project src/backend/ControleAcessoVeiculos.API -- --bootstrap-admin
```

O comando cria uma pessoa, o perfil `Administrador` e a primeira conta somente quando a tabela de usuários está vazia. Ele não abre endpoint anônimo e não imprime senha ou hash. Remova as três variáveis logo após o uso.

Administradores autenticados podem criar outras contas pelo endpoint `POST /users`. Neste MVP, nome, e-mail, senha de 12 a 128 caracteres e um perfil preliminar são obrigatórios. A API persiste apenas o hash.

## Políticas preliminares

| Política | Perfis preliminares |
|---|---|
| `access:operate` | Porteiro, Vigilante e Administrador |
| `transportation:review` | Setor de Transporte e Administrador |
| `users:manage` | Administrador |

Esses nomes estão centralizados e não pertencem ao Domain. A matriz ainda depende de validação com os responsáveis do processo. Endpoints de negócio só devem usar uma política depois que sua operação estiver confirmada.

## Pendências antes de encerrar a Issue #29

- validar se Vigilante possui as mesmas operações do Porteiro;
- validar correção, conferência, consulta, exportação e administração por perfil;
- definir redefinição de senha, recuperação, desativação e encerramento de sessões;
- decidir se haverá integração com identidade institucional;
- avaliar refresh token ou sessão por cookie quando o fluxo do frontend for implementado;
- registrar auditoria de logout e alterações de conta na Issue #31 quando esses fluxos existirem;
- proteger os endpoints de negócio com as políticas validadas.

## Validação automatizada

Os testes cobrem login válido, credenciais inválidas, usuário inativo, bloqueio após cinco tentativas, auditoria mínima sem dados sensíveis, rollback quando a auditoria falha, limite de requisições correlacionado, acesso sem token, acesso permitido, acesso negado por perfil, validação de conta e criação administrativa. Dados, senhas e chaves usados nos testes são fictícios e exclusivos do ambiente temporário.
