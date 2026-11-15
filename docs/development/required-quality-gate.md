# Gate estável de qualidade por PR

Rastreabilidade #661. Implementação candidata sobre main `b2b922b`.

O workflow `CI - Quality Gate` executa em cada PR, inclusive documental, e produz
o contexto `Quality Gate`. O helper lê o diff entre a base e a origem do evento,
incluindo os dois lados de uma renomeação. Os filtros `pull_request.paths` dos
oito workflows existentes determinam quais resultados serão exigidos.

Para documentação na raiz ou em `docs/`, o gate exige Dependency Review e executa
as regressões do próprio agregador. Backend, frontend, containers, dados fictícios,
recuperação e Terraform seguem os filtros já versionados. Alterações de código
analisável e workflows também exigem o resultado `CodeQL` do aplicativo
`github-advanced-security`, associado à mesma origem.

O agregador confere evento PR, número, SHA de origem e base. Uma execução mais
nova substitui a anterior. Falha, cancelamento, timeout ou execução requerida
omitida encerram o gate sem aprovação. Se o GitHub ainda estiver executando os
workflows, o helper aguarda com consulta a cada 30 segundos e limite de 50 minutos.
Os logs mostram nomes fixos de workflows e os estados necessários à operação.

O token efêmero recebe leitura de código, Actions, checks e PRs. O checkout
desativa persistência de credenciais. A automação de publicação conserva seu
fluxo próprio de tag/release. O agregador usa somente leitura da API.

## Manutenção dos filtros

O leitor valida o formato atual de listas de caminhos entre aspas duplas.
Filtros adicionais, padrões negativos ou outra representação YAML exigem
atualização do leitor e dos testes na mesma revisão. Uma representação não
suportada produz falha explícita. Os testes percorrem os oito workflows reais
para detectar divergência entre configuração e seleção do gate.

## Ativação na proteção da main

A leitura de configuração em 15/11 identificou uma revisão obrigatória,
`dismiss_stale_reviews=true`, `enforce_admins=false` e ausência de checks
obrigatórios na proteção consultada. A implementação desta issue deve receber
validação real antes da ativação do contexto.

Após o merge revisado e os ensaios, o administrador responsável configura
`Quality Gate` como check obrigatório do aplicativo GitHub Actions e exige a
branch atualizada com a base. A revisão existente continua fazendo parte dessa
configuração. CODEOWNERS e a aplicação das regras aos administradores exigem
decisão dos mantenedores institucionais, registrada na #661.

Um novo commit gera seu próprio gate. Se um workflow for reexecutado depois de
uma falha, reexecute também o gate para conferir o resultado atual. A publicação
de um candidato conserva a configuração efetiva até sua revisão e ativação.

## Validação

```shell
python3 -B -m unittest discover -s infrastructure/ci/tests -p test_quality_gate.py -v
```

Os cenários cobrem documento, código, infraestrutura, execução ausente,
cancelada, falha, timeout, origem/base/PR divergentes, reexecução e identidade
do aplicativo CodeQL. Um repositório Git temporário verifica renomeação real.
Os ensaios no GitHub recebem seus SHAs e resultados na Issue #661.

Referências primárias

- [Checks obrigatórios e filtros de caminhos](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks).
- [Verificação de execuções pela API](https://docs.github.com/en/rest/actions/workflow-runs#list-workflow-runs-for-a-repository).
- [Consulta de check runs](https://docs.github.com/en/rest/checks/runs#list-check-runs-for-a-git-reference).
