# Revisão do backlog e workspace — 02/11/2026

**Rastreabilidade:** #579. **Main de referência:** `0e7be77`.<br>
**Escopo:** 37 issues abertas na fotografia inicial; a própria #579 foi criada
depois para rastrear esta revisão. Não é uma medição percentual do produto.

## Critérios e limites

A revisão confrontou objetivos, critérios e dependências das issues com código,
PRs, evidências registradas e documentação. Não repetiu todas as validações do
produto nem transformou checklists de candidatos em funcionalidades integradas.
Idade de uma issue não comprova atraso sem compromisso ou data pactuada.

As prioridades têm significado de sequência: P1 para o próximo piloto e suas
dependências; P2 para o incremento seguinte ou após decisão; P3 para evolução
futura ou revisão não bloqueante. Elas não substituem `blocked`, `future` ou
`needs-validation`, nem representam gravidade de segurança.

## Decisões de reconciliação

- #266 e #267 foram encerradas como **não planejadas**, pois o login por
  identificador institucional foi substituído por Google pré-autorizado e
  Administrador local, registrados em #448/#449 e no ADR 0005. Não foram
  encerradas como implementadas.
- #163 e #273 foram explicitamente identificadas como pesquisa pedestre futura,
  preservando a decisão de concluir veículos antes dessa expansão.
- #555 recebeu evidência da reprodução/correção de foco em #569/#570. A
  validação no SHA final do candidato de login ainda impede seu encerramento.
- #382 passou a reconhecer a VM implantada; seus critérios de custo, operação,
  backup, renovação e recuperação continuam separados e pendentes.
- #30 distingue a proposta de rotina diária de uma garantia efetiva de RPO.
  Snapshot local restaurado não conclui #311 nem #312.
- #162 passou a referenciar #447 para a atualização posterior de Figma, sem
  marcar homologação não observada.
- #493 e #576 têm critérios registrados, mas seus PRs ainda abertos explicam a
  permanência no backlog; não foram fechadas antecipadamente.

