# Contrato dos relatórios administrativos

Este documento descreve o recorte técnico implementado pela Issue #441. Os
relatórios são destinados exclusivamente ao perfil `Administrador`; ocultar uma
tela no frontend não substitui a política aplicada pela API.

## Consultas disponíveis

| Relatório | Endpoint |
| --- | --- |
| Movimentações gerais de veículos | `GET /reports/vehicle-movements` |
| Utilizações da frota institucional | `GET /reports/institutional-fleet` |

Parâmetros comuns:

- `from` e `to`: datas locais obrigatórias no formato `AAAA-MM-DD`;
- período inclusivo de, no máximo, 31 dias;
- `page` a partir de 1 e `pageSize` entre 1 e 100;
- `status` opcional.

Movimentações também aceitam `plate`, `driverName` e `categoryName`. Frota
institucional aceita `plate`, `vehicleIdentification` e `driverName`. Os
filtros textuais são parciais e não diferenciam maiúsculas de minúsculas.

A resposta informa o período escolhido e o identificador do fuso institucional.
Um período sem dados retorna uma coleção vazia válida. Documento, credencial,
hash, token e demais dados desnecessários não integram o contrato.

## Autoria e auditoria

O servidor resolve nome e perfil dos responsáveis usando os identificadores já
persistidos. O cliente não informa autoria. Cada consulta bem-sucedida cria um
registro mínimo de auditoria com Administrador, tipo de relatório, período e
resultado; o conteúdo pessoal do relatório não é duplicado na auditoria.

## Exportação PDF e confirmação reforçada

A exportação permanece pendente no mesmo caminho de entrega. Ela deve gerar o
PDF no servidor, limitar volume, usar `Cache-Control: no-store` e exigir
confirmação reforçada em cada operação.

Como a autenticação cotidiana passará a usar Google OIDC (#448), a confirmação
não pode depender exclusivamente de senha local. A solução final deverá aceitar
reauth OIDC para contas Google e senha apenas para a conta administrativa local
de emergência. Nenhuma das opções reutilizará o endpoint de login nem enviará
segredo em URL, log ou auditoria.

DOCX não compõe o recorte por ser um formato editável. CSV também permanece fora
do escopo inicial; poderá ser avaliado em issue própria se houver necessidade
analítica institucional.
