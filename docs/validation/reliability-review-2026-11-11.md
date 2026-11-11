# Reliability — revisão de 11/11/2026

## Diagnóstico

A API oficial `code-quality/findings` retornou 11 findings abertos de Reliability
na main de referência `3306b8e`: dois warnings `cs/local-not-disposed` e nove
notes. Alertas de segurança de code scanning são uma consulta separada.

Os warnings #25 e #26 estão em `GoogleOidcProtocolTests.cs` e
`GoogleOidcSignedTokenTests.cs`. Criar uma fábrica e derivar outra por
`WithWebHostBuilder` deixava a fábrica original sem descarte explícito.

## Correção candidata — Issue #680

Cada helper cria diretamente uma subclasse privada de
`WebApplicationFactory<Program>`, configurada por `ConfigureWebHost`. O caller
continua dono da instância por `using`. Configurações, asserts, PKCE,
state/nonce, tokens assinados e isolamento do banco foram preservados.

O build Release com warnings como erros passou. Os 21 testes existentes das
duas suítes passaram, sem skips. Isso é evidência local, não uma nova análise
CodeQL da main nem autenticação Google real.

## Triagem e aceite

As nove notes incluem sete usos de `Path.Combine` em fixtures com caminhos
controlados e dois catches amplos em fronteiras de relatório e health check.
Não foram suprimidas regras, descartados findings ou reduzidos gates. Remover
um catch protetor apenas para melhorar o indicador não é uma correção segura.

Warnings mantêm Fair; somente notes permitem Good. Depois da incorporação,
conferir um novo scan completo da branch padrão, os dois warnings, possíveis
findings novos e o rating efetivo. A Issue #680 aguarda essa conferência; não
declarar Good ou segurança integral antecipadamente.

Referências:

- [Métricas e ratings do GitHub](https://docs.github.com/en/code-security/reference/code-quality/metrics-and-ratings).
- [API de Code Quality](https://docs.github.com/en/rest/code-quality/code-quality?apiVersion=2026-03-10).
