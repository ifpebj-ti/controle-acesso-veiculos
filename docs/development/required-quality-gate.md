# Gate estável de qualidade por PR

Rastreabilidade #661/#726/#732. Implementação incorporada pelo PR #722;
ativação conferida sobre main `2fe61b1` em 15/11/2026.

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

Após a incorporação humana do #722 e os ensaios de sucesso, falha e
cancelamento, a proteção foi atualizada e relida pela API em 15/11:

- `Quality Gate` obrigatório, restrito ao GitHub Actions (`app_id=15368`).
- `strict=true`: a branch precisa estar atualizada com a base.
- Uma revisão obrigatória e `dismiss_stale_reviews=true` preservados.
- Resolução de conversas obrigatória; force-push e exclusão da main proibidos.
- `enforce_admins=false` preservado: administradores ainda possuem exceção.
- CODEOWNERS e aprovação do último push não foram tornados obrigatórios.

A configuração não elimina o poder de exceção dos administradores. Alterar essa
política continua sendo decisão dos mantenedores institucionais. No fluxo
normal, falha, ausência ou cancelamento do gate impedem a integração. Não usar
bypass como rotina para contornar falhas. Os demais campos da proteção foram
comparados antes/depois e preservados; nenhum PR foi incorporado pelo agente.

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
