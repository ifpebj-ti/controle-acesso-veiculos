# Preparação da reativação segura — Issue #669

## Estado e dependências

Serviço, orquestração e diálogo estão preparados isoladamente em
`src/features/user-accounts/reactivation`. **Não estão montados na página de
contas**. O fluxo antigo da `AdminPage` não foi modificado neste incremento.

A base desta preparação é a main `3306b8e`. O contrato foi inspecionado no
backend #668, SHA `99e68463e57018d83cd04727a7e9b93c45051096`, em especial
`docs/security/authentication.md`. Esse candidato não é tratado como API
incorporada ou hospedada. A montagem final aguarda a incorporação do contrato
canônico de contas Local/Google do #530, conforme coordenação com Raíssa.
Não houve cópia ou merge desse PR nem relaxamento dos schemas atuais.

## Contrato preparado

- Google inativa: `POST /users/{id}/reactivation`, sem corpo, HTTP 204; não
  cria senha local.
- Local inativa: `POST /users/{id}/reactivation-with-reset`, corpo `{ reason }`;
  motivos fechados `Esquecimento`, `SuspeitaComprometimento` ou
  `ProvisionamentoCorretivo`. HTTP 200 deve passar pelo schema estrito existente
  de `temporaryCredential` e `temporaryCredentialExpiresAtUtc`.
- O 409 `local_reactivation_requires_credential_reset` na rota simples não
  dispara outra mutação. Exige atualização do catálogo e nova confirmação.
- Cada confirmação envia uma chamada, com `skipSessionRetry: true`.
  400 e 429 preservam o motivo e permitem somente nova tentativa explícita;
  401/403/404 bloqueiam a confirmação. Conflito, cancelamento, falha de rede,
  resposta inválida e resultado inesperado exigem reconciliação por leitura.

`ReactivationAccount` é uma projeção mínima de DTO **já validado**. O futuro
adaptador deve usar `authenticationMethod` canônico, nunca perfil, e-mail ou
domínio. `ReadReactivationAccount` recebe uma consulta injetada: não existe
suposição de endpoint `GET /users/{id}`. A integração deverá reutilizar o catálogo
real, seus schemas e regras de autorização, sem aceitar respostas inválidas.

## Resultado incerto e credencial

A consulta nunca reenvia a mutação. Conta ausente ou ainda inativa não comprova
rollback nem permite destravar a confirmação no diálogo. Conta Local ativa não
comprova recebimento da credencial; a orientação é fechar e usar a redefinição
administrativa existente, com nova confirmação explícita. Não se recupera nem se
gera outra credencial automaticamente.

A credencial válida é mantida somente no estado em memória e exibida pelo
`TemporaryCredentialDialog` existente, com prazo e entrega protegida ao titular.
Fechar limpa credencial e motivo antes de devolver o foco. Desmontagem descarta
respostas tardias. Não há escrita em storage, URL, log ou telemetria. Não fazer
capturas da credencial nem compartilhar credenciais de contas reais.

## Integração e aceite ainda pendentes

- Incorporar o contrato #530 e ligar o fluxo à lista real, com leitura validada e
  atualização do catálogo após sucesso/fechamento conforme estado observado.
- Compor frontend e API #668 identificados, sem exigir merge como atalho de teste.
- Executar com conta fictícia separada autorizada: Google sem senha, Local com
  reset, erros e reconciliação, prazo/entrega protegida e auditoria.
- Validar o novo fluxo em tablet físico, zoom real e leitor de tela. Ensaios
  anteriores de login ou auditoria não homologam esta tela.

Os testes automatizados usam transporte e dados fictícios. Não comprovam
autorização do servidor, API real, implantação ou homologação institucional.
