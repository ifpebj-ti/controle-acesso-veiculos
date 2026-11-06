# Escopo funcional e prontidão — 06/11/2026

Rastreabilidade: #624. Main c170f9b; candidatos e hospedagem distintos.

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
| Histórico e filtros           |      1 | existente; #568 é melhoria candidata independente                             |
| Catálogo da frota             |      1 | existente; HTTPS vazio limita teste populado                                  |
| Motoristas autorizados        |      1 | existente; HTTPS vazio limita teste populado                                  |
| Saída e retorno institucional |      1 | existente; ensaio de tarefas reais pendente                                   |
| Eventos e associação          |      1 | existente; itens populados/observação pendentes                               |
| Resumo operacional            |      1 | integrado e consultado                                                        |
| Relatórios e PDF              |    0,5 | consultas/exportação; reformulação #496 e aceite visual pendentes             |
| Auditoria administrativa      |      1 | consulta implementada, exercitada e preservada na limpeza                     |
| Revisão de correções          |    0,5 | backend #607 e frontend #613 candidatos; composição real pendente             |
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

Raíssa: tarefas finais do login/contas, acessibilidade, #613, PDFs e #621/#622.
Backend/infra: store/API do papel, composição de correções, segurança/operação,
qualidade/cobertura e preparação de candidatos. Há trabalho técnico independente
suficiente; não é necessário esperar todo o frontend para avançar nessas bases.
Aceite dos professores e observação dos usuários são tarefas conjuntas.
