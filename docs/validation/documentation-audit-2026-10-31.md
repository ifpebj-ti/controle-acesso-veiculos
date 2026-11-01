# Inventário documental e alcance das revisões

**Fotografia:** main `ad54c41835378ef5197747394b34194d52147806`, em 31/10/2026.<br>
**Rastreabilidade:** Issues #545, #548 e #549. Correção visual: Issue #550.

## Resposta objetiva sobre o alcance

A primeira auditoria #545 percorreu as **21 páginas existentes da Wiki**,
com foco em afirmações de estado, fontes, links, versões e divergências com o
código. Corrigiu 19 e preservou os dois registros históricos. Isso **não equivale
a revisar literalmente cada linha de toda a documentação do repositório**.

Nesta fotografia, o repositório contém **47 arquivos Markdown rastreados**,
somando **7.967 linhas**. Todos foram inventariados e submetidos a checagem
estrutural de links locais fora de blocos de código. Nenhum destino local
inexistente foi encontrado nessa checagem. Esse resultado não testa URLs
externas, fragmentos de seção, comandos, regras institucionais ou conteúdo de
PDFs/HTML/JSON e não comprova consistência semântica de todas as linhas.

Os arquivos acrescentados por esta issue não integram a contagem da fotografia
anterior. A lista abaixo registra a extensão real da verificação, sem transformar
um scanner de links em revisão humana integral.

## Leitura temática e achados

| Tema                   | Fonte/evidência confrontada                                   | Resultado e encaminhamento                                                                                                        |
| ---------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Login e sessão         | `authentication.md`, runbook Google, ADR 0005 e código/PRs    | Main, cliente configurado e Google real são estados distintos; #474/#494 e #448 seguem pendentes                                  |
| Topologia e segurança  | Índice de segurança e ADRs 0004/0006                          | Corrigidos DNS/TLS descritos como pendentes e referência à topologia original sem destacar substituição                           |
| STRIDE e diagrama      | Tabela de `threat-model.md` e ameaças por elemento no JSON    | Texto contém TM-01 a TM-27; JSON contém 26 e omite TM-24. Correção própria na #550; não ocultada por atualização do índice        |
| Migrations e contas    | Diretório de migrations, DbContext, contrato HTTP e #543      | Vinte migrations na main; não declarar reaplicação na VM; contrato textual Local/Google corrigido                                 |
| Relatórios             | Contrato #441, endpoints, #443/#496                           | Consulta/PDF implementados; conteúdo representativo, layout A4 e aceite continuam separados                                       |
| Fluxo recorrente       | Issues #213/#214, endpoint de candidatos e seleção na entrada | Já implementado; não criar outro autocomplete ou confundir com presença de pedestres #163                                         |
| Marco acadêmico        | Matrizes da Unidade 1/2, contagens de CI/testes e #547        | Atualização complementar está no PR #547; não duplicada nesta issue nem presumida como mergeada                                   |
| Interface              | README/frontend e modernização, #474/#494/#530                | Há trechos de etapas antigas convivendo com estado atual; revisão com Raíssa deve preservar autoria e o escopo dos PRs existentes |
| Produto                | Pesquisa oficial de seis fornecedores e código existente      | Publicação da Wiki #548 separa funções existentes, melhorias propostas e itens fora do MVP                                        |
| Infraestrutura operada | Runbooks e decisões datadas                                   | Não houve execução de Terraform, restore externo, k6, renovação TLS ou deploy nesta auditoria                                     |

### Distinções obrigatórias

- **Inventariado:** arquivo localizado, tamanho/linhas e links identificados.
- **Verificação estrutural:** destino de link local existe; não prova conteúdo.
- **Leitura dirigida:** trechos relevantes comparados a fontes específicas;
  não garante revisão de todas as linhas do arquivo.
- **Executado:** comando/teste realmente rodado com data, versão e resultado.
- **Aceito:** responsável institucional observou e registrou o aceite.

Não foi atribuída a nenhum dos 47 documentos a condição de revisão semântica
integral. O inventário não representa certificação de segurança nem autorização
para operação institucional.

