# Reativação segura na gestão de contas — Issue #669

## Estado atual e fontes

O PR #672 monta o diálogo preparado na AdminPage, usando o catálogo canônico
Local/Google do #530 já incorporado. Base deste incremento: main `6c435d4`,
recebida por merge regular `58af0e0`. Nenhuma branch de login foi refeita e
nenhum backend/infraestrutura/contrato foi alterado.

A API #668 permanece candidata em `e01247d`; seu contrato foi novamente conferido
em `docs/security/authentication.md`. Montagem no frontend não é implantação,
API hospedada ou homologação. Não usar a versão do site anterior como prova
deste código, nem ativar a tela em produção sem composição compatível.

## Integração na lista

- Somente Administrador carrega a gestão de contas. Métodos vêm exclusivamente
  de `authenticationMethod` do DTO validado; perfil/domínio não o substituem.
- Reativar uma conta inativa abre o diálogo já existente. O gatilho real é
  transmitido para retorno de foco; outras escritas ficam bloqueadas enquanto
  o fluxo estiver aberto. Desativação e redefinição ativa mantêm suas rotas.
- Google: POST `/users/{id}/reactivation`, sem corpo, HTTP 204. Não pede nem
  cria senha local.
- Local: POST `/users/{id}/reactivation-with-reset`, `{ reason }` do catálogo
  Esquecimento/SuspeitaComprometimento/ProvisionamentoCorretivo. HTTP 200 deve
  validar `temporaryCredential` e `temporaryCredentialExpiresAtUtc` pelo schema
  estrito existente.
- Uma confirmação explícita envia uma chamada com `skipSessionRetry: true`.
  Não há retry de mutação, inclusive na reconciliação ou atualização da lista.
- 400/429 preservam motivo e exigem envio explícito; 401/403/404 bloqueiam a
  confirmação. Erros de contrato/cancelamento/rede e respostas perdidas não
  significam rollback.

## Reconciliação e nova intenção

A consulta usa exclusivamente GET `/users` e seu schema real. Procura o nome
pelo filtro literal existente e compara o ID, sem assumir endpoint de detalhe.
Não usa o filtro ativo nem a paginação visual, e lê até cinco páginas de 100.
Se não encontrar (incluindo nome alterado ou limite atingido), o resultado é
inconclusivo. Não inferir exclusão/rollback ou método por outro registro.

Após resultado incerto, o diálogo permite somente leitura. Fechar e abrir
novamente não libera outro POST para aquela conta durante a vida da página.
A guarda contém somente IDs em memória, não dados de credencial. Conta ativa
não comprova recebimento da credencial: a pessoa deve usar o fluxo já existente
Redefinir credencial, com nova justificativa e confirmação explícita. Recarregar
não deve ser usado como prova de rollback; o servidor continua controlando
concorrência, auditoria e credenciais de uso único.

O 409 `local_reactivation_requires_credential_reset` é uma recusa conhecida da
rota antiga. Não há fallback automático: fechar consulta novamente o catálogo,
e uma **nova confirmação explícita** usa o método canônico atualizado. Essa
recusa não é confundida com uma resposta de transporte perdida.

Após conclusão/fechamento relevante, a lista é reconsultada com os filtros
aplicados, preservando o rascunho. A página é mantida quando válida; se a última
ficar inválida, outra consulta ajusta somente seu número. Foco retorna ao gatilho
conectado, ação atual da conta ou região do catálogo; não rouba foco de feedback
já intencionalmente anunciado. Cancelar sem envio não recarrega a lista.

## Credencial e sessão

O diálogo existente exibe a credencial uma única vez, com prazo e entrega
protegida. Não é copiada automaticamente. Fechar limpa o estado antes de voltar
à lista. A página administrativa é remontada ao trocar o ID da conta autenticada;
logout/desmontagem descarta respostas tardias. Sem credencial em URL, storage,
logs, telemetria, documentação ou capturas de QA. Não usar contas compartilhadas.

## Cronologia e evidências

- `dd5cf90`: preparação isolada e correção do erro de motivo relatado no tablet.
- `02efbff`: sincronização documental/base com #530, ainda sem montagem;
  48 testes focados, lint/build atribuídos à revisão anterior.
- Este incremento: montagem e regressões da página completa/serviço validador,
  com dados e transporte controlados. Quantidades/checks finais ficam no PR.

Os ensaios anteriores de tablet/Narrador/zoom continuam ligados à preparação
isolada; não homologam automaticamente o diálogo montado e o novo retorno de
foco na lista. No contexto montado, passaram oito casos de tela/tema em Brave 157.0.8103.79
(390×844, 768×1024, 1440×1000, 720×500, Claro/Escuro), cinco cenários controlados
(resposta perdida ativa/inativa, resposta inválida, recusa legada e validação),
quatro varreduras axe sem achados sérios/críticos e dois ensaios automatizados
com zoom nativo 200%, teclado/Escape/retorno de foco e sem overflow. O zoom
preservou a janela, confirmou fator 2, DPR 1→2 e CSS zoom 1. São componentes e
serviços reais com contexto/transporte fictícios, não API real, tablet físico
ou Narrador. Scripts/logs e capturas de confirmação sem credencial ficam no
TEMP, fora do Git; nenhum valor de credencial é capturado ou publicado.

Pendências: candidato explícito de frontend + API #668 com conta fictícia
separada, validação autenticada de Local/Google/erros/auditoria/entrega e aceite
humano do novo contexto. Manter draft / Refs #669. Não fazer merge ou deploy.
