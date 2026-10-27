# Implantação com imagens versionadas

## Objetivo e limite

O arquivo `infrastructure/docker/docker-compose.production.yml` executa a mesma
versão publicada do frontend e do backend no GitHub Container Registry (GHCR).
Ele não contém `build`: o host de destino baixa os artefatos que a CI já
construiu, analisou e associou a uma release.

Essa configuração torna a implantação repetível, mas não significa que exista
um ambiente institucional de produção aprovado. Antes de uso real ainda são
obrigatórios servidor administrado, DNS, terminação HTTPS, gestão externa de
segredos, firewall, backup protegido, monitoramento e autorização institucional.

## Estado observado na homologação

Em 25 de outubro de 2026, a homologação técnica executava frontend, API e
PostgreSQL saudáveis com a release `v0.4.0`, atrás de Load Balancer e OCI WAF. A
promoção é deliberadamente manual: alterações na `main` não atualizam a VM até que
uma nova release revisada seja publicada e `DEPLOYMENT_VERSION` seja alterada.

O endpoint `dat.ernandescosta.me` usa certificado público confiável e termina o
TLS no Load Balancer. A renovação automática do certificado, o backup protegido,
a observabilidade operada e a homologação institucional continuam pendentes;
portanto, o ambiente permanece classificado como homologação, não produção.

## Release disponível

A release técnica atual é `v0.4.0`. As duas imagens foram verificadas como
manifestos para `linux/amd64` e `linux/arm64`:

```bash
docker pull ghcr.io/ifpebj-ti/controle-acesso-veiculos-backend:0.4.0
docker pull ghcr.io/ifpebj-ti/controle-acesso-veiculos-frontend:0.4.0
```

Os manifests verificados são, respectivamente,
`sha256:c14ec8fe6b6c6719755924ec687b69dabbc486bdeb25d3d1cf3d87558a808c48`
e `sha256:c39240dcff6ad9d9db157118099dc7b18ece0dcfabf59420f1838408c50ee620`.

O GHCR armazena as imagens da aplicação, enquanto proveniência e SBOM assinados
permanecem no serviço GitHub Artifact Attestations. Para fixar conteúdo por
digest, use `imagem@sha256:<digest>`; para implantar a release revisada, use
`imagem:0.4.0`. Nunca mova uma versão publicada para outro digest: mudanças
posteriores exigem uma nova release conforme Semantic Versioning.

Os packages principais são canais de release. Pushes comuns na `main` executam
as validações, mas não publicam uma nova versão. Em uma tag Git revisada, a CI
publica as variantes e o manifesto por commit, registra as atestações no GitHub
e então aplica a tag `MAJOR.MINOR.PATCH` ao mesmo digest. Não são criadas tags
`latest` ou `main`, nem versões OCI auxiliares para as atestações.

## Pré-requisitos

- Docker Engine com o plugin Compose;
- acesso de leitura aos packages do GHCR, caso não sejam públicos;
- versão semântica já publicada para as duas imagens;
- banco com backup verificado e migrations compatíveis com a versão escolhida;
- proxy reverso com HTTPS no mesmo host ou em uma rede de confiança.

O Compose não publica portas do backend ou do PostgreSQL. O frontend fica, por
padrão, disponível somente em `127.0.0.1:8080`, para que um proxy HTTPS no host
seja o único ponto de entrada. Cookies de sessão são `Secure` no ambiente
`Production`; portanto, abrir essa porta diretamente por HTTP serve apenas para
diagnóstico de disponibilidade e não para autenticação.

## Preparação segura

Na pasta `infrastructure/docker`, crie um arquivo local a partir do exemplo:

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

No PowerShell:

```powershell
Set-Location infrastructure/docker
Copy-Item .env.production.example .env.production
```

Defina no arquivo local:

- `DEPLOYMENT_VERSION`: a mesma release para frontend e backend, como `0.4.0`;
- `ALLOWED_HOSTS`: o domínio público esperado pela API e `localhost`, usado
  somente pela verificação de saúde interna;
- caminhos absolutos para três arquivos protegidos: senha do PostgreSQL,
  connection string do backend e chave JWT;
- certificado PFX de Data Protection fornecido pelo secret manager, sua senha e o
  nome de um volume externo compartilhado pelas réplicas;
- endereço e porta de loopback que o proxy HTTPS acessará.

O `.env.production` é ignorado pelo Git e contém somente caminhos e configuração
não secreta. O Compose monta os arquivos como secrets somente leitura, evitando
que os valores apareçam nas variáveis retornadas por `docker inspect`. Essa
proteção local não substitui um secret manager: restrinja os arquivos ao
operador e nunca envie seu conteúdo por issue, Pull Request, chat ou log.

Em 27 de outubro de 2026, uma stack descartável construída a partir do PR da
Issue #516 comprovou que backend e PostgreSQL iniciam lendo esses arquivos, que
os valores não aparecem em `docker inspect` nem nos logs e que a recriação do
backend aceita rotação e rollback da chave JWT. O ensaio usou somente valores
aleatórios efêmeros, removeu contêineres, redes, volumes e arquivos ao terminar e
não acessou a homologação.

Prepare os arquivos fora do repositório. A senha usada na connection string deve
ser exatamente a mesma do arquivo do PostgreSQL; prefira base64url ou hexadecimal
aleatório para não introduzir delimitadores na connection string:

