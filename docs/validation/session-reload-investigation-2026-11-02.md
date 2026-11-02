# Recargas e recuperação da sessão — 02/11/2026

**Rastreabilidade:** #591, #581 e #588. **Base:** main `e0156b1`.

## Separação dos problemas

O titular relatou sucesso Google e acesso ao perfil Porteiro no candidato HTTPS
e, depois de recargas repetidas, saída da sessão. Há três problemas distintos:

| Evidência                                                       | Tratamento                                                     |
| --------------------------------------------------------------- | -------------------------------------------------------------- |
| Conclusão Google recebia HTML da SPA e exibia 404               | Proxy exato na #586 / PR #590                                  |
| Descoberta de provedores recebeu 429 da regra ampla do WAF      | Escopo refinado na #588 / PR #589; 35 consultas retornaram 200 |
| Botão persistia em “Redirecionando…” após voltar pelo histórico | Frontend #587 / PR #592                                        |

Nenhum desses fatos, isoladamente, identifica toda perda de sessão. Esta
investigação não usa cookies ou credenciais do titular, não modifica contas e
não reproduz ataques na hospedagem.

## Reprodução determinística em ambiente descartável

O teste `LostCommittedRefreshResponseRevokesStaleFamilyAndFreshLoginRecovers`
executa API real pelo TestServer e PostgreSQL descartável via Testcontainers:

1. Cria somente uma identidade fictícia e obtém CSRF e sessão local.
2. Um handler de transporte deixa a API concluir uma renovação com sucesso,
   descarta a resposta e lança erro antes que o cliente receba o `Set-Cookie`.
3. Confere no banco a rotação confirmada: token antigo consumido/revogado por
   rotação e um sucessor ainda ativo, na mesma família.
4. Reapresenta o cookie antigo, como faria um cliente que perdeu a resposta.
5. Confere 401, revogação do sucessor por reutilização e auditoria correspondente.
6. Faz autenticação nova e confirma renovação com outra família ativa.

O handler modela **perda da resposta após commit**. Não é uma captura de rede,
um aborto TCP real, um teste do Google ou reprodução observada do F5 no browser
do titular. Não reproduz cancelamento anterior ao commit nem mede WAF.

O teste concorrente existente foi fortalecido: além de uma resposta 200 e outra
401 para o mesmo token, confere zero sucessores ativos depois da reutilização e
nega uma tentativa com o cookie da resposta vencedora. O teste de rotação
sequencial existente permanece preservado. Não se alteram limites, rotação,
cookies, transações, revogação, contrato nem comportamento de produção.

## Recuperação e limites

Depois de uma resposta perdida, tentar indefinidamente o refresh antigo não
recupera a sessão. O usuário deve retornar ao login e autenticar novamente;
para perfis Google, com a conta previamente autorizada. O frontend deve limpar
a identidade em memória ao receber a falha definitiva, sem reiniciar Google
automaticamente. A recuperação local fictícia exercitada não substitui um novo
ensaio Google com o titular presente.

Uma tolerância genérica que aceite refresh já consumido ocultaria também
reutilização maliciosa. A decisão conservadora da ADR 0001 é mantida. A
[RFC 9700, seção 4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2)
explica a revogação na detecção de replay e a necessidade de nova autorização
para o cliente legítimo. A aplicação mantém sua própria sessão depois do OIDC;
não usa o refresh token do Google neste fluxo.

## Pendências antes de concluir a #591

Os sete testes de `AuthenticationSessionTests` passaram na execução local com
API e PostgreSQL descartável. O comando utilizou .NET 10, filtro da classe,
relatório TRX e diretório de artefatos ignorado. Inclui a reprodução de resposta
perdida e a verificação concorrente fortalecida. Esse resultado não é uma
execução de toda a suíte do backend.

- Relacionar o SHA e o PR desta evidência na Issue #591.
- Observar recarga normal e nova autenticação no candidato HTTPS atualizado.
- Se a falha persistir sem recarga interrompida, correlacionar somente códigos,
  horários e identificadores técnicos sanitizados; não capturar cookies, tokens,
  e-mails ou parâmetros OAuth em evidência pública.
- Distinguir falha de rede, 429 da borda/API e 401 de sessão. Não atribuir todo
  encerramento ao mecanismo reproduzido aqui.
