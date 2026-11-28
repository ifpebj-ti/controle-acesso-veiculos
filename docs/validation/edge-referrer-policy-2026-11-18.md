# Política efetiva de referência da borda — 18/11/2026

Rastreabilidade: #772 / CAV-27. Base main `a4ffcc5`.

## Causa e implementação

O Caddy sobrescrevia a política no-referrer do Nginx com
strict-origin-when-cross-origin. O exemplo versionado agora usa no-referrer.
O verificador HTTP exige exatamente um header Referrer-Policy com esse valor;
política ausente, divergente ou duplicada falha. Quatro testes com servidor HTTP
local cobrem esses estados. A CI Containers executa os testes antes do smoke
HTTP existente; nenhum scanner ou gate foi reduzido.

## Aplicação controlada na homologação

Em 18/11 às 13h23 BRT, foi aplicado somente esse campo na configuração do Caddy
v2.11.7, com backup protegido, comparação estrutural das configurações adaptadas,
validação pelo binário instalado, troca atômica e reload bem-sucedido.
Fonte de implementação: `cea1803`; commits documentais posteriores não mudam
esse recorte. O backup permite restaurar a configuração e recarregar o serviço.

A release de aplicação continua 0.5.0, fonte `eaccd72`, com 23 migrations.
Frontend, backend e PostgreSQL conservaram seus IDs de container e imagens:

- Backend: sha256:1534ee794f47772299d85f396257f9e7043ba0151678fdb72fbb1a4397abb2f8.
- Frontend: sha256:805b4585ef3568f9b797ece0cf784b6db0500da4e11812498752609758e973c8.

Não houve nova imagem, migration, alteração de conta ou mutação de negócio.
A sessão administrativa temporária teve exclusão solicitada e a regra temporária
de acesso do cliente foi removida após a operação.

## Evidências e limites

- Quatro testes do verificador: aprovados.
- Caddyfile candidato validado localmente com imagem Caddy fixada por digest.
- Caddyfile candidato validado também pelo Caddy instalado na VM.
- Verificador público com validação TLS: aprovado para redirect relativo,
  frame policy, cache e Referrer-Policy único em todas as rotas consultadas.
- Login, readiness, providers e CSRF retornaram 200 com um único no-referrer;
  googleEnabled=true. A resposta CSRF não foi publicada.
- Checks sem sessão não comprovam autenticação Google real, acessibilidade,
  autorização completa nem aprovação do avaliador. Nenhum desses ensaios foi
  repetido nesta alteração.

CAV-27 recebeu correção técnica e reteste público no recorte de header. O aceite
independente do professor continua separado. Provas operacionais e backup ficam
em armazenamento privado; não são publicados logs brutos ou configuração real.

Referência: [Caddy header](https://caddyserver.com/docs/caddyfile/directives/header).
