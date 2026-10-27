# Renovação do certificado TLS da homologação

## Estado atual

Em 26/10/2026, o endpoint da homologação respondeu por HTTPS com hostname, cadeia
pública e TLS validados. O certificado atual expira em **24/01/2027**. Até a
automação ser ensaiada e aprovada, a renovação manual deve ocorrer até
**10/01/2027**.

Este documento descreve o procedimento-alvo. Ele não contém OCIDs, IPs, e-mail de
conta ACME, chaves, tokens ou PEMs.

## Arquitetura-alvo

```text
Namecheap (zona raiz)
  -> delega somente a zona filha de homologação
OCI Public DNS
  <- lego cria/remove TXT ACME por instance principal
Let's Encrypt
  -> emite certificado após DNS-01
OCI Certificates
  -> recebe nova versão importada
Load Balancer + WAF
  -> apresenta a versão ativa aos navegadores
```

## Gates antes da implantação

- [ ] custo e limites de OCI DNS confirmados na conta acadêmica;
- [ ] zona filha e delegação revisadas sem afetar registros do domínio raiz;
- [ ] policy IAM limitada a registros da zona filha;
- [ ] binário `lego` fixado por versão e checksum verificado;
- [ ] diretório ACME root-only em volume persistente e incluído no backup protegido;
- [ ] staging ACME aprovado antes de produção;
- [ ] procedimento de importação/promoção não registra PEM ou identificadores;
- [ ] canal e destinatários institucionais dos alertas confirmados;
- [ ] rollback para a versão anterior ensaiado;
- [ ] documentação restrita registra os identificadores necessários.

## Fluxo de renovação

1. O timer executa diariamente uma verificação sem emitir certificado quando a
   validade restante estiver acima da janela aprovada.
2. Dentro da janela de 30 dias, o `lego` cria o TXT DNS-01 na zona delegada usando
   `OCI_AUTH_TYPE=instance_principal`.
3. A autoridade certificadora valida o TXT e emite a nova cadeia.
4. O processo confirma permissão `0600`, chave correspondente ao certificado, SAN
   esperado, cadeia e validade superior à versão ativa.
5. Uma nova versão é importada no OCI Certificates. O listener não é alterado se
   qualquer validação falhar.
6. A versão é promovida e um teste externo verifica DNS, cadeia, hostname,
   TLS 1.2/1.3, HTTP 200, cookie seguro e health check.
7. A versão anterior permanece disponível durante a janela de rollback.
8. O job registra somente data, serial abreviado/permitido, validade, resultado e
   correlation ID; nunca registra chave, PEM, token ou OCID.

## Falha e rollback

- falha de DNS/ACME: manter certificado ativo e alertar; não repetir em loop rápido;
- material inválido: interromper antes da importação e preservar evidência sanitizada;
- importação falhou: manter a versão ativa e abrir incidente operacional;
- teste externo falhou: retornar o listener à versão anterior e repetir os health checks;
- menos de sete dias restantes: escalar para renovação manual de contingência;
- suspeita de chave exposta: revogar o certificado, substituir a conta ACME e investigar.

## Evidência permitida

Pode ser publicada: data, resultado, dias restantes, versão da ferramenta, status
do health check e identificação sanitizada da execução. Devem permanecer restritos:
PEMs, conta ACME, OCIDs, endereços, token, chave, configuração OCI e saída bruta.

## Validação periódica

- diariamente: validade e sucesso da última execução;
- semanalmente: associação do certificado ao listener e saúde do endpoint;
- mensalmente: versão/checksum do cliente ACME, custo e alertas;
- a cada renovação: teste externo e rollback;
- a cada troca de equipe: revogar acessos humanos e revisar o dynamic group/policy.

## Referências

- [ADR 0008](../architecture/decisions/0008-automated-tls-certificate-renewal.md)
- [Issue #509](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/509)
- [OCI: importar certificado](https://docs.oracle.com/en-us/iaas/Content/certificates/importing-certificate.htm)
- [OCI Load Balancer: certificados](https://docs.oracle.com/en-us/iaas/Content/Balance/Tasks/managingcertificates.htm)
- [lego: Oracle Cloud DNS](https://go-acme.github.io/lego/dns/oraclecloud/)
