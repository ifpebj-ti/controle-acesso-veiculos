# Preflight da homologação na OCI

> **Estado em 25/10/2026:** o preflight foi concluído e a topologia de homologação
> técnica foi provisionada com VM privada, Load Balancer, WAF e Bastion. Este
> documento permanece como checklist reutilizável para mudanças e recriações. DNS
> e certificado público confiável foram validados em 26/10/2026; sua renovação
> automatizada permanece na Issue #509. Backup e restauração na OCI,
> observabilidade operada e piloto institucional continuam pendentes.

## Objetivo e limite

Este runbook prepara a decisão de executar um `terraform plan` para o ambiente de
homologação descrito nas Issues #382 e #468 e na ADR 0006. Ele deve ser executado com uma
pessoa autorizada a consultar a tenancy, mas **não cria recursos, não configura
credenciais e não autoriza `terraform apply`**.

O resultado é uma das três classificações:

- **apto para preparar o plan:** todos os gates estão comprovados e a revisão do
  Terraform pode começar;
- **bloqueado:** falta informação, permissão, responsável, capacidade ou controle
  obrigatório;
- **revisão de arquitetura:** custo, limite ou requisito torna a topologia proposta
  inadequada.

Homologação acompanhada não equivale a produção institucional. Até autorização
específica, devem ser usados somente dados fictícios.

## Regras de segurança

1. Cada pessoa acessa o Console com identidade individual e MFA. Não compartilhar
   senha, token, chave de API, sessão, arquivo de configuração ou dispositivo.
2. Não enviar informações da tenancy por chat, Issue, Pull Request ou Wiki.
3. Não publicar OCIDs, nome da tenancy, e-mails, endereços IP, fingerprints,
   capturas do Console, faturas, chaves ou dados de pagamento.
4. Não executar comandos da OCI CLI, Terraform ou Cloud Shell durante este
   preflight. A consulta é manual e somente leitura.
5. Não criar nem “testar rapidamente” VM, rede, bucket, chave, budget, quota ou
   qualquer outro recurso.
6. Se o Console solicitar elevação de privilégio, interromper e encaminhar ao
   administrador da tenancy. Não ampliar permissões para concluir o checklist.
7. A evidência pública registra apenas o resultado sanitizado. Valores detalhados
   permanecem no canal institucional de acesso restrito definido pelos orientadores.

## Participantes mínimos

| Papel                                | Responsabilidade no preflight                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| administrador autorizado da tenancy  | consultar assinatura, permissões, limites e cobrança sem compartilhar credenciais       |
| responsável técnico                  | conduzir o checklist, comparar a arquitetura e registrar somente o resultado sanitizado |
| revisor técnico ou orientador        | revisar custo, exposição, responsabilidades e decisão de saída                          |
| responsável financeiro institucional | confirmar teto, validade do crédito e destinatários dos alertas, quando aplicável       |
| responsável funcional                | confirmar janela e finalidade do piloto, sem operar a infraestrutura                    |

Uma pessoa pode exercer mais de um papel quando autorizado, mas o plano de
infraestrutura precisa de revisão por uma segunda pessoa antes de qualquer `apply`.

## Evidência permitida e proibida

| Pode constar no repositório                         | Deve permanecer restrito                                                     |
| --------------------------------------------------- | ---------------------------------------------------------------------------- |
| tipo genérico de assinatura                         | nome e OCID da tenancy                                                       |
| moeda, teto aprovado e mês de expiração             | identificadores de assinatura e faturamento                                  |
| nome público da região escolhida                    | OCIDs de compartments, recursos, usuários ou grupos                          |
| shape e arquitetura candidatos                      | IP público ou privado do ambiente                                            |
| custo mensal e anual estimado, arredondado          | faturas, método de pagamento e dados contratuais                             |
| resposta “confirmado”, “pendente” ou “indisponível” | nomes, e-mails e identificadores das pessoas                                 |
| função responsável, sem dado pessoal                | senhas, tokens, cookies, chaves, fingerprints e arquivos OCI CLI             |
| decisão final e seus bloqueios                      | captura de tela que exponha identidade, saldo detalhado ou estrutura interna |

Quando a comprovação detalhada for necessária, registrar sua localização e o papel
custodiante, nunca o conteúdo sensível.

## Etapa 1 — Conta, crédito e vigência

O administrador autorizado deve conferir no Console:

- tipo real de assinatura ou acordo educacional;
- estado ativo da conta;
- moeda de cobrança;
- crédito disponível e já consumido;
- data e regra de expiração;
- serviços excluídos, restrições contratuais e comportamento após o fim do crédito;
- responsável institucional por cobrança e suporte da conta.

