# Ciclo automatizado e revisável de releases — #698

## Estado e limites

Candidato de automação, ainda não executado para publicar uma release real.
A #686 continua acompanhando a composição e promoção de 0.5.0; não a publicar
antes de preservar o frontend Google/contas e fechar os critérios correspondentes.
Não há deploy automático à Oracle, novo PAT, token duradouro ou merge por agente.

## Fluxo

1. Abrir uma issue **de preparação** com fonte/composição, versão e critérios de
   revisão. Não usar como pré-condição circular uma issue que só termina depois
   da publicação ou do deploy; estes permanecem em acompanhamento separado.
2. Em Actions, executar `Release - Reviewed lifecycle`, escolhendo `patch` ou
   `minor` e o número da issue. A versão é calculada pela última seção datada do
   changelog: 0.4.0 → patch 0.4.1 ou minor 0.5.0; depois 0.5.1, 0.5.2 etc.
3. O workflow move somente o lote Unreleased incorporado para uma seção datada,
   cria branch `chore/issue-N-release-vX.Y.Z` e tenta abrir PR **draft**. Se a
   política impedir PRs de bot, entrega o link para um responsável abrir a
   proposta. A branch preparada não é PR aprovado nem release. Não cria tag,
   publica imagens, aprova ou incorpora esse PR.
4. Conferir os workflows do PR. Segundo a documentação atual do GitHub, eventos
   opened/synchronize/reopened criados com GITHUB_TOKEN podem gerar execuções
   aguardando aprovação. Usar “Approve workflows to run” quando o GitHub
   apresentar essa opção. Se a política efetiva exigir uma ação humana adicional,
   reabrir a proposta com a conta responsável e conferir os gates do SHA revisado.
5. Após o merge humano da preparação, o job privilegiado lê a versão de um nome
   de branch estrito, verifica o commit incorporado à main e exige notas datadas.
   Cria tag anotada imutável e usa `workflow_dispatch` explicitamente para rodar
   CI Containers na tag. Não presume que o push feito pelo token dispare a CI.
6. O pipeline existente continua construindo e analisando as duas arquiteturas,
   executando smoke/ZAP e publicando os manifests de backend/frontend.
   A GitHub Release é publicada **somente depois de ambos manifests passarem**.
   Um draft existente é atualizado com notas da fonte real; release publicada
   é preservada. Tag com outro SHA causa falha, nunca force-update.
7. Conferir os artefatos e promover a versão à VM segundo o
   [runbook](versioned-container-deployment.md), com backup/rollback e evidências.
   Atualizar referências de instalação/Wiki separadamente após publicação real.

## Segurança e configuração do repositório

O token padrão continua somente leitura. Permissões de escrita são concedidas
apenas aos jobs necessários: proposta recebe contents/pull-requests; tag após
merge recebe contents/actions; publicação final recebe contents. PRs externos
não executam os jobs privilegiados, e não é usado pull_request_target.

A configuração atual mantém o token padrão somente leitura e não habilita
aprovações de PR por Actions. A opção administrativa de criar/aprovar PRs pode
ser imposta pela organização. A ferramenta respeita a política: se a criação
por bot for negada, prepara a branch e apresenta o link para abertura humana.
Não acrescentar PAT nem liberar autoaprovação para contornar a restrição.
CODEOWNERS, regras e revisões continuam obrigatórios. Quando a abertura é feita
pela conta humana, não é necessária a reabertura para provocar a CI inicial.

Todos os valores de evento passam por variáveis de ambiente e validação em
Python; não são executados como texto de shell. O helper usa JSON em stdin para
as chamadas mutantes da API. `prepare`/`notes` podem ser testados sem API externa;
`tag`/`publish` são operações reais restritas ao fluxo revisado.

## Reexecução e falhas

- Falha de teste/scan/smoke impede a publicação correspondente.
- Tag já publicada com outro commit nunca é movida.
- Tag e release já publicadas para a mesma fonte não disparam rebuild automático.
- Se uma publicação parcial falhar, os controles de imutabilidade podem exigir
  nova versão após correção; não sobrescrever imagem para obter verde.
- Falha ao abrir PR pode deixar apenas a branch de preparação. Conferir estado
  antes de repetir; nenhum caminho faz force-push ou altera a main diretamente.
- A integração GitHub real e a primeira release desse fluxo precisam de evidência
  própria na #686. Testes locais dos parsers não comprovam essa execução.

## Validação local

```shell
python3 -m unittest discover -s infrastructure/ci/tests -p test_release_lifecycle.py
```

Os testes cobrem versão/branch inválidos, bump patch/minor, notas limitadas à
versão, changelog vazio/ausente e recusa de sobrescrita de tag. Nenhuma chamada
mutante real é feita nesses testes.

Fonte primária: [eventos e GITHUB_TOKEN](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).

## Complemento candidato — ciclo de release (#698, 12/11/2026)

A automação usa o GITHUB_TOKEN efêmero com escrita restrita por job. Preparação
cria branch e propõe PR draft conforme a política do repositório; criação de tag depende de merge humano de branch/versionamento
validados e source incorporado. Publicação de release depende dos manifests
verificados de ambas imagens e não faz deploy à VM. Não há autoaprovação,
automerge, pull_request_target, PAT adicional ou movimentação de tag existente.

Riscos residuais: revisão indevida da composição, comprometimento de mantenedor
ou workflow e publicação parcial. As mitigações são branch protegida, CODEOWNERS,
validação de fonte/notas, gates preservados, imutabilidade e recuperação explícita.
Execuções iniciadas pelo token podem aguardar aprovação humana conforme a
política efetiva do GitHub. Os checks precisam concluir no SHA revisado. Ver [procedimento e limites](../operations/release-automation.md).
