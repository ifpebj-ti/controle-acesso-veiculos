# Conferência das pendências acadêmicas — 12/11/2026

Esta é uma conferência sanitizada do novo relatório recebido, não sua cópia nem
uma atribuição própria de nota. O relatório descreve o repositório como referência,
mas enumera lacunas residuais que precisam de verificação por fonte e data.

| Item                                  | Conferência atual                                                                                                                                                   | Ação / limite                                                                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cobertura                             | A CI já disponibiliza Cobertura; artefato da main 4f4f567 consolidado: backend escrito à mão 8642/9271 linhas, 93,22%                                               | #691 acrescenta consolidação e piso de 70%; candidato não é gate já ativo na main. Frontend e meta crítica de branches da #499/#507 continuam separados       |
| GitHub Projects                       | Quadro privado #43 já existia e estava vinculado, com 380 itens e 18 campos no inventário inicial                                                                   | #692 preservou o quadro, conferiu issues, corrigiu estado residual e publicou orientação. Uma consulta sem visibilidade não comprova ausência de board        |
| Releases                              | v0.4.0 continua sendo a release estável; v0.5.0 é draft, não tag publicada                                                                                          | #686 precisa concluir composição frontend/backend antes de publicação; a main isolada não contém todo frontend Google/contas hospedado                        |
| Atualização da VM                     | Backend 812b71e/runtime 10.0.15 foi instalado e conferido pela #677; 162/162 testes HTTPS nos três perfis locais disponíveis, com relato positivo Google do titular | Imagem operacional identificada não é publicação da release GHCR. Frontend permaneceu 7dd02a6 e não recebeu automaticamente todos os merges                   |
| Automação de versão/changelog/release | Planejamento da versão e edição do changelog ainda são manuais; publicação de imagens por tag já é automatizada                                                     | Automatizar proposta revisável e publicação segura é trabalho próprio; não adicionar release/tag a cada merge sem verificar composição, gates e imutabilidade |
| Alertas de segurança                  | Consulta autenticada em 12/11: Dependabot e code scanning retornaram zero alertas abertos                                                                           | Isso é fotografia dessas APIs; não substitui scanner de imagens, avaliação externa, revisão e teste de autorização                                            |
| Quality Gate e carga                  | Existem propostas #507 e #515; sua presença em branch não prova proteção da main ou teste operacional concluído                                                     | Sincronizar sem duplicar trabalho e executar evidências apropriadas; não encerrar #499/#502 apenas por contagem de testes                                     |

## Precisões importantes

- A #686 foi criada em 11/11/2026; não estava aberta há semanas no relatório
  consultado em 12/11. As datas de changelog e publicação em UTC podem cair em
  dias diferentes sem indicar tag incorreta.
- SBOM externo e atestações OCI no registry são coisas distintas. A publicação
  deixou de usar atestações OCI conforme decisão anterior; não reintroduzi-las
  apenas por uma frase genérica do relatório. Scanner/SBOM continuam necessários.
- Nenhum PR recente de Dependabot é prova de zero vulnerabilidades. A confirmação
  atual foi feita pelas APIs de alertas, com credencial autorizada.
- A ausência de `latest` ou uma tag `main` antiga não exige tag mutável nova. O
  processo vigente promove versões explícitas e imutáveis. O problema real é
  fechar lotes pequenos com frequência e efetivamente promovê-los.
- Cobertura elevada não comprova qualidade de todas as asserções, branches,
  acessibilidade, desempenho ou segurança. Não somar percentuais de backend e
  frontend nem inflar o resultado contando relatórios duplicados/migrations.

## Projects e visibilidade

Quadro canônico: [controle-acesso-veiculos — #43](https://github.com/orgs/ifpebj-ti/projects/43).
Permanece privado. A conta pode ter permissão na organização e, ainda assim,
a credencial de terminal não possuir escopo `project`. Renovar esse escopo
permitiu inventariar o quadro; não criou nova permissão institucional no projeto.

## Prioridade técnica

1. Incorporar os gates e contratos revisados com checks obrigatórios verdes.
2. Integrar as telas de categorias/cadastro com o backend correspondente e
   validar em composição identificada, sem confundir dados fictícios com uso real.
3. Concluir a composição da release e automatizar seus passos controlados,
   preservando o frontend Google/contas e a segurança da exportação.
4. Produzir as evidências restantes de operação, carga, backup externo e
   recuperação. Não atribuir 100% da Unidade 1/2 apenas ao parecer favorável.

Referências de medição: [gate backend](../development/backend-coverage-gate.md)
e [cadência de releases](../operations/release-cadence.md). O relatório original
permanece fora do Git; credenciais, logs brutos e dados pessoais não foram copiados.
