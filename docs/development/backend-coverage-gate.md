# Cobertura consolidada do backend — #691

A CI já gera Cobertura nas três suítes .NET. O consolidador em Python usa apenas
a biblioteca padrão e atua como ferramenta de QA; Python não faz parte da API
ou das regras de acesso do produto.

## Método e escopo

- União dos hits por caminho canônico e número da linha: uma linha coberta em
  qualquer suíte conta uma vez, sem somar médias de percentuais.
- Cópias idênticas de relatórios TRX são ignoradas por hash.
- Mede os quatro projetos produtivos do backend. Exclui testes, bin/obj e
  migrations/snapshot EF gerados; estes continuam testados pela integração,
  mas suas linhas automáticas não inflam a métrica de código escrito à mão.
- Exige relatórios válidos e linhas executáveis dos quatro projetos; ausência,
  XML inválido, entidades XML e hits negativos falham de forma explícita.
- O piso inicial é **70% de linhas no backend consolidado**, sem arredondamento
  para ultrapassar o limite. Não é piso por projeto nem medição de branches.
- A meta crítica de 90% da #499/#507 e o frontend permanecem separados. Não
  reduzir os pisos preparados naquele PR nem apresentar este piso como a meta
  final da Unidade 2.

## Execução

Depois dos testes existentes com Cobertura:

```shell
python3 -m unittest discover -s infrastructure/ci/tests -p test_backend_coverage.py
python3 infrastructure/ci/summarize_backend_coverage.py artifacts/test-results --minimum-lines 70 --output artifacts/backend-coverage-summary
```

A CI publica `summary.json`/`summary.md` junto aos artefatos e no resumo da
execução. Não depende de Sonar, serviço externo, token adicional ou novo teste
redundante das mesmas suítes. O comando sai com código 1 abaixo do piso e 2
quando não pode medir.

## Linha de base identificada

Em 12/11/2026 foi consolidado o artefato GitHub `13882568036` da main
`4f4f567b0086f4ab176ab46510a744b274e2140f`, execução de 11/11. É evidência desse
snapshot; não é nova execução de testes nem medição de candidatos posteriores.

| Projeto                                | Cobertas | Executáveis |     Linhas |
| -------------------------------------- | -------: | ----------: | ---------: |
| Domain                                 |      682 |         738 |     92,41% |
| Application                            |     2553 |        2716 |     94,00% |
| Infrastructure, sem migrations geradas |     3043 |        3181 |     95,66% |
| API                                    |     2364 |        2636 |     89,68% |
| Backend consolidado                    |     8642 |        9271 | **93,22%** |

Sem a exclusão de migrations geradas, o resultado seria 96,58%; esse número
não foi escolhido para avaliar código de negócio. Não há evidência nesta tarefa
para afirmar porcentagem consolidada do frontend, cobertura de 100% ou ausência
de bugs. O gate foi incorporado pelo #697 e executado com sucesso na main `8b61ccd`.

## Medição automática após incorporação

A execução [43343801016](https://github.com/ifpebj-ti/controle-acesso-veiculos/actions/runs/43343801016)
concluiu com sucesso na main `8b61ccd38b4c9b2e73783a6a3fdccf9a388c10a9`.
O artefato `13999454597` contém `backend-coverage-summary/summary.json` e
`summary.md`, além dos TRX. Os TRX registram 88 Domain, 141 Application e 285
integração, todos aprovados. O sufixo do nome do artefato é o número da execução.

| Projeto             | Cobertas | Executáveis |     Linhas |
| ------------------- | -------: | ----------: | ---------: |
| Domain              |      700 |         756 |     92,59% |
| Application         |     2639 |        2786 |     94,72% |
| Infrastructure      |     3168 |        3313 |     95,62% |
| API                 |     2431 |        2704 |     89,90% |
| Backend consolidado |     8938 |        9559 | **93,50%** |

O resumo identifica três relatórios únicos entre seis arquivos. O mesmo método
preserva o piso global de 70% e a exclusão de código gerado. A métrica de linhas
do backend não mede branches, frontend ou a homologação dos fluxos.

## Coordenação com #507

O #507 prepara gates independentes de Domain/Application e cobertura frontend,
com testes e métricas mais estritos. Este recorte adiciona consolidação global
backend em outra issue e não descarta o trabalho existente. Ao sincronizar o
#507, manter a consolidação deste arquivo e seus passos da CI, junto aos gates
críticos, sem duplicar execução desnecessária ou reduzir limites.
