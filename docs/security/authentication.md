# Autenticação e autorização

## Estado

A fundação técnica da Issue #29 implementa login individual, provisionamento inicial controlado, criação, consulta, desativação e reativação administrativas de contas, hash de senha, bloqueio temporário, access token JWT, negação por padrão e políticas preliminares. A issue técnica foi concluída; a validação institucional da matriz foi separada na Issue #75.

## Decisões implementadas

- Senhas usam `PasswordHasher` do ASP.NET Core Identity no formato V3, PBKDF2-HMAC-SHA512, salt aleatório por senha e 210.000 iterações.
- A API nunca recebe nem persiste senha em texto simples fora da duração da requisição de login.
- Usuário desconhecido, inativo, bloqueado, perfil inativo e senha incorreta recebem a mesma resposta HTTP 401.
- Cinco senhas incorretas bloqueiam a conta por 15 minutos.
- O login também possui limite padrão de 30 requisições por minuto por endereço da conexão, sem fila; excesso retorna HTTP 429 sem revelar a existência da conta.
- O login válido zera as tentativas anteriores.
- A resposta de login válido expõe somente JWT, expiração, identificador, e-mail normalizado e perfil ativo; nome, hash, bloqueio e demais estados internos da conta não fazem parte do contrato.
- O access token é assinado com HMAC-SHA256 e expira em 15 minutos.
- O token contém apenas identificador do usuário, e-mail, perfil e identificador único do token.
- A política global exige autenticação. Login, health checks e OpenAPI em desenvolvimento são exceções explícitas.
- OpenAPI não é publicado fora do ambiente `Development`.
- O primeiro administrador é criado somente por comando explícito, fora da superfície HTTP.
- Depois do bootstrap, somente `users:manage` pode criar uma conta individual em `POST /users`.
- Login bem-sucedido e o momento do bloqueio temporário geram auditoria `Login` associada ao usuário, na mesma unidade de trabalho da mudança de estado.
- Somente `users:manage` consulta, desativa ou reativa contas; auto-desativação e remoção do último Administrador ativo são rejeitadas.
- A API confirma a cada requisição autenticada que a conta e o perfil do JWT permanecem ativos.
- Desativação e reativação são auditadas atomicamente sem duplicar nome ou e-mail.
- Criação administrativa registra o Administrador como ator; o bootstrap registra origem `Bootstrap` com ator nulo, pois ainda não existe usuário autenticado.

Não existem refresh token, lista geral de revogação ou logout no servidor neste incremento. A desativação da conta, porém, invalida seus tokens na próxima requisição protegida. Até a decisão sobre sessões, o frontend deve manter o access token somente em memória e solicitar novo login após a expiração. Não armazenar token em `localStorage`, logs ou mensagens de erro. A identidade retornada ajuda a montar a interface, mas o frontend não decide autorização: cada operação continua sendo validada pelas políticas da API. A auditoria de autenticação não guarda e-mail, senha, hash, token, IP ou tentativas para usuário inexistente. Se a auditoria obrigatória de um login válido falhar, a API não emite o token.

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

O comando cria uma pessoa, o perfil `Administrador` e a primeira conta somente quando a tabela de usuários está vazia. Pessoa, conta e auditoria são persistidas na mesma transação. A auditoria usa ator nulo e origem explícita de sistema, sem nome, e-mail, senha ou hash. O comando não abre endpoint anônimo nem imprime credenciais. Remova as três variáveis logo após o uso.

Administradores autenticados podem criar outras contas pelo endpoint `POST /users`. Neste MVP, nome, e-mail, senha de 12 a 128 caracteres e um perfil preliminar são obrigatórios. A API persiste apenas o hash. `GET /users` pesquisa nome ou e-mail, filtra pelo estado e limita cada página a 100 itens. `DELETE /users/{id}` desativa sem apagar o histórico; `POST /users/{id}/reactivation` reativa e limpa tentativas e bloqueio temporário anteriores.

## Políticas preliminares

| Política | Perfis preliminares |
|---|---|
| `access:operate` | Porteiro, Vigilante e Administrador |
| `access-records:review` | Porteiro, Vigilante, Setor de Transporte e Administrador |
| `access-records:correct` | Porteiro, Vigilante e Administrador |
| `transportation:review` | Setor de Transporte e Administrador |
| `operations:summary:read` | Porteiro, Vigilante, Setor de Transporte e Administrador |
| `users:manage` | Administrador |

Esses nomes estão centralizados e não pertencem ao Domain. A matriz do MVP foi
registrada na Issue #75 e continua revisável durante a homologação. O Setor de
Transporte possui leitura do histórico geral por sua responsabilidade de
supervisão e conferência, sem herdar a política de operação ou correção. Porteiro
e Vigilante possuem as mesmas permissões operacionais porque o Vigilante apenas
substitui o Porteiro quando necessário.

## Evoluções após a Issue #29

- validar ajustes solicitados durante a homologação da matriz da Issue #75;
- validar o resumo operacional diário durante a homologação e definir se haverá conferência formal ou exportação;
- definir redefinição de senha, recuperação e encerramento explícito de sessões;
- decidir se haverá integração com identidade institucional;
- avaliar refresh token ou sessão por cookie quando o fluxo do frontend for implementado;
- registrar auditoria de logout, troca de perfil e redefinição de senha quando esses fluxos existirem;
- proteger os endpoints de negócio com as políticas validadas.

## Validação automatizada

Os testes cobrem login válido e seu contrato mínimo de identidade, credenciais inválidas, usuário inativo, bloqueio após cinco tentativas, auditoria mínima sem dados sensíveis, rollback quando a auditoria falha, limite de requisições correlacionado, acesso sem token, acesso permitido, acesso negado por perfil, criação e pesquisa administrativas, revogação imediata por desativação, reativação, auto-desativação, concorrência entre administradores, ator de sistema e upgrade/downgrade seguro da auditoria. Dados, senhas e chaves usados nos testes são fictícios e exclusivos do ambiente temporário.
