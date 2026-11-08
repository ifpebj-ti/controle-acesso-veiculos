# Configuração do Google OIDC em homologação

**Rastreabilidade:** Issues #448, #529, #573 e #576; frontend #461 e #493.

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

### Lista de teste Google e autorização local são controles distintos

Para requisições restritas aos escopos básicos `openid`, `email` e `profile`,
o Google documenta uma exceção às restrições usuais de Testing: a identidade
não precisa estar na lista de usuários de teste. A expiração de consentimento
em sete dias dessa modalidade também não deve ser presumida para esse recorte.
Isso não elimina restrições de disponibilidade do serviço ou políticas do
Google Workspace da conta. Confira os escopos efetivamente enviados e eventual
erro do provedor; não acrescente permissões ou publique o aplicativo apenas
para contornar uma suposição sobre a lista.

A pré-autorização **no banco da aplicação** continua obrigatória em todos os
casos: endereço Google exato, conta ativa e perfil operacional permitido.
Consentimento Google, inclusão em uma lista no console ou domínio institucional
não concedem acesso ao sistema. Não publique os endereços dos titulares nas
evidências. Consulte a [política oficial de audiência](https://support.google.com/cloud/answer/15549945?hl=en).

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
absoluto, proprietário e permissões restritas, incluindo a leitura pelo UID
efetivo do backend não root. `root:root 0600` sozinho não atende esse requisito
em uma montagem local por arquivo. Siga a
[verificação de acesso do serviço](versioned-container-deployment.md) antes de
recriar o contêiner; não use `chmod` de leitura pública para corrigir a falha.
Registre somente os caminhos no ambiente protegido:

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

Depois de conferir release, acesso Administrador, identidades consentidas para
pré-autorização e rollback, aplique os mesmos argumentos com
`up --detach --wait backend`. Para novas contas, siga a ordem abaixo: a política
de criação acompanha o estado habilitado do provedor.
Preserve os dois arquivos `-f` em todos os comandos de manutenção: um comando
somente com a base pode recriar o backend sem a configuração Google. Registre o
conjunto de arquivos usado no inventário restrito da implantação.

Sem o override, o exemplo base não habilita Google. Se a configuração da imagem
tiver sido alterada independentemente, confira o estado efetivo em
`GET /api/auth/providers`; não confie somente na presença de um arquivo.

## Ensaio para liberar os PRs do frontend

### Preparar o candidato antes do teste

- Registre os SHAs exatos de backend e frontend e a base integrada. Checks
  verdes não comprovam que essas versões estão no site.
- O workflow atual `ci-containers.yml` constrói e verifica PRs, mas só publica
  as imagens de release no evento de push de uma tag `v*` validada. Merge ou
  sucesso do build de um PR não publica nem implanta automaticamente o candidato.
- Para ensaio anterior ao merge, use um candidato isolado, revisado e identificado,
  com procedimento explícito de construção/transferência de imagens e rollback.
  Não rotule código ainda candidato como release aprovada nem reutilize `0.4.0`.
- Confirme acesso administrativo, configuração por arquivo, migrations
  compatíveis, proteção das chaves persistentes e backup antes de promover.
  Preserve o conjunto completo de configuração da versão anterior.
- Cliente OAuth cadastrado, segredo disponível em canal protegido e callback
  correto são pré-requisitos; o resultado só é confirmado pelo ensaio real.

1. Confirme HTTPS confiável e readiness saudável pela borda.
2. Confirme o login de um Administrador local e seu acesso à gestão de contas.
3. Confira `GET /api/auth/providers` com `googleEnabled=true` no backend candidato
   compatível. Não inicie a criação de novas contas operacionais enquanto ele
   informar `false`.
4. Pelo Administrador e pela API, cadastre a identidade consentida exata para um
   perfil operacional de teste com o menor privilégio necessário. Confira
   `authenticationMethod=Google` e ausência de credencial temporária na resposta.
   Se a conta já existir, confira estado e método; não a converta nem duplique
   silenciosamente. Uma conta Google ainda não vinculada será vinculada somente
   no primeiro login autorizado, após a validação do provedor.
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

### Cancelamento do consentimento

A entrega técnica #636 trata `access_denied` somente no evento `OnAccessDenied` do
middleware OIDC, depois da validação de estado protegido e correlação. Um
cancelamento válido limpa a identidade externa temporária e retorna ao caminho
local configurado com `status=denied`, sem expor a descrição do provedor nem
criar sessão da aplicação. A interface já consome esse contrato; uma nova
tentativa deve depender de ação explícita do usuário.

Callbacks sem estado, com estado alterado, sem cookie de correlação ou
reapresentados continuam rejeitados com 401 genérico. Outros erros do provedor
também permanecem em falha fechada. Não converter todas as falhas remotas em
redirecionamento para esconder erro de protocolo, e não aceitar `returnUrl` ou
destino recebido na query do callback.

Os testes usam um provedor fictício com o middleware real e mantêm as
regressões de assinatura, issuer, audience, expiração e nonce. Eles não
substituem Cancelar e tentar novamente no Google real com o titular, depois da
implantação de um backend candidato identificado. Fazer merge não atualiza a VM.
A experiência com o titular permanece na #593: mensagem, foco e nova tentativa
precisam de observação própria. Se o Google não oferecer Cancelar, registrar a
limitação, sem remover autorizações da conta ou fabricar evidência. A integração
técnica do backend não encerra essa homologação.

### Contas locais legadas e janela do ensaio

`Program.cs` configura `AuthenticationMethodPolicy` com `Google.Enabled`.
`CreateUserAccountService` usa essa política para criar operadores Google e
`LoginService` restringe novos logins por senha ao Administrador quando ela está
ativa. Criar um operador com o provedor desabilitado gera uma conta Local;
habilitar Google depois não converte automaticamente essa conta.

As contas fictícias locais do professor pertencem ao ensaio legado da 0.4.0.
Combine a janela do candidato antes de trocar o site: os novos logins locais
dos perfis operacionais serão negados com Google habilitado. Não exclua essas
contas, altere suas senhas ou force conversão para tentar manter os dois ensaios
no mesmo fluxo. O Administrador local deve continuar acessível. Planeje o
acesso Google consentido do professor ou uma alternância de ambiente controlada,
com restauração conjunta da imagem e configuração anteriores quando necessária.
Isso não é prova de revogação imediata de toda sessão previamente emitida.

A [evidência de preparação de 02/11/2026](../validation/google-candidate-preflight-2026-11-02.md)
registra o estágio de configuração e o snapshot restaurado, sem declarar
implantação do candidato ou conclusão do backup institucional.

### Escolha da conta na estação compartilhada

A Issue #600 acrescenta `prompt=select_account` ao desafio iniciado pelo
backend. Isso solicita ao Google a seleção da identidade, incluindo uma nova
tentativa depois de escolher a conta incorreta. Não utiliza `prompt=consent`,
não exige uma nova senha Google e não altera os escopos mínimos. O Google
continua responsável por suas telas e políticas; não se simula o seletor no
frontend nem se força uma tela de cancelamento.

Não são enviados `login_hint` ou `hd`. A escolha de uma identidade não concede
acesso: conta ativa, pré-autorização exata e perfil continuam verificados pela
API. O login administrativo local permanece separado. Cada início cria estado,
nonce e PKCE novos, sem reiniciar automaticamente o fluxo ao voltar ou falhar.

Os testes de protocolo comprovam a emissão do parâmetro; a apresentação no
Google real e a troca de perfis devem ser observadas no candidato identificado
da #581. O candidato precisa incluir explicitamente a #600; merge não atualiza
a hospedagem. Referência: [parâmetros OIDC do Google](https://developers.google.com/identity/openid-connect/openid-connect#authenticationuriparameters).

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
- [Google: audiência e exceções do modo Testing](https://support.google.com/cloud/answer/15549945?hl=en)
- [OAuth para aplicações web no servidor](https://developers.google.com/identity/protocols/oauth2/web-server)
- [ADR 0005](../architecture/decisions/0005-google-oidc-and-emergency-access.md)
