# Inventário de pendências — 03/11/2026

Rastreabilidade: #605. Fotografia inicial: **39 issues e 17 PRs abertos**,
antes da criação da própria tarefa de organização. Main `8322961` incorpora
#601 e #604; nenhum desses merges implanta automaticamente a hospedagem.

O objetivo é reduzir dependências e trabalho parado, não encerrar issues sem
implementação ou evidência. As filas usam milestones sem datas inventadas:
Estabilização do MVP veicular, Unidade 2 é operação e homologação, Evoluções futuras.
Issues futuras não são defeitos do MVP e não bloqueiam uma demonstração por si sós.

## Todas as issues da fotografia

| Issue                                                                                                                                                       | Fila         | Estado e próximo passo                                                                                                                                   | Decisão/ensaio                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| [#603](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/603) — Distinguir falhas de contrato de falhas reais de rede no frontend                | MVP veicular | Bug reproduzido; correção frontend pendente. Raíssa corrigir classificação de contrato/rede; coordenar #530.                                             | Técnico                              |
| [#594](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/594) — Equilibrar a composição do login em telas largas                                 | MVP veicular | Visual candidato #596, não implantado. Revisar composição desktop e evidências específicas.                                                              | Q1                                   |
| [#593](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/593) — Retornar ao login após cancelamento do consentimento Google                      | MVP veicular | Backend #599 implantado; protocolo passou. Ensaiar mensagem/foco; Cancelar não aparece para o titular.                                                   | Q2                                   |
| [#591](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/591) — Investigar recuperação da sessão após refresh interrompido ou concorrente        | MVP veicular | Reutilização de token observada; origem da interrupção não atribuída. Concluir investigação sem enfraquecer replay; #595.                                | Técnico                              |
| [#587](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/587) — Restaurar ação de login Google ao voltar pelo navegador                          | MVP veicular | Retorno BFCache corrigido no candidato #592. Consolidar ensaio autenticado restrito ao escopo; sem bloquear por marca.                                   | Q2                                   |
| [#581](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/581) — Montar e validar candidato integrado Google em homologação HTTPS                 | MVP veicular | Candidato HTTPS preparado e ativo; checklist técnico defasado. Atualizar evidências; concluir negação/troca de conta; #585 não recebe merge.             | Q2                                   |
| [#566](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/566) — Exibir todas as categorias na faixa horizontal do histórico                      | MVP veicular | Candidato #568; checks sem falhas na consulta atual. Ensaiar categorias, contagens, tablet e acessibilidade; não repetir diagnóstico antigo de CI.       | Q1                                   |
| [#565](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/565) — Corrigir redirecionamento após logout e troca de conta                           | MVP veicular | Correção #567 presente no candidato HTTPS. Administrador sai de Usuários/Relatórios e Google operacional abre destino permitido.                         | Q2                                   |
| [#514](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/514) — Validar exceções de placas e estratégia para dados existentes                    | MVP veicular | Sintaxe de placas entregue; exceções ainda precisam de regra. Auditar legado e definir exceções; consulta oficial é estudo separado.                     | Q6                                   |
| [#509](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/509) — Automatizar renovação do certificado TLS da homologação                          | Unidade 2    | HTTPS válido; renovação ainda manual; proposta #512. Selecionar automação DNS/segredos, ensaiar renovação, alerta e rollback.                            | Q11                                  |
| [#502](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/502) — Executar teste de carga básico com k6 na homologação                             | Unidade 2    | Script no candidato #515; carga representativa não executada. Concluir observabilidade e definir janela/volume antes de executar.                        | Q12                                  |
| [#501](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/501) — Implantar gestão protegida dos contêineres da homologação                        | Unidade 2    | Proposta de gestão privada #517; painel não implantado. Revisar alternativa e risco; implantação restrita e ensaio operacional.                          | Técnico                              |
| [#500](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/500) — Implantar observabilidade operada na homologação OCI                             | Unidade 2    | Instrumentação existe; coletor/painéis operados não. Revisar proposta #508, retenção, custo e alertas.                                                   | Q10                                  |
| [#499](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/499) — Comprovar cobertura de 90% nos fluxos críticos                                   | Unidade 2    | Medição/gates no #507; frontend ainda abaixo da meta de branches. Concluir recorte e testes relevantes, comprovar 90% sem excluir riscos.                | Técnico                              |
| [#496](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/496) — Reformular PDFs administrativos em A4 paisagem conforme planilhas institucionais | MVP veicular | Reformulação dos PDFs ainda sem implementação. Implementar paisagem/tabelas e máscara no servidor; conferir ativo institucional.                         | Q8                                   |
| [#495](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/495) — Exibir nome oficial do sistema no login e no menu lateral                        | MVP veicular | Bloqueada por nome oficial #453. Manter identidade atual; implementar só após definição.                                                                 | Respondida: nome pendente            |
| [#493](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/493) — Aprimorar a experiência responsiva da tela de login no mobile                    | MVP veicular | Escopo visual #494 pronto; base #474 pendente. Preservar evidência atribuída; incorporar após a base revisada.                                           | Técnico                              |
| [#489](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/489) — Planejar relatórios analíticos com estatísticas e gráficos                       | Futura       | Descoberta de gráficos adicionais; evolução futura. Escolher decisões/indicadores antes de ampliar backend ou frontend.                                  | Q7                                   |
| [#473](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/473) — Integrar alteração auditada de perfis no frontend                                | MVP veicular | Contrato de contas corrigido no #530, fora da hospedagem. Prioridade de integração; completar validação autenticada/dispositivos.                        | Q1                                   |
| [#468](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/468) — Implantar OCI WAF no ambiente de homologação                                     | Unidade 2    | WAF ativo; falsos positivos parcialmente corrigidos. Reconciliar pacote Resource Manager e completar logs/custo/rollback.                                | Q10                                  |
| [#461](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/461) — Integrar login Google e acesso administrativo no frontend                        | MVP veicular | Login Google e administrativo ativos no candidato #474. Consolidar sucesso relatado e completar negação/troca antes do aceite.                           | Q2                                   |
| [#453](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/453) — Definir nome oficial e identidade verbal do sistema                              | MVP veicular | Nome oficialmente pendente conforme José em 03/11. Não antecipar DAT, sigla ou significado; manter #495 bloqueada.                                       | Respondida: nome pendente            |
| [#451](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/451) — Implementar revisão auditável de solicitações de correção                        | MVP veicular | Implementação de proposta/aprovação ainda pendente. Diretriz autorizada: preservar original, motivo, revisão e rejeição sem exclusão.                    | Respondida: implementação autorizada |
| [#449](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/449) — Governar contas e perfis pelo Administrador único                                | MVP veicular | Governança backend implementada; integração #530 e aceite pendentes. Separar evidências técnicas de homologação; quatro perfis, sem adm mestre.          | Q1/Q2                                |
| [#448](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/448) — Adotar Google OIDC com autorização local e acesso administrativo separado        | MVP veicular | Google habilitado; sucesso real relatado, não mais só preparação. Atualizar checklist; testar negação e esclarecer reautenticação apenas onde permitida. | Q2                                   |
| [#447](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/447) — Atualizar Figma e Wiki após a homologação dos fluxos                             | Unidade 2    | Documentação/Figma depende dos fluxos aceitos. Raíssa promover só telas validadas; preservar hipóteses.                                                  | Q1                                   |
| [#443](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/443) — Homologar relatórios administrativos e atualizar a Wiki                          | Unidade 2    | Consulta/PDF passaram tecnicamente; aceite visual pendente. Ensaiar roteiro #532; composição PDF #496 é entrega separada.                                | Q8                                   |
| [#422](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/422) — Disponibilizar indicadores agregados de utilização da frota                      | MVP veicular | Totais diários existem; integração da tela e média pendentes. Validar recorte da duração média; agregar no servidor.                                     | Q7                                   |
| [#382](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/382) — Implantar ambiente de homologação do MVP na OCI                                  | Unidade 2    | VM e candidato HTTPS ativos; operação ainda parcial. Validar consumo, orçamento, alertas, recuperação e quatro perfis.                                   | Q10/Q13                              |
| [#312](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/312) — Implementar recuperação pontual do PostgreSQL para RPO de uma hora               | Unidade 2    | WAL/PITR ainda não implementado. Após backup externo, escolher ferramenta e provar RPO/RTO.                                                              | Técnico                              |
| [#311](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/311) — Provisionar backup protegido na OCI                                              | Unidade 2    | Base Terraform preparada; backup externo não comprovado. Provisionar com IAM/Vault, janela de retenção e restauração externa.                            | Q10/Q13                              |
| [#275](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/275) — Definir política para estudantes autorizados a conduzir veículos                 | MVP veicular | Política de estudantes condutores não definida. Consultar autoridade do campus; sem inferir capacidade legal ou coletar fotos.                           | Q5                                   |
| [#273](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/273) — Pesquisar acesso multimodal de pedestres e bicicletas — evolução futura          | Futura       | Pesquisa multimodal adiada por José. Manter em evolução futura, fora do núcleo veicular.                                                                 | Já decidido: futuro                  |
| [#269](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/269) — Modelar autorização excepcional após o fechamento da portaria                    | MVP veicular | Fechamento às 22h informado; exceções não implementadas. Definir autoridade, validade e procedimento de emergência.                                      | Q4                                   |
| [#163](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/163) — Validar presença de servidores e terceirizados — evolução pedestre futura        | Futura       | Presença pedestre adiada; não é busca veicular recorrente. Retomar somente após estabilização veicular.                                                  | Já decidido: futuro                  |
| [#162](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/162) — Homologar manualmente os fluxos com os quatro perfis                             | Unidade 2    | Demonstração aprovada; roteiro completo de homologação ainda pendente. Identificar tarefas observadas por perfil e registrar problemas/aceites.          | Q1                                   |
| [#100](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/100) — Implementar fluxo seguro de reconciliação após contingência                      | Unidade 2    | Contingência em papel confirmada; reconciliação ainda não implementada. Fluxo separado com horários/autorias distintos, duplicidade e conferência.       | Respondida parcialmente: Q3          |
| [#41](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/41) — Reavaliar Node 26 e TypeScript 7 apos suporte LTS                                  | Futura       | Evolução de toolchain condicionada ao suporte conjunto. Reavaliar em tarefa futura; não migrar por organização do backlog.                               | Técnico/futuro                       |
| [#30](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/30) — Definir retenção, backup, recuperação e contingência                               | Unidade 2    | Retenção e responsáveis gerais definidos; exercício/revisão final pendentes. Completar papéis de conferência, substituição e validação do descarte.      | Q3/Q13                               |

As perguntas Q1–Q13 estão no [roteiro de decisões](pending-decisions-2026-11-03.md).
As respostas de correção/contingência/nome recebidas em 03/11 foram incorporadas
com atribuição, sem transformar liberdade técnica em aceite de telas não vistas.

## Todos os PRs da fotografia

Nenhum dos 17 SHAs consultados apresentou check concluído com falha ou check em
andamento nessa consulta. Isso não substitui revisão humana, compatibilidade com
a main atual ou aceite dos cenários obrigatórios. `UNKNOWN` em mergeabilidade
não prova conflito. As novas alterações exigem nova consulta no SHA resultante.

| PR                                                                                 | Base                                        | Situação na fotografia | Próximo passo                                                                                          |
| ---------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------ |
| [#599](https://github.com/ifpebj-ti/controle-acesso-veiculos/pull/599) — `0ca897d` | `main`                                      | Draft                  | Backend já em candidato. Completar ensaio aplicável de cancelamento; preservar #601 ao atualizar base. |
| [#596](https://github.com/ifpebj-ti/controle-acesso-veiculos/pull/596) — `e5e8352` | `feature/issue-493-mobile-login-experience` | Draft                  | Visual opcional após #494. Revisão específica; não inclui sozinho #567/#592.                           |
| [#595](https://github.com/ifpebj-ti/controle-acesso-veiculos/pull/595) — `22fbd28` | `main`                                      | Draft                  | Reprodução controlada de sessão, sem mudança de produção; causa exata do incidente real pendente.      |
| [#592](https://github.com/ifpebj-ti/controle-acesso-veiculos/pull/592) — `3c56918` | `feature/issue-461-google-admin-login`      | Draft                  | Retorno BFCache já no candidato. Completar evidência restrita ao escopo e revisar após #474.           |
| [#585](https://github.com/ifpebj-ti/controle-acesso-veiculos/pull/585) — `d5a7ba5` | `main`                                      | Draft                  | Somente composição de ensaio; **não fazer merge** como atalho para os PRs originais.                   |
| [#572](https://github.com/ifpebj-ti/controle-acesso-veiculos/pull/572) — `c405299` | `main`                                      | Ready for review       | Revisar sete atualizações e repetir testes no novo conjunto; não misturar com correção de contas.      |
| [#568](https://github.com/ifpebj-ti/controle-acesso-veiculos/pull/568) — `b40d2ed` | `main`                                      | Draft                  | Checks atuais sem falha. Validar faixa de categorias e consultas; independe do login.                  |
| [#567](https://github.com/ifpebj-ti/controle-acesso-veiculos/pull/567) — `a515f87` | `feature/issue-461-google-admin-login`      | Draft                  | Validar logout administrativo seguido de entrada operacional; depois incorporar sobre a base aceita.   |
| [#532](https://github.com/ifpebj-ti/controle-acesso-veiculos/pull/532) — `15eff44` | `main`                                      | Draft                  | Roteiro documental de relatórios não comprova homologação; aguardar os ensaios registrados.            |
| [#530](https://github.com/ifpebj-ti/controle-acesso-veiculos/pull/530) — `4861d9a` | `main`                                      | Draft                  | Prioridade: corrigir contrato real de contas e completar teste autenticado; coordenar #603.            |
| [#517](https://github.com/ifpebj-ti/controle-acesso-veiculos/pull/517) — `4a13155` | `main`                                      | Draft                  | Proposta documental de gestão privada; implementação e ensaio da #501 continuam pendentes.             |
| [#515](https://github.com/ifpebj-ti/controle-acesso-veiculos/pull/515) — `7462ffa` | `main`                                      | Draft                  | Script/proposta de k6; janela, volume e execução são pendências da #502.                               |
| [#512](https://github.com/ifpebj-ti/controle-acesso-veiculos/pull/512) — `3fa2fc8` | `main`                                      | Draft                  | Proposta documental de TLS; automação, promoção e rollback ainda não executados.                       |
| [#508](https://github.com/ifpebj-ti/controle-acesso-veiculos/pull/508) — `c5e2dc6` | `main`                                      | Draft                  | Proposta documental de observabilidade; ainda falta operar coletor, armazenamento e alertas.           |
| [#507](https://github.com/ifpebj-ti/controle-acesso-veiculos/pull/507) — `08917e2` | `main`                                      | Draft                  | Gates e cobertura parcial; concluir 90% no recorte crítico com testes significativos.                  |
| [#494](https://github.com/ifpebj-ti/controle-acesso-veiculos/pull/494) — `b1b3f5f` | `feature/issue-461-google-admin-login`      | Ready for review       | Ready no escopo visual; base #474 deve ser incorporada antes.                                          |
| [#474](https://github.com/ifpebj-ti/controle-acesso-veiculos/pull/474) — `8917075` | `main`                                      | Draft                  | Login já em candidato; concluir negação/troca de conta e revisão integrada antes do merge.             |

## Sequência de trabalho

1. Corrigir a lista de contas (#530/#473) e a classificação de erros (#603),
   preservando os contratos e a independência dos PRs.
2. Completar os ensaios Google que realmente faltam e revisar #474. Após a base,
   revisar #592 e #567, #494 e, depois, #596. Atualizar bases por merge normal,
   conforme coordenação com a autora; não fazer rebase ou force-push por limpeza.
3. O histórico #568 é independente do login. Testar e revisar no próprio escopo.
4. Implementar a revisão auditada #451 e a reconciliação #100 de forma separada.
   Não misturar cadastro atrasado com alteração livre de horário operacional.
5. Fechar o ciclo técnico de recuperação/backup e a automação TLS, observabilidade
   e gestão restrita; depois executar carga limitada com métricas úteis.
6. Observar os quatro perfis, revisar os PDFs e registrar os resultados na #162,
   #443 e #447. Atualizar manual/Figma apenas com decisões e evidências atribuídas.
7. Publicar release compatível e promover imagens identificadas com rollback.
   Não criar versão nova apenas para diminuir a fila de PRs.

Essa é uma sequência de dependências, não uma autorização de merge de todos os
PRs. As propostas documentais #508/#512/#517 precisam ter escopo e critérios
compatíveis com a entrega que realmente contém; não declará-las como implantação.

## Definições confirmadas e limites

- Nome permanece pendente; não transformar DAT em marca oficial por inferência.
- Correção aprovada muda a versão efetiva; original e decisões não são apagados.
- Contingência usa papel e lançamento posterior; papéis de conferência ainda
  precisam de definição. O horário observado não se confunde com o da digitação.
- O cliente informou liberdade de solução; isso autoriza o trabalho técnico,
  mas não comprova testes ou aceite do fluxo que será implementado.
- Hospedagem conhecida: frontend `d5a7ba5`, backend `0ca897d`, Google habilitado.
  #530/#568/#596 não fazem parte desse frontend. Main e runtime são fotografias distintas.
- Quantidade de testes ou issues encerradas não equivale a cobertura, segurança
  absoluta ou prontidão institucional.

## Verificação desta organização

Inventário: API autenticada GitHub, corpos de todas as 39 issues, critérios,
comentários recentes, bases/SHAs dos 17 PRs e seus checks no instante da consulta.
Histórico preservado; não foi feita leitura de cada comentário histórico já
existente. Milestones/alterações publicadas são reconsultados para conferir
atribuição e UTF-8. Não foram publicados contatos privados ou credenciais.

Wiki é sincronizada em tarefa separada após #601/#604 pela própria #605; a
proposta documental deste PR permanece revisável antes de incorporar é main.