No toolchain, o calendário oficial registra Node 26 LTS a partir de
28/10/2026, mas o suporte documentado do typescript-eslint continua em
TypeScript `>=4.8.4 <6.1.0`. Apenas o primeiro critério da #41 foi confirmado.
Não houve migração de Node/TypeScript nesta tarefa; Node 24 continua suportado.
Fontes consultadas em 02/11: [calendário Node](https://github.com/nodejs/Release/blob/main/schedule.json)
e [matriz do lint](https://typescript-eslint.io/users/dependency-versions/).

## Sequência operacional

1. Concluir o candidato Google #448/#461 com as bases #474/#494, mantendo o
   ensaio real e a preparação do servidor distintos de merges.
2. Validar a governança/perfis e relatórios com os candidatos #530/#532 e os
   roteiros #162/#443.
3. Concluir backup externo, renovação TLS, observabilidade e testes operacionais
   com evidência própria; as propostas existentes permanecem visíveis.
4. Avançar PDF, correções por solicitação e indicadores com contratos e decisões
   definidos, sem duplicar funcionalidades já entregues.
5. Retomar marca, pedestres e toolchain conforme suas dependências, sem ampliar
   silenciosamente o MVP veicular.

## Organização local executada

O diretório principal já separa fontes, documentação e infraestrutura. Não foi
necessária uma mudança da arquitetura de diretórios da aplicação.

- 23 worktrees auxiliares registrados foram inventariados.
- Seis checkouts documentais limpos, já integrados à main, sem cache de aplicação,
  arquivos de ambiente nos caminhos convencionais conferidos ou referência de
  processo detectada, foram arquivados fora
  do checkout principal com `git worktree move`. HEAD e estado limpo foram
  conferidos após a movimentação.
- A inspeção de montagens Docker não estava disponível; diretórios com possível
  uso de aplicação ou runtime incerto foram preservados.
- 44 notas soltas `.md`/`.diff`, sem referência encontrada nos arquivos
  versionados, foram agrupadas em `artifacts/working-notes/2026-11-02/`.
- Nenhum arquivo foi apagado. Trabalhos ativos, evidências e configurações
  pessoais foram preservados. O mapeamento de origem/destino ficou local.
- `.gitignore` explicita diretórios temporários/resultados e remove padrões
  duplicados, preservando as exclusões anteriores.

Os arquivos físicos de um desenvolvedor não são parte do PR: a organização
versionada está nas convenções de [contribuição](../../CONTRIBUTING.md) e nas
regras de ignore. Revisões futuras podem arquivar os checkouts restantes após
confirmar que seus caminhos não atendem a serviços ou trabalho em andamento.

## Fotografia por issue

As linhas abaixo são a classificação datada; os blocos de revisão publicados
nas próprias issues incluem os vínculos de evidência e os próximos passos.

| Issue                                                                    | Prioridade | Estado em 02/11                                                                               | Próximo passo                                                                                                                                                 |
| ------------------------------------------------------------------------ | ---------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [#30](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/30)   | P2         | Decisões registradas; operação e validação institucional parciais                             | Concluir responsabilidades/validação arquivística e os exercícios de backup, PITR e contingência; snapshot pontual não garante RPO.                           |
| [#41](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/41)   | P3         | Janela de revisão alcançada; TypeScript 7 ainda sem suporte oficial do lint                   | Manter Node 24 suportado e TypeScript 6; reavaliar a migração coordenada quando houver suporte oficial, sem misturar com o candidato Google.                  |
| [#100](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/100) | P2         | Bloqueada por definição do procedimento de reconciliação                                      | Validar contrato, responsáveis e conferência do papel; não usar endpoints normais para falsificar horário retroativo.                                         |
| [#162](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/162) | P1         | Homologação observada dos quatro perfis pendente                                              | Executar roteiro e registrar tarefas, dificuldades e volume representativo; demonstração aprovada e testes técnicos não substituem os critérios.              |
| [#163](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/163) | P3         | Pesquisa futura de presença pedestre; fora do incremento veicular atual                       | Retomar somente depois de concluir o núcleo de veículos; não confundir com a busca recorrente veicular já implementada.                                       |
| [#266](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/266) | P3         | Substituída pela decisão de Google pré-autorizado e Administrador local                       | Não implementar login por matrícula nesta linha de trabalho. Preservar a decisão anterior como histórico.                                                     |
| [#267](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/267) | P3         | Substituída pelo fluxo Google/admin vigente                                                   | Não trocar o contrato por matrícula; seguir os candidatos de Google e acesso administrativo com e-mail.                                                       |
| [#269](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/269) | P2         | Regra excepcional após fechamento ainda sem implementação própria                             | Validar autoridades e contrato para a exceção; autorização de evento existente não cobre automaticamente todos os cenários.                                   |
| [#273](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/273) | P3         | Descoberta multimodal futura, adiada pelo responsável do projeto                              | Manter fora do MVP veicular atual e retomar a pesquisa após estabilizar os veículos.                                                                          |
| [#275](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/275) | P2         | Decisão institucional pendente                                                                | Confirmar autoridade, dados mínimos e validade; não inferir capacidade legal ou autorização do estudante.                                                     |
| [#311](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/311) | P1         | Base Terraform versionada; backup externo ainda não comprovado                                | Provisionar e validar Object Storage/Vault/IAM, alertas e restauração desde o armazenamento externo.                                                          |
| [#312](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/312) | P2         | PITR/WAL ainda pendente                                                                       | Escolher estratégia e exercitar recuperação pontual isolada; não declarar RPO de uma hora a partir de dump lógico.                                            |
| [#382](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/382) | P1         | Homologação técnica implantada; critérios operacionais incompletos                            | Concluir custo/quotas, renovação, observabilidade, backup externo e ensaio de atualização/rollback; não reprovisionar a VM apenas porque a issue está aberta. |
| [#422](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/422) | P2         | Totais diários disponíveis; indicador médio ainda exige definição e integração                | Validar conjunto/período da média e implementar a agregação no servidor; não calcular a partir da página visível.                                             |
| [#443](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/443) | P1         | Relatórios implementados; homologação representativa pendente                                 | Conferir PDF com casos fictícios representativos e perfis, reautenticação e limites; preservar o roteiro draft.                                               |
| [#447](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/447) | P2         | Figma aceito depende dos fluxos homologados; Wiki tem manutenção técnica contínua             | Promover somente os fluxos efetivamente aceitos e registrar a ligação com a sessão observada.                                                                 |
| [#448](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/448) | P1         | Caminho crítico: candidato HTTPS e Google real pendentes                                      | Sincronizar os candidatos, obter imagens compatíveis, combinar janela, ativar backend candidato, pré-autorizar via API e observar sucesso/negação.            |
| [#449](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/449) | P1         | Governança implementada no backend; critério documental/homologação composto permanece aberto | Concluir a validação integrada do Administrador único sem criar quinto perfil ou inferir aceite pela automação.                                               |
| [#451](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/451) | P2         | Solicitação/aprovação de correção ainda não implementada                                      | Validar a transição da correção direta auditada para proposta/decisão, mantendo original e autorização no servidor.                                           |
| [#453](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/453) | P3         | Nome oficial depende de decisão institucional                                                 | Registrar nome, forma curta e aceite antes de alterar marca, namespaces ou imagens.                                                                           |
| [#461](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/461) | P1         | Implementada no candidato #474, ainda draft por integração real                               | Receber a main com #570, registrar novos SHAs/checks e executar Google real no candidato HTTPS.                                                               |
| [#468](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/468) | P1         | WAF/LB implantados; validações operacionais restantes pendentes                               | Concluir custo, rate limiting/observabilidade e falsos positivos com Google/relatórios, além de rollback; não declarar política plenamente homologada.        |
| [#473](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/473) | P1         | UI no candidato #530; validação autenticada/dispositivos pendente                             | Usar backend compatível com o contrato textual e concluir as evidências humanas que faltam, sem marcar ensaios não feitos.                                    |
| [#489](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/489) | P3         | Descoberta de indicadores adicionais, sem aceite das novas definições                         | Distinguir agregados já existentes de novos insights e validar finalidade/fórmulas antes de expandir gráficos ou contratos.                                   |
| [#493](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/493) | P1         | Critérios visuais registrados; PR #494 ainda não incorporado e depende da base                | Sincronizar sobre #474 e preservar a atribuição das evidências de tablet/zoom; não fechar antes do merge.                                                     |
| [#495](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/495) | P3         | Bloqueada pelo nome oficial ainda não aprovado                                                | Aguardar #453 antes de substituir nomes e ativos; não bloquear o ensaio técnico do login por marca futura.                                                    |
| [#496](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/496) | P2         | Reformulação dos PDFs ainda pendente                                                          | Confirmar ativo institucional e alinhar contrato/privacidade do documento mascarado antes da implementação e conferência visual.                              |
| [#499](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/499) | P1         | PR #507 com cobertura parcial e pisos; meta final ainda não atingida                          | Preservar pisos e ampliar cenários de risco; consolidar o recorte crítico, sem reduzir denominadores para fabricar 90%.                                       |
| [#500](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/500) | P2         | Proposta no PR #508; observabilidade operada não implantada                                   | Revisar arquitetura/custo e implementar coletor, consultas e alertas pelo caminho restrito.                                                                   |
| [#501](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/501) | P2         | Proposta no PR #517; painel gerenciado não implantado                                         | Escolher alternativa e acesso restrito; não expor Docker socket ou reaproveitar VM de laboratório como entrega deste projeto.                                 |
| [#502](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/502) | P2         | Script candidato no PR #515; carga representativa ainda não executada                         | Aprovar cenário/volume e janela, executar com dados fictícios e registrar latência/erros/consumo sem desativar WAF.                                           |
| [#509](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/509) | P1         | Consulta TLS implementada; renovação automática ainda não comprovada                          | Revisar DNS/IAM, ensaiar renovação/alerta/rollback; não confundir HTTPS válido ou probe com automação completa.                                               |
| [#514](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/514) | P2         | Exceções e dados legados exigem decisão                                                       | Auditar de forma sanitizada e definir exceções sem afrouxar validação nem afirmar regularidade pela sintaxe.                                                  |
| [#555](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/555) | P1         | Defeito de foco reproduzido e corrigido na main; candidato login ainda precisa da base        | Sincronizar #474 com o merge #570 e conferir o cenário original e a CI no SHA final antes de encerrar a investigação.                                         |
| [#565](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/565) | P1         | Correção candidata no PR #567, ainda draft                                                    | Atualizar sobre a base do login e concluir revisão integrada de retorno/logout/troca de conta.                                                                |
| [#566](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/566) | P2         | Implementação candidata no PR #568; CI e aceite ainda pendentes                               | Resolver falha no SHA correto e completar validações próprias da prateleira; não reutilizar aceite de tablet do login.                                        |
| [#576](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/576) | P1         | PR documental #577 pronto para revisão, sem merge                                             | Revisar evidência e roteiro; concluir por merge somente quando aplicável, sem promover o runtime por causa de documentação.                                   |