```text
# postgresql-password.txt
VALOR_ALEATORIO

# database-connection.txt (uma única linha)
Host=postgresql;Port=5432;Database=controle_acesso;Username=controle_acesso_app;Password=VALOR_ALEATORIO;GSS Encryption Mode=Disable

# jwt-signing-key.txt (ao menos 32 bytes aleatórios)
CHAVE_ALEATORIA
```

No Linux, aplique `chmod 600` e mantenha o diretório inacessível para outros
usuários. O backend falha no startup quando um caminho é relativo, o arquivo não
existe, está vazio, excede 16 KiB ou quando valor direto e arquivo são fornecidos
ao mesmo tempo. O conteúdo nunca integra a mensagem de erro.

Crie o volume externo antes da primeira implantação. Em um host único ele pode
ser um volume Docker; em topologia distribuída deve apontar para armazenamento
durável compartilhado, como um mount privado do OCI File Storage:

```bash
docker volume create controle-acesso-veiculos-data-protection
```

O caminho informado em `DATA_PROTECTION_CERTIFICATE_FILE` deve existir no host,
ser legível somente pelo operador autorizado e conter um PFX com chave privada.
O Compose o monta como secret somente leitura. Não coloque PFX, senha ou XML do
key ring junto das imagens, do repositório ou dos artefatos de CI.

Se os packages forem privados, autentique o Docker com uma credencial pessoal
de escopo mínimo `read:packages`. Não armazene o token em arquivo do projeto:

```bash
gh auth token | docker login ghcr.io --username SEU_USUARIO --password-stdin
```

## Rotação dos segredos de execução

Faça uma rotação por vez, em janela autorizada. Preserve temporariamente a versão
anterior em armazenamento protegido para rollback e nunca imprima o conteúdo:

1. gere o novo valor por fonte criptograficamente segura;
2. grave-o em um arquivo novo com proprietário e modo restritos;
3. quando for a senha do banco, atualize primeiro a credencial no PostgreSQL e a
   connection string correspondente de forma coordenada;
4. altere somente o caminho local aplicável no `.env.production`;
5. valide `docker compose config --quiet` e recrie apenas o serviço consumidor;
6. confirme readiness, login, renovação de sessão e ausência do valor em
   `docker inspect` e logs;
7. após a janela de observação, descarte a versão anterior pelo procedimento
   aprovado.

Se a validação falhar, restaure o caminho anterior, recrie somente o serviço
afetado e repita os testes. A rotação da chave JWT encerra a validade dos access
tokens existentes. A troca do certificado de Data Protection ou do key ring tem
impacto adicional em antifalsificação e deve seguir a ADR 0003, não este fluxo
simples.

## Implantação

Os exemplos seguintes devem ser executados em `infrastructure/docker`:

```bash
docker compose \
  --env-file .env.production \
  --file docker-compose.production.yml \
  config --quiet

docker compose \
  --env-file .env.production \
  --file docker-compose.production.yml \
  pull
```

O `pull` deve resolver duas imagens com a mesma versão:

```text
ghcr.io/ifpebj-ti/controle-acesso-veiculos-backend:<versão>
ghcr.io/ifpebj-ti/controle-acesso-veiculos-frontend:<versão>
```

Registre os digests resolvidos no histórico da implantação. Para uma implantação
institucional, verifique também as atestações conforme
[`docs/development/ci-cd.md`](../development/ci-cd.md).

O Compose não aplica migrations automaticamente. Isso evita que toda réplica da
API altere o schema ao iniciar. Antes da promoção, um operador autorizado deve:

1. criar e verificar um backup;
2. revisar as migrations da mesma tag Git da imagem;
3. aplicá-las uma única vez por um caminho administrativo protegido;
4. confirmar a compatibilidade de rollback.

Depois dessa etapa controlada, inicie os serviços:

```bash
docker compose \
  --env-file .env.production \
  --file docker-compose.production.yml \
  up --detach --remove-orphans --wait

docker compose \
  --env-file .env.production \
  --file docker-compose.production.yml \
  ps
```

O resultado esperado é PostgreSQL, backend e frontend saudáveis. A validação
funcional deve usar o domínio HTTPS, não a porta HTTP de loopback.

Depois de substituir o backend, obtenha um token antifalsificação, substitua a
instância e valide o mesmo par em uma operação protegida. HTTP 400 nesse ensaio
indica `ApplicationName`, volume ou certificado divergente entre réplicas.

Inclua o key ring no plano de backup, mas mantenha o PFX e sua senha no cofre de
segredos. Restaure os dois componentes por canais separados e teste em ambiente
isolado. Em caso de comprometimento da chave privada, substitua certificado e key
ring de forma controlada e encerre as sessões de maneira conservadora.

## Atualização e rollback

Para atualizar, altere somente `DEPLOYMENT_VERSION` para uma release revisada,
faça backup, aplique as migrations controladas e execute novamente `pull` e
`up --detach --wait`. Não use `main` ou `latest` como versão de implantação.

Para rollback da aplicação, restaure a versão anterior no arquivo local e
execute novamente os mesmos comandos. Se a release nova alterou o schema, não
faça downgrade no escuro: siga a estratégia revisada para aquela migration ou
restaure banco e aplicação a partir do mesmo ponto de recuperação.

Para parar a aplicação sem apagar os dados:

```bash
docker compose \
  --env-file .env.production \
  --file docker-compose.production.yml \
  down
```

Não acrescente `--volumes` em ambiente com dados que precisem ser preservados.
Consulte também o
[`procedimento de continuidade`](data-retention-and-continuity.md).
