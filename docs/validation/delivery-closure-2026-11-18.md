# Balanço de fechamento técnico — 18/11/2026

Rastreabilidade: #775. Main de referência `a4ffcc5`; aplicação instalada 0.5.0,
fonte `eaccd72`, frontend/backend por digest, 23 migrations. Uma proposta em PR
não muda automaticamente a main ou o servidor.

## Complemento de 28/11/2026

A main `fccc58b` já incorpora #769 e #770. A release publicada continua 0.5.0.
Os incrementos seguintes estão em revisão no GitHub:

| Entrega                               | Evidência de 28/11                                                                                                                                   |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base Nginx 1.30.8, #792               | AMD64, ARM64, smoke integrado, CodeQL e Quality Gate passaram no SHA `d479372`. Candidato ainda em revisão.                                          |
| Versão abaixo da navegação, #783/#793 | 54 testes focados do frontend, lint, build e versão de exemplo no bundle. Falta verificar a composição da imagem candidata e a posição no navegador. |
| Badges do backend, #794               | Dois SVGs gerados a partir do Cobertura mesclado. A primeira publicação automática depende da execução na main depois da incorporação.               |
| Configuração de sessão, #795          | 13 testes focados novos aprovados. A nova cobertura global depende da execução consolidada.                                                          |
| ZAP na CI                             | O smoke usa o Baseline passivo. A evidência cobre as requisições visitadas pelo roteiro.                                                             |

A [CI da main](https://github.com/ifpebj-ti/controle-acesso-veiculos/actions/runs/44353086524)
publicou 93,67% de linhas escritas à mão (9.504/10.146). O Cobertura mesclado
registrou 87,25% de ramificações (3.509/4.022) com código gerado. O relatório
separado recebido dos professores indica 95,7% de linhas e 84,6% de ramificações,
também incluindo código gerado. Os relatórios têm recortes distintos.
A conferência mecânica dos 109 Markdown da main encontrou zero links relativos
sem destino. A revisão de conteúdo priorizou release, cobertura e pendências.

## Solicitações dos professores

| Solicitação                                             | Evidência atual                                                         | Pendência real                                                                   |
| ------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Compose com imagens publicadas, tags iguais e changelog | 0.5.0 publicada e instalada; Compose e guia alinhados em #767           | Manter a cadência; não sobrescrever versões já publicadas                        |
| Release automática revisável                            | Ciclo executado; #770 prepara notas por versão e bloqueia placeholder   | Incorporar #769/#770 após revisão; sincronizar a base entre os merges            |
| Metadados corretos nas imagens                          | #769 passou 20 checks no SHA 225c5e4                                    | Incorporar antes da próxima publicação; não alterar a imagem antiga              |
| Site, domínio, HTTPS, WAF e About                       | https://dat.ernandescosta.me/login; TLS e controles públicos conferidos | Renovação e alertas TLS #509; aceite de operação                                 |
| Fullscreen API                                          | Implementada e instalada, por ação explícita do usuário                 | Compatibilidade no navegador do piloto                                           |
| Contas de teste                                         | Fixtures por perfil e janelas delimitadas já foram ensaiadas            | Nova janela exige preparação quando houver avaliador; não reativada nesta tarefa |
| Branches após merge                                     | delete_branch_on_merge=true conferido anteriormente                     | Limpar somente branches incorporadas/ensaios encerrados                          |
| Projects e documentação                                 | Quadro privado #43 existente; Wiki e documentação versionada            | Avaliadores precisam ter acesso; revisões por fluxo permanecem contínuas         |
| Cobertura e gates                                       | Backend 93,50% global na fonte 8b61ccd; piso global 70%                 | 90% de todos os componentes/fluxos críticos e frontend #499/#507                 |
| Reliability / Maintainability                           | Nove notes no último snapshot; sete caminhos tratados no #773           | Análise de main após merge; acima de Good ainda não comprovado                   |

A alegação antiga de ausência de Projects/alertas decorreu da visibilidade da
consulta, não da inexistência do quadro. Não publicar documentos privados para
corrigir esse contexto; usar links e evidências sanitizadas.

## Relatório de segurança

A tabela dos 28 IDs permanece no
[balanço do relatório](professor-delivery-security-status-2026-11-15.md).
Não há base para afirmar que todos os pontos já foram encerrados.

- CAV-17/22/23: correções de redirect, frames e cache instaladas e retestadas
  publicamente em 0.5.0. CAV-27: política da borda corrigida e retestada em 18/11,
  com backup e imagens preservadas (#774). Aceite independente continua separado.
- CAV-04/05/06: política de disponibilidade/lockout, limites coordenados e
  confirmação de senha ainda na #727. Exigem projeto e testes controlados para
  não criar bloqueio de operadores ou enfraquecer a autenticação.
- CAV-08/18: revisão auditada depende da composição #607/#613 e da observação
  integrada. Papel já tem backend persistido; interface #712 segue pendente.
- Privacidade/governança, correlação, mensagens e comportamento de borda possuem
  pendências próprias na tabela. Funcionalidade implementada não é aceite LGPD.
- #765: achado novo em ferramenta npm de desenvolvimento, separado do relatório.
  A fotografia registrada tinha 12 ocorrências HIGH e zero CRITICAL, ligadas ao
  advisory picomatch; audit de produção zero. Não há correção publicada confirmada
  naquele snapshot. Não forçar downgrade, suprimir advisory ou declarar resolvido.

## Unidade 2 e implantação institucional

O checklist original tem 17 critérios consolidados. Permanecem 8 atendidos,
8 parciais e 1 pendente, 71% ±5 pontos pela régua 1/0,5/0.
A estimativa funcional provisória é 13/15 capacidades, aproximadamente 87% ±8
pontos. As duas réguas medem coisas diferentes; nenhuma é percentual de segurança
nem divisão de produtividade entre integrantes.

Prioridades para completar evidências da Unidade 2:

1. Gestão protegida dos containers (#501), único critério classificado pendente.
2. Observabilidade realmente operada (#500) e carga k6 na nuvem (#502), com
   métricas e análise de gargalos. O ensaio local de 975 requisições não mede OCI.
3. Cobertura crítica/frontend (#499/#507), revisão de bugs e qualidade acima de
   Good, mantendo testes úteis e gates.
4. Manual atualizado e tarefas observadas com os quatro perfis (#162), incluindo
   os novos fluxos somente quando sua composição estiver implantada e identificada.

Para operação institucional também faltam backup externo/PITR (#311/#312),
exercício de recuperação com RPO/RTO, renovação TLS (#509), privacidade e aceite
do piloto. Uma restauração no mesmo host não comprova recuperação após perda
da VM. Não é necessário redesenhar o MVP inteiro: o maior trabalho restante é
concluir fluxos candidatos e provar operação, recuperação e uso real com segurança.

## Ordem de revisão registrada em 18/11

#769 → sincronização regular do #770 com main → #770. #773 e #774 são diffs
independentes de comportamento, mas compartilham a seção Unreleased; preservar
as entradas ao atualizar as bases. Este PR documental vem depois na organização,
com evidências candidatas explicitadas. Nenhum merge foi realizado pelo agente.
Não incorporar #607/#613/#645 ou migrações .NET 11 apenas para reduzir a lista.
