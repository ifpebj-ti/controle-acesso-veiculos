# Dashboard, ZAP e leitura de CI — 13/11/2026

**Rastreabilidade:** #708. Fonte main `267c133d0c62a51fcdcae23745a5092d27ef3d1f`,
após os merges #567/#592/#494/#596. Este registro não declara implantação.

## Dashboard de produto

Foram executados nesta fonte:

- 10 testes de integração `OperationalSummaryTests`, com API de teste e
  PostgreSQL descartável/Testcontainers: todos passaram;
- 21 testes em `DashboardPage.test.tsx` e `operationalSummaryService.test.ts`:
  todos passaram com Vitest 5.1.0 e execução sequencial.

A integração cobre os quatro perfis, negação de anônimo/perfil indevido,
contagens de acessos/frota/eventos, limites do dia em America/Recife, gráficos
horários, série recente, datas inválidas/limites e ausência de nome/placa na
resposta agregada. Os testes de tela/contrato cobrem mudança de data, gráficos
administrativos, estados vazios sem dados inventados, falha/recuperação,
acesso negado e auditoria automática de acessibilidade.

Os testes de integração usam PostgreSQL real descartável, não o banco hospedado.
Os testes React/serviço usam ambiente automatizado com respostas controladas;
não são uma nova observação visual no navegador, tablet ou leitor de tela.
Não foi declarado teste autenticado na VM nesta rodada.

A árvore `src/frontend` da main é idêntica à do #596/6bb9be0:
`5f623c8db16ef7b21e07fdd297eb885bf542f089`. A suíte completa de 805 testes/67
arquivos pertence à revisão anterior dessa composição; ela não foi executada
outra vez para este documento. Os 21 testes focados desta rodada não devem ser
somados a ela como testes distintos.

## OWASP ZAP

O relatório da execução [43502824579](https://github.com/ifpebj-ti/controle-acesso-veiculos/actions/runs/43502824579),
fonte `267c133`, foi baixado e examinado. Artefato:
`zap-baseline-43502824579-1`, ID `14074433334`.

| Risco       | Categorias de alerta |
| ----------- | -------------------: |
| Alto        |                    0 |
| Médio       |                    0 |
| Baixo       |                    1 |
| Informativo |                    3 |

O achado baixo é COEP ausente/inválido, com três ocorrências. A decisão de
manter esse aviso para a arquitetura atual já está na política versionada.
Os informativos são comentário suspeito no bundle, identificação de aplicação
web moderna e cache de conteúdo. Essas quatro categorias permanecem visíveis;
não foram suprimidas nem reclassificadas para produzir verde.

O recorte percorreu seis URLs/endpoints da stack descartável de CI em
`http://frontend:8080`, sem sessão de operador e sem scan ativo. Não é uma nova
análise autenticada da hospedagem, não testa todos os botões e não comprova
zero vulnerabilidades no sistema. HTML, JSON e Markdown ficam nos artefatos da
execução por 14 dias; os arquivos brutos desta conferência não foram versionados.

Na consulta, CI Containers ainda concluía outros jobs. A presença do relatório
ZAP não foi usada como prova de aprovação de toda a matriz AMD64/ARM64 ou de
publicação de imagens.

## k6 é outra verificação

O candidato #515 registra um ensaio anterior com API fictícia local:
três perfis de 1/3/5 VUs, 975 requisições do k6, sem erros ou HTTP 429 e com
thresholds preservados. O código k6 ainda não está incorporado à main.
Esses resultados pertencem à fonte/ambiente descritos no PR, não a uma nova
execução neste documento. A janela OCI, WAF/LB e recursos da VM continuam na #502.

O k6 simula consultas concorrentes para medir desempenho. ZAP examina respostas
em busca de problemas de segurança. O dashboard de produto consulta números
agregados da API; ele não é um painel Grafana de CPU/memória, cuja operação
continua na #500. Nenhuma dessas ferramentas substitui as demais.

## Cancelamentos e implantação

Os merges vieram em sequência, e os workflows de validação estão configurados
para cancelar execuções antigas da mesma branch. Os timestamps consultados são
compatíveis com essa substituição. Não é necessário reconstruir todo o
histórico para colorir commits antigos de verde. Cancelamento não é aprovação;
a fonte atual precisa das verificações aplicáveis concluídas.

Os workflows têm filtros de caminhos. Os quatro merges alteraram frontend e
documentação; ausência de novo CI Backend em cada merge não comprova falha.
Consultar o [guia CI/CD](../development/ci-cd.md) para interpretar cada estado.

Nenhuma conta, regra de autorização, política de scanner, workflow ou imagem
hospedada foi alterada. A composição da próxima release permanece na #686.

## Fontes primárias

- [Concorrência no GitHub Actions](https://docs.github.com/en/actions/concepts/workflows-and-actions/concurrency).
- [Thresholds do k6](https://grafana.com/docs/k6/latest/using-k6/thresholds/).
- [Escopo do ZAP Baseline](https://www.zaproxy.org/docs/docker/baseline-scan/).
