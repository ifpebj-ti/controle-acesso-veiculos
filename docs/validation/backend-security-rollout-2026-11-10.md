# Promoção de segurança do backend — 10/11/2026

Rastreabilidade: Issue #657; incrementos #653/#654/#648/#651/#655, incorporados
na main `2689402e547af889034c043b4bcd0e2f3ffd5407`.

## Estado instalado

Somente o backend foi substituído na homologação
`https://dat.ernandescosta.me`. O frontend continua na fonte `7dd02a6`.
Os containers frontend/PostgreSQL e as configurações, variáveis, redes,
montagens de segredos, proxy e key ring foram preservados por comparação.
Nenhuma migration foi aplicada; não houve limpeza ou alteração de contas.
Não foi publicada uma nova release estável nem movida a tag `0.4.0`.

| Identidade | Valor |
| --- | --- |
| Fonte backend | `2689402e547af889034c043b4bcd0e2f3ffd5407` |
| Imagem local da promoção | `cav/hml-backend:security-2689402` |
| ID conferido após carga na VM | `sha256:92687203f8d3617ebc0f20c4ad7edd21906af10eb840fd8ff66690f0786f1c8e` |
| SHA-256 do arquivo transferido | `cd23289e78915bab9bcd71da5af5bf0b3c1fbfa639e546522951c64e273847a0` |
| Arquivo comprimido | 146.127.426 bytes |
| Arquitetura / usuário | AMD64 / UID 1654 |
| Runtime | .NET / ASP.NET Core 10.0.14 |
| APT / libapt | `2.8.4ubuntu0.1` |

O contexto foi gerado por `git archive` da fonte incorporada, excluindo arquivos
locais não versionados. A imagem foi construída, exportada, analisada e
transferida por SSH com verificação estrita de host. Arquivo, revisão, imagem e
hardening foram conferidos antes/depois da ativação. O Compose efetivo só mudou
em imagem/política de pull do backend, por overlay operacional identificado.
Não se presume que uma tag local seja uma release publicada no GHCR.

## Pré-requisitos e recuperação

- Inventário anterior confirmou backend `5fa21bb` e frontend `7dd02a6` saudáveis.
- Backup de 97.817 bytes criado com hash e restaurado em banco temporário
  isolado, conferindo 20 migrations e 14 tabelas. O banco temporário foi removido;
  o banco da aplicação não foi restaurado ou limpo.
- Trivy 0.76.1: zero HIGH/CRITICAL no artefato AMD64, com SBOM SPDX externo
  contendo 134 pacotes. O resultado vale para a imagem/base da execução.
- Rollback preparado para a imagem anterior com a configuração preservada.
  Não foi necessário executá-lo e não se declara exercício de RTO/RPO.
- A sessão Bastion temporária foi encerrada e sua remoção confirmada. Somente o
  CIDR temporário acrescentado pela tarefa foi retirado da allowlist.

O backup está no mesmo host e **não** satisfaz backup externo, PITR ou recuperação
institucional. O procedimento não comprova a matriz ARM64 local nem elimina
todos os riscos da aplicação.

## Verificação HTTPS após a promoção

Em 10/11/2026, às 16h42 de Brasília (19h42 UTC), **162 de 162 verificações**
passaram com contas fictícias de Vigilante, Setor de Transporte e Administrador:

- readiness e descoberta do provedor; Google permaneceu habilitado;
- leituras e negações por perfil, relatórios e dois PDFs administrativos;
- CSRF, cookies seguros, rotação e logout;
- `sid` estável na rotação; access token recusado após logout e reuso;
- família independente preservada após revogação de outra sessão;
- filtros literais em auditoria/relatórios e respostas no-store;
- datas extremas recusadas com 400 e validações/paginação existentes.

Não foram criados/excluídos registros operacionais. Auditorias de consultas,
autenticação e exportação são efeitos esperados do ensaio. Resultados detalhados
e configurações permanecem em diretório privado; esta síntese não inclui
identidades, senhas, tokens, cookies, dados pessoais ou o relatório externo.

### Limitações preservadas

A conta fictícia de Porteiro já retornava 401 no login local **antes** da troca,
em consonância com o incidente relatado pelo avaliador. Não foi reparada nem
contada como perfil aprovado. Paridade de policies e testes locais não
substituem esse login hospedado pendente.

Não houve novo login Google com titular, ensaio de tablet/Narrador, carga ou
aceite institucional. A contenção de identidade histórica não foi reexecutada
com mutação de catálogo no host: há regressões PostgreSQL locais, mas o reteste
dinâmico desse cenário permanece necessário. Snapshots completos não foram
implementados por essa contenção.

O candidato de texto #659 não faz parte desta fonte instalada. Relatório
externo, correção em código, implantação e reteste independente são estados
distintos; não se declaram todos os achados encerrados.

## Continuidade

Repetir os cenários pendentes com contas sintéticas dedicadas, coordenar a
recuperação da conta de Porteiro, revisar o candidato #659 e prosseguir com
credenciais/limitação de tentativas, borda, snapshots e revisão auditada.
A Wiki foi sincronizada separadamente pela #658 após os merges, preservando a
diferença entre o backend instalado e os candidatos de frontend ainda abertos.
