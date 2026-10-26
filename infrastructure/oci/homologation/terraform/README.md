# Base Terraform da homologação na OCI

## Estado

Esta configuração representa a base das Issues #382 e #468 executada pelo **OCI
Resource Manager**. Em 25 de outubro de 2026, ela sustentava a homologação técnica
com VM privada, Load Balancer, WAF e Bastion; a aplicação `v0.4.0` foi instalada
por um procedimento operacional separado. Senhas, chave JWT, banco com dados e
chaves privadas não entram no Terraform.

O ambiente ainda usa certificado temporário e não possui DNS público aprovado.
Backup externo, observabilidade operada e piloto institucional também permanecem
pendentes. Novos `apply` devem ocorrer somente depois da revisão do plano, da
estimativa de custo e da confirmação explícita do responsável pela conta.

## Recursos representados

- compartimento exclusivo com tags de custo e operação;
- orçamento mensal padrão de 25 unidades na moeda da conta, alinhado à referência
  anual da Issue #382, com alertas previstos em 50%, 75% e 90% e alertas reais em
  75%, 90% e 100%;
- VCN com subnet pública exclusiva para o Load Balancer e subnet privada para a VM;
- Internet Gateway para a borda e NAT Gateway para saída controlada da VM privada;
- NSG permitindo somente HTTPS 443 da internet e SSH 22 originado dentro da VCN;
- OCI Flexible Load Balancer fixado no piso e teto de 10 Mbps, com TLS encerrado por
  certificado do OCI Certificates service;
- OCI WAF regional associado ao Load Balancer, com proteção colaborativa gerenciada
  contra XSS e SQL injection, inspeção dos primeiros 8 KiB do corpo e bloqueio de
  requisições que ultrapassem esse limite, além do limite inicial das rotas de
  autenticação;
- uma VM flexível, por padrão Arm com 1 OCPU, 6 GiB e boot volume de 50 GiB;
- OCI Bastion com origem administrativa restrita e sessões máximas de 30 minutos;
- Ubuntu 24.04 com IMDS legado desabilitado, criptografia de trânsito do volume,
  Docker, atualizações automáticas, firewall do host e diretórios protegidos.

O `cloud-init` não contém segredos, domínio, token, chave SSH ou credencial. A VM
não recebe IP público e aceita a porta interna `8088` somente da subnet do Load
Balancer. A aplicação e as credenciais são instaladas em etapa posterior e
controlada; o DNS e o certificado público confiável permanecem pendentes.

## Gate financeiro

A tabela pública da Oracle consultada em 20/10/2026 informa gratuidade para a
primeira instância mensal do WAF e para as primeiras 10 milhões de requisições por
mês. A oferta pública do Load Balancer informa cobrança somente acima da primeira
instância e acima de 10 Mbps. Esta configuração fixa um único Load Balancer em 10
Mbps e um único WAF para permanecer nessa faixa, mas preço público não substitui a
estimativa vinculante da tenancy. O Cost Estimator e o plano do Resource Manager
devem ser conferidos antes do `Apply`; orçamento apenas alerta e não interrompe
consumo.

## Por que usar Resource Manager

O serviço mantém o estado do Terraform na OCI e executa o provider com identidade
gerenciada. Assim, não é necessário criar uma chave de API permanente no notebook
do aluno. O pacote deve ser enviado como ZIP e revisado com `Plan` antes de
qualquer `Apply`.

## Validação local sem credenciais

Na raiz deste diretório:

```bash
docker run --rm \
  -v "$PWD:/workspace" \
  -w /workspace \
  hashicorp/terraform:1.13.5 fmt -check -recursive

docker run --rm \
  -v "$PWD:/workspace" \
  -w /workspace \
  hashicorp/terraform:1.13.5 init -backend=false -input=false -lockfile=readonly

docker run --rm \
  -v "$PWD:/workspace" \
  -w /workspace \
  hashicorp/terraform:1.13.5 validate
```

`init` baixa o provider para `.terraform`, que é ignorado pelo Git. A validação
local comprova sintaxe e contrato do provider, mas não verifica capacidade, custo
ou permissão na tenancy.

## Preparação do pacote

Não inclua `.terraform`, plano, state ou arquivo de valores no ZIP:

```powershell
Compress-Archive `
  -Path *.tf,*.tftpl,schema.yaml `
  -DestinationPath "$env:TEMP\controle-acesso-veiculos-oci-homologation.zip" `
  -Force
