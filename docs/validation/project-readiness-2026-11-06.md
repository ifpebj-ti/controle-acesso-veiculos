# Escopo funcional e prontidão — revisão de 08/11/2026

Rastreabilidade: #624 e #628. Main 202a913; candidatos e hospedagem distintos.
O nome histórico do arquivo foi mantido para preservar os links existentes.

## Critério mantido

Mesmas 14 capacidades da régua de 03/11: 1 para fluxo implementado no núcleo,
0,5 para entrega parcial/candidata com etapa obrigatória faltante e 0 para não
implementado. Não é medida de horas, segurança ou aceite. Incerteza de julgamento
±8 pontos, sem interpretação estatística.

| Capacidade                    | Pontos | Evidência e restante                                                          |
| ----------------------------- | -----: | ----------------------------------------------------------------------------- |
| Login Google e administrativo |    0,5 | positivo relatado/servidor testado; negativos/troca e PRs originais pendentes |
| Contas e perfis               |    0,5 | lista corrigida e API exercitada; #530 com integração humana pendente         |
| Entrada geral                 |      1 | núcleo implementado e testado                                                 |
| Acessos abertos e saída       |      1 | núcleo implementado e testado                                                 |
| Histórico e filtros           |      1 | núcleo e #568 incorporados; composição hospedada 7dd02a6                      |
| Catálogo da frota             |      1 | existente; HTTPS vazio limita teste populado                                  |
| Motoristas autorizados        |      1 | existente; HTTPS vazio limita teste populado                                  |
| Saída e retorno institucional |      1 | existente; ensaio de tarefas reais pendente                                   |
| Eventos e associação          |      1 | existente; itens populados/observação pendentes                               |
| Resumo operacional            |      1 | integrado e consultado                                                        |
| Relatórios e PDF              |    0,5 | consultas/exportação; reformulação #496 e aceite visual pendentes             |
| Auditoria administrativa      |      1 | consulta implementada, exercitada e preservada na limpeza                     |
| Revisão de correções          |    0,5 | candidatos com ensaio local real; HTTPS/aceite ainda pendentes                |
| Reconciliação do papel        |    0,5 | #611 tem domínio/aplicação; falta persistência, transação/API e tela          |

Resultado: **11,5/14 = 82,1%**, aproximadamente **82% concluído / 18% restante**.
A mudança desde 11/14 (79%) é exclusivamente o incremento parcial do papel,
antes pontuado zero. Não foi concedido ponto por novos commits, testes repetidos,
contas temporárias ou fullscreen. Domínio/aplicação candidatos não equivalem a
importação entregue; se a avaliação exigir somente fluxos integrados, deve usar
outra régua e não comparar os números diretamente.

## O que falta de trabalho concreto

- Concluir tarefas autenticadas e acessibilidade do login/contas, com titulares
  Google autorizados e composição identificada; #530, #474/#494/#567/#592.
- Integrar #607 com #613, migrar e validar em ambiente isolado antes de promover.
- Implementar persistência/concorrência/auditoria/contrato HTTP do papel e a tela.
- Concluir o recorte de PDF e a homologação visual, sem confundir PDF válido com
  documento aprovado institucionalmente.
- Consolidar release compatível e manual; promover imagens explicitamente.

## Matéria versus uso institucional

A [Unidade 2](unit-2-readiness.md) fica em **11/17 (65% ±5 pontos)**, faltando
aproximadamente 35% da pontuação, com vários itens de infraestrutura e medição.
O produto está mais próximo da avaliação controlada do que da operação definitiva.
Não é preciso reinventar o sistema; é preciso fechar integrações e evidências.

Para operar de verdade, persistem gates de backup externo e restauração,
observabilidade/alertas, renovação TLS, contingência, responsabilidades e uso de
dados autorizado. Não há base para um percentual confiável de produção nem para
uma data de conclusão em dias. O peso do trabalho restante não acompanha
linearmente os pontos: uma integração difícil pode valer só meio ponto.

## Dependências de equipe

Raíssa: tarefas finais do login/contas, acessibilidade, #613 e PDFs. #621/#622
foram incorporadas na main; a promoção dessa interface continua separada.
Backend/infra: store/API do papel, composição de correções, segurança/operação,
qualidade/cobertura e preparação de candidatos. Há trabalho técnico independente
suficiente; não é necessário esperar todo o frontend para avançar nessas bases.
Aceite dos professores e observação dos usuários são tarefas conjuntas.

## Evidência operacional de 08/11

A [atualização de segurança #628](backend-runtime-security-2026-11-08.md)
instalou o backend 5fa21bb, preservando frontend 7dd02a6 e banco. Backup com
restauração isolada local e 111 verificações HTTPS passaram. Os cinco itens
funcionais parciais continuam parciais: login, contas, PDFs, revisão e papel.
Não foi atribuído ponto por corrigir o empacotamento ou repetir testes.

#613/3a5b00f aplicou a resolução de contagens; revisão independente executou
82 testes focados, lint e build. A produção frontend desse recorte é equivalente
à composição local a159e4c, mas isso não substitui HTTPS/aceite humano no SHA
final nem instala a interface. Nenhum novo login Google real foi realizado.
