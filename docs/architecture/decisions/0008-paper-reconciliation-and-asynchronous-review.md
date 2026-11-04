# ADR 0008 — Reconciliação do papel com conferência assíncrona

- **Estado:** direção autorizada; domínio e orquestração de aplicação candidatos, sem persistência/API.
- **Data:** 03/11/2026.
- **Rastreabilidade:** #100 e #30. Revisão de correções: #451/#607/#610.
- **Base atualizada:** main `c620c88` após #616/#614; não incorpora o candidato #607.

## Contexto

José informou a decisão operacional: na indisponibilidade do sistema ou da
internet, Porteiro/Vigilante registram em papel e digitam depois. Transporte
confere diariamente, aceitando ou recusando com justificativa, sem parar os novos
atendimentos. Administrador é a continuidade técnica; a mesma pessoa não confere
o próprio lançamento. A implementação foi autorizada, mas o exercício observado
de contingência não foi realizado por essa comunicação.

Uma entrada às 9h digitada às 10h precisa conservar os dois instantes. A saída
real às 10h10 continua sendo registrada normalmente, mesmo antes da conferência.
Estado físico do acesso e estado de conferência são conceitos independentes.

## Decisão

1. Usar fluxo específico, sem adicionar horário retroativo aos endpoints normais.
2. Identificar a linha pela combinação incidente e número sequencial. A futura
   persistência deverá impor essa unicidade no banco, não apenas na interface.
3. Conservar autor do papel, digitador, entrada e saída observadas no papel,
   momento da digitação, justificativa e referência ao acesso efetivo.
4. Tratar a conferência como `Pendente`, `Conferida` ou `Recusada`. Decisão exige
   outro ator e motivo; a mesma decisão repetida conserva o primeiro instante.
   Decisão divergente não sobrescreve estado terminal.
5. Uma recusa preserva fatos e proveniência. Divergências seguem para correção
   rastreada; não excluir o acesso nem fabricar um novo horário para ocultar erro.
6. Quando houver veículo dentro, criar acesso operacional em aberto e apresentar
   indicação de conferência pendente. A conferência não é autorização para impedir
   a saída normal, nem confirmação de que o veículo ainda está fisicamente dentro.

## Incremento implementado

`ReconciliacaoContingencia` registra metadados imutáveis e a decisão atribuída.
Valida identificadores, textos limitados, UTC e cronologia. Os testes de domínio
exercitam os estados, a preservação das evidências e a independência da saída
operacional. Não há DbSet, migration, endpoint, tela ou inscrição desse modelo
na aplicação em execução. Isso não comprova idempotência ou corrida no PostgreSQL.

A referência do autor do papel é um identificador operacional limitado a 120
caracteres, conforme o formulário existente; não é login, documento pessoal ou
fonte de permissão. Validação contra o incidente e seus operadores pertence à
orquestração futura. Placa, pessoa, categoria e objetivo permanecem no acesso;
não duplicá-los nesta entidade de proveniência.

## Entrega necessária antes de ativar

- Contrato específico para incidente/importação e divergências incompletas;
  horário ilegível deve gerar pendência, nunca valor inventado.
- Autorização no servidor: operação importa; Transporte/Admin confere; ator da
  sessão não pode ser enviado livremente no payload.
- Transação que crie proveniência, acesso, eventual saída de papel e auditoria;
  idempotência por incidente/linha e intenção, conflitos e bloqueio de concorrência.
- Verificação de acessos simultâneos existentes, sem escolher silenciosamente
  outro acesso ou ignorar o conflito para concluir uma importação.
- Integração com autoria do encerramento do #607/#609, revisão de migrations
  e ensaios de upgrade/recuperação antes de promover imagens.
- Consulta de fila e resumo da conferência diária, acessibilidade, manual,
  OpenAPI, diagrama de ameaças e exercício com os quatro perfis.

## Consequências e riscos

O fluxo permite trabalho contínuo e mantém rastreabilidade do papel. A fila
precisa de acompanhamento diário; uma pendência não pode desaparecer por ficar
antiga. A conferência rejeitada pode exigir outro tipo de correção além do escopo
descritivo atual; o contrato dessa divergência será explícito, sem liberar edição
irrestrita de pessoa, placa ou horário.

Falsificação de autoria, importação duplicada, deslocamento de horário, recusa
destrutiva e autoaprovação são riscos a controlar na API/persistência futuras.
As validações do domínio não substituem autenticação, autorização, constraints,
controle de replay ou auditoria transacional. Ameaças continuam abertas até
validação integrada. A hospedagem e o formulário normal não mudam neste incremento.

## Incremento de aplicação — 04/11/2026

`PaperReconciliationService` valida e normaliza importação e conferência antes de
chamar uma porta de persistência atômica. Porteiro/Vigilante importam;
Transporte/Administrador conferem. Ator e instante de gravação vêm do contexto do
servidor; o payload não contém digitador, revisor ou horário de digitação.
Datas observadas aceitam offset explícito e são normalizadas para UTC. Hora
ilegível/ausente não é substituída por agora. Reutiliza a validação de entrada
existente para evitar uma política divergente de placa, categoria e campos.

O resultado canônico da persistência é devolvido sem recalcular sua data ou
repetir a escrita. Cancelamento já conhecido impede iniciar a operação. Falha
incerta é propagada: isso não comprova rollback nem autoriza retry automático.

**Limite explícito:** `IPaperReconciliationStore` é contrato, não implementação.
Unicidade, rejeição de replay divergente, validação do incidente/autor do papel,
concorrência, impedimento de autoaprovação, transação e auditoria precisam ser
realizados/revalidados no store com PostgreSQL. O domínio já impede autoaprovação,
mas o teste de aplicação com store fictício não prova essa garantia no banco.
Ainda não há DI, migration, API pública nem alteração da hospedagem.

Validação: 137 testes da aplicação passaram, incluindo 47 novos casos. A matriz
cobre perfis negados, identidade inválida, datas, entrada fechada/aberta, formatos,
conflitos, recibo repetido, cancelamento e falha incerta sem segundo envio. Não
contabilizar esse resultado como integração ou aceite institucional.
