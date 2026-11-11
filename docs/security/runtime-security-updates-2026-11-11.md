# Atualização de runtime — 11/11/2026

> **Complemento após a promoção #677:** backend `812b71e` instalado e runtime
> 10.0.15 conferido na VM. Scanner zero HIGH/CRITICAL e 162/162 verificações
> HTTPS nos três perfis locais disponíveis; frontend e banco preservados.
> [Evidência e limites](../validation/backend-runtime-rollout-2026-11-11.md).
> Os trechos seguintes preservam a fotografia inicial, anterior à promoção.

## Motivo e evidência

O scanner Trivy 0.76.1 encontrou três achados HIGH no runtime ASP.NET Core
10.0.14 da imagem AMD64 construída da main 3306b8e: CVE-2026-114146,
CVE-2026-114147 e CVE-2026-114149. A Microsoft publicou 10.0.15 em 10/11.
O advisory GitHub do CVE-2026-114146 é classificado como Critical; as categorias
pertencem às respectivas fontes e não devem ser confundidas. Presença no
inventário não comprova exploração nem o uso de cada funcionalidade afetada.
O advisory 114146 descreve SignalR; a busca estática atual não encontrou
AddSignalR/MapHub/Hub no backend. Isso delimita a evidência de aplicabilidade
e não é motivo para ignorar o patch ou os demais advisories.

Este resultado é posterior à fotografia do relatório externo. Não alterar seus
28 itens retroativamente nem declarar o ambiente livre de vulnerabilidades com
base numa varredura anterior. Uma execução passada sem HIGH/CRITICAL só vale
para aquela imagem e a base de vulnerabilidades usada naquele momento.

## Escopo do candidato

A imagem final passa de `aspnet:10.0.14` para `aspnet:10.0.15`. Não altera C#,
API, autenticação, permissões, dados ou migrations. Proteção do primeiro download
APT, versões mínimas, usuário 1654 e gates do scanner são preservados. O ajuste
de falha de DNS e refresh estrito é o recorte separado #673.

O patch exige build, scanner e promoção identificada. Não significa que a VM
foi atualizada. A última hospedagem documentada permanece backend 2689402,
com runtime 10.0.14, até uma promoção efetivamente verificada. O relatório não
prova comprometimento do servidor; a correção deve receber prioridade.

## Fontes primárias

- [Microsoft — atualizações de novembro](https://devblogs.microsoft.com/dotnet/dotnet-and-dotnet-framework-november-2026-servicing-updates/).
- [Release .NET 10.0.15](https://github.com/dotnet/core/blob/main/release-notes/10.0/10.0.15/10.0.15.md).
- [Advisory CVE-2026-114146](https://github.com/dotnet/aspnetcore/security/advisories/GHSA-67wp-ghc2-fw2g).