Não presumir que os US$ 300 informados correspondem ao Free Tier público ou que
possuem as mesmas regras. A média de US$ 25 por mês é apenas uma referência
matemática para um ano, não uma autorização mensal automática.

**Evidência sanitizada esperada:** tipo genérico da conta, moeda, mês de expiração,
teto aprovado, papel responsável e confirmação de que as regras foram lidas.

**Bloquear se:** saldo, validade, responsabilidade ou consequência do esgotamento
não puderem ser confirmados.

## Etapa 2 — Região, arquitetura e capacidade

Conferir a home region e escolher a região-alvo considerando autorização, latência,
serviços disponíveis e operação pela equipe. Na região escolhida, verificar:

- domínios de disponibilidade;
- presença e capacidade atual de `VM.Standard.A1.Flex`;
- imagem Linux compatível com `aarch64`;
- alternativa AMD64 caso Arm esteja indisponível;
- compatibilidade dos serviços de Bastion, Certificates, Flexible Load Balancer,
  WAF, NAT Gateway, Object Storage, Logging, Monitoring e Notifications necessários;
- limites regionais e por domínio de disponibilidade.

As imagens da aplicação são multi-arquitetura, mas isso não garante capacidade do
shape na região. Não reservar nem iniciar instância para fazer a conferência.

**Evidência sanitizada esperada:** região pública, shape primário, fallback,
arquitetura, disponibilidade consultada e data da consulta.

**Bloquear ou revisar se:** não existir capacidade adequada, imagem compatível ou
fallback dentro do orçamento.

## Etapa 3 — Limites, quotas e permissões

No painel de limites, quotas e uso, conferir pelo menos:

- compute flexível por arquitetura, OCPU e memória;
- instâncias e volumes de inicialização/bloco;
- VCN, subnets, Network Security Groups, NAT Gateway, Flexible Load Balancer e Bastion;
- WAF regional, OCI Certificates e capacidades de proteção disponíveis;
- Object Storage, Vault, Logging, Monitoring, Notifications e Budgets;
- escopo de cada limite: tenancy, região ou domínio de disponibilidade;
- uso atual que possa disputar a mesma capacidade.

**Limite de serviço** é a capacidade concedida pela OCI. **Quota de compartment** é
uma restrição definida pelos administradores para controlar quanto um compartimento
pode consumir. Um limite alto não autoriza consumo, e uma quota não substitui
orçamento, monitoramento ou revisão do plano.

Confirmar se existem grupos de menor privilégio para rede, compute, operação,
backup, recuperação, auditoria e custódia de chaves. A criação de budget pode exigir
permissão no compartimento raiz; essa necessidade deve ser encaminhada ao
administrador, não resolvida concedendo acesso amplo à equipe.

**Evidência sanitizada esperada:** serviços verificados, resultado
“suficiente/insuficiente”, escopo e papel que aprovará eventuais quotas.

**Bloquear se:** o plano depender de privilégio administrativo permanente, usuário
compartilhado ou limite não disponível.

## Etapa 4 — Estimativa e proteção financeira

Montar uma estimativa oficial antes do `plan`, incluindo, mesmo quando o valor
calculado for zero:

| Componente        | Premissa a estimar                                                    |
| ----------------- | --------------------------------------------------------------------- |
| compute           | shape, OCPUs, memória e horas mensais                                 |
| armazenamento     | boot/block volume, desempenho, backups e crescimento                  |
| rede              | NAT Gateway, Flexible Load Balancer de 10 Mbps, IP e tráfego de saída |
| WAF               | primeira instância, volume mensal de requisições e logs               |
| segurança         | Vault, chaves e operações criptográficas                              |
| backup            | Object Storage, operações, retenção de 35 dias e restauração          |
| observabilidade   | ingestão e retenção de logs, métricas, alarmes e notificações         |
| DNS e certificado | zona, consultas e método de renovação                                 |
| margem            | variação de uso, câmbio, impostos e recuperação temporária            |

Registrar custo mensal e anual estimado e a folga até o teto aprovado. Não tratar
recurso “Always Free” como garantido antes de confirmar elegibilidade e capacidade
na própria conta.

Preparar um budget para o compartment do projeto, com destinatários institucionais
confirmados. A direção inicial da Issue #382 prevê alertas de gasto previsto em 50%,
75% e 90%, e de gasto real em 75%, 90% e 100%. Os percentuais devem ser revisados
com o responsável financeiro.

Budgets são limites informativos e seus alertas não desligam recursos. Portanto,
também são necessários quotas, revisão periódica de consumo e um procedimento de
desligamento. Alertas podem ser avaliados com atraso; não esperar o e-mail para
investigar uma anomalia percebida.

