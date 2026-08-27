# Autenticação e autorização

## Estado

A fundação técnica da Issue #29 implementa login individual, hash de senha, bloqueio temporário, access token JWT, negação por padrão e políticas preliminares. A issue não deve ser encerrada até a matriz de perfis ser validada e o fluxo de provisionamento e recuperação de contas ser definido.

## Decisões implementadas

- Senhas usam `PasswordHasher` do ASP.NET Core Identity no formato V3, PBKDF2-HMAC-SHA512, salt aleatório por senha e 210.000 iterações.
- A API nunca recebe nem persiste senha em texto simples fora da duração da requisição de login.
- Usuário desconhecido, inativo, bloqueado, perfil inativo e senha incorreta recebem a mesma resposta HTTP 401.
- Cinco senhas incorretas bloqueiam a conta por 15 minutos.
- O login válido zera as tentativas anteriores.
- O access token é assinado com HMAC-SHA256 e expira em 15 minutos.
- O token contém apenas identificador do usuário, e-mail, perfil e identificador único do token.
- A política global exige autenticação. Login, health checks e OpenAPI em desenvolvimento são exceções explícitas.
- OpenAPI não é publicado fora do ambiente `Development`.

Não existem refresh token, revogação ou logout no servidor neste incremento. Até essa decisão, o frontend deve manter o access token somente em memória e solicitar novo login após a expiração. Não armazenar token em `localStorage`, logs ou mensagens de erro.

## Configuração

Os valores públicos de emissor, audiência e validade ficam em `appsettings.json`. A chave de assinatura é obrigatória, deve possuir pelo menos 32 caracteres e deve ser fornecida por secret manager ou variável de ambiente:

```text
Authentication__Jwt__SigningKey
```

Nunca versionar a chave real. Ambientes diferentes devem usar chaves diferentes. Uma troca de chave invalida os tokens emitidos anteriormente.

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
- definir criação do primeiro administrador e provisionamento de contas;
- definir redefinição de senha, recuperação, desativação e encerramento de sessões;
- decidir se haverá integração com identidade institucional;
- avaliar refresh token ou sessão por cookie quando o fluxo do frontend for implementado;
- registrar auditoria de login, bloqueio, logout e alterações de conta na Issue #31;
- proteger os endpoints de negócio com as políticas validadas.

## Validação automatizada

Os testes cobrem login válido, credenciais inválidas, usuário inativo, bloqueio após cinco tentativas, acesso sem token, acesso permitido e acesso negado por perfil. Dados, senhas e chaves usados nos testes são fictícios e exclusivos do ambiente temporário.
