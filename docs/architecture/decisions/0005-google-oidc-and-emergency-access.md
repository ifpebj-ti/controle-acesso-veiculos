# ADR 0005 — Google OIDC com autorização local e acesso de emergência

- **Estado:** aceita para implementação; credenciais e homologação pendentes
- **Data:** 14 de outubro de 2026; revisada em 20 de outubro de 2026
- **Rastreabilidade:** Issues #448, #449 e #441

## Contexto

Professores e cliente validaram o uso de uma conta Google previamente
autorizada para o login cotidiano. A conta pode ser institucional ou pessoal,
pois nem todo funcionário possui conta institucional. O Google comprova a
identidade, mas não conhece os perfis operacionais do campus nem pode decidir
quem é Porteiro, Vigilante, Transporte ou Administrador.

O sistema já possui sessão renovável própria, revogação e autorização local. A
integração deve preservar esses controles, evitar tokens do Google no navegador
e manter um acesso de emergência quando o provedor estiver indisponível.

## Decisão

Adotar OpenID Connect Authorization Code Flow, iniciado e concluído no backend:

1. o navegador solicita o início do login à API;
2. a API cria propriedades protegidas e redireciona para o Google;
3. o callback HTTPS valida assinatura, emissor, audiência, expiração, `state`,
   `nonce`, `email_verified` e o `sub` estável;
4. a API localiza uma conta ativa previamente autorizada;
5. no primeiro vínculo, e somente nele, uma conta previamente cadastrada pode
   associar o e-mail Google verificado que o Administrador autorizou ao
   `sub` do Google;
6. depois do vínculo, o `sub` é a identidade externa canônica; mudança de e-mail
   não transfere a conta;
7. a aplicação emite sua própria sessão curta e renovável, já existente, com o
   perfil obtido exclusivamente do banco local.

O callback do provedor não entregará um JWT da aplicação por query string. A
API concluirá o fluxo em uma autenticação externa temporária, criará o cookie
HttpOnly da sessão renovável e redirecionará apenas para um caminho local fixo
do frontend. Nesse caminho, o frontend obterá o token CSRF e usará o endpoint
de renovação existente para receber o access token curto somente em memória.
Parâmetros de retorno fornecidos pelo navegador não decidirão o destino do
redirecionamento.

Uma conta Google válida não recebe acesso automaticamente, seja ela pessoal ou
institucional. O Administrador cadastra previamente o endereço exato e
atribui o perfil antes do primeiro login. Não haverá restrição por domínio. O
parâmetro `hd` do Google não será usado como autorização nem como requisito de
acesso.

Serão solicitados somente os escopos mínimos de OIDC (`openid`, `email` e
`profile`). Access token, ID token, authorization code, client secret e refresh
token do Google não serão enviados ao frontend, persistidos na auditoria ou
gravados em `localStorage`/`sessionStorage`.

## Modelo de conta

Cada conta terá método explícito de autenticação:

- `Google`: usado por Porteiro, Vigilante e Setor de Transporte, não possui
  senha local utilizável;
- `Local`: usado somente pelo perfil Administrador e possui hash local;
- uma conta `Google` ainda sem `sub` representa o estado transitório de vínculo
  pendente e não pode autenticar localmente.

O par provedor/`sub` será único. Alterar método, desvincular identidade ou
promover conta de emergência exige operação administrativa sensível, motivo,
auditoria e revogação das sessões existentes.

Devem existir ao menos duas contas Administrador locais e individuais, sob
custódias institucionais distintas, para evitar ponto único de falha. Elas não
serão compartilhadas nem exibidas como opção principal. O procedimento de uso,
guarda, teste e rotação será documentado; indisponibilidade do Google não
concede acesso local aos perfis operacionais.

## Administrador único

Não existe um segundo tipo de Administrador nem uma capacidade de “mestre”. O
perfil Administrador já existente é a autoridade local de governança e o único
que pode provisionar contas, atribuir ou revogar perfis e administrar o método
de autenticação. A implementação deve:

- impedir remoção, rebaixamento ou desativação do último Administrador ativo;
- impedir autoelevação e exigir confirmação reforçada para mudanças de perfil;
- revogar sessões quando perfil ou método mudar;
- auditar estado anterior, novo estado, ator, motivo e data sem copiar tokens;
- separar gestão de identidade da operação cotidiana da portaria.

## Confirmação reforçada

Operações exclusivas do Administrador, como exportar relatório, exigem prova
recente da senha local em endpoint dedicado, com limite de tentativas e resposta
genérica. Se uma operação sensível for futuramente concedida a um perfil Google,
ela deverá usar nova autenticação OIDC e validar o instante da prova, sem
reintroduzir senha local para esse perfil.

A prova gera autorização curta, vinculada a usuário, sessão, finalidade e uso
único. Não será reutilizado `POST /auth/login` e o frontend não escolherá qual
mecanismo o servidor aceita.

## Configuração e implantação

Client ID, client secret e chaves permanecem fora do Git. Desenvolvimento,
homologação e produção usam clientes/redirect URIs separados. Fora de
desenvolvimento, callback e aplicação exigem HTTPS e um domínio da aplicação
previamente configurado no cliente OAuth.

Variáveis previstas:

```text
Authentication__Google__Enabled
Authentication__Google__ClientId
Authentication__Google__ClientSecret
Authentication__Google__ClientSecretFile
Authentication__Google__CallbackPath
Authentication__Google__FrontendCompletionPath
```

Na implantação conteinerizada compatível, o segredo é fornecido por
`Authentication__Google__ClientSecretFile`, montado somente leitura e fora do
repositório. O valor direto e o caminho não podem coexistir. O override
`docker-compose.google.yml` ativa essa configuração explicitamente; o
[roteiro operacional](../../operations/google-oidc-setup.md) descreve o cliente
web e os testes. A listagem do valor direto acima documenta a compatibilidade
da API, não uma recomendação de armazenamento em variáveis do contêiner.

Habilitar o provedor sem configuração completa deve impedir o startup. O deploy
deve primeiro aplicar a migration, provisionar segredos, testar as contas
Administrador locais, pré-autorizar os operadores, habilitar OIDC em homologação
e somente então encerrar o modo local legado. Não haverá conversão em massa
irreversível.

## Alternativas rejeitadas

- **Autorizar automaticamente por e-mail ou domínio:** permite concessão
  indevida e não oferece identificador externo estável. O e-mail verificado é
  usado apenas no primeiro vínculo com uma conta já provisionada; depois disso,
  o `sub` é a identidade canônica.
- **Receber ID token diretamente do frontend:** amplia a superfície e mistura o
  cliente público com a validação e troca de código.
- **Usar perfil/grupo do Google como autorização local:** acopla regra do campus
  a configuração externa não governada pelo sistema.
- **Manter senha para todos como fallback:** preserva duas superfícies de ataque
  e torna impossível saber qual método deve governar a conta.
- **Uma única conta Administrador:** cria ponto único de falha operacional;
  por isso o perfil é único, mas deve possuir ao menos dois titulares individuais.

## Consequências

- funcionários deixam de administrar mais uma senha cotidiana;
- desativar ou mudar um perfil continua sendo decisão local e tem efeito nas
  sessões da aplicação;
- disponibilidade do login passa a depender parcialmente do Google, mitigada
  por contas de emergência controladas;
- implementação exige migration, endpoints OIDC, governança mestre, atualização
  do frontend, threat model e ensaio real em HTTPS;
- a exportação segura da #441 pode usar uma abstração única de step-up sem exigir
  senha inexistente de uma conta Google.

## Referências

- [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)
- [ASP.NET Core Google authentication](https://learn.microsoft.com/aspnet/core/security/authentication/social/google-logins?view=aspnetcore-10.0)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
