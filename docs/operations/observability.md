# Observabilidade da API

**Rastreabilidade:** Issue #102

## Estado

A API possui uma base vendor-neutral de observabilidade com OpenTelemetry. A
instrumentação e a exportação OTLP ficam desabilitadas por padrão e não são um
ambiente de monitoramento completo. Collector, armazenamento, painéis, alertas,
retenção e plantão ainda dependem da infraestrutura de homologação e produção.

Foram habilitados, quando configurados:

- traces das requisições ASP.NET Core, exceto `/health`, `/health/live` e
  `/health/ready`;
- métricas HTTP do ASP.NET Core;
- métricas do runtime .NET;
- identificação estável do serviço e versão do assembly;
- exportação de métricas e traces pelo protocolo OTLP.

Logs não são exportados pelo OpenTelemetry neste incremento. O logging HTTP
seguro e correlacionado continua no console da aplicação, sem corpo, query
string, token ou valores da rota.

## Configuração

Para manter desenvolvimento e testes independentes de uma plataforma externa,
o padrão é:

```json
{
  "Observability": {
    "Enabled": false,
    "ServiceName": "controle-acesso-veiculos-api"
  }
}
```

Em container, configure somente quando houver um collector OTLP acessível:

```dotenv
OTEL_ENABLED=true
OTEL_SERVICE_NAME=controle-acesso-veiculos-api
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
```

O Compose encaminha essas opções como `Observability__Enabled`,
`Observability__ServiceName` e `OTEL_EXPORTER_OTLP_ENDPOINT`. O repositório não
cria um collector porque endereço, armazenamento e operação ainda não foram
decididos. Habilitar a exportação sem um receiver acessível não deve derrubar a
API, mas produz falhas internas do exporter e não gera observabilidade útil.

Outras opções padronizadas do exporter, como protocolo, timeout, headers e
atributos de resource, podem usar as variáveis `OTEL_*` documentadas pelo
OpenTelemetry. Headers de autenticação são segredos: devem vir do mecanismo de
segredos do ambiente, nunca de `.env.example`, Compose versionado, issue, Wiki ou
linha de comando compartilhada.

## Privacidade e segurança

A instrumentação automática não substitui a revisão de telemetria. Neste recorte:

- não há instrumentação de corpos, headers de autorização ou SQL; nomes dos
  parâmetros de query podem aparecer, mas seus valores são redigidos;
- a API rejeita o startup se o ambiente tentar desativar a redação dos valores de
  query string;
- health checks não geram traces, reduzindo volume e ruído operacional;
- nomes de serviço não devem identificar pessoa, dispositivo ou unidade sensível;
- o endpoint OTLP deve usar TLS e autenticação fora da rede local confiável;
- o collector deve aplicar menor privilégio, retenção e restrição de acesso;
- atributos novos e instrumentações de banco exigem nova análise de privacidade.

## Verificação em homologação

1. Disponibilizar um collector compatível com OTLP em rede restrita.
2. Configurar endpoint e credenciais pelo ambiente de homologação.
3. Iniciar a API com `OTEL_ENABLED=true`.
4. Executar `/health/ready`, login fictício e um fluxo operacional com dados de
   teste.
5. Confirmar métricas HTTP/runtime e traces das rotas operacionais.
6. Confirmar que health checks, corpos, valores de query string, tokens,
   credenciais, connection strings e dados pessoais não aparecem.
7. Interromper temporariamente o collector e comprovar que a API continua
   atendendo requisições.
8. Registrar versão, horário, resultado e responsável pelo ensaio.

## Alertas e SLOs para validar

Os sinais iniciais para discussão em homologação são:

| Sinal | Uso esperado | Decisão pendente |
|---|---|---|
| readiness indisponível | detectar perda de acesso ao PostgreSQL | janela, severidade e responsável |
| proporção de HTTP 5xx | detectar falha da API | limite, período e exceções |
| duração por rota normalizada | detectar degradação sem expor valores da URL | percentil e objetivo por fluxo |
| saturação de CPU, memória e GC | dimensionar a API | limites e capacidade da infraestrutura |
| ausência de telemetria | detectar API, collector ou exportação indisponível | tolerância e canal de escalonamento |

Nenhum valor de SLO ou alerta deve ser tratado como compromisso institucional
antes de medir carga real e definir horário de suporte, destinatários e processo
de resposta a incidentes.

## Pendências para produção

- escolher e proteger collector, backend de métricas/traces e armazenamento;
- definir TLS, autenticação, rede, segregação e rotação de credenciais;
- definir retenção e controle de acesso da telemetria;
- criar painéis e alertas aprovados;
- calibrar sampling, cardinalidade e custo com carga real;
- integrar alertas ao procedimento de incidente e contingência;
- testar indisponibilidade do collector e recuperação do pipeline;
- designar responsáveis técnicos e institucionais.
