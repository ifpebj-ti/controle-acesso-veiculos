# CI/CD e segurança de containers

## Estado

Esta página documenta a fundação de integração contínua da Issue #25. Os workflows constroem e validam o código e as imagens, mas não publicam artefatos executáveis nem realizam deploy.

## Workflows

| Workflow | Gatilho | Verificações |
|---|---|---|
| CI - Backend | Alterações do backend e de suas regras de formato | restore, `dotnet format`, build Release com warnings como erros, 21 testes e cobertura |
| CI - Frontend | Alterações do frontend | `npm ci`, ESLint e build Vite |
| CI - Containers | Código, Dockerfiles, Compose ou contexto Docker | build isolado das duas imagens e Trivy para vulnerabilidades HIGH/CRITICAL corrigíveis |
| Dependency Review | Toda Pull Request | bloqueio de novas dependências com vulnerabilidade alta ou crítica |

Todas as actions de terceiros estão fixadas por SHA de commit e acompanhadas do número da release auditada. Os jobs usam apenas `contents: read`, cancelam execuções obsoletas da mesma referência e possuem timeout.

Os resultados TRX e Cobertura do backend são mantidos por 14 dias. Cobertura é evidência de apoio; não substitui revisão de cenários, risco e qualidade dos testes.

## Dependabot

O Dependabot verifica semanalmente:

- pacotes NuGet do backend;
- pacotes npm do frontend;
- imagens base dos Dockerfiles de backend e frontend;
- GitHub Actions.

As atualizações continuam sujeitas aos mesmos testes e à mesma revisão de uma Pull Request comum. Dependabot não autoriza merge automático.

## Controles dos containers

- O backend utiliza o usuário não privilegiado `app` fornecido pela imagem oficial .NET.
- O frontend utiliza a imagem Nginx unprivileged e escuta na porta interna 8080.
- Backend e frontend usam filesystem raiz somente leitura, `/tmp` temporário, `no-new-privileges` e remoção de capabilities Linux.
- O frontend instala dependências com `npm ci` e o lockfile versionado.
- O `.dockerignore` impede o envio de `.env`, segredos, metadados Git, dependências locais, resultados de teste e documentação para o contexto de build.

## Liveness e readiness

| Endpoint | Finalidade | Dependências |
|---|---|---|
| `GET /health` | Alias compatível de liveness | Nenhuma |
| `GET /health/live` | Confirmar que o processo HTTP responde | Nenhuma |
| `GET /health/ready` | Confirmar que a instância pode receber tráfego | Conexão com PostgreSQL |

Readiness retorna `503 Service Unavailable` quando o banco não pode ser acessado. A resposta expõe apenas `Healthy` ou `Unhealthy` e timestamp; exceções e detalhes da conexão não são retornados.

## Análise de imagens

Cada imagem é construída sem `push` e carregada apenas no runner. O Trivy falha em vulnerabilidades HIGH ou CRITICAL para as quais existe correção. Vulnerabilidades ainda sem correção permanecem visíveis no relatório, mas não bloqueiam automaticamente a pipeline para evitar um estado impossível de corrigir no repositório.

Essa exceção deve ser reavaliada periodicamente. Uma vulnerabilidade explorável sem correção pode exigir troca da imagem base, mitigação adicional ou aceitação formal de risco.

## Publicação em registry

A publicação automática foi avaliada e permanece desabilitada. Antes de enviar imagens a GHCR, OCIR ou outro registry, a equipe precisa definir:

- ambiente e responsável pela implantação;
- autenticação por identidade de curta duração ou token com privilégio mínimo;
- tags imutáveis por commit e política de retenção;
- geração de SBOM, assinatura e verificação de proveniência;
- aprovação de promoção entre desenvolvimento, homologação e produção;
- estratégia de rollback e resposta a vulnerabilidades.

Adicionar `push: true` ou credenciais ao workflow sem essas decisões não é permitido.

## Operação e revisão

Antes do merge:

1. Confirmar que todos os checks foram executados.
2. Revisar alertas do Trivy e do Dependency Review.
3. Confirmar que nenhum segredo apareceu no diff ou nos logs.
4. Verificar que alterações de dependência possuem justificativa.
5. Registrar exceções e riscos residuais na Pull Request.

## Referências oficiais

- [ASP.NET Core health checks](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/health-checks?view=aspnetcore-10.0)
- [.NET container images and non-root user](https://learn.microsoft.com/en-us/dotnet/core/docker/container-images#non-root-user)
- [GitHub Actions workflow permissions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions)
- [Dependabot options](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)
- [NGINX unprivileged image](https://github.com/nginx/docker-nginx-unprivileged)
- [Trivy Action](https://github.com/aquasecurity/trivy-action)
