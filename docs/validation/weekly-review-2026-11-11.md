# Revisão semanal — apresentação de 11/11/2026

Preparado em **10/11/2026**, com evidências desde a apresentação de 04/11.
Este registro distingue implementação, incorporação, hospedagem e aceite; não
substitui a matriz de prontidão nem o relatório externo restrito.

## Avanços da semana

| Frente     | Entrega e limite                                                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Interface  | Tela cheia opcional (#621/#629) e categorias do histórico (#568) incorporadas. Não inferir que todo incremento da main está no frontend instalado.         |
| Imagens    | Runtime e pacotes APT corrigidos (#616/#627); builds/scans separados por arquitetura, sem atestações OCI novas implícitas.                                 |
| Sessão     | Vínculo de JWT à família ativa (#653), com revogação por logout/reuso e preservação de família independente.                                               |
| Dados      | Buscas administrativas literais (#648), datas extremas no resumo (#651), contenção da identificação de veículo referenciado (#654) e no-store (#655).      |
| Validação  | NUL em entrada/auditoria incorporado (#659); buscas de contas/eventos no candidato #664. Não é validação universal.                                        |
| Operação   | Promoção backend identificada e 162 verificações HTTPS, documentadas em #660. Backup local restaurado em banco isolado não comprova proteção externa/PITR. |
| Manutenção | Dependências e ferramentas atualizadas com ensaio conjunto (#639/#640/#641/#642). Mudanças de código não atualizam automaticamente a VM.                   |
| Segurança  | Retorno externo triado sem publicar o documento original, dados pessoais ou logs brutos. Correções instaladas não encerram todos os itens.                 |

## Estado para demonstração

- URL: <https://dat.ernandescosta.me/login>.
- Main de referência: `dc8a91eae2bdb8a535e5d5d5b4b00e2035eca7df`.
- Último frontend hospedado identificado: `7dd02a6464ae150a3397acb43d0b2d5227f80b43`.
- Último backend hospedado identificado: `2689402e547af889034c043b4bcd0e2f3ffd5407`.
- Release estável publicada: `v0.4.0`; a composição de homologação tem fontes
  próprias. Não alterar a release para descrever um candidato.
- Em 10/11, às 23h38 (UTC−3), `/login`, `/api/health/ready` e
  `/api/auth/providers` responderam 200, com verificação TLS; provedor Google
  habilitado. Esse smoke público não autenticou usuários nem conferiu cada tela.
- Google autorizado com uma recarga foi confirmado pelo titular após a promoção;
  é relato atribuído, não observação independente de toda a matriz.
- Credenciais ficam fora do Git e dos slides. A conta fictícia antiga de Porteiro
  por senha tem pendência de método; não anunciar quatro contas locais validadas
  sem conferir a disponibilidade de cada uma.

## Candidatos que não equivalem a entrega no site

- #474/#494/#596 e #567/#592: pilha do login e retorno, com snapshots e critérios
  próprios. Os relatos de negação genérica não identificam sozinhos a causa.
- #645: auditoria legível; #666: orientação de conflito ao editar veículo.
- #607/#613: solicitação e revisão de correções, ainda sem aceite integrado.
- #611/#100: reconciliação de registros em papel ainda incompleta.
- #663/#668: recuperação segura na reativação Local, fonte `99e6846`, com
  465 testes locais aprovados; integração frontend e promoção pendentes.
- #664: validação de duas buscas administrativas, ready para revisão após 470
  testes locais e checks aprovados; sem promoção para a hospedagem nesta tarefa.

## Segurança: concluído e restante

O retorno externo é favorável e registra 28 itens, sem crítico ou alto naquela
avaliação, com cinco médios, treze baixos e dez informativos. Não é certificação,
segurança absoluta ou autorização de operação institucional.

Sessão, filtros, datas e cache receberam correções instaladas; identificação
histórica recebeu contenção, não snapshot completo. Permanecem recuperação de
credenciais, equilíbrio de bloqueios/limites, concorrência, histórico completo,
conferências de borda e reteste independente. Itens informativos e decisões de
produto precisam de análise, não de novas restrições automáticas aos operadores.

CodeQL cobre análise estática (SAST); ZAP cobre HTTP em execução (DAST); Trivy e
SBOM tratam componentes e inventário das imagens. A existência das ferramentas
não comprova ausência de falhas ou nova execução de todas elas nesta semana.

## Progresso e comparação

A estimativa funcional de referência do roteiro de 04/11 era cerca de 79% ±8
pontos. A [matriz funcional](project-readiness-2026-11-06.md) posterior registra
11,5/14 capacidades equivalentes, aproximadamente 82% ±8 pontos. A diferença
nominal de cerca de três pontos veio do crédito parcial do modelo de papel,
não das correções de segurança, e não é medida precisa de produtividade: as
faixas se sobrepõem. Não aumentar o indicador apenas por commits de segurança.

A [Unidade 2](unit-2-readiness.md) mantém oito critérios atendidos, seis parciais
e três pendentes: `(8 + 6 × 0,5) / 17 = 64,7%`, cerca de 65% ±5 pontos. Corrigir
código não substitui evidência de operação, carga, recuperação e aceite.

## Preparação e próximos passos

1. Apresentar somente o que a imagem instalada permite demonstrar e conferir
   acesso antes da fala; não projetar credenciais.
2. Revisar candidatos prontos sem bypass; merge é realizado pelo responsável,
   seguido de promoção identificada quando apropriado, com rollback.
3. Concluir recuperação de conta, revisão de correções e reconciliação em papel.
4. Instalar os recortes aprovados e solicitar reteste dos itens correspondentes.
5. Comprovar backup externo/recuperação, observabilidade operada, renovação TLS,
   carga controlada e homologação observada antes de operação institucional.

## Referências

- [Evidência da promoção de segurança](backend-security-rollout-2026-11-10.md)
- [Prontidão da Unidade 2](unit-2-readiness.md)
- [Autenticação e autorização](../security/authentication.md)
- [Limites da validação textual](../security/text-validation-boundaries.md)
- [Estado canônico na Wiki](https://github.com/ifpebj-ti/controle-acesso-veiculos/wiki/Status-do-Projeto)
