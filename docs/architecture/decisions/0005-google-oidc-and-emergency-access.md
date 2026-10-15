# ADR 0005 — Google OIDC com autorização local e acesso de emergência

- **Estado:** aceita para implementação; credenciais e homologação pendentes
- **Data:** 14 de outubro de 2026
- **Rastreabilidade:** Issues #448, #449 e #441

## Contexto

Professores e cliente validaram o uso da conta Google dos funcionários para o
login cotidiano. O Google comprova a identidade, mas não conhece os perfis
operacionais do campus nem pode decidir quem é Porteiro, Vigilante, Transporte
ou Administrador.

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
   associar seu e-mail institucional verificado ao `sub` do Google;
6. depois do vínculo, o `sub` é a identidade externa canônica; mudança de e-mail
   não transfere a conta;
7. a aplicação emite sua própria sessão curta e renovável, já existente, com o
   perfil obtido exclusivamente do banco local.

Uma conta Google válida, inclusive do domínio institucional, não recebe acesso
automaticamente. O Administrador mestre provisiona a conta e atribui o perfil
antes do primeiro login. A restrição de domínio é defesa adicional e deve ser
verificada pelo backend; o parâmetro visual `hd` não é autorização.

Serão solicitados somente os escopos mínimos de OIDC (`openid`, `email` e
`profile`). Access token, ID token, authorization code, client secret e refresh
token do Google não serão enviados ao frontend, persistidos na auditoria ou
gravados em `localStorage`/`sessionStorage`.

## Modelo de conta

Cada conta terá método explícito de autenticação:

- `Google`: exige provedor e `sub`, não possui senha local utilizável;
- `LocalEmergency`: possui hash local e é restrita a Administrador mestre;
- estado transitório `GooglePendingLink`: conta pré-provisionada ainda sem
  `sub`, incapaz de autenticar localmente.

O par provedor/`sub` será único. Alterar método, desvincular identidade ou
promover conta de emergência exige operação administrativa sensível, motivo,
auditoria e revogação das sessões existentes.

Devem existir ao menos duas contas de emergência sob custódias institucionais
distintas. Elas não serão compartilhadas, exibidas como opção principal nem
usadas no cotidiano. O procedimento de uso, guarda, teste e rotação será
documentado; indisponibilidade do Google não concede acesso a outras contas.

## Administrador mestre

Administrador mestre é uma capacidade local de governança, não um atributo do
Google. Ele pode provisionar contas, atribuir ou revogar perfis e administrar o
método de autenticação. A implementação deve:

- impedir remoção, rebaixamento ou desativação do último mestre ativo;
- impedir autoelevação e exigir confirmação reforçada para privilégios;
- revogar sessões quando perfil ou método mudar;
- auditar estado anterior, novo estado, ator, motivo e data sem copiar tokens;
- separar gestão de identidade da operação cotidiana da portaria.

## Confirmação reforçada

Operações sensíveis, como exportar relatório, exigem prova recente adequada ao
método da conta:

- conta `Google`: nova autenticação OIDC, solicitando seleção/consentimento
  conforme suportado e conferindo `auth_time`/instante da prova;
- conta `LocalEmergency`: senha atual validada em endpoint dedicado, com limite
  de tentativas e resposta genérica.

A prova gera autorização curta, vinculada a usuário, sessão, finalidade e uso
único. Não será reutilizado `POST /auth/login` e o frontend não escolherá qual
mecanismo o servidor aceita.

## Configuração e implantação

Client ID, client secret e chaves permanecem fora do Git. Desenvolvimento,
homologação e produção usam clientes/redirect URIs separados. Fora de
desenvolvimento, callback e aplicação exigem HTTPS e domínio aprovado.

Variáveis previstas:

```text
Authentication__Google__Enabled
Authentication__Google__ClientId
Authentication__Google__ClientSecret
Authentication__Google__AllowedHostedDomain
Authentication__Google__CallbackPath
```

Habilitar o provedor sem configuração completa deve impedir o startup. O deploy
deve primeiro aplicar a migration, provisionar segredos, testar contas de
emergência, habilitar OIDC em homologação e somente então desativar login local
das contas cotidianas. Não haverá conversão em massa irreversível.

## Alternativas rejeitadas

- **Confiar apenas no e-mail ou domínio:** permite concessão indevida e não
  oferece identificador externo estável.
- **Receber ID token diretamente do frontend:** amplia a superfície e mistura o
  cliente público com a validação e troca de código.
- **Usar perfil/grupo do Google como autorização local:** acopla regra do campus
  a configuração externa não governada pelo sistema.
- **Manter senha para todos como fallback:** preserva duas superfícies de ataque
  e torna impossível saber qual método deve governar a conta.
- **Uma única conta mestre:** cria ponto único de falha operacional.

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
