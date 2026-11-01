# Configuração do Google OIDC em homologação

**Rastreabilidade:** Issues #448 e #529; frontend #461 e #493.

## Estado e pré-requisitos

A API implementa OIDC no servidor e aceita o segredo Google por arquivo. O
override `infrastructure/docker/docker-compose.google.yml` habilita o provedor
somente quando aplicado explicitamente. A stack padrão mantém a configuração
vigente. Existir um cliente Google não comprova que o login está funcionando:
console, configuração implantada e ensaio real são três etapas distintas.

A release `0.4.0` não incorpora automaticamente a leitura por arquivo nem as
correções de callback posteriores. Antes de habilitar Google, promova uma release
compatível com os PRs #518, #521, #524 e o frontend revisado do #474/#494,
preservando os gates do
[guia de implantação](versioned-container-deployment.md#primeira-promoção-após-os-ajustes-de-https).
O teste integrado pode usar um candidato isolado antes do merge final, desde
que sua origem e versão sejam registradas. Não modifique a tag publicada.

## Verificar o projeto antes de criar credenciais

No Google Cloud, use a conta autorizada e confira os projetos acessíveis tanto
em “Nenhuma organização” como na organização institucional. Se houver cliente
destinado ao mesmo ambiente, revise seu tipo e seus redirects antes de criar
outro. Um projeto de homologação deve ter responsáveis identificados e plano de
transferência para a equipe institucional. Não habilite billing ou APIs
adicionais para este cadastro sem necessidade comprovada.

Em Google Auth Platform, configure:

| Item                   | Configuração                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------ |
| Tipo de cliente        | Aplicativo da Web, confidencial, usado pelo backend                                  |
| Identificação visual   | Nome descritivo e claramente de homologação enquanto o nome oficial não for definido |
| Público                | Externo, pois a decisão admite contas pessoais e institucionais                      |
| Escopos                | Somente `openid`, `email` e `profile`                                                |
| Redirect URI exata     | `https://dat.ernandescosta.me/signin-google`                                         |
| Origens JavaScript     | Não necessárias para o fluxo OIDC mediado pelo backend                               |
| Responsáveis e contato | Contas autorizadas e monitoradas; não publicar endereços pessoais no repositório     |

Confira no console as restrições vigentes do modo de teste e eventual exigência
de usuários de teste/verificação. Não suponha que a audiência externa libera
qualquer conta: a aplicação só aceita a conta exata pré-autorizada no banco.
Não configure `hd` como requisito de domínio. Não solicite Gmail, Drive ou
`offline_access`; o sistema mantém sua própria sessão renovável.

O Google pode exigir consentimento, dados de contato, domínios autorizados,
verificação de propriedade ou aprovação administrativa. Conclua cada requisito
com informação real do responsável. Não invente aprovação institucional,
política de privacidade pública ou contato para passar pelo formulário.

## Guardar o cliente sem expor o segredo

O Client ID identifica o aplicativo; o Client Secret é uma credencial do
servidor. O Google pode disponibilizar o segredo somente no momento da criação.
Guarde o arquivo pelo canal protegido do ambiente e não copie o valor em chat,
issue, PR, screenshot, log, frontend ou variável `VITE_*`. Evite abrir a tela de
segredo durante compartilhamento de tela. Não use a senha da conta Google como
segredo do aplicativo.

Na VM, o arquivo do segredo deve ficar fora do repositório, com caminho
absoluto, proprietário e permissões restritas. Registre somente os caminhos no
ambiente protegido:

```dotenv
GOOGLE_CLIENT_ID=ID_DO_CLIENTE_WEB.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET_FILE=/opt/controle-acesso-veiculos/secrets/google-client-secret.txt
```

Não combine `Authentication__Google__ClientSecret` com
`Authentication__Google__ClientSecretFile`: o backend rejeita essa ambiguidade.

## Aplicar o override na release compatível

Os caminhos abaixo correspondem à organização atual da homologação. Execute no
host pelo canal administrativo autorizado:

```bash
cd /opt/controle-acesso-veiculos
sudo docker compose --project-name cav-hml \
  --env-file /etc/controle-acesso-veiculos/.env.production \
  -f docker-compose.production.yml -f docker-compose.google.yml config --quiet
```

Depois de conferir release, contas Administrador, pré-autorização dos operadores
e rollback, aplique os mesmos argumentos com `up --detach --wait backend`.
Preserve os dois arquivos `-f` em todos os comandos de manutenção: um comando
somente com a base pode recriar o backend sem a configuração Google. Registre o
conjunto de arquivos usado no inventário restrito da implantação.

Sem o override, o exemplo base não habilita Google. Se a configuração da imagem
tiver sido alterada independentemente, confira o estado efetivo em
`GET /api/auth/providers`; não confie somente na presença de um arquivo.

## Ensaio para liberar os PRs do frontend

1. Confirme HTTPS confiável e readiness saudável pela borda.
2. Confirme o login de um Administrador local e seu acesso à gestão de contas.
3. Cadastre uma conta Google de teste autorizada para um perfil operacional.
4. Confira `GET /api/auth/providers` com `googleEnabled=true`.
5. Inicie pelo botão Google do frontend candidato; o backend usa
   `/api/auth/google/start` e o retorno do provedor usa `/signin-google`.
6. O titular conclui a autenticação e eventual consentimento no Google. O
   frontend recebe somente `status=success|denied` e restaura a sessão pelo
   refresh já existente; nenhum token ou código vai para storage ou URL do SPA.
7. Confira o perfil, navegação, operação autorizada, refresh e logout.
8. Confirme a negação de conta Google não pré-autorizada e de conta local
   inativa. Use contas de teste consentidas; não altere perfis de usuários reais.
9. Confira se login negado apresenta mensagem genérica e se o Administrador
   continua acessível quando Google está indisponível.
10. Registre candidato, data e resultados sanitizados nas Issues #448/#461,
    distinguindo o ensaio técnico da homologação institucional.

Uma chamada manual ao callback sem o estado emitido pelo middleware não é um
teste válido de login. Replay, correlação e nonce exigem também os testes de
segurança pertinentes; não marque esses critérios apenas por observar sucesso.

## Rollback

Se o candidato falhar, restaure conjuntamente a configuração e a release
conhecidas conforme o guia de implantação. Remover o override preserva o método
registrado das contas; não transforma contas Google em locais nem cria senha
para operadores. Preserve Administradores locais e use o
[runbook de contingência](google-identity-contingency.md). Para troca de segredo,
use novo arquivo protegido e recriação do backend, com janela de rollback;
comprometimento exige revogação pelo responsável no Google.

## Referências oficiais

- [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)
- [Google: clientes OAuth](https://support.google.com/cloud/answer/15549257)
- [OAuth para aplicações web no servidor](https://developers.google.com/identity/protocols/oauth2/web-server)
- [ADR 0005](../architecture/decisions/0005-google-oidc-and-emergency-access.md)