## Inventário da fotografia

Todos os arquivos abaixo tiveram inventário e checagem de links locais. A coluna
adicional indica somente a leitura temática desta rodada; não afirma execução
dos comandos contidos no documento.

| Arquivo na fotografia                                                                                                                                    | Linhas | Verificação adicional nesta rodada                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | -----: | ------------------------------------------------- |
| [.github/PULL_REQUEST_TEMPLATE.md](../../.github/PULL_REQUEST_TEMPLATE.md)                                                                               |     58 | Somente inventário e links locais nesta rodada    |
| [.github/instructions/backend.instructions.md](../../.github/instructions/backend.instructions.md)                                                       |     26 | Somente inventário e links locais nesta rodada    |
| [.github/instructions/repository.instructions.md](../../.github/instructions/repository.instructions.md)                                                 |     33 | Somente inventário e links locais nesta rodada    |
| [.github/instructions/security.instructions.md](../../.github/instructions/security.instructions.md)                                                     |     29 | Somente inventário e links locais nesta rodada    |
| [AGENTS.md](../../AGENTS.md)                                                                                                                             |     51 | Leitura dirigida por tema; sem aprovação integral |
| [CHANGELOG.md](../../CHANGELOG.md)                                                                                                                       |    209 | Somente inventário e links locais nesta rodada    |
| [CONTRIBUTING.md](../../CONTRIBUTING.md)                                                                                                                 |    116 | Somente inventário e links locais nesta rodada    |
| [README.md](../../README.md)                                                                                                                             |    413 | Leitura dirigida por tema; sem aprovação integral |
| [SECURITY.md](../../SECURITY.md)                                                                                                                         |     64 | Somente inventário e links locais nesta rodada    |
| [docs/architecture/decisions/0001-secure-session-lifecycle.md](../../docs/architecture/decisions/0001-secure-session-lifecycle.md)                       |    105 | Somente inventário e links locais nesta rodada    |
| [docs/architecture/decisions/0002-data-retention-and-oci-backup.md](../../docs/architecture/decisions/0002-data-retention-and-oci-backup.md)             |    118 | Somente inventário e links locais nesta rodada    |
| [docs/architecture/decisions/0003-protected-data-protection-key-ring.md](../../docs/architecture/decisions/0003-protected-data-protection-key-ring.md)   |     66 | Somente inventário e links locais nesta rodada    |
| [docs/architecture/decisions/0004-oci-homologation-topology.md](../../docs/architecture/decisions/0004-oci-homologation-topology.md)                     |    181 | Leitura dirigida por tema; sem aprovação integral |
| [docs/architecture/decisions/0005-google-oidc-and-emergency-access.md](../../docs/architecture/decisions/0005-google-oidc-and-emergency-access.md)       |    164 | Leitura dirigida por tema; sem aprovação integral |
| [docs/architecture/decisions/0006-oci-waf-protected-homologation-edge.md](../../docs/architecture/decisions/0006-oci-waf-protected-homologation-edge.md) |    119 | Leitura dirigida por tema; sem aprovação integral |
| [docs/architecture/vehicle-plate-policy.md](../../docs/architecture/vehicle-plate-policy.md)                                                             |     63 | Leitura dirigida por tema; sem aprovação integral |
| [docs/development/administrative-report-contract.md](../../docs/development/administrative-report-contract.md)                                           |     83 | Leitura dirigida por tema; sem aprovação integral |
| [docs/development/ci-cd.md](../../docs/development/ci-cd.md)                                                                                             |    329 | Somente inventário e links locais nesta rodada    |
| [docs/development/commit-conventions.md](../../docs/development/commit-conventions.md)                                                                   |     67 | Somente inventário e links locais nesta rodada    |
| [docs/development/frontend-design-tokens.md](../../docs/development/frontend-design-tokens.md)                                                           |    127 | Somente inventário e links locais nesta rodada    |
| [docs/operations/contingency-record-template.md](../../docs/operations/contingency-record-template.md)                                                   |     59 | Somente inventário e links locais nesta rodada    |
| [docs/operations/data-retention-and-continuity.md](../../docs/operations/data-retention-and-continuity.md)                                               |    268 | Somente inventário e links locais nesta rodada    |
| [docs/operations/google-identity-contingency.md](../../docs/operations/google-identity-contingency.md)                                                   |    107 | Leitura dirigida por tema; sem aprovação integral |
| [docs/operations/google-oidc-setup.md](../../docs/operations/google-oidc-setup.md)                                                                       |    134 | Somente inventário e links locais nesta rodada    |
| [docs/operations/observability.md](../../docs/operations/observability.md)                                                                               |    112 | Somente inventário e links locais nesta rodada    |
| [docs/operations/oci-homologation-preflight.md](../../docs/operations/oci-homologation-preflight.md)                                                     |    260 | Somente inventário e links locais nesta rodada    |
| [docs/operations/versioned-container-deployment.md](../../docs/operations/versioned-container-deployment.md)                                             |    359 | Somente inventário e links locais nesta rodada    |
| [docs/research/academic-evolution-options.md](../../docs/research/academic-evolution-options.md)                                                         |    129 | Somente inventário e links locais nesta rodada    |
| [docs/security/README.md](../../docs/security/README.md)                                                                                                 |     54 | Leitura dirigida por tema; sem aprovação integral |
| [docs/security/authentication.md](../../docs/security/authentication.md)                                                                                 |    315 | Leitura dirigida por tema; sem aprovação integral |
| [docs/security/dynamic-application-security-testing.md](../../docs/security/dynamic-application-security-testing.md)                                     |     89 | Somente inventário e links locais nesta rodada    |
| [docs/security/evidence/zap-baseline-2026-09-16/README.md](../../docs/security/evidence/zap-baseline-2026-09-16/README.md)                               |     49 | Somente inventário e links locais nesta rodada    |
| [docs/security/evidence/zap-baseline-2026-09-16/zap-report.md](../../docs/security/evidence/zap-baseline-2026-09-16/zap-report.md)                       |    246 | Somente inventário e links locais nesta rodada    |
| [docs/security/secure-development-guide.md](../../docs/security/secure-development-guide.md)                                                             |    402 | Somente inventário e links locais nesta rodada    |
| [docs/security/threat-model.md](../../docs/security/threat-model.md)                                                                                     |    337 | Leitura dirigida por tema; sem aprovação integral |
| [docs/validation/backend-mvp-homologation.md](../../docs/validation/backend-mvp-homologation.md)                                                         |    698 | Leitura dirigida por tema; sem aprovação integral |
| [docs/validation/guided-operational-pilot.md](../../docs/validation/guided-operational-pilot.md)                                                         |    212 | Leitura dirigida por tema; sem aprovação integral |
| [docs/validation/unit-1-readiness.md](../../docs/validation/unit-1-readiness.md)                                                                         |    107 | Leitura dirigida por tema; sem aprovação integral |
| [docs/validation/unit-2-readiness.md](../../docs/validation/unit-2-readiness.md)                                                                         |     89 | Leitura dirigida por tema; sem aprovação integral |
| [infrastructure/database/README.md](../../infrastructure/database/README.md)                                                                             |     84 | Somente inventário e links locais nesta rodada    |
| [infrastructure/demo/README.md](../../infrastructure/demo/README.md)                                                                                     |     96 | Somente inventário e links locais nesta rodada    |
| [infrastructure/oci/backup/README.md](../../infrastructure/oci/backup/README.md)                                                                         |    130 | Somente inventário e links locais nesta rodada    |
| [infrastructure/oci/homologation/edge/README.md](../../infrastructure/oci/homologation/edge/README.md)                                                   |    159 | Somente inventário e links locais nesta rodada    |
| [infrastructure/oci/homologation/terraform/README.md](../../infrastructure/oci/homologation/terraform/README.md)                                         |    182 | Somente inventário e links locais nesta rodada    |
| [src/frontend/AGENTS.md](../../src/frontend/AGENTS.md)                                                                                                   |     57 | Leitura dirigida por tema; sem aprovação integral |
| [src/frontend/README.md](../../src/frontend/README.md)                                                                                                   |    500 | Leitura dirigida por tema; sem aprovação integral |
| [src/frontend/docs/modernization.md](../../src/frontend/docs/modernization.md)                                                                           |    312 | Somente inventário e links locais nesta rodada    |
| Arquivo na fotografia | Linhas | Verificação adicional nesta rodada |
| --- | ---: | --- |
| [.github/PULL_REQUEST_TEMPLATE.md](../../.github/PULL_REQUEST_TEMPLATE.md) | 58 | Somente inventário e links locais nesta rodada |
| [.github/instructions/backend.instructions.md](../../.github/instructions/backend.instructions.md) | 26 | Somente inventário e links locais nesta rodada |
| [.github/instructions/repository.instructions.md](../../.github/instructions/repository.instructions.md) | 33 | Somente inventário e links locais nesta rodada |
| [.github/instructions/security.instructions.md](../../.github/instructions/security.instructions.md) | 29 | Somente inventário e links locais nesta rodada |
| [AGENTS.md](../../AGENTS.md) | 51 | Leitura dirigida por tema; sem aprovação integral |
| [CHANGELOG.md](../../CHANGELOG.md) | 209 | Somente inventário e links locais nesta rodada |
| [CONTRIBUTING.md](../../CONTRIBUTING.md) | 116 | Somente inventário e links locais nesta rodada |
| [README.md](../../README.md) | 413 | Leitura dirigida por tema; sem aprovação integral |
| [SECURITY.md](../../SECURITY.md) | 64 | Somente inventário e links locais nesta rodada |
| [docs/architecture/decisions/0001-secure-session-lifecycle.md](../../docs/architecture/decisions/0001-secure-session-lifecycle.md) | 105 | Somente inventário e links locais nesta rodada |
| [docs/architecture/decisions/0002-data-retention-and-oci-backup.md](../../docs/architecture/decisions/0002-data-retention-and-oci-backup.md) | 118 | Somente inventário e links locais nesta rodada |
| [docs/architecture/decisions/0003-protected-data-protection-key-ring.md](../../docs/architecture/decisions/0003-protected-data-protection-key-ring.md) | 66 | Somente inventário e links locais nesta rodada |
| [docs/architecture/decisions/0004-oci-homologation-topology.md](../../docs/architecture/decisions/0004-oci-homologation-topology.md) | 181 | Leitura dirigida por tema; sem aprovação integral |
| [docs/architecture/decisions/0005-google-oidc-and-emergency-access.md](../../docs/architecture/decisions/0005-google-oidc-and-emergency-access.md) | 164 | Leitura dirigida por tema; sem aprovação integral |
| [docs/architecture/decisions/0006-oci-waf-protected-homologation-edge.md](../../docs/architecture/decisions/0006-oci-waf-protected-homologation-edge.md) | 119 | Leitura dirigida por tema; sem aprovação integral |
| [docs/architecture/vehicle-plate-policy.md](../../docs/architecture/vehicle-plate-policy.md) | 63 | Leitura dirigida por tema; sem aprovação integral |
| [docs/development/administrative-report-contract.md](../../docs/development/administrative-report-contract.md) | 83 | Leitura dirigida por tema; sem aprovação integral |
| [docs/development/ci-cd.md](../../docs/development/ci-cd.md) | 329 | Somente inventário e links locais nesta rodada |
| [docs/development/commit-conventions.md](../../docs/development/commit-conventions.md) | 67 | Somente inventário e links locais nesta rodada |
| [docs/development/frontend-design-tokens.md](../../docs/development/frontend-design-tokens.md) | 127 | Somente inventário e links locais nesta rodada |
| [docs/operations/contingency-record-template.md](../../docs/operations/contingency-record-template.md) | 59 | Somente inventário e links locais nesta rodada |
| [docs/operations/data-retention-and-continuity.md](../../docs/operations/data-retention-and-continuity.md) | 268 | Somente inventário e links locais nesta rodada |
| [docs/operations/google-identity-contingency.md](../../docs/operations/google-identity-contingency.md) | 107 | Leitura dirigida por tema; sem aprovação integral |
| [docs/operations/google-oidc-setup.md](../../docs/operations/google-oidc-setup.md) | 134 | Somente inventário e links locais nesta rodada |
| [docs/operations/observability.md](../../docs/operations/observability.md) | 112 | Somente inventário e links locais nesta rodada |
| [docs/operations/oci-homologation-preflight.md](../../docs/operations/oci-homologation-preflight.md) | 260 | Somente inventário e links locais nesta rodada |
| [docs/operations/versioned-container-deployment.md](../../docs/operations/versioned-container-deployment.md) | 359 | Somente inventário e links locais nesta rodada |
| [docs/research/academic-evolution-options.md](../../docs/research/academic-evolution-options.md) | 129 | Somente inventário e links locais nesta rodada |
| [docs/security/README.md](../../docs/security/README.md) | 54 | Leitura dirigida por tema; sem aprovação integral |
| [docs/security/authentication.md](../../docs/security/authentication.md) | 315 | Leitura dirigida por tema; sem aprovação integral |
| [docs/security/dynamic-application-security-testing.md](../../docs/security/dynamic-application-security-testing.md) | 89 | Somente inventário e links locais nesta rodada |
| [docs/security/evidence/zap-baseline-2026-09-16/README.md](../../docs/security/evidence/zap-baseline-2026-09-16/README.md) | 49 | Somente inventário e links locais nesta rodada |
| [docs/security/evidence/zap-baseline-2026-09-16/zap-report.md](../../docs/security/evidence/zap-baseline-2026-09-16/zap-report.md) | 246 | Somente inventário e links locais nesta rodada |
| [docs/security/secure-development-guide.md](../../docs/security/secure-development-guide.md) | 402 | Somente inventário e links locais nesta rodada |
| [docs/security/threat-model.md](../../docs/security/threat-model.md) | 337 | Leitura dirigida por tema; sem aprovação integral |
| [docs/validation/backend-mvp-homologation.md](../../docs/validation/backend-mvp-homologation.md) | 698 | Leitura dirigida por tema; sem aprovação integral |
| [docs/validation/guided-operational-pilot.md](../../docs/validation/guided-operational-pilot.md) | 212 | Leitura dirigida por tema; sem aprovação integral |
| [docs/validation/unit-1-readiness.md](../../docs/validation/unit-1-readiness.md) | 107 | Leitura dirigida por tema; sem aprovação integral |
| [docs/validation/unit-2-readiness.md](../../docs/validation/unit-2-readiness.md) | 89 | Leitura dirigida por tema; sem aprovação integral |
| [infrastructure/database/README.md](../../infrastructure/database/README.md) | 84 | Somente inventário e links locais nesta rodada |
| [infrastructure/demo/README.md](../../infrastructure/demo/README.md) | 96 | Somente inventário e links locais nesta rodada |
| [infrastructure/oci/backup/README.md](../../infrastructure/oci/backup/README.md) | 130 | Somente inventário e links locais nesta rodada |
| [infrastructure/oci/homologation/edge/README.md](../../infrastructure/oci/homologation/edge/README.md) | 159 | Somente inventário e links locais nesta rodada |
| [infrastructure/oci/homologation/terraform/README.md](../../infrastructure/oci/homologation/terraform/README.md) | 182 | Somente inventário e links locais nesta rodada |
| [src/frontend/AGENTS.md](../../src/frontend/AGENTS.md) | 57 | Leitura dirigida por tema; sem aprovação integral |
| [src/frontend/README.md](../../src/frontend/README.md) | 500 | Leitura dirigida por tema; sem aprovação integral |
| [src/frontend/docs/modernization.md](../../src/frontend/docs/modernization.md) | 312 | Somente inventário e links locais nesta rodada |
