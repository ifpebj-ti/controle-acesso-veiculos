# Roteiro de decisões e validações — 03/11/2026

Responda pelo número Q1–Q13. Pode usar: **definido**, **precisa confirmar** ou
**pode ficar para depois**. Quando houver aprovação institucional, informe a
função de quem confirmou e a data aproximada; não envie senhas, documentos,
cookies, contatos privados ou capturas com dados reais.

**Decisão não é teste:** aprovar uma regra permite implementar; não comprova que
a interface, a infraestrutura ou o exercício de recuperação já funcionaram.

## O que já sabemos — não precisa responder novamente

- O foco atual são veículos. Pedestres/presença laboral permanecem para o futuro
  (#273/#163); não ampliar o MVP por causa da organização do backlog.
- Existem quatro perfis. Porteiro e Vigilante compartilham a operação; não criar
  Administrador mestre ou perfil autenticado Motorista sem nova decisão.
- Google aceita conta pessoal ou institucional exata, ativa e pré-autorizada.
  Administrador usa a entrada local separada. O domínio não concede acesso.
- Eurico responde pelo processo; a equipe designada pelo curso, com orientadores,
  responde pela manutenção técnica. Faltam alguns papéis de substituição/conferência.
- Registros, auditoria e papel reconciliado: prazo operacional informado de cinco
  anos. Logs técnicos: 90 dias. Backups: 35 dias. Revisão arquivística precede
  qualquer descarte automático. RPO de uma hora e RTO de quatro horas são metas,
  ainda não resultados comprovados.
- O orçamento informado é US$ 300 para até um ano na conta acadêmica. Saldo,
  vencimento e consumo efetivo precisam ser conferidos na conta; não presumir
  que orçamento encerra serviços ou impede cobrança.
- A demonstração recebeu aprovação. O roteiro observado completo dos quatro
  perfis, com evidências por tarefa, continua distinto desse retorno positivo.

## Respostas já recebidas em 03/11

### Correções — #451

José relatou que Eurico deu liberdade à equipe e autorizou implementar a solução.
A decisão técnica é preservar o original, solicitar com justificativa, revisar
por Transporte/Administrador e aplicar somente após aprovação. Rejeitar registra
motivo e mantém a proposta como rejeitada; não exclui evidência. A tela principal
mostra um acesso com sua versão efetiva; a trilha mostra as versões e decisões.
Não permitir autoaprovação. O aceite da experiência final permanece na #162.

### Contingência — #30/#100

Foi confirmado o uso do papel durante indisponibilidade e lançamento posterior.
Será um fluxo separado com horário observado e horário da digitação distintos,
identificação do autor do papel, digitador e conferência. Isso não libera a edição
livre do horário nos endpoints normais. Falta somente o detalhe de papéis em Q3.

### Nome — #453/#495

Continua pendente. DAT é uma possibilidade, sem nome/expansão aprovados. Não
alterar marca, sigla, imagens de container ou namespaces por suposição.

## Q1 — Quais testes com pessoas realmente ocorreram?

Issues #162/#473/#443/#447/#566/#594.

Para cada perfil é Porteiro, Vigilante, Transporte e Administrador é informe:
quem testou pelo papel exercido, quando, quais tarefas concluiu, em qual aparelho
e o que precisou de ajuda. Diferencie equipe testando conta fictícia de usuário
representativo executando a operação. A tela de login já tem relatos de tablet e
Narrador; isso não comprova a tela de contas, categorias ou relatórios.

O período de pico chegou a ser observado? Quantos veículos ou atendimentos em
quanto tempo? Se não mediram, responda **ainda não medimos**.

## Q2 — Ensaios Google ainda específicos

Issues #448/#461/#565/#587/#581/#593.

- Depois de sair de Usuários ou Relatórios como Administrador, entrar com Google
  como Porteiro abriu a visão permitida sem tentar voltar à administração?
- Alguém consentiu em testar uma conta Google que não esteja pré-autorizada?
  Basta confirmar a disponibilidade do titular; não informar credenciais.
- Caso tenha ocorrido outra falha, informe etapa e horário aproximado, sem URL
  com parâmetros OAuth.

José já confirmou Google/Porteiro, recargas, recuperação por novo login e login
administrativo. Não é preciso repeti-los apenas para preencher o checklist.
Cancelar não aparece na tela Google desse titular: permanece uma limitação,
sem exigir remover consentimentos ou forçar uma tela do provedor.

## Q3 — Quem digita e quem confere o papel?

Issues #30/#100. O procedimento geral já foi confirmado.

- Porteiro/Vigilante fazem a digitação posterior? Transporte também pode digitar?
- Transporte ou Administrador fará a conferência? Pode ser a mesma pessoa que
  digitou ou deve existir uma segunda pessoa?
- Quem responde pelo incidente quando há papel incompleto ou horários ilegíveis?

Recomendação técnica: operação lança; Transporte/Administrador confere; a mesma
pessoa não aprova o próprio lançamento. Sem informação legível, registrar a
pendência, em vez de inventar horário. Isso é proposta técnica até confirmação
ou delegação explícita dessa escolha.

## Q4 — Veículos após 22h

Issue #269. O fechamento às 22h já foi informado.

Quem autoriza as exceções? Como o operador recebe essa autorização? Residentes,
serviços e eventos exigem autorização individual, lista por período ou outra
regra? Em emergência, quem será avisado e quem revisará depois? Não precisamos
de nomes reais de visitantes ou mensagens privadas como evidência.

## Q5 — Estudantes que chegam conduzindo veículos

Issue #275.

Existe política escrita de quem pode entrar, inclusive residente? Qual setor
concede/revoga a autorização e por quanto tempo? Se isso não foi decidido,
informe **confirmar com a gestão**. Não inferir idade/capacidade legal, nem
solicitar fotos de CNH ou documento como atalho.

## Q6 — Exceções de placa

Issue #514.

O campus recebe veículos sem placa, estrangeiros, máquinas ou outra identificação
especial? Como a portaria decide nesses casos hoje e quem autoriza? Os dados
antigos devem ser preservados e corrigidos com trilha, sem apagar silenciosamente.
Uma integração oficial paga não será ativada apenas para validar o formato.

## Q7 — Indicadores e média da frota

Issues #422/#489.

Qual decisão Eurico quer apoiar com gráficos? O que é necessário agora e o que
pode ficar para depois? Para a média, proponho considerar **utilizações que
retornaram no período**, duração real entre saída e retorno, excluir utilizações
abertas e apresentar ausência de média quando não houver retorno. Essa definição
faz sentido para o setor ou ele quer outro recorte? Não chamar uma contagem por
hora de capacidade real de atendimento.

## Q8 — PDF e referência institucional

Issues #496/#443/#532.

A revisão continua pedindo tabela em A4 paisagem e o símbolo isolado do IF no
canto direito? O ativo desse símbolo já foi fornecido/aprovado? O número de
documento, quando coletado, continua somente mascarado conforme a decisão já
registrada na #496; não precisamos receber documentos reais para testar.
Quem do setor revisará um PDF de exemplo com textos longos e várias páginas?

## Q9 — Nome

Issues #453/#495: **respondido: pendente**. Quando houver decisão, enviar somente
nome completo, forma curta, subtítulo e quem aprovou. Enquanto isso, preservamos
a identidade descritiva atual.

## Q10 — Custos e avisos de operação

Issues #382/#468/#500/#311.

Qual é a data final do período acadêmico que o ambiente precisa cobrir? Qual
função/pessoa autorizada deve receber avisos de custo, falha e disco cheio?
Não envie contatos privados para publicação: a configuração será privada.
O responsável deseja desligamento fora de alguma janela ou precisa funcionar
continuamente para os testes? A escolha técnica das ferramentas continua com
a equipe, respeitando o orçamento já informado.

## Q11 — DNS e manutenção do HTTPS

Issue #509/#512.

Quem continuará com acesso administrativo ao domínio temporário se José sair do
projeto? Já há um responsável pela continuidade ou segue com José? A equipe fará
a revisão técnica da automação sem pedir senha da conta Namecheap nem mudar o
DNS principal para resolver isso por tentativa.

## Q12 — Janela de homologação e de carga

Issues #162/#502/#515.

Quais dias/horários podem ser usados para teste acompanhado e para carga limitada
sem atrapalhar o professor ou a portaria? Quem informará um volume aproximado de
uso real? Não precisamos que José escolha número de usuários virtuais sem base:
a equipe transformará o uso esperado em um cenário limitado e revisável.

## Q13 — Responsáveis e recuperação

Issues #30/#311/#312/#382.

Qual função substitui Eurico na ausência? Qual função será a referência de
arquivamento/proteção de dados antes do descarte? Quem pode autorizar um exercício
de restauração em ambiente separado e quem verifica o resultado? Equipe do curso
e orientadores já são os responsáveis técnicos gerais; não repetir essa decisão.

## Não são perguntas para o cliente

Escolha de ferramenta de testes, desenho de migrations, controle de concorrência,
tratamento HTTP, proteção de segredos, separação de IAM, limiares técnicos e
instrumentação são trabalhos da equipe. As issues #603/#499/#500/#501/#509/#311/#312
contém implementação ou evidência ainda faltante: uma resposta “aprovado” não
substitui executar esse trabalho. #41/#163/#273 seguem na fila futura.
