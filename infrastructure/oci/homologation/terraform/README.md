# Base Terraform da homologação na OCI

## Estado

Esta configuração prepara a base da Issue #382 para execução pelo **OCI Resource
Manager**. Ela ainda não contém a aplicação, senhas, certificado, chave JWT, banco
com dados ou DNS. O primeiro `apply` deve ser executado apenas depois da revisão do
plano e da confirmação explícita do responsável pela conta.

## Recursos planejados

- compartimento exclusivo com tags de custo e operação;
- orçamento mensal padrão de 25 unidades na moeda da conta, alinhado à referência
  anual da Issue #382, com alertas previstos em 50%, 75% e 90% e alertas reais em
  75%, 90% e 100%;
- VCN, subnet pública, Internet Gateway, rota e lista de segurança sem ingresso;
- NSG permitindo somente HTTPS 443 da internet e SSH 22 originado dentro da VCN;
- uma VM flexível, por padrão Arm com 1 OCPU, 6 GiB e boot volume de 50 GiB;
- OCI Bastion com origem administrativa restrita e sessões máximas de 30 minutos;
- Ubuntu 24.04 com IMDS legado desabilitado, criptografia de trânsito do volume,
  Docker, atualizações automáticas, firewall do host e diretórios protegidos.

O `cloud-init` não contém segredos, domínio, token, chave SSH ou credencial. A
aplicação e a borda HTTPS permanecem etapas posteriores e controladas.

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
  hashicorp/terraform:1.5.7 fmt -check -recursive

docker run --rm \
  -v "$PWD:/workspace" \
  -w /workspace \
  hashicorp/terraform:1.5.7 init -backend=false

docker run --rm \
  -v "$PWD:/workspace" \
  -w /workspace \
  hashicorp/terraform:1.5.7 validate
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
- limite mensal na moeda da conta;
- destinatários institucionais dos alertas.

O e-mail e o CIDR administrativo não devem ser publicados no GitHub. O
Resource Manager fornece `tenancy_ocid`, `compartment_ocid` e `region` ao stack.

## Gate do primeiro plano

O plano esperado cria uma VM, um boot volume, rede isolada, Bastion, orçamento e
alertas. Antes do `Apply`, confirme:

1. nenhum recurso de laboratório aparece como alterado ou destruído;
2. a forma selecionada possui capacidade e o valor estimado permanece no teto;
3. somente TCP 443 possui origem `0.0.0.0/0`;
4. TCP 22 aceita apenas tráfego interno da VCN;
5. não existe porta pública para PostgreSQL, API, Docker ou administração;
6. o CIDR do Bastion é restrito e os destinatários estão corretos;
7. o plano foi revisado por outra pessoa autorizada;
8. a autorização final para criação e possível consumo foi registrada.

## Depois da criação

1. aguarde o `cloud-init` encerrar e registre somente o resultado sanitizado;
2. confirme Cloud Agent, monitoring, firewall, Docker e atualizações automáticas;
3. crie uma sessão temporária do Bastion, sem publicar endereço ou chave;
4. configure DNS com o IP exibido como output sensível;
5. instale e valide a borda descrita em `../edge`;
6. prepare segredos e execute o Compose versionado sem build no host;
7. habilite backup protegido antes de preservar qualquer dado;
8. execute smoke tests, teste dos quatro perfis e rollback.

## Limites conhecidos

- uma única VM é ponto único de falha aceito para o piloto;
- budget alerta, mas não interrompe consumo;
- o IP público pode mudar se a VNIC for substituída; DNS deve ser atualizado;
- a imagem mais recente é escolhida somente no primeiro plano e depois ignorada
  para evitar recriação silenciosa;
- disponibilidade do shape Arm só é comprovada pelo plano/aplicação na região;
- alta disponibilidade, banco gerenciado e dados reais permanecem fora de escopo.

## Referências

- [ADR 0004](../../../../docs/architecture/decisions/0004-oci-homologation-topology.md)
- [Preflight](../../../../docs/operations/oci-homologation-preflight.md)
- [Borda HTTPS](../edge/README.md)
- [OCI Resource Manager](https://docs.oracle.com/en-us/iaas/Content/ResourceManager/home.htm)
- [OCI Terraform Provider](https://docs.oracle.com/en-us/iaas/tools/terraform-provider-oci/latest/)
