# Catálogo de categorias de acesso — #688

O catálogo canônico do backend é `AccessCategoryNames.Supported`. Mantém as nove
opções anteriores e acrescenta `Aluno`, `Terceirizado` e `Federal`. Federal
significa servidor federal, conforme confirmação de José em 12/11/2026.
A API normaliza maiúsculas/espaços; valores desconhecidos continuam inválidos.

A persistência vigente cria a categoria canônica na primeira movimentação
válida dentro da transação. Não é necessária migration de dados, reset ou
reclassificação do histórico. Filtros/relatórios usam a mesma normalização.

Categoria descreve o acesso, não comprova vínculo institucional ou idade,
não cria conta nem autoriza a pessoa. O pré-cadastro #689/#690 é separado e não
copia automaticamente uma categoria para toda movimentação.

O frontend deve ampliar todos os consumidores do catálogo, incluindo contagens,
histórico e formulários, em PR próprio. A interface ainda não é comprovada por
esta alteração backend. Doze categorias podem ampliar o custo das consultas
atuais de contagem; manter concorrência limitada e estados de falha distintos de
zero, sem inventar métricas ou novo endpoint neste recorte.
