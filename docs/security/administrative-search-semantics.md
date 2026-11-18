# Semântica das buscas administrativas

Os filtros textuais de relatórios e eventos procuram trechos literais, sem
diferenciar maiúsculas de minúsculas. O filtro `entity` da auditoria compara o
nome completo, também sem diferenciar caixa. `%`, `_` e `\` enviados pelo
cliente são texto, não operadores de consulta.

A infraestrutura escapa esses caracteres antes de construir o padrão e usa o
escape explícito do PostgreSQL. Os curingas que permitem a busca parcial são
adicionados somente pela aplicação. Paginação, períodos e autorização continuam
obrigatórios. A geração de PDF consulta o mesmo store dos relatórios.

Os testes de integração usam PostgreSQL descartável, verificam caracteres
literais e resultados comuns e desfazem as próprias fixtures por transação.
Isso não comprova implantação nem reteste no ambiente hospedado.

Esta defesa complementa a parametrização SQL: uma consulta parametrizada impede
que texto vire SQL, mas não impede que caracteres de um padrão sejam
interpretados por `LIKE`. A correção pertence à semântica da aplicação e não
depende de o WAF bloquear buscas legítimas.

Referência: [PostgreSQL 16 — Pattern Matching](https://www.postgresql.org/docs/16/functions-matching.html).
