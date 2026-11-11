# Faixa de datas do resumo operacional

O resumo usa o dia selecionado, o início exclusivo do dia seguinte e uma
tendência de 14 dias. A faixa representável é de `0001-01-14` a `9999-12-30`,
inclusive. Datas fora dela são recusadas antes de consultar o store; o endpoint
responde HTTP 400 com ValidationProblem no campo `date`.

A regra não altera o fuso institucional, a data padrão ou o período de tendência.
Os testes de aplicação verificam que datas recusadas não consultam o banco e
que os dois limites válidos preservam 14 posições. Testes HTTP exercitam o
contrato de erro com autenticação. Isso não é reteste da hospedagem.
