# Quality Gate

## Estado

**Implementação versionada:** preparada na Issue #219.

**Ativação externa:** pendente até existir um projeto real no SonarQube Cloud e
as configurações protegidas do repositório.

**Badge:** não deve ser publicado antes da primeira análise válida.

## Decisão

O projeto adotará o SonarQube Cloud como análise estática centralizada do
monorepo. A escolha complementa, sem substituir, `dotnet format`, analisadores
.NET, ESLint, testes, Dependency Review e scans das imagens.

A mesma análise cobre C#, JavaScript e TypeScript e recebe os relatórios:

- OpenCover produzido pelas suítes .NET;
- LCOV produzido pelo Vitest;
- resultados de testes mantidos como artefatos por 14 dias.

O Quality Gate inicial deve usar o perfil mantido pelo serviço para **código
novo**, evitando transformar dívida histórica em aprovação cosmética ou bloquear
toda evolução antes de uma baseline real. Espera-se que código novo não introduza
problemas de confiabilidade ou segurança, mantenha hotspots revisados, limite
duplicação e preserve cobertura compatível com o gate configurado no serviço.

## Execução segura

O workflow `.github/workflows/quality-gate.yml` executa somente quando a variável
`SONAR_ENABLED` possui o valor `true`.

Configurações necessárias no GitHub:

| Tipo     | Nome                 | Conteúdo                                                       |
| -------- | -------------------- | -------------------------------------------------------------- |
| Variable | `SONAR_ENABLED`      | `true`, somente após toda configuração estar pronta            |
| Variable | `SONAR_ORGANIZATION` | identificador público da organização no SonarQube Cloud        |
| Variable | `SONAR_PROJECT_KEY`  | chave pública do projeto criado no serviço                     |
| Secret   | `SONAR_TOKEN`        | token de análise; nunca registrar em arquivo, log, Issue ou PR |

Pull Requests originados no próprio repositório podem receber o segredo durante
o job. Pull Requests de forks são ignorados pelo job centralizado porque o GitHub
não fornece secrets a código não confiável. Não se usa `pull_request_target` para
executar código do PR com privilégios.

As verificações existentes continuam obrigatórias mesmo quando a análise externa
é ignorada ou está indisponível. Falha real do Quality Gate deve falhar o job; não
se deve adicionar `continue-on-error` para mascará-la.

## Ativação administrativa

1. Um administrador da organização importa
   `ifpebj-ti/controle-acesso-veiculos` no SonarQube Cloud.
2. Configura o método de análise como CI e desativa análise automática, evitando
   resultados duplicados.
3. Confirma a definição de código novo e o Quality Gate aplicável.
4. Cria um token de análise com o menor escopo disponível.
5. Registra as duas variables e o secret no GitHub.
6. Define `SONAR_ENABLED=true` por último.
7. Reexecuta o workflow e confirma métricas, Quality Gate e decoração do PR.
8. Somente depois adiciona badge apontando para o projeto real e avalia tornar o
   check obrigatório na proteção da `main`.

## Baseline de 15 de setembro de 2026

A baseline serve para decisão, não como promessa de qualidade absoluta:

- frontend: 275 testes aprovados; 89,04% de linhas, 85,76% de statements,
  78,61% de branches e 88,50% de funções no relatório V8;
- backend na última execução verde disponível: 81,22% de linhas no domínio,
  47,50% na aplicação e 94,97% na suíte de integração/infraestrutura;
- uma tentativa local posterior confirmou os 96 testes unitários, mas a suíte de
  integração ficou indisponível porque o Docker Desktop estava desligado; esse
  resultado parcial não foi usado como aprovação.

Os números podem mudar conforme classificação de código gerado e combinação dos
relatórios pelo SonarQube Cloud. O valor oficial será o primeiro resultado real
publicado pelo serviço.

## Limitações e tratamento

- análise estática produz falsos positivos; cada caso deve ser revisado e ter
  justificativa, nunca ser suprimido em massa;
- cobertura mede execução, não qualidade das asserções nem cenários ausentes;
- indisponibilidade do serviço externo não autoriza remover testes ou linters;
- o token deve ser rotacionado se houver suspeita de exposição;
- métricas e badge não significam homologação institucional nem prontidão para
  produção.
