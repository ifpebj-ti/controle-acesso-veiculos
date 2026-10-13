# Borda HTTPS da homologação

## Estado e limite

Estes arquivos preparam o terminador HTTPS definido na ADR 0004 e na Issue #437.
Eles **não comprovam** que exista VM, domínio, certificado ou ambiente OCI
implantado. Não execute esta configuração antes de concluir os gates da Issue
#382: autorização, custo, DNS, rede, responsáveis e revisão do plano.

O Caddy executa como serviço do host e encaminha somente para o frontend do
Compose em `127.0.0.1:8080`. A API e o PostgreSQL continuam acessíveis apenas nas
redes internas do Compose. A interface administrativa do Caddy fica limitada a
`127.0.0.1:2019` para permitir validação e reload local sem exposição pública.

## Decisões de segurança

- o único ingresso público da aplicação é TCP 443;
- o desafio ACME por HTTP é desabilitado; a emissão usa TLS-ALPN na porta 443;
- a porta 80 não é requisito desta configuração e não deve ser aberta apenas para
  redirecionar tráfego inseguro;
- o hostname vem de arquivo local do serviço e nenhum identificador da tenancy é
  versionado;
- o upstream é fixo em loopback, impedindo encaminhamento acidental para serviço
  de rede arbitrário;
- HSTS só deve chegar aos usuários depois que DNS, certificado e HTTPS forem
  validados; não teste a aplicação real por HTTP;
- os logs são estruturados e enviados ao `journald`; eles ainda exigem acesso,
  retenção e exportação definidos para a homologação;
- a CSP permanece responsabilidade do frontend. A borda acrescenta apenas
  cabeçalhos compatíveis e não relaxa políticas existentes.

## Pré-requisitos para ativação

1. domínio ou subdomínio aprovado apontando para o endpoint da VM;
2. NSG e firewall do host aceitando somente TCP 443 para usuários;
3. frontend saudável e publicado somente em `127.0.0.1:8080` pelo
   `docker-compose.production.yml`;
4. saída HTTPS e resolução DNS permitidas para emissão e renovação do certificado;
5. pacote oficial estável do Caddy instalado como serviço `systemd`;
6. operador individual autorizado e caminho administrativo temporário auditável;
7. plano de rollback, observabilidade e resposta a falha de renovação definido.

Consulte a documentação oficial do Caddy para instalar o pacote da distribuição.
Não baixe binários por comandos improvisados no `cloud-init` e não grave
credenciais em user data.

## Preparação no host

Os exemplos abaixo pressupõem que a revisão do Terraform e a autorização da
implantação já ocorreram.

```bash
sudo install -o root -g caddy -m 0640 \
  infrastructure/oci/homologation/edge/Caddyfile.example \
  /etc/caddy/Caddyfile

sudo install -o root -g caddy -m 0640 \
  infrastructure/oci/homologation/edge/caddy.env.example \
  /etc/caddy/controle-acesso-veiculos.env
```

Substitua somente `homologation.example.invalid` no arquivo local pelo hostname
aprovado. Esse arquivo não deve receber token DNS, senha ou chave. Se futuramente
um desafio DNS exigir credencial, ela deverá vir de um secret manager e de um
módulo revisado separadamente.

Conecte o arquivo de ambiente ao serviço por um drop-in local:

```ini
# /etc/systemd/system/caddy.service.d/controle-acesso-veiculos.conf
[Service]
EnvironmentFile=/etc/caddy/controle-acesso-veiculos.env
```

## Validação antes de iniciar

Valide a sintaxe e inspecione a configuração adaptada sem registrar segredos:

```bash
sudo -u caddy caddy fmt --diff /etc/caddy/Caddyfile
sudo -u caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
```

Depois de confirmar DNS e porta 443, ative ou recarregue sem interromper uma
configuração válida:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now caddy
sudo systemctl reload caddy
sudo systemctl status caddy --no-pager
```

O reload do Caddy valida a nova configuração antes de substituir a anterior. Se a
validação falhar, não reinicie o serviço repetidamente: preserve a configuração
anterior, corrija o arquivo e valide novamente.

## Verificação operacional

Execute pelo domínio HTTPS aprovado, nunca pelo IP ou pela porta interna:

```bash
curl --fail --show-error --silent \
  --output /dev/null \
  --write-out '%{http_code}\n' \
  "https://${APP_HOSTNAME}/"
```

Confirme também:

- certificado válido, hostname correto e cadeia confiável;
- HTTP/2 ou HTTP/3 negociado sem tornar UDP 443 obrigatório para o MVP;
- cabeçalho HSTS presente somente no endpoint HTTPS;
- login e renovação de sessão funcionando com cookie `Secure`;
- API e PostgreSQL inacessíveis diretamente pela internet;
- `127.0.0.1:2019` e `127.0.0.1:8080` não vinculados à interface pública;
- emissão e renovação registradas sem expor material criptográfico.

Logs recentes ficam no journal do serviço:

```bash
sudo journalctl -u caddy --since '30 minutes ago' --no-pager
```

Não copie logs brutos para Issues ou Pull Requests. Registre apenas evidência
sanitizada, pois URLs, agentes de usuário e endereços podem constituir metadados.

## Renovação, atualização e rollback

O Caddy mantém certificados gerenciados no diretório persistente do usuário do
serviço. Inclua esse estado no inventário operacional, mas não no Git. Monitore
erros de renovação e validade do certificado externamente.

Antes de atualizar o pacote ou o Caddyfile:

1. registre a versão instalada e preserve uma cópia local protegida da
   configuração funcional;
2. execute `caddy validate` com a proposta;
3. aplique `systemctl reload caddy`;
4. repita o smoke test HTTPS e o teste de sessão;
5. se falhar, restaure o arquivo anterior e recarregue o serviço.

Desativar o proxy não remove a VM, volumes, IP, DNS ou outros recursos cobrados.
O encerramento do piloto deve seguir o runbook e a revisão financeira da Issue
#382.

## Referências

- [ADR 0004 — topologia da homologação](../../../../docs/architecture/decisions/0004-oci-homologation-topology.md)
- [Preflight da OCI](../../../../docs/operations/oci-homologation-preflight.md)
- [Implantação com imagens versionadas](../../../../docs/operations/versioned-container-deployment.md)
- [Caddy — Automatic HTTPS](https://caddyserver.com/docs/automatic-https)
- [Caddy — execução com systemd](https://caddyserver.com/docs/running)
