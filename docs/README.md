# Documentação do projeto

Este índice organiza as fontes versionadas por tarefa. A
[Wiki](https://github.com/ifpebj-ti/controle-acesso-veiculos/wiki) apresenta a visão
acadêmica e de produto; código, contratos e migrations representam a implementação.
Datas, commits e classificação de cada evidência devem ser preservados.

## Por onde começar

| Necessidade                                 | Fonte                                                                                                                                                                                                                                    |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entender o produto e seus limites           | [README principal](../README.md) e [Visão na Wiki](https://github.com/ifpebj-ti/controle-acesso-veiculos/wiki/Visao-do-Projeto)                                                                                                          |
| Saber o que está implementado ou pendente   | [Status na Wiki](https://github.com/ifpebj-ti/controle-acesso-veiculos/wiki/Status-do-Projeto) e issues/PRs correspondentes                                                                                                              |
| Aprender com produtos existentes            | [Referências e melhorias aplicáveis](https://github.com/ifpebj-ti/controle-acesso-veiculos/wiki/Referencias-de-Produto-e-Melhorias) e [análise base](https://github.com/ifpebj-ti/controle-acesso-veiculos/wiki/Analise-de-Concorrencia) |
| Instalar e executar                         | [README principal](../README.md), [dados fictícios](../infrastructure/demo/README.md) e [banco/recuperação](../infrastructure/database/README.md)                                                                                        |
| Avaliar os quatro perfis com usuários       | [Homologação integrada](validation/backend-mvp-homologation.md) e [piloto acompanhado](validation/guided-operational-pilot.md)                                                                                                           |
| Conferir entregas acadêmicas                | [Unidade 1](validation/unit-1-readiness.md) e [Unidade 2](validation/unit-2-readiness.md): fotografias datadas, não aceite dos professores                                                                                               |
| Conhecer o alcance das revisões documentais | [Inventário e limites da auditoria](validation/documentation-audit-2026-10-31.md)                                                                                                                                                        |

## Arquitetura e contratos

- [Política de placas](architecture/vehicle-plate-policy.md).
- [Contrato dos relatórios administrativos](development/administrative-report-contract.md).
- [Decisões arquiteturais](architecture/decisions/):
  [sessões](architecture/decisions/0001-secure-session-lifecycle.md),
  [retenção/backup](architecture/decisions/0002-data-retention-and-oci-backup.md),
  [key ring](architecture/decisions/0003-protected-data-protection-key-ring.md),
  [topologia original, substituída](architecture/decisions/0004-oci-homologation-topology.md),
  [identidade Google e autorização local](architecture/decisions/0005-google-oidc-and-emergency-access.md)
  e [borda WAF vigente](architecture/decisions/0006-oci-waf-protected-homologation-edge.md).
- [Arc42 na Wiki](https://github.com/ifpebj-ti/controle-acesso-veiculos/wiki/Arquitetura-de-Software)
  e [modelo de dados](https://github.com/ifpebj-ti/controle-acesso-veiculos/wiki/Modelo-de-Dados).

## Segurança e operação

- [Central de segurança](security/README.md): autenticação, STRIDE, Threat Dragon,
  desenvolvimento seguro e limites do ZAP.
- [Implantação versionada e rollback](operations/versioned-container-deployment.md).
- [Preflight OCI](operations/oci-homologation-preflight.md),
  [Terraform de homologação](../infrastructure/oci/homologation/terraform/README.md)
  e [borda HTTPS](../infrastructure/oci/homologation/edge/README.md).
- [Configuração Google](operations/google-oidc-setup.md) e
  [contingência do provedor](operations/google-identity-contingency.md).
- [Observabilidade](operations/observability.md),
  [retenção/continuidade](operations/data-retention-and-continuity.md),
  [formulário de contingência](operations/contingency-record-template.md) e
  [backup OCI](../infrastructure/oci/backup/README.md).

Homologação com HTTPS, existência de Terraform e configuração OTLP não comprovam,
respectivamente, autorização de produção, provisionamento de backup ou operação
de monitoramento. Merge na main também não equivale a deploy: a promoção exige
imagens e configuração compatíveis com rollback.

## Desenvolvimento e pesquisa

- [Contribuição](../CONTRIBUTING.md), [instruções do repositório](../AGENTS.md),
  [convenção de commits](development/commit-conventions.md) e
  [CI/CD](development/ci-cd.md).
- [Frontend](../src/frontend/README.md),
  [instruções da área](../src/frontend/AGENTS.md),
  [tokens de interface](development/frontend-design-tokens.md) e
  [modernização](../src/frontend/docs/modernization.md).
- [Evoluções acadêmicas e TCC](research/academic-evolution-options.md): pesquisa
  futura, sem incluir câmeras, LPR ou pedestres no MVP veicular automaticamente.

## Regra de manutenção

Ao mudar um contrato ou comportamento, revisar a fonte da área e registrar o
estado real da validação. Após o merge, atualizar a Wiki em tarefa separada com
referência ao PR incorporado. Não sobrescrever atas, baselines ou resultados
históricos como se fossem testes novos. Segredos, credenciais de teste e dados
reais não fazem parte da documentação pública.
