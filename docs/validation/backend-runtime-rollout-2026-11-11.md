# Promoção do backend e runtime — 11/11/2026

Rastreabilidade: Issue #677; correções #675/#676 incorporadas e main
`812b71e1183534a4218187537077ade40a64df8c`, após #682/#683.

## Estado efetivamente instalado

Somente o backend da homologação `https://dat.ernandescosta.me` foi atualizado.
O frontend permanece `7dd02a6464ae150a3397acb43d0b2d5227f80b43`; os containers
do frontend e PostgreSQL não foram recriados. Não houve migration, limpeza de
dados, alteração de perfil ou redefinição de credencial nesta promoção.

| Identidade                       | Valor                                                                     |
| -------------------------------- | ------------------------------------------------------------------------- |
| Fonte backend                    | `812b71e1183534a4218187537077ade40a64df8c`                                |
| Imagem operacional local         | `cav/hml-backend:runtime-812b71e`                                         |
| ID conferido na VM               | `sha256:05afe7c4580b4e215d58aad61f4ccef0a00f9d83fc70e3b80e1619be9b97d1f0` |
| Digest da configuração da imagem | `sha256:2d4db46ff39a5b21fca3511477c5fb1eb03deb7183b8cce2d1772e2b814976b2` |
| SHA-256 do arquivo transferido   | `960e353345d3fe73b8d5c73126b38770434318af4710218527d3753c1055df32`        |
| Arquivo comprimido               | 144484562 bytes                                                           |
| Arquitetura / usuário            | AMD64 / UID 1654                                                          |
| Runtime conferido no container   | ASP.NET Core e .NET 10.0.15                                               |
| APT / libapt                     | `2.8.4ubuntu0.1`                                                          |

O contexto foi exportado por `git archive` da main incorporada, sem arquivos
locais não versionados. Scanner Trivy 0.76.1: zero HIGH/CRITICAL no artefato;
SBOM SPDX externo com 134 pacotes. O resultado vale para esta imagem e a base
da execução. Não foi construída uma nova imagem ARM64 local nesta promoção.

Além do runtime/APT, o delta C# desde o backend anterior inclui as validações
NUL incorporadas por #659/#664 e atualização revisada de dependência. A API e as
migrations foram conferidas; não se descreve esse lote como mera troca do runtime.

## Proteções e recuperação

- Backup local de 101.023 bytes restaurado em banco temporário isolado: 20
  migrations e 14 tabelas conferidas. O banco temporário foi removido; o banco
  da aplicação não foi restaurado. Isso não implementa backup externo.
- Arquivo transferido por túnel Bastion temporário e SSH com conferência estrita
  de host. Hash, origem, arquitetura, UID e identidade da imagem verificados.
- Configuração Compose efetiva comparada antes/depois: somente imagem e
  política de pull do backend mudaram. Ambiente da aplicação, Google, janela de
  contas fictícias, proxy, segredos, key ring, redes e hardening preservados.
  Metadados `DOTNET_VERSION`/`ASPNET_VERSION` mudaram para 10.0.15 como esperado.
- A primeira conferência de identidade bloqueou antes da ativação porque o
  manifesto local confundia digest de configuração com ID de imagem. Os dois
  identificadores foram conferidos e mantidos separados; o hash do arquivo não
  mudou e nenhuma verificação foi dispensada.
- Uma tentativa de ativação acionou rollback por exigir igualdade também nos
  metadados da versão do runtime. O retorno à imagem anterior funcionou.
  A conferência foi corrigida para permitir somente as duas mudanças de versão
  esperadas, preservando comparação estrita das variáveis da aplicação. Novo
  inventário e promoção concluíram com o serviço saudável.

O acesso Bastion temporário foi encerrado: exclusão da sessão e remoção do
endereço cliente adicional foram confirmadas. Nenhuma regra SSH ampla foi criada.

## Verificações após ativação

Passaram **162/162 verificações HTTPS** em 2026-11-11T18:35:16.168302+00:00 (UTC), nos
três perfis locais disponíveis: Vigilante, Transporte e Administrador.

Foram conferidos readiness, provedor Google habilitado, negação sem sessão,
permissões por perfil, contratos de consultas, no-store, paginação inválida,
filtros literais, limites de datas, PDFs com step-up, cookies Secure, CSRF,
renovação, logout, rejeição de reuso e isolamento entre famílias de sessão.
Não foram criados ou apagados registros operacionais; consultas e autenticações
geram a auditoria normal do sistema.

O Porteiro local já estava indisponível antes desta promoção após mudança de
método de autenticação relatada na avaliação externa. Foi preservado, não
reparado silenciosamente. O ensaio não representa os quatro perfis locais.

Não houve nova observação de tablet, Narrador ou autenticação Google pelo agente.
A configuração Google preservada e a resposta do provedor não comprovam login
real. José confirmou em 11/11, após a promoção, que entrou com sua conta Google
já autorizada e continuou como Porteiro depois de uma recarga. Esse resultado
é relato do titular, vinculado ao frontend `7dd02a6` e backend `812b71e`; não é
observação independente do agente, teste de carga ou validação de outros fluxos
OAuth. Não substitui a correlação ainda pendente do cenário de conta não autorizada.

## Release e limites

Esta é uma promoção identificada por fonte/imagem e overlay operacional, não uma
release GHCR. A release publicada permanece `0.4.0`; a proposta `0.5.0` está em
draft na #686 e não criou tag pública. Não mover `0.4.0` para estes artefatos.

A main ainda não contém toda a interface Google/contas do frontend candidato.
A futura release conjunta precisa preservar esses fluxos e seus critérios,
conforme a [política de releases](../operations/release-cadence.md).
Backup externo, monitoramento operado, renovação TLS e aceite institucional
continuam separados. Atualização não comprova ausência geral de vulnerabilidades.
