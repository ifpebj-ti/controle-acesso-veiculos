# Autenticação e autorização

## Estado

A fundação técnica da Issue #29 implementa login individual, provisionamento inicial controlado, criação, consulta, desativação e reativação administrativas de contas, hash de senha, bloqueio temporário, access token JWT, negação por padrão e políticas preliminares. A Issue #190 acrescenta o ciclo de vida de sessão controlado pelo servidor, e a Issue #251 acrescenta a troca autenticada de senha. A validação institucional da matriz, dos tempos operacionais e do canal de recuperação permanece nas Issues #75, #162 e #220.

## Decisões implementadas

- Senhas usam `PasswordHasher` do ASP.NET Core Identity no formato V3, PBKDF2-HMAC-SHA512, salt aleatório por senha e 210.000 iterações.
- Quando um login válido usa um hash compatível, porém abaixo da configuração vigente, a API recalcula e persiste o hash antes de emitir a sessão. A atualização, a sessão e a auditoria compartilham a mesma unidade de trabalho; uma falha impede a emissão da credencial e desfaz todas as mudanças.
- A API nunca recebe nem persiste senha em texto simples fora da duração da requisição de login.
- Usuário desconhecido, inativo, bloqueado, perfil inativo e senha incorreta recebem a mesma resposta HTTP 401.
- Cinco senhas incorretas bloqueiam a conta por 15 minutos.
- O login também possui limite padrão de 30 requisições por minuto por endereço da conexão, sem fila; excesso retorna HTTP 429 sem revelar a existência da conta.
- O login válido zera as tentativas anteriores.
- A resposta de login válido expõe somente JWT, expiração, identificador, e-mail normalizado e perfil ativo; nome, hash, bloqueio e demais estados internos da conta não fazem parte do contrato.
- O access token é assinado com HMAC-SHA256 e expira em 15 minutos.
- O login também cria uma família de sessão com duração absoluta inicial de 12 horas e inatividade máxima inicial de 60 minutos; ambos os valores são configuráveis e ainda são hipóteses do MVP.
- O token de renovação possui 256 bits gerados pelo gerador criptográfico do sistema, é opaco e é entregue somente em cookie `HttpOnly`, `SameSite=Strict` e de caminho restrito.
- Somente o SHA-256 do token de renovação é persistido. O valor bruto não integra DTO, banco, auditoria nem log.
- `POST /auth/refresh` rotaciona o token em uma transação, preserva a expiração absoluta e rejeita reutilização. A reutilização revoga toda a família conhecida.
- `POST /auth/logout` revoga a família no servidor e expira o cookie. A desativação da conta também revoga suas sessões na mesma transação.
- `POST /auth/password` exige JWT válido, senha atual e uma nova senha de 12 a 128 caracteres. A nova senha não pode reutilizar a credencial atual.
- Cada conta possui uma versão de credencial incluída no JWT. A troca incrementa essa versão, portanto access tokens anteriores falham já na próxima requisição, sem aguardar os 15 minutos de validade.
- Troca do hash, incremento da versão, revogação de todas as sessões renováveis e auditoria ocorrem na mesma transação com bloqueio da conta no PostgreSQL. Duas requisições concorrentes não podem aceitar a mesma senha atual.
- A auditoria da troca registra somente as versões anterior e nova da credencial. Senha atual, senha nova, hashes, e-mail, JWT e refresh token não são copiados.
- A migration atribui versão `1` às contas existentes. JWTs emitidos por versões anteriores da API não possuem essa claim e são rejeitados após o deploy, exigindo novo login; essa invalidação conservadora é intencional.
- Renovação e logout exigem o par de tokens antifalsificação emitido por `GET /auth/csrf`; ausência ou inconsistência retorna HTTP 400 antes de acessar a sessão.
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

O servidor possui renovação, rotação, revogação e logout, mas não mantém uma lista de JWTs: o access token continua curto e a API confirma conta, perfil e versão da credencial em cada requisição. A família persistida controla a renovação, enquanto a versão invalida em conjunto os JWTs anteriores após troca de senha. Não armazenar JWT ou refresh token em `localStorage`, `sessionStorage`, logs ou mensagens de erro. A identidade retornada ajuda a montar a interface, mas o frontend não decide autorização: cada operação continua sendo validada pelas políticas da API. A auditoria de autenticação não guarda e-mail, senha, JWT, refresh token, hash, cookie, IP ou tentativas para usuário inexistente. Se a persistência obrigatória de sessão e auditoria de um login válido falhar, a API não emite credencial.

## Integração do frontend

A Issue #117 aplica essa decisão no frontend React. O formulário usa e-mail e
senha porque esse é o contrato vigente de `POST /auth/login`; a preferência
visual anterior por nome de usuário não altera silenciosamente a API. A resposta
é validada antes de criar a sessão, e somente `id`, e-mail, perfil e expiração
compõem a identidade local.

Até a conclusão da Issue #191, o access token fica em uma variável de módulo e no contexto React apenas durante
a aba aberta. Ele é anexado pelo interceptor do Axios, nunca é colocado em URL,
estado de rota, log, mensagem de erro, `localStorage` ou `sessionStorage`. Logout,
expiração e resposta 401 limpam token, identidade e temporizador. Atualizar a
página perde a memória e exige novo login; esse comportamento é uma limitação
temporária do cliente. A Issue #191 deve integrar `GET /auth/csrf`,
`POST /auth/refresh` e `POST /auth/logout`, manter o access token apenas em
memória e coordenar múltiplas abas sem ler o cookie `HttpOnly`.

