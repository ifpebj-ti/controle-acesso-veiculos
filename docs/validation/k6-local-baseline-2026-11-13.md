# Ensaio k6 local — 13/11/2026

**Rastreabilidade:** Issue #502 / PR #515. Execução local concluída; ensaio OCI
permanece pendente. Não é teste de capacidade da hospedagem nem aceite do pico real.

## Ambiente e método

- API ASP.NET Core: fonte `8b61ccd`, PostgreSQL descartável, 22 migrations.
- Alvo loopback em HTTP; sem TLS, Caddy, Load Balancer ou WAF nesse caminho.
- Conta Porteiro exclusivamente fictícia no banco de QA; nenhum usuário real ou
  conta dos professores foi alterado. Credenciais/token somente no processo.
- Grafana k6 nativo 2.3.0, ZIP oficial AMD64 conferido pelo SHA-256 publicado.
- Perfis sequenciais `low`/`medium`/`intense`, com readiness HTTP 200 antes e depois
  de cada perfil. Autenticação renovada antes de cada execução.
- Leituras de acessos abertos e resumo diário, com pausas de 2–3 segundos.
  O k6 não cria movimentos. Login gera sessão/auditoria técnica conforme a API.
- Thresholds originais preservados: erro <1%, HTTP 429 <1%, p95 <1500 ms e
  p99 <3000 ms. Rate limiting da aplicação mantido ativo.

## Resultados

| Perfil  | VUs máximos | Duração observada | Requisições | Req/s | p50 (ms) | p95 (ms) | Erros / HTTP 429 |
| ------- | ----------: | ----------------: | ----------: | ----: | -------: | -------: | ---------------- |
| low     |           1 |           75.42 s |          61 |  0.81 |    14.12 |    22.34 | 0 / 0            |
| medium  |           3 |          152.76 s |         303 |  1.98 |    13.00 |    26.88 | 0 / 0            |
| intense |           5 |          182.27 s |         611 |  3.35 |    13.92 |    24.66 | 0 / 0            |

Os três processos encerraram com código zero e todos os thresholds passaram.
O p99 foi avaliado pelo threshold e permaneceu abaixo de 3000 ms em cada perfil;
o resumo padrão desta execução não exportou seu valor numérico. Não foi
substituído pelo máximo nem inventado um percentil.

## Limitações e próximos passos

Estes números verificam o roteiro e a API local. Testes frontend também estavam
em execução na estação durante parte da janela: houve concorrência de recursos.
Não se mediu CPU/memória/disco da VM, conexões do PostgreSQL ou eventos de WAF/LB.
Não se inferem consumo de produção, capacidade máxima, ausência de gargalos ou
atendimento do pico real. Não houve carga contra o site hospedado.

O problema prático encontrado foi o uso de localhost dentro de Docker, que
aponta para o próprio contêiner. O invocador agora usa k6 nativo para loopback,
rejeita URLs com credenciais/query/fragmento antes do login e separa diretórios
por execução. Também corrige a obtenção do caminho da pasta (`FullName` de
`DirectoryInfo`). Depois dessa correção, o invocador PowerShell completo passou
com o perfil `low`, autenticação fictícia local, escrita do resumo e limpeza da
variável de token. Essa verificação adicional não foi somada à tabela dos três
perfis. A CI confere os guardas sem autenticar ou gerar carga.

A próxima etapa é uma janela identificada na OCI, após composição da release e
observabilidade, com limites de custo, recursos medidos e critérios de parada.
A #502 continua aberta e o #515 draft. Registros do banco de QA não se misturam
à homologação; os resumos brutos permanecem fora do Git.

Referências: [thresholds oficiais do k6](https://grafana.com/docs/k6/latest/using-k6/thresholds/)
e [resumos por arquivo](https://grafana.com/docs/k6/latest/results-output/end-of-test/custom-summary/).
