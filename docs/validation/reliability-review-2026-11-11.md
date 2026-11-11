# Reliability ? revis?o de 11/11/2026

## Fonte e diagn?stico

A consulta autenticada ? API oficial `code-quality/findings` encontrou 11
findings abertos de Reliability na main de refer?ncia `3306b8e`: dois warnings
`cs/local-not-disposed` e nove notes. O endpoint de alertas de seguran?a de
code scanning ? separado e n?o substitui esse invent?rio.

Os warnings #25 e #26 apontam para `GoogleOidcProtocolTests.cs` e
`GoogleOidcSignedTokenTests.cs`. A express?o que criava uma f?brica e derivava
outra com `WithWebHostBuilder` deixava a f?brica original sem descarte expl?cito.

## Corre??o candidata ? Issue #680

Cada helper passa a criar diretamente uma subclasse privada de
`WebApplicationFactory<Program>`, configurada por `ConfigureWebHost`. Os callers
continuam donos da inst?ncia via `using`. A configura??o, os asserts, PKCE,
state/nonce, tokens assinados e isolamento do banco foram preservados.

Build Release com warnings como erros passou. Os 21 testes existentes das duas
su?tes Google passaram, sem skips. Isso verifica o comportamento local; n?o ?
resultado de uma nova execu??o do CodeQL na main nem autentica??o Google real.

## Findings restantes e aceite

As nove notes incluem sete usos de `Path.Combine` em fixtures com caminhos
controlados e dois catches amplos em fronteiras de relat?rio e health check.
A presen?a de uma note n?o prova exposi??o de dados nem justifica remover uma
prote??o. A triagem n?o suprimiu regras, descartou findings ou alterou gates.

Segundo a documenta??o oficial, warnings mant?m Fair; somente notes permitem
Good. Ap?s incorporar a corre??o, conferir um novo scan completo da branch
padr?o: verificar os dois warnings, poss?veis findings novos e o rating efetivo.
N?o declarar Good antecipadamente. A conclus?o da Issue #680 depende dessa
confer?ncia; a melhoria n?o significa seguran?a integral do sistema.

Refer?ncias:

- [M?tricas e ratings do GitHub](https://docs.github.com/en/code-security/reference/code-quality/metrics-and-ratings).
- [API de Code Quality](https://docs.github.com/en/rest/code-quality/code-quality?apiVersion=2026-03-10).