A interface filtra rotas e navegação usando exclusivamente `profileName`
devolvido pela API. A filtragem reduz confusão, mas não é autorização. A matriz
do servidor continua prevalecendo, inclusive no acesso operacional excepcional
do Administrador. Essas ações ficam fora de seu menu rotineiro, mas uma rota
compatível não contradiz a política do backend.

Foram consideradas e rejeitadas neste incremento as seguintes alternativas:

- `localStorage`, por manter o JWT disponível a scripts após recarregamentos e
  ampliar a janela de exposição em um incidente de XSS;
- `sessionStorage`, por continuar disponível a scripts durante toda a aba;
- um refresh token retornado em JSON ou persistido pelo JavaScript, por ampliar a
  exposição em um incidente de XSS;
- aumentar isoladamente a duração do JWT, porque amplia a janela de abuso e não
  oferece rotação, detecção de reutilização nem revogação no servidor.

Credencial incorreta, conta inativa e bloqueio temporário permanecem
indistinguíveis na interface porque a API retorna o mesmo 401 por segurança. O
frontend não tenta inferir o motivo. Respostas 403 exibem acesso negado sem dados
do recurso, e indisponibilidade não gera confirmação falsa de login.

## Configuração

Os valores públicos de emissor, audiência e validade ficam em `appsettings.json`. A chave de assinatura é obrigatória, deve possuir pelo menos 32 caracteres e deve ser fornecida por secret manager ou variável de ambiente:

```text
Authentication__Jwt__SigningKey
```

Nunca versionar a chave real. Ambientes diferentes devem usar chaves diferentes. Uma troca de chave invalida os tokens emitidos anteriormente.

O ciclo de sessão aceita as configurações públicas abaixo:

```text
Authentication__Session__InactivityTimeoutMinutes
Authentication__Session__AbsoluteLifetimeHours
Authentication__Session__RefreshCookieName
```

Os limites aceitos no startup são, respectivamente, 5–240 minutos e 1–24 horas,
com duração absoluta obrigatoriamente superior à inatividade. Em produção, os
cookies usam `Secure`; por isso, a aplicação publicada precisa de HTTPS. No
Compose, o Nginx mantém a arquitetura same-origin e reescreve o caminho externo
de `/auth` para `/api/auth`. Outros proxies devem fazer adaptação equivalente sem
ampliar o cookie para todo o site.

O Compose identifica explicitamente a API como `LocalContainer`. Nesse ambiente
de desenvolvimento, e somente nele, os cookies não usam `Secure` porque a stack
é servida por HTTP local. `Development` e `Testing` possuem o mesmo tratamento;
qualquer outro ambiente exige cookie `Secure` e HTTPS. `LocalContainer` não deve
ser usado em implantação institucional.

As chaves antifalsificação do container local são efêmeras: reiniciar a API
invalida o par CSRF, e o frontend deve buscá-lo novamente. Antes de múltiplas
réplicas ou produção, o operador precisa configurar um key ring compartilhado,
persistente, criptografado e acessível apenas à aplicação. Essa dependência faz
parte da infraestrutura definitiva, não deve ser simulada por chave versionada.

Os limites de login são configuráveis por `RateLimiting__LoginPermitLimit` e
`RateLimiting__LoginWindowSeconds`. Alterações para produção devem considerar
NAT compartilhado, observabilidade e teste de carga. A aplicação usa somente o
endereço da conexão e não confia em cabeçalhos encaminhados antes da configuração
explícita de proxies conhecidos.

A troca de senha possui limite próprio por usuário autenticado, configurável por
`RateLimiting__PasswordChangePermitLimit` e
`RateLimiting__PasswordChangeWindowSeconds`. Os valores iniciais permitem cinco
tentativas por minuto, sem fila.

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
- definir responsáveis e canal confiável para recuperação de acesso na Issue #220;
- decidir se haverá integração com identidade institucional;
- concluir a integração frontend da Issue #191 e homologar os tempos na Issue #162;
- definir retenção e limpeza operacional das sessões revogadas e expiradas;
- registrar auditoria de troca de perfil quando esse fluxo existir;
- proteger os endpoints de negócio com as políticas validadas.

## Validação automatizada

Os testes cobrem login válido e seu contrato mínimo de identidade, credenciais inválidas, usuário inativo, bloqueio após cinco tentativas, atualização progressiva de hash sem regravação desnecessária, atomicidade da atualização, auditoria mínima sem dados sensíveis, rollback quando a auditoria falha, limite de requisições correlacionado, acesso sem token, acesso permitido, acesso negado por perfil, criação e pesquisa administrativas, revogação imediata por desativação, reativação, auto-desativação, concorrência entre administradores, ator de sistema e upgrade/downgrade seguro da auditoria. O ciclo de sessão acrescenta testes de cookie, ausência de segredo no corpo e no banco, CSRF, rotação, replay, concorrência, inatividade, duração absoluta, logout, perfil inativo, revogação por desativação e rollback. A troca autenticada acrescenta testes de senha atual incorreta, reutilização, validação, revogação, invalidação imediata do JWT, concorrência, rate limiting, auditoria mínima e rollback. Os testes de persistência usam PostgreSQL real e dados, senhas e chaves fictícios exclusivos do ambiente temporário.
