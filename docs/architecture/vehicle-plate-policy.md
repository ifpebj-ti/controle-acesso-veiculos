# Política de placas de veículos

Esta decisão implementa o recorte de backend da Issue #444 e separa validação de
cadastro completo de normalização para pesquisa.

## Formatos aceitos

Uma placa informada em cadastro ou operação deve corresponder a um dos padrões
brasileiros em circulação:

- padrão nacional anterior: `LLLNNNN`, por exemplo `ABC-1234`;
- PIV Mercosul: `LLLNLNN`, por exemplo `ABC1D23`.

Espaços e hífen são aceitos na digitação. A persistência usa sete caracteres
ASCII, em maiúsculas e sem separadores. `777777`, posições incompatíveis,
quantidade diferente de sete, letras acentuadas e símbolos são rejeitados.

A validação confirma somente o **formato**. Ela não afirma que a placa foi
emitida, pertence ao veículo apresentado ou está regular. Uma integração futura
com fonte oficial da Senatran/Serpro exigirá estudo próprio de contrato, custo,
disponibilidade e proteção de dados; indisponibilidade externa não poderá parar
a portaria.

## Veículo sem placa convencional

O catálogo institucional já permite omitir a placa quando existe identificação
alternativa, como patrimônio ou número de frota. Essa exceção não transforma a
identificação interna em placa e não se aplica ao registro geral nem a uma regra
de evento vinculada a placa.

Placa estrangeira, de experiência/fabricante ou outro padrão especial não será
convertida ou inventada. Caso ocorra no campus, o caso deve ser registrado para
validação institucional e tratado por uma extensão explícita desta política.

## Pesquisa

Filtros e busca rápida aceitam de um a sete caracteres parciais, com a mesma
normalização de espaços, hífen e caixa. Eles não exigem uma placa completa e não
são usados para persistir ou autorizar um novo registro.

## Auditoria dos dados existentes

Antes de qualquer futura restrição no banco, execute uma consulta somente leitura
e revise os resultados com Transporte. Nenhum histórico deve ser corrigido ou
apagado automaticamente.

```sql
SELECT 'veiculos' AS origem, id, placa
FROM dbo.veiculos
WHERE placa IS NOT NULL
  AND placa !~ '^[A-Z]{3}([0-9]{4}|[0-9][A-Z][0-9]{2})$'
UNION ALL
SELECT 'autorizacoes_veiculos_eventos' AS origem, id, placa
FROM dbo.autorizacoes_veiculos_eventos
WHERE placa IS NOT NULL
  AND placa !~ '^[A-Z]{3}([0-9]{4}|[0-9][A-Z][0-9]{2})$'
ORDER BY origem, id;
```

Registros incompatíveis permanecem como evidência histórica. A correção, quando
necessária e autorizada, deve preservar valor anterior, responsável, motivo e
data na auditoria; uma migration de restrição só poderá ser criada depois de a
consulta retornar vazia ou de existir estratégia aprovada para exceções.
