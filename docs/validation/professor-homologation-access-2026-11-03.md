# Acesso dos professores na homologação — 03/11 e 04/11/2026

Rastreabilidade: #612/#614 e #615/#616. Autorização de teste comunicada por José.
Credenciais e identidades Google consentidas ficam em arquivo privado, fora do
repositório. Nenhum aceite institucional novo é atribuído a essa execução técnica.

## Candidato instalado

- Backend: `04d102b7beabad6faa2a4c6d450d307b09126d9f`.
- Composição: fonte #614/d2788a4, callback #599/0ca897d e pin de runtime #616/3ac82ea.
- Frontend preservado: `d5a7ba5`; #530/#608/#613/#596 não foram implantados.
- Imagem AMD64: `sha256:30299cfd4a78cb0f1dc74af36f982a68395ccf687fcfe7a7c19d96e8c74165c6`.
- Runtime ASP.NET Core e NETCore verificados: 10.0.14.
- Ambiente explícito: Homologation. Arquivos/segredos protegidos e volume de
  Data Protection preservados, sem migration ou troca de banco.
- Configuração e imagem anteriores registradas para rollback. A tentativa inicial
  anterior à conclusão da transferência não foi ativada e o rollback foi confirmado;
  a ativação final validou arquivo e identidade da imagem antes de subir o serviço.

A imagem inicialmente construída com runtime em cache 10.0.12 foi rejeitada pelo
Trivy e não foi instalada. A imagem corrigida passou com zero HIGH/CRITICAL,
sem ignorar vulnerabilidades com correção disponível. SBOM SPDX 2.3 gerado com
134 pacotes. Isso não comprova ausência de toda vulnerabilidade na aplicação.

## Validações por snapshot

- #614: 408 testes completos da solução passaram.
- Composição com #599 antes do pin Docker: 414 testes completos passaram,
  com build Release sob avisos como erros e formatação verificados.
- O pin alterou Dockerfile/changelog; build da imagem, versão efetiva, Trivy,
  SBOM e verificações HTTP abaixo foram realizados depois dele.
- Os números se sobrepõem e não devem ser somados a #607 ou #611.

## Verificação HTTPS após ativação

| Perfil fictício | Login | Resumo | Renovação | Logout | Consulta `/users` |
| --------------- | ----- | ------ | --------- | ------ | ----------------- |
| Porteiro        | 200   | 200    | 200       | 204    | 403               |
| Vigilante       | 200   | 200    | 200       | 204    | 403               |
| Transporte      | 200   | 200    | 200       | 204    | 403               |
| Administrador   | 200   | 200    | 200       | 204    | 200               |

Cookies de sessão conferidos com Secure e HttpOnly. `/health/ready` respondeu
200; `/auth/providers` confirmou Google habilitado. O início Google redirecionou
com callback HTTPS exato, escopos openid/email/profile e seleção explícita de conta.
Esse redirecionamento não substitui um novo login Google do titular.

José relatou entrada pela interface com a conta fictícia de Porteiro após receber
as instruções. É relato do titular, não uma observação independente do navegador.
As demais verificações acima são HTTP/API; não representam homologação observada
de todos os fluxos, tablet ou leitor de tela.

## Janela e limites

A exceção contempla somente três contas operacionais sintéticas exatas, com
limite `2026-11-05T03:00:00Z` (00h de 05/11 em Brasília). Usuários reais continuam
Google e Administrador mantém a regra local existente. Sessão e renovação não
ultrapassam o limite absoluto; JWTs já emitidos conservam validade curta normal.
Revogar sessões é necessário para encerramento antecipado, respeitada essa janela.

A tela de Usuários e permissões do frontend hospedado ainda possui a
incompatibilidade de contrato registrada na #603. A correção #530/#608 foi testada
localmente e não está nessa imagem frontend. Revisão de correções #607/#613 e
importação do papel #100/#611 também não são funcionalidades disponíveis no site.

Divulgar como avaliação controlada com dados fictícios e limitações conhecidas.
Não publicar senha, cookie, token, parâmetros OAuth ou contatos de titulares.
Os roteiros privados de apresentação e teste distinguem esses estados.
