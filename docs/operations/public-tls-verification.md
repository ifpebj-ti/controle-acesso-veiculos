# Verificação pública de HTTPS e readiness

**Escopo:** verificação somente leitura, Issue #554; renovação completa na #509.<br>
**Origem do código:** extraído do candidato #512, sem incorporar sua proposta
de DNS/IAM ou declarar a renovação automática implementada.

## Comando

Com Python 3.11 ou superior, a partir da raiz do repositório:

```powershell
python -B infrastructure/oci/homologation/scripts/check_public_tls.py `
  --origin https://dat.ernandescosta.me
```

O script consulta somente a origem HTTPS informada e `/api/health/ready`, sem
autenticar, modificar dados ou seguir redirecionamentos. A origem deve ser
autorizada; não use a ferramenta para enumerar serviços de terceiros.

A conexão valida cadeia e hostname, exige TLS 1.2 ou superior e confere readiness
na mesma conexão. A resposta é limitada a 16 KiB. Não há cookie persistido,
registro do corpo, token ou certificado no resultado. `SSLKEYLOGFILE` é rejeitado
antes do handshake para não gerar um arquivo com chaves de sessão TLS.

## Resultado e códigos de saída

| Código | Estado     | Interpretação                                                                           |
| ------ | ---------- | --------------------------------------------------------------------------------------- |
| 0      | `ok`       | Mais de 30 dias restantes, certificado confiável e readiness válido                     |
| 1      | `warning`  | Até 30 dias restantes                                                                   |
| 2      | `urgent`   | Até 14 dias restantes                                                                   |
| 3      | `critical` | Até 7 dias restantes; a verificação real de certificado rejeita validade expirada       |
| 4      | `failed`   | Origem, certificado, conexão ou contrato de readiness inválidos; motivo fixo sanitizado |

O JSON informa horário UTC da consulta, validade do certificado, dias completos
restantes, protocolo TLS e estado HTTP, ou um motivo fixo de falha. Erro de uso
da CLI, como ausência de `--origin`, é tratado pelo parser de argumentos.

Verificação pontual em **01/11/2026, 17:02 UTC**: readiness 200, TLS 1.3,
certificado até **24/01/2027, 20:55:40 UTC**, com **84 dias completos** restantes.
É uma fotografia; não comprova disponibilidade contínua, renovação ou alerta.

## Testes e integração contínua

```powershell
python -B -m unittest discover `
  --start-directory infrastructure/oci/homologation/scripts/tests `
  --pattern test_public_tls.py --verbose
```

Oito testes offline exercitam limites de validade, origem, proteção SSL, falhas
sanitizadas, redirects e resposta inválida/grande. Eles substituem as conexões
por doubles e não acessam a hospedagem. O workflow de infraestrutura executa
esses testes; não instala nem agenda o probe na VM.

## O que continua faltando

O probe **não renova certificado, não agenda verificações e não envia avisos**.
Responsáveis, canal de alerta, agendamento, DNS-01 automatizável, credencial de
menor privilégio, emissão de teste, promoção no Load Balancer e rollback continuam
na #509. Não interpretar código 0 como cumprimento desses critérios.

Antes de automatizar, decidir como receber e tratar códigos diferentes de zero.
Não publicar material privado de certificado, token DNS ou configuração do provedor.
Homologação e produção institucional continuam estados distintos.
