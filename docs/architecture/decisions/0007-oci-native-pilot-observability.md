# ADR 0007 — Observabilidade gerenciada pela OCI no piloto

- **Status:** aceita como direção técnica; provisionamento condicionado ao plano e ao custo
- **Data:** 26/10/2026
- **Decisores:** equipe de desenvolvimento, orientadores e responsável operacional
- **Rastreabilidade:** Issue #500

## Contexto

A API já exporta métricas e traces por OTLP de forma opt-in e produz logs
estruturados no console. A instância de homologação usa `VM.Standard.A1.Flex` com
configuração inicial de 1 OCPU e 6 GiB de memória, executando aplicação e banco.
Adicionar nela outro banco de telemetria sem medição de capacidade aumenta o risco de
a própria observabilidade causar indisponibilidade.

A Unidade 2 exige métricas da VM e dos contêineres, logs pesquisáveis, traces,
painéis, alertas e retenção. O painel administrativo não pode ser publicado na borda
da aplicação e a telemetria não deve conter credenciais ou dados pessoais.

## Alternativas avaliadas

| Alternativa                               | Benefícios                                                                                                                          | Custos e riscos                                                                                                                                                                             | Adequação ao piloto                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| OCI Monitoring, Logging e APM             | Serviços gerenciados, IAM e Console já usados pela equipe; métricas de Compute disponíveis pelo Oracle Cloud Agent; APM recebe OTLP | Dependência da OCI; APM e volumes acima das franquias precisam de estimativa; chave privada de ingestão exige cofre e rotação                                                               | **Recomendada, condicionada ao orçamento**                                       |
| OpenObserve single-node                   | Logs, métricas e traces em uma única ferramenta; OTLP nativo; operação simples em comparação com uma pilha de vários backends       | Compete por CPU, memória e disco com API e PostgreSQL; painel e credenciais adicionais; perda do nó afeta a telemetria local; licença e atualização passam a ser responsabilidade da equipe | Não executar na VM atual; reavaliar em nó separado se a opção OCI não for viável |
| Grafana + Loki + Tempo + Prometheus/Alloy | Ecossistema conhecido e componentes especializados                                                                                  | Mais processos, armazenamento e configuração; Loki não fornece autenticação própria; maior superfície operacional para uma equipe pequena                                                   | Desproporcional para a homologação atual                                         |

O OpenObserve suporta modo single-node com armazenamento local ou de objetos, mas o
modo local é indicado para teste ou uso leve. A documentação do Grafana confirma que
o servidor é apenas uma parte da capacidade: Loki, Tempo e o armazenamento de
métricas precisam ser dimensionados separadamente. Além disso, o Loki exige uma
camada de autenticação externa.

## Decisão proposta

Adotar, para o piloto, serviços gerenciados da mesma tenancy:

1. **OCI Monitoring** para CPU, memória, disco, rede e alarmes básicos da VM. O plugin
   `Compute Instance Monitoring` já é declarado pelo Terraform.
2. **OCI Logging** para logs sanitizados da API e dos contêineres, com grupo e
   configuração próprios da homologação.
3. **OCI APM** para métricas e traces OTLP da API, usando endpoint privado e chave de
   dados fornecidos somente por segredo de implantação.
4. **OCI Notifications** para um canal de alerta aprovado, sem endereços versionados.
5. **OCI Console com IAM** como painel administrativo. Nenhuma porta de
   observabilidade será incluída no Load Balancer, WAF ou NSG público.

Esta ADR não autoriza criar recursos. Antes do `apply`, a equipe deve registrar a
estimativa mensal do APM e confirmar que Monitoring, Logging e Notifications ficam
dentro das franquias ou do teto acadêmico. Se a estimativa não for aceita, a decisão
volta para revisão e OpenObserve em instância separada será comparado com a redução de
retenção e amostragem.

## Recorte inicial

### Métricas

- CPU, memória, disco, rede e saúde da instância;
- estado e reinicializações dos contêineres;
- taxa, duração e respostas HTTP 5xx da API;
- runtime .NET sem atributos de usuário.

### Logs

- nível, timestamp, serviço, ambiente, `traceId`, `correlationId` e evento técnico;
- sem corpo de requisição, token, cookie, senha, query string, e-mail, nome, placa ou
  connection string;
- retenção inicial de 30 dias, o menor intervalo aceito pelo OCI Logging, sujeita à
  medição de volume e custo.

### Traces

- rotas normalizadas, método, status, duração e exceção sanitizada;
- health checks excluídos;
- amostragem inicial conservadora, calibrada após medir volume e custo.

## Segurança e operação

- guardar chave privada do APM em mecanismo de segredos, nunca em Terraform state,
  GitHub, `.env` compartilhado, issue ou Wiki;
- restringir consulta por grupo IAM de operação e desenvolvimento autorizado;
- separar telemetria de homologação de qualquer ambiente futuro de produção;
- configurar falha aberta do exporter: indisponibilidade da telemetria não pode
  interromper o controle de acesso;
- criar alerta de indisponibilidade/readiness, HTTP 5xx, saturação de recurso e
  ausência de telemetria;
- testar alerta e resposta com dados fictícios, registrando horário, responsável,
  consumo e resultado sanitizado;
- não tratar logging técnico como trilha de auditoria de negócio nem como backup.

## Critérios para aceitar a decisão

- estimativa mensal registrada e compatível com o teto da conta;
- destinatário e responsável pelos alertas definidos;
- retenção e amostragem aprovadas para o piloto;
- acesso ao Console testado apenas pelos grupos IAM necessários;
- procedimento de descarte dos recursos e dados ao final do piloto documentado.

## Referências oficiais

- [OCI Monitoring e alarmes](https://docs.oracle.com/en-us/iaas/Content/Monitoring/)
- [Métricas de instância e Oracle Cloud Agent](https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/enablingmonitoring.htm)
- [OCI Logging](https://docs.oracle.com/en-us/iaas/Content/Logging/)
- [Preços de observabilidade da OCI](https://www.oracle.com/manageability/pricing/)
- [OCI APM com OpenTelemetry](https://docs.oracle.com/en-us/iaas/application-performance-monitoring/doc/configure-opentelemetry.html)
- [Arquitetura single-node do OpenObserve](https://openobserve.ai/docs/architecture/)
- [Instalação e autenticação do Loki](https://grafana.com/docs/loki/latest/setup/install/)
- [Requisitos do Grafana](https://grafana.com/docs/grafana/latest/setup-grafana/installation/)