```

No Console OCI, crie uma stack no Resource Manager usando o ZIP. Informe na
interface:

- compartment pai autorizado;
- região São Paulo;
- origem pública do operador como `/32` para o Bastion;
- CIDR privado da aplicação sem sobreposição;
- OCID do certificado gerenciado e validado para o hostname aprovado;
- Load Balancer com mínimo e máximo de 10 Mbps;
- limite inicial de autenticação compatível com o ensaio de homologação;
- limite mensal na moeda da conta;
- destinatários institucionais dos alertas.

O e-mail, o CIDR administrativo, o OCID do certificado e os outputs sensíveis não
devem ser publicados no GitHub. O Resource Manager fornece `tenancy_ocid`,
`compartment_ocid` e `region` ao stack.

## Gate do primeiro plano

O plano esperado cria uma VM privada, um boot volume, duas subnets, NAT Gateway,
Flexible Load Balancer, WAF, Bastion, orçamento e alertas. Antes do `Apply`,
confirme:

1. nenhum recurso de laboratório aparece como alterado ou destruído;
2. a forma selecionada possui capacidade e o valor estimado permanece no teto;
3. somente TCP 443 do NSG do Load Balancer possui origem `0.0.0.0/0`;
4. TCP 22 aceita apenas tráfego interno da VCN;
5. a VM não possui IP público e `8088` aceita somente o Load Balancer;
6. não existe porta pública para PostgreSQL, API, Docker ou administração;
7. certificado, hostname, versões TLS e health check estão corretos;
8. as capacidades `9410000` (XSS) e `9420000` (SQLi) existem na região e usam a
   versão mais recente retornada pela OCI;
9. o limite de autenticação não bloqueará o ensaio legítimo;
10. o CIDR do Bastion é restrito e os destinatários estão corretos;
11. o plano foi revisado por outra pessoa autorizada;
12. a autorização final para criação e possível consumo foi registrada.

## Depois da criação

1. aguarde o `cloud-init` encerrar e registre somente o resultado sanitizado;
2. confirme Cloud Agent, monitoring, firewall, Docker e atualizações automáticas;
3. confirme que a VM não possui IP público e crie uma sessão temporária do Bastion;
4. instale e valide a borda privada descrita em `../edge`;
5. configure DNS com o IP do Load Balancer exibido como output sensível;
6. prepare segredos e execute o Compose versionado sem build no host;
7. habilite backup protegido antes de preservar qualquer dado;
8. habilite e revise logs do WAF antes de promover regras observadas para bloqueio;
9. execute smoke tests, ZAP autorizado, teste dos quatro perfis e rollback.

## Observabilidade opcional

A fundação aprovada na ADR 0007 permanece desabilitada por padrão. Para incluí-la
no plano, defina `enable_observability = true` somente no OCI Resource Manager ou em
um `terraform.tfvars` local ignorado. O plano cria:

- tópico de Notifications e assinatura de e-mail pendente de confirmação;
- alarmes de CPU e memória, habilitados apenas quando houver destinatário;
- grupo e log customizado com retenção inicial de 30 dias;
- coleta dos arquivos JSON de stdout do Docker pelo Oracle Cloud Agent;
- domínio gratuito do OCI APM, sem versionar chave ou endpoint privado.

O endereço de alerta é dado operacional e não deve entrar em commit. Depois do
`apply`, o titular precisa confirmar a assinatura recebida por e-mail. A chave
privada de ingestão do APM deve ser obtida por operador autorizado e armazenada no
mecanismo de segredos da implantação; ela não é output do Terraform.

Antes de habilitar a exportação OTLP na API, valide o plano, a franquia aplicável e
o procedimento em [`Observabilidade da API`](../../../../docs/operations/observability.md).

## Limites conhecidos

- uma única VM é ponto único de falha aceito para o piloto;
- budget alerta, mas não interrompe consumo;
- o endpoint público pertence ao Load Balancer; uma substituição deve ser conferida
  antes de manter o DNS;
- a imagem mais recente é escolhida somente no primeiro plano e depois ignorada
  para evitar recriação silenciosa;
- disponibilidade do shape Arm só é comprovada pelo plano/aplicação na região;
- limites e regras WAF são valores iniciais e exigem observação de falsos positivos;
  a API regional aceita no máximo 8 KiB de inspeção do corpo, portanto conteúdos
  maiores são bloqueados em vez de seguirem parcialmente inspecionados;
- alta disponibilidade, banco gerenciado e dados reais permanecem fora de escopo.

## Referências

- [ADR 0004](../../../../docs/architecture/decisions/0004-oci-homologation-topology.md)
- [Preflight](../../../../docs/operations/oci-homologation-preflight.md)
- [Borda HTTPS](../edge/README.md)
- [OCI Resource Manager](https://docs.oracle.com/en-us/iaas/Content/ResourceManager/home.htm)
- [OCI Terraform Provider](https://docs.oracle.com/en-us/iaas/tools/terraform-provider-oci/latest/)
- [OCI WAF com Flexible Load Balancer](https://docs.oracle.com/en/learn/oci-waf-flex-lbaas/)
- [Capacidades de proteção do OCI WAF](https://docs.oracle.com/en-us/iaas/Content/WAF/Protections/protections_management.htm)
- [Lista de preços da Oracle Brasil](https://www.oracle.com/br/cloud/price-list/)
