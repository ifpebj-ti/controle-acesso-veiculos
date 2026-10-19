# Contrato dos relatórios administrativos

Este documento descreve o recorte técnico implementado pela Issue #441. Os
relatórios são destinados exclusivamente ao perfil `Administrador`; ocultar uma
tela no frontend não substitui a política aplicada pela API.

## Consultas disponíveis

| Relatório | Endpoint |
| --- | --- |
| Movimentações gerais de veículos | `GET /reports/vehicle-movements` |
| Utilizações da frota institucional | `GET /reports/institutional-fleet` |
| PDF de movimentações | `POST /reports/vehicle-movements/pdf` |
| PDF de utilizações da frota | `POST /reports/institutional-fleet/pdf` |

Parâmetros comuns:

- `from` e `to`: datas locais obrigatórias no formato `AAAA-MM-DD`;
- período inclusivo de, no máximo, 31 dias;
- `page` a partir de 1 e `pageSize` entre 1 e 100;
- `status` opcional.

Os valores públicos aceitos em `status` são:

- movimentações gerais: `Aberto`, `Encerrado` e `Pendente`;
- frota institucional: `EmUso`, `Concluido`, `PendenteRetorno` e `Corrigido`.

Valores desconhecidos são rejeitados com `400`; não são convertidos em uma
consulta vazia bem-sucedida.

Movimentações também aceitam `plate`, `driverName` e `categoryName`. Frota
institucional aceita `plate`, `vehicleIdentification` e `driverName`. Os
filtros textuais são parciais e não diferenciam maiúsculas de minúsculas.
`plate` e `vehicleIdentification` são propriedades distintas e opcionais na
resposta: uma identificação interna nunca é apresentada como se fosse placa.

A resposta informa o período escolhido e o identificador do fuso institucional.
Um período sem dados retorna uma coleção vazia válida. Documento, credencial,
hash, token e demais dados desnecessários não integram o contrato.

## Autoria e auditoria

O servidor resolve nome e perfil dos responsáveis usando os identificadores já
persistidos. O cliente não informa autoria. Cada consulta bem-sucedida cria um
registro mínimo de auditoria com Administrador, tipo de relatório, período e
resultado; o conteúdo pessoal do relatório não é duplicado na auditoria.

## Exportação PDF e confirmação reforçada

Os endpoints de exportação recebem período, filtros e `currentPassword` no corpo
JSON. A senha nunca integra URL, nome de arquivo, PDF, log ou auditoria. No
contrato local atual, cada exportação exige a senha vigente do Administrador e
usa a mesma política de limitação de tentativas das operações sensíveis.
Uma falha nessa confirmação devolve `403` com o código estável
`report_export_reauthentication_failed`. Ela não significa que a sessão venceu;
o frontend não deve encerrar a sessão nem repetir automaticamente a exportação.
Ausência ou invalidez da sessão continua sendo representada por `401`.

O servidor:

- aplica novamente autorização e estado da conta, mesmo após o JWT;
- limita o período a 31 dias e o resultado a 1.000 registros;
- resolve autoria e nome do exportador sem aceitar esses valores do navegador;
- gera o arquivo em memória, sem armazenamento permanente;
- devolve `application/pdf`, nome previsível e `Cache-Control: no-store`;
- audita tipo, período, resultado e Administrador sem copiar o conteúdo;
- produz um PDF vazio válido quando nenhum registro atende aos filtros.

A renderização usa QuestPDF 2026.9.1 no processo da API. A dependência não faz
chamadas de rede nem recebe dados do relatório; a licença Community foi escolhida
por se tratar de projeto acadêmico e aberto. Qualquer atualização de versão ou
mudança de finalidade exige nova revisão de licença e segurança.

Como a autenticação cotidiana passará a usar Google OIDC (#448), este incremento
ainda não fecha o critério de confirmação reforçada para contas Google. A solução
final deverá aceitar reautenticação OIDC para essas contas e manter senha somente
para a conta administrativa local de emergência. Nenhuma das opções reutilizará
o endpoint de login nem enviará segredo em URL, log ou auditoria.

DOCX não compõe o recorte por ser um formato editável. CSV também permanece fora
do escopo inicial; poderá ser avaliado em issue própria se houver necessidade
analítica institucional.
