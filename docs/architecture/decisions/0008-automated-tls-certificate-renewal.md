# ADR 0008: renovação automatizada do certificado TLS

- **Estado:** proposta para validação operacional
- **Data:** 26/10/2026
- **Issue:** [#509](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/509)

## Contexto

A homologação usa um certificado público Let's Encrypt emitido por DNS-01 e
importado no OCI Certificates. O certificado atual resolve a advertência do
navegador, mas sua emissão foi manual e ele expira em 24/01/2027. Uma renovação
manual não é um controle operacional suficiente.

A API de produção da Namecheap exige habilitação da conta e IPv4 de origem em lista
de permissão. A credencial administra a conta DNS e não oferece, no fluxo avaliado,
evidência de restrição apenas ao registro ACME. Portanto, ela não será colocada na
VM nem usada como solução definitiva sem uma revisão adicional de privilégios.

## Decisão proposta

Delegar somente a zona filha de homologação para o OCI Public DNS e manter o
domínio raiz no provedor atual. A VM privada usará o cliente ACME `lego`, fixado por
versão e checksum, com DNS-01 e autenticação por **instance principal**. Não haverá
chave de usuário OCI ou token DNS persistido na VM.

A autorização IAM deverá permitir somente o gerenciamento de registros da zona
filha pelo dynamic group da instância. A promoção criará uma nova versão no OCI
Certificates, validará o material antes da ativação e manterá a versão anterior
disponível durante uma janela curta de rollback.

## Motivos

- concentra DNS, identidade da workload, certificado e Load Balancer na mesma
  tenancy auditável;
- troca credencial estática por instance principal e política de menor privilégio;
- limita a delegação ao hostname de homologação, sem mover o domínio pessoal inteiro;
- o `lego` suporta OCI DNS e autenticação por instance principal;
- permite ensaio em ACME staging antes de consumir limites de produção.

## Controles obrigatórios

1. revisar o `terraform plan` da zona, dynamic group e policy por uma segunda pessoa;
2. restringir IAM à zona filha e não conceder administração ampla de DNS;
3. executar primeiro contra o diretório staging da autoridade certificadora;
4. armazenar conta ACME e chave privada em diretório root-only fora do repositório;
5. nunca imprimir PEM, token, OCID, e-mail ou arquivo de configuração em logs;
6. validar chave/certificado correspondentes, SAN, cadeia e prazo antes da importação;
7. promover somente quando health check e teste HTTPS externo estiverem aprovados;
8. alertar com 30, 14 e 7 dias e manter renovação manual documentada;
9. preservar a versão anterior até o fim da janela de rollback;
10. não executar a automação antes de confirmar custo e limites do OCI DNS.

## Alternativas consideradas

### API direta da Namecheap

Mantida apenas como contingência avaliada. Exige API habilitada e IPv4 permitido,
e a credencial não demonstrou escopo suficientemente estreito para permanecer na
workload.

### Renovação manual

Permanece como contingência, com prazo operacional em 10/01/2027. Não é a solução
definitiva porque depende de memória humana e amplia o risco de expiração.

### Mover todo o domínio para outro provedor

Rejeitado para o piloto por ampliar o impacto sobre registros não relacionados ao
projeto. Pode ser reavaliado quando existir domínio institucional.

## Consequências e pendências

A delegação altera a autoridade DNS do subdomínio e deve ser executada em janela
controlada. O custo ainda precisa ser confirmado no estimador/contrato da tenancy.
Esta ADR não autoriza `terraform apply`, mudança de nameserver ou instalação na VM.
Essas ações exigem plano revisado, backup da configuração atual e rollback.

## Referências

- [Namecheap API](https://www.namecheap.com/support/api/intro/)
- [OCI Public DNS](https://docs.oracle.com/en-us/iaas/Content/DNS/Concepts/gettingstarted.htm)
- [OCI Certificates](https://docs.oracle.com/en-us/iaas/Content/certificates/managing-certificates.htm)
- [lego: Oracle Cloud DNS](https://go-acme.github.io/lego/dns/oraclecloud/)
