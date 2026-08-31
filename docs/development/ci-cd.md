# CI/CD e segurança de containers

## Estado

Esta página documenta a fundação de integração contínua iniciada na Issue #25 e
ampliada pela Issue #90. Os workflows validam código e imagens em Pull Requests e
publicam imagens verificadas no GitHub Container Registry após integração na
`main`. A publicação no registry não realiza deploy nem torna o sistema pronto
para produção.

## Workflows

| Workflow | Gatilho | Verificações |
|---|---|---|
| CI - Backend | Alterações do backend e de suas regras de formato | restore, `dotnet format`, build Release com warnings como erros, suíte automatizada e cobertura |
| CI - Frontend | Alterações do frontend | `npm ci`, ESLint e build Vite |
| CI - Containers | Código, Dockerfiles, Compose ou contexto Docker | build isolado e Trivy nas duas imagens; smoke test integrado de PostgreSQL, API e frontend; após push na `main`, novo build, novo scan e publicação no GHCR |
| CI - Database recovery | Scripts de backup ou configuração local do PostgreSQL | dump lógico, restauração completa em banco isolado e limpeza dos recursos temporários |
| Dependency Review | Toda Pull Request | bloqueio de novas dependências com vulnerabilidade alta ou crítica |

Todas as actions de terceiros estão fixadas por SHA de commit e acompanhadas do
número da release auditada. Os jobs de validação usam apenas `contents: read`. O
job de publicação, restrito a push na `main`, acrescenta `packages: write`.
Todos os workflows cancelam execuções obsoletas da mesma referência e possuem
timeout.

Os resultados TRX e Cobertura do backend são mantidos por 14 dias. Cobertura é evidência de apoio; não substitui revisão de cenários, risco e qualidade dos testes.

## Dependabot

O Dependabot verifica semanalmente:

- pacotes NuGet do backend;
- pacotes npm do frontend;
- imagens base dos Dockerfiles de backend e frontend;
- GitHub Actions.

As atualizações continuam sujeitas aos mesmos testes e à mesma revisão de uma Pull Request comum. Dependabot não autoriza merge automático.

Atualizações major do toolchain frontend são deliberadas: propostas para Node 26 e TypeScript 7 continuam visíveis, mas só devem ser mescladas depois de cumprirem os critérios de compatibilidade e LTS da Issue #41. O projeto não suprime alertas de novas versões ou correções de segurança.

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

## Smoke test integrado do Compose

O job `Run integrated Compose smoke test` valida uma propriedade diferente dos
builds isolados: confirma que o arquivo Compose versionado consegue iniciar
PostgreSQL, API e frontend em conjunto. O job:

1. gera senha de banco e chave JWT efêmeras, mascara os valores e os mantém
   somente no ambiente do runner;
2. usa um nome de projeto exclusivo da execução e solicita portas aleatórias ao
   Docker, evitando colisões com outras stacks;
3. valida a configuração sem imprimir os valores resolvidos;
4. constrói e inicia os três serviços;
5. exige resposta `Healthy` de `/health/ready` e o HTML esperado do frontend;
6. mostra estado e logs somente quando há falha;
7. remove containers, rede e volume descartáveis mesmo após erro.

O job não aplica migrations, não cria usuário, não usa dados institucionais e não
substitui testes funcionais ou homologação. A publicação no GHCR depende do smoke
test, impedindo a distribuição automática de uma revisão cuja stack integrada
não inicia.

## Análise de imagens

Em Pull Requests e branches de trabalho, cada imagem é construída sem `push` e
carregada apenas no runner. O Trivy falha em vulnerabilidades HIGH ou CRITICAL
para as quais existe correção. Em um push na `main`, o job de publicação
reconstrói e analisa a imagem com o nome final antes de autenticar no registry e
enviar qualquer tag.

Vulnerabilidades ainda sem correção permanecem visíveis no relatório, mas não
bloqueiam automaticamente a pipeline para evitar um estado impossível de
corrigir no repositório.

Essa exceção deve ser reavaliada periodicamente. Uma vulnerabilidade explorável sem correção pode exigir troca da imagem base, mitigação adicional ou aceitação formal de risco.

## Publicação em registry

Depois que uma alteração é integrada à `main`, o workflow publica:

| Componente | Imagem |
|---|---|
| Backend | `ghcr.io/ifpebj-ti/controle-acesso-veiculos-backend` |
| Frontend | `ghcr.io/ifpebj-ti/controle-acesso-veiculos-frontend` |

Cada pacote recebe duas tags:

- `sha-<commit>`: referência imutável por convenção para rastrear exatamente o
  código que originou a imagem;
- `main`: referência móvel para o último commit integrado e aprovado pela
  esteira.

Exemplo de download da imagem rastreável do backend:

```bash
docker pull ghcr.io/ifpebj-ti/controle-acesso-veiculos-backend:sha-<commit>
```

O workflow usa o `GITHUB_TOKEN` efêmero do job e autentica somente depois do
scan. Pull Requests não executam o job de publicação e permanecem sem
`packages: write`. Nenhum token de registry deve ser adicionado ao repositório.

O primeiro push cria os packages no escopo da organização. A visibilidade do
package é uma decisão administrativa: se a equipe precisar permitir download
anônimo para apresentação acadêmica, um responsável da organização deverá
alterá-la para pública nas configurações do package. Enquanto o package for
privado, o download local exige autenticação no GHCR com permissão
`read:packages`.

Publicar uma imagem não promove a aplicação para homologação ou produção. Antes
de qualquer deploy real, a equipe ainda precisa definir:

- ambiente e responsável pela implantação;
- política de retenção das imagens;
- geração de SBOM, assinatura e verificação de proveniência;
- aprovação de promoção entre desenvolvimento, homologação e produção;
- estratégia de rollback e resposta a vulnerabilidades.

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
