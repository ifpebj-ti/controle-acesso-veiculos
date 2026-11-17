# Ensaio de carga controlado

## Objetivo e limites

O ensaio da Issue #502 produz uma linha de base técnica para a homologação OCI.
Ele não certifica capacidade de produção, não simula DDoS e não substitui a
observação do fluxo real da portaria. A primeira versão usa apenas operações de
leitura e uma conta fictícia dedicada para impedir mistura com o piloto.

O script versionado está em
[`infrastructure/load-testing/k6`](../../infrastructure/load-testing/k6/README.md).
Os limites de 1, 3 e 5 usuários virtuais são conservadores e devem ser
reavaliados após a medição do volume real, sem exceder o orçamento acadêmico.

## Pré-condições obrigatórias

Antes de executar contra a nuvem, registre na Issue #502:

1. hostname e release candidata, sem publicar IP quando desnecessário;
2. data, horário, duração, operador e responsável que autorizou a janela;
3. confirmação de que não haverá demonstração ou uso do piloto no período;
4. conta local fictícia dedicada, ativa somente durante o ensaio;
5. backup e saúde da stack confirmados;
6. WAF, rate limiting, logs, métricas e traces mantidos ativos;
7. teto de custo e critério de interrupção aceitos.

Não use conta pessoal, conta de servidor real, dados reais nem credencial Google.
Não publique senha, cookie, token, cabeçalho `Authorization` ou resposta com dado
operacional.

## Critérios de interrupção

Interrompa imediatamente quando ocorrer qualquer condição abaixo:

- readiness diferente de HTTP 200 antes do início;
- mais de 1% de erros de aplicação ou requisição após os primeiros 30 segundos;
- perda de saúde de API, banco, proxy ou Load Balancer;
- CPU sustentada acima de 85%, memória acima de 90% ou disco acima de 85%;
- crescimento anormal de conexões, reinício de contêiner ou fila operacional;
- custo inesperado, alerta do WAF ou impacto percebido por um usuário;
- latência p95 acima de 1,5 s ou p99 acima de 3 s.

Os thresholds são guardas iniciais do ensaio, não promessa contratual de SLA.
HTTP 429 é medido separadamente: ele pode demonstrar o funcionamento do limite,
mas ainda reprova a linha de base acima de 1% para evitar mascarar saturação.

## Sequência de execução

Execute um perfil por vez, começando por `low`. Só avance quando a saúde e os
recursos voltarem ao estado anterior e o resultado precedente tiver sido
revisado.

```powershell
.\infrastructure\load-testing\k6\Invoke-Baseline.ps1 `
  -ApiBaseUrl 'https://HOST_DE_HOMOLOGACAO/api' `
  -Profile low `
  -ApprovedRemoteTarget
```

Repita com `medium` e `intense` apenas dentro da mesma janela autorizada. O
invocador remoto usa a imagem oficial `grafana/k6:2.3.0`, pede a senha sem eco, faz um
login único e não escreve a credencial no repositório ou no relatório.

## Execução local

Alvos `localhost`, `127.0.0.1` e `::1` usam o executável nativo oficial do k6,
instalado no PATH ou informado por `-K6Executable`. O loopback de um contêiner
pertence ao próprio contêiner; não encaminhe o token para outro hostname apenas
para contornar essa diferença. O invocador rejeita URL com credenciais, query ou
fragmento antes de solicitar a senha e autenticar.

Cada execução grava seu resumo em uma pasta UTC/perfil distinta, evitando que
`medium` sobrescreva `low`. O script também aceita `K6_SUMMARY_PATH` para uma
saída nativa fora do repositório. Valores de tokens continuam apenas em memória
e variáveis transitórias do processo.

Um ensaio local serve para validar o roteiro, os endpoints e os thresholds.
Ele não comprova latência de internet, capacidade da VM, atuação do WAF, TLS ou
aceitação do volume real da portaria. A pendência de nuvem permanece na #502.

## Evidência mínima

Para cada perfil, registre de forma sanitizada:

- release, horário UTC, duração e quantidade máxima de usuários virtuais;
- total e taxa de requisições, p50, p95 e p99;
- taxa de erro e quantidade de HTTP 429;
- CPU, memória, disco, reinícios e conexões do PostgreSQL;
- eventos relevantes do WAF, Load Balancer, Caddy, API e banco;
- gargalo observado, hipótese, ação sugerida e necessidade de novo ensaio.

O `summary.json` gerado em `artifacts/k6` é evidência local bruta. Ele é ignorado
pelo Git. Publique apenas um resumo revisado, sem URL sensível, token, conta,
placa, nome ou conteúdo de resposta.

## Encerramento e limpeza

1. desative ou remova a conta fictícia dedicada;
2. confirme que o ensaio não criou registros de negócio;
3. verifique novamente `/health/ready` e os recursos da VM;
4. compare com o estado anterior e registre limitações honestamente;
5. mantenha a Issue #502 aberta até executar os três perfis ou documentar a
   limitação com evidência;
6. atualize a Wiki somente depois do PR e da evidência serem incorporados.

Resultados de uma única VM e janela não devem ser extrapolados para produção.

## Execução local registrada

O [relatório de 13/11/2026](../validation/k6-local-baseline-2026-11-13.md)
registra os três perfis executados contra a API fictícia local. Os thresholds
passaram; métricas e limitações permanecem separadas do ensaio OCI pendente.
