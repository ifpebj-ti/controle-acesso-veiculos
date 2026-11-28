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

Após os incrementos da Issue #499 e a sincronização com a `main` em 28/10/2026,
585 testes elevaram o resultado para:

| Métrica      | Cobertos | Total | Percentual |
| ------------ | -------: | ----: | ---------: |
| Linhas       |    3.501 | 3.858 |     90,74% |
| Instruções   |    3.665 | 4.180 |     87,67% |
| Funções      |      982 | 1.079 |     91,01% |
| Ramificações |    2.509 | 3.130 |     80,15% |

A CI aplica um piso global de 90% para linhas e funções, 87% para instruções e 79%
para ramificações. Esses valores impedem regressão imediata sem declarar que todas as
métricas já atingiram a meta final. Os pisos devem subir junto com testes novos; não
devem ser reduzidos para acomodar uma mudança.

Em 01/11/2026, após sincronizar o candidato #507 com a main `6a787c3`, a execução
completa sequencial passou com **585 testes em 57 arquivos**. A remoção já
incorporada do código de demonstração alterou o denominador, sem retirar código
adicional do conjunto medido neste incremento:

| Métrica      | Cobertos | Total | Percentual |
| ------------ | -------: | ----: | ---------: |
| Linhas       |    3.501 | 3.829 |     91,43% |
| Instruções   |    3.665 | 4.150 |     88,31% |
| Funções      |      982 | 1.067 |     92,03% |
| Ramificações |    2.509 | 3.125 |     80,28% |

O ganho desta medição não deve ser atribuído a novos testes de interface: os
numeradores permaneceram iguais aos da fotografia anterior. Instruções e
ramificações continuam abaixo de 90%; a Issue #499 permanece aberta.

## Backend

### Nova medição após sincronização — 01/11/2026

O candidato #507 foi sincronizado com a main `6a787c3`. A primeira medição
encontrou regressão de ramificações: domínio 89,71% e aplicação 89,38%. Os pisos
de 90% foram preservados. Testes adicionais cobrem validação de cotas e limites
de autorizações de veículos em eventos, recusa de alteração do próprio perfil,
validação antes de persistência e emissão de credencial temporária apenas para
Administrador Local. Os testes anteriores foram preservados.

| Camada      | Testes aprovados | Linhas | Ramificações |
| ----------- | ---------------: | -----: | -----------: |
| Domain      |              128 | 92,35% |       90,88% |
| Application |              167 | 93,47% |       90,25% |

Esses valores são medições independentes das duas suítes unitárias no candidato,
não cobertura consolidada da API, infraestrutura ou fluxos com PostgreSQL.

O verificador de Cobertura agora rejeita valores não finitos, taxas fora de
0–1, separadores decimais incompatíveis, pacotes duplicados e ausência ou
ambiguidade de relatórios. Dezesseis cenários de regressão offline exercitam
aceitação do piso exato e rejeições; seis deles reproduziram aceitação incorreta
antes da correção. A CI executa o teste do verificador antes de aplicar os pisos.
Não houve exclusão de código, redução de limite ou alteração funcional.

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

Após os incrementos de segurança da Issue #499, a suíte de Application passou de 90
para 157 testes e elevou a cobertura do assembly `Application` para 93,42% de linhas
e 90,25% de ramificações. O serviço de renovação e encerramento de sessão, as
políticas de sessão e credencial temporária, a geração de relatórios administrativos
e o bootstrap do primeiro administrador atingiram 100% de linhas e ramificações em
testes unitários diretos. Isso cobre rotação, reutilização de token, inatividade,
credencial expirada, perfil inativo, logout, confirmação de exportação, falhas de PDF
e inicialização segura sem representar 100% do backend inteiro. Os testes de eventos
também cobrem busca e paginação inválidas, limites de campos e regras, normalização e
mapeamento dos resultados de criação, atualização e cancelamento. O registro de
acessos cobre ainda conflitos de evento/candidato, campos opcionais, filtros e
correções; o login cobre conta ausente/inativa, bloqueio, rehash e auditoria.

Na suíte de Domain, 45 cenários adicionais elevaram o total de 78 para 123 testes e a
cobertura do assembly de 85,23% para 93,63% de linhas e de 74,71% para 90,59% de
ramificações. O incremento verifica invariantes de categorias, perfis, vínculo entre
pessoa e veículo, ciclo de vida da sessão, autenticação local/Google e eventos. Os
caminhos negativos cobrem limites, autoria, períodos, bloqueio, credencial temporária
e transição de método de autenticação, sem alterar o código de produção.

A CI mede `Domain` e `Application` novamente em diretórios isolados e bloqueia
regressões abaixo de 90% tanto em linhas quanto em ramificações. O verificador exige
exatamente um relatório e o assembly esperado, evitando aprovação acidental com
artefato ausente ou pertencente a outra suíte.

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
