# Análises de segurança: SAST, DAST e componentes

Rastreabilidade: #634. Configuração conferida em 08/11/2026; base main 58670be.
Este mapa descreve controles existentes, sem habilitar uma ferramenta nova.

## O que temos

| Abordagem                       | Ferramenta existente                                      | O que examina                                                | Onde conferir                                                 |
| ------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| SAST                            | CodeQL                                                    | Fluxos e padrões de segurança no código                      | Checks `CodeQL` e `Analyze` dos PRs; Security → Code scanning |
| Qualidade estática complementar | ESLint, analisadores C# e compilação com avisos como erro | Convenções, erros e regras habilitadas do código             | CI Frontend e CI Backend                                      |
| DAST baseline                   | OWASP ZAP passivo                                         | Respostas HTTP da aplicação descartável em execução          | CI Containers → smoke integrado → baseline ZAP e artefatos    |
| Análise de componentes          | Trivy, Dependency Review e Dependabot                     | Pacotes, imagens, dependências e vulnerabilidades conhecidas | CI Containers, Dependency Review e alertas do repositório     |

SAST lê o código; DAST observa o sistema rodando. Análise de componentes verifica
o que usamos para construir e executar o sistema. São camadas complementares.
SBOM é um inventário e proveniência registra a origem do artefato; nenhum deles,
isoladamente, é um teste de segurança da aplicação.

## CodeQL: configuração real

A consulta autenticada `gh api repos/ifpebj-ti/controle-acesso-veiculos/code-scanning/default-setup`
retornou `state=configured`, suite `default`, threat model `remote` e agendamento
semanal. A lista retornada contém C#, JavaScript/TypeScript, Python e Actions;
os aliases de linguagem da API não representam ferramentas adicionais.
Checks de análise também foram observados nos PRs do projeto.

Esse default setup é administrado pelo GitHub. Por isso, a ausência de um
`codeql.yml` no diretório de workflows não significa ausência de SAST.
Não criar um segundo workflow CodeQL apenas para preencher essa ausência:
uma migração para configuração avançada exige decisão e coordenação próprias.

Os resultados de segurança ficam em
[Code scanning](https://github.com/ifpebj-ti/controle-acesso-veiculos/security/code-scanning).
As análises de qualidade ficam em
[Security and quality](https://github.com/ifpebj-ti/controle-acesso-veiculos/security/quality).
Um check concluído confirma a execução; a triagem de alertas e as métricas têm
seus próprios resultados. Não interpretar check verde como prova de que todo
o código está seguro ou de que uma avaliação de qualidade está satisfatória.

## ZAP: alcance do que está automatizado

O workflow [`ci-containers.yml`](../../.github/workflows/ci-containers.yml) sobe
uma stack descartável e executa `zap-baseline.py` na sua rede. O alvo desse
baseline não é automaticamente o site hospedado e não usa uma sessão de operador
para percorrer todos os fluxos autenticados.

São gerados relatórios HTML, JSON e Markdown, publicados como artefatos do job.
A [política e os limites do baseline](dynamic-application-security-testing.md)
explicam `FAIL`, `WARN`, retenção e o exemplo histórico sanitizado. Relatório
antigo não comprova a situação da versão atual.

Esse baseline passivo não é pentest completo, scan ativo autenticado ou teste
de todas as regras de negócio. Autorização por perfil, sessão, concorrência,
auditoria e correção de registros também precisam de testes específicos e
validação integrada. Nenhum escaneamento novo da hospedagem é declarado aqui.

## Componentes, gates e evidência

O CI de containers bloqueia achados CRITICAL e HIGH corrigíveis segundo a
política versionada; achados HIGH também são reportados. Não transformar um
gate aprovado em afirmação automática de zero HIGH em todas as categorias.
O resultado deve informar a imagem, arquitetura, ferramenta e momento do scan.

Uma CVE recém-publicada pode aparecer em um artefato anteriormente sem achados,
como ocorreu com APT na #626. O patch na fonte e a promoção na VM são etapas
distintas; a #628 acompanha a conferência operacional. Não ignorar CVE nem
reduzir severidade para obter um resultado verde.

Ao apresentar a segurança do projeto, vincular fonte/SHA, execução e resultado,
distinguindo análise estática, baseline dinâmico, componentes, testes funcionais
e aceite humano. Senhas, tokens, cookies, HAR bruto e dados reais não pertencem
às evidências públicas.

## Referências internas

- [Guia seguro](secure-development-guide.md).
- [Modelo de ameaças](threat-model.md).
- [CI Frontend](../../.github/workflows/ci-frontend.yml).
- [CI Backend](../../.github/workflows/ci-backend.yml).
- [Política do ZAP](../../infrastructure/security/zap-baseline.conf).