**Evidência sanitizada esperada:** total mensal/anual arredondado, margem, período,
ferramenta usada, thresholds propostos e papéis destinatários.

**Bloquear ou revisar se:** a estimativa ultrapassar o teto, não houver margem ou
ninguém puder acompanhar os alertas.

## Etapa 5 — DNS, HTTPS e acesso administrativo

Confirmar antes do Terraform:

- domínio ou subdomínio dedicado à homologação;
- papel autorizado a alterar o DNS;
- método de emissão e renovação automática do certificado;
- certificado gerenciado no OCI Certificates service e respectivo OCID fornecido
  somente no Resource Manager;
- responsável por falha de renovação;
- exposição pública limitada a HTTPS na porta 443 do Load Balancer protegido pelo WAF;
- VM em subnet privada, sem IP público, aceitando a borda interna somente do NSG do Load Balancer;
- frontend publicado pelo proxy e conectado ao serviço local;
- API, PostgreSQL, Docker, métricas e administração sem portas públicas;
- OCI Bastion ou caminho temporário equivalente, limitado por identidade, origem,
  duração e auditoria;
- contas individuais com MFA e procedimento de revogação após troca de equipe.

**Evidência sanitizada esperada:** domínio apenas se já for público e autorizado,
papéis responsáveis, método de certificado, porta pública e mecanismo
administrativo escolhido.

**Bloquear se:** a solução exigir HTTP para autenticação, SSH irrestrito,
PostgreSQL público ou segredo incluído em Terraform, `cloud-init`, imagem ou Git.

## Etapa 6 — Dados, backup, observabilidade e encerramento

Conferir o vínculo com as demais entregas:

- dados fictícios até autorização específica para cada fase do piloto;
- backup protegido da Issue #311 antes de informação que precise ser preservada;
- PITR e RPO de uma hora ainda pendentes na Issue #312;
- volume e certificado do key ring com persistência e custódia definidas;
- logs sem credenciais ou dados pessoais desnecessários;
- métricas, health checks, alertas e papéis de resposta;
- janela do piloto, revisão semanal inicial de consumo e data de desligamento;
- responsável por remover recursos, confirmar ausência de cobrança residual e
  preservar somente as evidências autorizadas.

**Bloquear se:** não existir responsável pelo suporte, backup, incidentes, custo ou
desligamento.

## Registro sanitizado do resultado

Copiar somente este quadro para a Issue #382 após a sessão:

```text
Data da verificação: AAAA-MM-DD
Revisores por papel: administração OCI / técnico / orientação / financeiro
Conta e crédito: confirmado | pendente | incompatível
Mês de expiração e moeda: <somente se autorizado>
Região: confirmada | pendente
Shape primário e fallback: confirmados | pendentes | indisponíveis
Limites e quotas: suficientes | pendentes | insuficientes
Estimativa mensal/anual arredondada: <valor autorizado para publicação>
Budget e destinatários por papel: definidos | pendentes
DNS, HTTPS e renovação: definidos | pendentes
Acesso administrativo temporário: definido | pendente
Backup, observabilidade e desligamento: definidos | pendentes
Resultado: apto para preparar o plan | bloqueado | revisão de arquitetura
Bloqueios e decisão: <sem OCIDs, IPs, e-mails, nomes ou segredos>
Local restrito das evidências detalhadas: <sistema e papel custodiante>
```

“Apto para preparar o plan” permite apenas adaptar e revisar o Terraform. O
primeiro `apply` exige plano revisado por outra pessoa, estimativa confirmada,
backup e rollback definidos e autorização explícita do responsável pela tenancy.

## Referências

- [ADR 0006 — borda protegida pelo OCI WAF](../architecture/decisions/0006-oci-waf-protected-homologation-edge.md)
- [Issue #382 — ambiente de homologação](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/382)
- [OCI Budgets](https://docs.oracle.com/en-us/iaas/Content/Billing/Concepts/budgetsoverview.htm)
- [OCI service limits](https://docs.oracle.com/en-us/iaas/Content/General/service-limits/default.htm)
- [OCI Compute shapes](https://docs.oracle.com/en-us/iaas/Content/Compute/References/computeshapes.htm)
- [OCI Compute quotas](https://docs.oracle.com/en-us/iaas/Content/Quotas/Concepts/resourcequotas_topic-Compute_Quotas.htm)
- [OCI Bastion](https://docs.oracle.com/en-us/iaas/Content/Bastion/Concepts/bastionoverview.htm)
- [OCI IAM MFA](https://docs.oracle.com/en-us/iaas/Content/Security/Reference/iam_security_topic-IAM_MFA.htm)
- [Oracle Cloud pricing and Cost Estimator](https://www.oracle.com/cloud/pricing/)
