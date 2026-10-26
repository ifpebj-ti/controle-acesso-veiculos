# Cobertura de testes

## Objetivo e estado

Cobertura mede quais instruções e decisões foram exercitadas durante os testes. Ela
ajuda a encontrar lacunas, mas não comprova sozinha a correção, a segurança ou a
qualidade dos cenários. A meta oficial da Unidade 2 é demonstrar pelo menos 90% no
recorte crítico aprovado, sem excluir código relevante apenas para elevar o número.

Em 26/10/2026, a medição inicial confirmou que o projeto ainda não pode declarar
essa meta como concluída. Este documento estabelece uma linha de base reproduzível;
o limiar de 90% somente será ativado depois que o recorte crítico for aprovado e as
lacunas correspondentes receberem testes significativos.

## Frontend

Execute a partir de `src/frontend`:

```bash
npm ci
npm run test:coverage
```

O Vitest mede os arquivos TypeScript e TSX em `src/`, excetuando apenas os próprios
testes, a configuração compartilhada de teste, a declaração de tipos do Vite e o
ponto de montagem `main.tsx`. Componentes, páginas, hooks, serviços, schemas e regras
de autorização permanecem incluídos.

Linha de base local de 26/10/2026, com 554 testes:

| Métrica      | Cobertos | Total | Percentual |
| ------------ | -------: | ----: | ---------: |
| Linhas       |    3.431 | 3.843 |     89,27% |
| Instruções   |    3.592 | 4.164 |     86,26% |
| Funções      |      951 | 1.073 |     88,63% |
| Ramificações |    2.486 | 3.120 |     79,67% |

Após o primeiro incremento da Issue #499, 567 testes elevaram o resultado para:

| Métrica      | Cobertos | Total | Percentual |
| ------------ | -------: | ----: | ---------: |
| Linhas       |    3.482 | 3.843 |     90,60% |
| Instruções   |    3.645 | 4.164 |     87,53% |
| Funções      |      975 | 1.073 |     90,86% |
| Ramificações |    2.494 | 3.120 |     79,93% |

A CI aplica um piso global de 90% para linhas e funções, 87% para instruções e 79%
para ramificações. Esses valores impedem regressão imediata sem declarar que todas as
métricas já atingiram a meta final. Os pisos devem subir junto com testes novos; não
devem ser reduzidos para acomodar uma mudança.

## Backend

Execute na raiz do repositório, com o Docker disponível para a suíte de integração:

```bash
dotnet restore src/backend/ControleAcessoVeiculos.slnx --locked-mode
dotnet build src/backend/ControleAcessoVeiculos.slnx --configuration Release --no-restore
dotnet test src/backend/ControleAcessoVeiculos.slnx \
  --configuration Release \
  --no-build \
  --no-restore \
  --coverage \
  --coverage-output-format cobertura \
  --report-trx \
  --results-directory artifacts/test-results
```

A execução oficial da CI na `main` em 26/10/2026 registrou os seguintes valores por
suíte e assembly. Eles não devem ser somados nem tratados como um único percentual,
pois as suítes medem conjuntos sobrepostos em processos diferentes.

| Suíte      | Assembly crítico | Linhas | Ramificações |
| ---------- | ---------------- | -----: | -----------: |
| Domínio    | Domain           | 85,23% |       74,71% |
| Aplicação  | Application      | 79,26% |       76,17% |
| Integração | Domain           | 84,42% |       61,47% |
| Integração | Application      | 86,70% |       66,30% |
| Integração | API              | 82,81% |       60,96% |
| Integração | Infrastructure   | 97,52% |       94,37% |

Após o primeiro incremento de segurança da Issue #499, a suíte de Application passou
de 90 para 127 testes e elevou a cobertura do assembly `Application` para 90,32% de
linhas e 83,09% de ramificações. O serviço de renovação e encerramento de sessão, as
políticas de sessão e credencial temporária, a geração de relatórios administrativos
e o bootstrap do primeiro administrador atingiram 100% de linhas e ramificações em
testes unitários diretos. Isso cobre rotação, reutilização de token, inatividade,
credencial expirada, perfil inativo, logout, confirmação de exportação, falhas de PDF
e inicialização segura sem representar 100% do backend inteiro.

Na suíte de Domain, 21 cenários adicionais elevaram o total de 78 para 99 testes e a
cobertura do assembly de 85,23% para 90,11% de linhas e de 74,71% para 77,35% de
ramificações. O incremento verifica invariantes de categorias, perfis, vínculo entre
pessoa e veículo e ciclo de vida da sessão; ramificações ainda permanecem abaixo do
limiar final e continuam visíveis como trabalho pendente.

## Evidência na CI

As esteiras de backend e frontend publicam relatórios por 14 dias. Os artefatos
contêm resultados de teste e cobertura, mas não credenciais nem dados de produção.
O frontend publica somente o resumo JSON e o relatório Cobertura XML; relatórios HTML
com cópias navegáveis do código não são anexados.

## Evolução até o limiar

1. Aprovar com equipe e orientadores quais módulos e fluxos formam o recorte crítico.
2. Priorizar autenticação, autorização, sessão, acessos, eventos, relatórios e
   persistência antes de código puramente apresentacional.
3. Acrescentar testes de comportamento e integração para decisões ainda não
   exercitadas; não substituir cenários reais por mocks somente para elevar cobertura.
4. Repetir e registrar a medição após cada incremento.
5. Elevar progressivamente os pisos da CI até que cada métrica aprovada alcance 90%.

Migrations, código gerado e pontos de inicialização podem ser avaliados separadamente,
mas toda exclusão precisa de justificativa técnica registrada. Não é permitido reduzir
o conjunto medido, remover testes ou ignorar falhas para produzir cobertura fictícia.
