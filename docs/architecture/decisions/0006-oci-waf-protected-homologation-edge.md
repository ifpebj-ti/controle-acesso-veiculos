# ADR 0006 — Borda de homologação protegida pelo OCI WAF

- **Status:** Proposta; depende de plano, custo, certificado e homologação
- **Data:** 20 de outubro de 2026
- **Issues:** #382 e #468
- **Substitui:** ADR 0004

## Contexto

A ADR 0004 propôs uma VM pública endurecida para reduzir custo e complexidade no
primeiro piloto. Antes da implantação, o professor responsável por segurança
solicitou um Web Application Firewall. O OCI WAF regional usa um OCI Flexible Load
Balancer como ponto de aplicação. Manter a VM pública em paralelo permitiria
contornar o WAF e não atenderia ao objetivo de segurança.

O piloto continua com uma única VM e orçamento acadêmico limitado. A primeira
instância mensal do OCI WAF e as primeiras 10 milhões de requisições constam como
gratuitas na tabela pública consultada em 20/10/2026. A oferta pública do Flexible
Load Balancer informa gratuidade para a primeira instância e os primeiros 10 Mbps.
Essas condições precisam ser confirmadas no Cost Estimator da própria tenancy antes
do `Apply`; preços e elegibilidade podem mudar.

## Decisão

Adotar a topologia:

`Internet -> Flexible Load Balancer HTTPS + OCI WAF -> Caddy privado -> frontend -> API -> PostgreSQL`

- somente o Load Balancer recebe `443` da internet;
- a VM fica em subnet privada, sem IP público;
- o Load Balancer encaminha HTTP apenas para `8088` da VM, autorizado por NSG;
- Caddy aceita `8088` somente da subnet do Load Balancer e encaminha para o
  frontend publicado em `127.0.0.1:8080`;
- API, PostgreSQL, Docker e interfaces administrativas não possuem porta pública;
- administração ocorre por sessão temporária do OCI Bastion;
- a VM usa NAT Gateway apenas para saída, atualizações e pull de imagens;
- TLS termina no Load Balancer com certificado previamente validado no OCI
  Certificates service; a chave privada não é exportada ao Terraform ou à VM;
- o WAF usa as versões mais recentes disponibilizadas pela OCI das capacidades
  colaborativas `9410000` (XSS) e `9420000` (SQL injection);
- as rotas `/api/auth/` recebem limite inicial por origem, além dos limites já
  impostos pela API;
- nenhum cabeçalho de origem é confiado se a requisição não vier do Load Balancer;
- logs, métricas e falsos positivos devem ser revisados antes do piloto e após cada
  mudança de regra.

## Implantação gradual

1. validar Terraform localmente sem credenciais;
2. gerar `Plan` no OCI Resource Manager;
3. conferir que nenhum recurso externo ao compartimento será alterado;
4. confirmar a estimativa da tenancy e a faixa de gratuidade aplicável;
5. validar certificado, domínio, NSGs, WAF e versões das capacidades;
6. executar `Apply` somente após revisão humana;
7. instalar a borda privada e a stack versionada;
8. habilitar logs do WAF e executar smoke tests e ZAP baseline autorizados;
9. ensaiar Google OIDC, acesso administrativo, relatórios e fluxos operacionais;
10. revisar falsos positivos e rollback antes de convidar testadores.

Uma regra problemática deve ser desabilitada ou ajustada no WAF; a VM não pode ser
exposta diretamente como atalho. Se o Load Balancer ou WAF não puder ser mantido
dentro do orçamento, a implantação deve voltar para revisão arquitetural, não para
uma alteração manual silenciosa.

## Consequências

### Positivas

- a origem deixa de ser diretamente acessível pela internet;
- XSS, SQL injection e abuso de autenticação recebem uma camada gerenciada antes da
  aplicação;
- certificado e endpoint público ficam desacoplados da VM;
- regras, limites e rede tornam-se reproduzíveis pelo Resource Manager;
- o WAF complementa as validações do backend e os testes ZAP sem substituí-los.

### Custos e riscos

- Load Balancer, NAT, logs e tráfego podem consumir crédito mesmo quando WAF e
  compute estejam em faixas gratuitas;
- regras gerenciadas podem bloquear requisições legítimas, inclusive callback
  Google e exportação de relatórios;
- uma única VM permanece ponto único de falha;
- a comunicação Load Balancer–Caddy é HTTP dentro da VCN e depende do isolamento
  por subnet, NSG e firewall do host;
- uma configuração incorreta de proxy confiável pode permitir falsificação de IP
  ou protocolo;
- a proteção só é real depois de `Plan`, `Apply`, logs e testes na tenancy.

## Alternativas rejeitadas

- **WAF com VM ainda pública:** permite contornar a proteção.
- **Network Load Balancer:** não fornece o ponto HTTP compatível com o WAF regional.
- **chave TLS versionada ou armazenada no state:** amplia exposição de segredo.
- **WAF como substituto de validação no backend:** não protege regras de negócio,
  autorização ou consistência dos dados.
- **bloqueios amplos sem observação:** aumenta falsos positivos e risco operacional.

## Referências

- [OCI WAF com Flexible Load Balancer](https://docs.oracle.com/en/learn/oci-waf-flex-lbaas/)
- [Capacidades de proteção](https://docs.oracle.com/en-us/iaas/Content/WAF/Protections/protections_management.htm)
- [Terraform `oci_waf_web_app_firewall`](https://registry.terraform.io/providers/oracle/oci/latest/docs/resources/waf_web_app_firewall)
- [Preços públicos da Oracle Brasil](https://www.oracle.com/br/cloud/price-list/)
