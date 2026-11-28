# Consulta de autorizações de eventos

Rastreabilidade #743. Contrato candidato; não está habilitado no site por este PR.

## Estados e compatibilidade

| Query HTTP                       | Resultado                                       |
| -------------------------------- | ----------------------------------------------- |
| Sem active/status                | Somente ativos, como antes                      |
| `active=true`                    | Somente ativos                                  |
| `active=false`                   | Somente cancelados                              |
| `status=all` sem active          | Ativos e cancelados                             |
| `status=all` com active          | 400: combinação ambígua                         |
| Status diferente de all ou vazio | 400 de validação                                |
| `active=` ou `active=null`       | Continua inválido; não é representação de todos |

O filtro Todos da interface deve enviar `status=all` e omitir `active`. Ativos e
Cancelados continuam enviando o booleano e omitindo `status`. Não enviar valores
nulos como texto nem combinar/filtrar páginas no navegador para fabricar o total.
O identificador de status é comparado sem diferenciar maiúsculas/minúsculas.

## Exemplo

```http
GET /event-authorizations?status=all&name=Evento&page=1&pageSize=25
```

`name`, `fromUtc`, `toUtc`, `page` e `pageSize` conservam seus contratos e
validações. O mesmo filtro de estado é aplicado na consulta e na contagem do
servidor; `items`, `totalCount` e `totalPages` continuam canônicos. Não há
mudança de permissão, criação/edição/cancelamento, banco ou retenção.

O GET exige a autorização de leitura existente. O acréscimo não transforma
cancelamento em exclusão nem reativa evento. A seleção opcional de evento no
registro de entrada deve continuar pedindo explicitamente `active=true`.

## Validação e integração

A regressão HTTP/PostgreSQL cria três autorizações fictícias, cancela uma e
consulta Todos em três páginas. Confere IDs únicos, totais, filtros de nome e
período, default ativo, booleanos e rejeições ambíguas. Demais regressões de
autorização e privacidade permanecem na suíte.

A mudança frontend continua com Raíssa na #743: serialização, estados, filtros,
paginação e ensaio com API candidata compatível. O candidato pode ser testado
antes de merge; não há implantação automática e o endpoint hospedado anterior
não deve ser apresentado como compatível sem verificação de versão.
