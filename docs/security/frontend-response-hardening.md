# Redirects, frames e cache do frontend

Rastreabilidade #723, achados CAV-17/CAV-22/CAV-23 do relatório externo.

## Evidência pública em 15/11/2026

No frontend hospedado `67ad6b8`, consultas sem autenticação confirmaram
redirecionamento de `/api` para HTTP/8080, duas políticas X-Frame-Options no
CSRF e ausência de Cache-Control explícito no HTML/bundle. As consultas de
readiness e CSRF responderam 200. A coleta registrou somente status e cabeçalhos
selecionados, sem publicar cookies ou corpo do CSRF.

## Comportamento do candidato

- O redirect de `/api` usa `Location: /api/`. O navegador resolve o destino
  relativo na origem já acessada, preservando o HTTPS público.
- O Nginx emite uma política `X-Frame-Options: DENY` e remove o header duplicado
  recebido do backend. A resposta CSRF conserva seu `no-store`.
- O HTML do SPA recebe `no-cache`, permitindo revalidação a cada navegação.
- Bundles JS/CSS com hash no nome recebem cache público de um ano e `immutable`.
- Recursos inexistentes em `/assets/` retornam 404. O cache imutável só é
  acrescentado aos códigos de resposta elegíveis da diretiva `add_header`.
- Os headers de segurança continuam no nível do servidor e são herdados pelas
  locations. O mapa de cache usa valor vazio para os endpoints dinâmicos.

## Validação reproduzível

```shell
python3 -B infrastructure/security/verify_frontend_responses.py http://127.0.0.1:3000
```

O verificador faz requisições limitadas, conserva validação TLS quando recebe
HTTPS e apresenta somente mensagens controladas. Ele confere redirect relativo,
CSRF, HTML, bundle identificado pelo próprio HTML e recurso estático ausente.
O smoke integrado de containers executa o mesmo verificador contra a API real.

O ensaio local inicial utilizou o Nginx real da imagem identificada e um upstream
de teste que reproduz os dois headers do CSRF. Com a configuração anterior,
falharam cinco verificações. Com a configuração candidata, todas passaram.
Esse recorte avalia o proxy. A promoção e o reteste da borda pública estão na #686.

## Continuidade

O fallback de rotas do SPA e a política de Referrer-Policy aplicada pela borda
continuam com seus recortes de avaliação nos achados CAV-21/CAV-27. O relatório
de remediação identifica fonte, implantação e reteste de cada achado.

Referências primárias

- [Redirects relativos no Nginx](https://nginx.org/en/docs/http/ngx_http_core_module.html#absolute_redirect).
- [Headers e herança](https://nginx.org/en/docs/http/ngx_http_headers_module.html#add_header).
- [Supressão de header do upstream](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_hide_header).
