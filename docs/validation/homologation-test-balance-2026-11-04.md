# Balanço técnico da homologação — 04/11/2026

- **Rastreabilidade:** #618; main de referência a6ad478 após #608/#614/#616.
- **Fonte hospedada:** frontend 83492f7 e backend 04d102b; release estável v0.4.0.
- **Método:** chamadas HTTPS autenticadas com contas fictícias já autorizadas,
  negativas controladas e verificação de contrato/headers; sem carga ou brute force.
- **Estado:** avaliação técnica controlada, sem novo aceite institucional.

## Resultado na hospedagem

Foram aprovadas **111/111 verificações** antes da limpeza e as mesmas 111/111
depois. Não são 222 casos distintos. Nenhum novo acesso operacional foi criado
pelo roteiro; consultas/autenticação/exportações geram a auditoria prevista.

| Grupo de verificações   | Aprovadas | Falhas |
| ----------------------- | --------: | -----: |
| anonymous               |        12 |      0 |
| google-provider-enabled |         1 |      0 |
| Porteiro                |        22 |      0 |
| Vigilante               |        22 |      0 |
| SetorTransporte         |        22 |      0 |
| Administrador           |        20 |      0 |
| admin                   |        12 |      0 |

O roteiro conferiu:

- readiness público (200), descoberta de provedor e Google habilitado;
- chamadas protegidas sem sessão negadas com 401;
- login dos quatro perfis fictícios na janela autorizada;
- usuários/auditoria/relatórios exclusivos de Administrador;
- limites de leitura operacional e de histórico da frota por perfil;
- tentativa operacional de criar conta ou conceder perfil administrativo negada;
- paginação inválida, data inválida, período de relatório excessivo e status
  desconhecido rejeitados; placa 777777 rejeitada sem criação;
- PDF dos dois relatórios com assinatura de arquivo, Content-Type e no-store;
- refresh sem CSRF rejeitado, refresh válido, cookies Secure, logout e nova
  tentativa de refresh após logout negada.

Não houve falha nesse recorte. Consultas vazias não comprovam todos os campos de
itens populados. PDF válido por assinatura/headers não equivale a revisão visual
de paginação ou conteúdo. Esses resultados não são prova de teste de carga,
pentest completo, acessibilidade humana ou ausência de vulnerabilidades.

### HTTPS

O probe confirmou TLS 1.3, readiness 200 e validade do certificado até
24/01/2027 às 20h55 UTC, com 81 dias restantes na execução de 04/11.
Isso não comprova agendamento/renovação automática ou entrega de alertas.

## Limpeza autorizada dos dados fictícios

José confirmou remover os registros operacionais de ensaio do histórico,
preservando contas e auditoria. O inventário direto encontrou dois acessos,
dois veículos e dois vínculos, além de 14 pessoas (12 vinculadas às contas).
Não foram selecionados dados por nome ou por exclusão ampla.

Antes da alteração foi criado dump restrito (modo 0600), verificado por hash e
restaurado em banco temporário isolado. A mesma transação de limpeza foi ensaiada
nesse banco. A execução efetiva só prosseguiu após o ensaio bem-sucedido.

A transação usou IDs inventariados, locks com timeout e guardas de quantidade e
referências compartilhadas. Não usou TRUNCATE, CASCADE ou reset de identidades.
Foram removidos dois acessos e, apenas sem referências remanescentes, os dois
vínculos, dois veículos e duas pessoas correspondentes. Usuários, sessões,
configuração e categorias não foram resetados.

Os 174 registros de auditoria existentes no instante da manutenção foram
preservados por verificação dentro da transação. Dois registros de manutenção
foram acrescentados com origem de sistema, sem copiar nomes ou credenciais.
Auditorias posteriores dos testes explicam o aumento subsequente da contagem.

Resultado: zero acessos em aberto/histórico, zero veículos/vínculos de ensaio e
12 contas preservadas. O banco temporário foi removido. O backup continua
restrito na VM para recuperação seletiva; não deve ser restaurado sobre novos
dados indiscriminadamente. Isso não implementa backup externo gerenciado nem
uma regra de descarte para dados institucionais reais.

## Regressão do backend candidato de correções

#607 foi atualizado por merge normal com main a6ad478, head c13155d. O único
conflito foi no changelog; as entradas de autoria da saída e runtime foram
preservadas. Build Release da solução com warnings-as-errors: zero avisos/erros;
dotnet format e diff check aprovados. A suíte completa com cobertura/TRX e
Testcontainers PostgreSQL passou em **448/448 testes**, sem falhas ou ignorados.

Esses testes pertencem ao candidato separado, não ao backend hospedado 04d102b.
O #607 continua draft: integração real com a interface #613 e ensaios humanos
continuam pendentes. Não houve nova implantação ou migration na hospedagem.
Preservar #599 ao compor uma próxima imagem.

## Outras evidências recentes e seus limites

- #608/fbe8e35: 620 testes em 56 arquivos, lint/build, revisão independente antes
  do merge; classificação de falha de contrato, rede e cancelamento.
- Frontend instalado 83492f7: 735 testes em 61 arquivos no ensaio anterior;
  essa suíte não foi novamente executada como parte das 111 chamadas atuais.
- #611/dab9d96: 96 testes de domínio e 137 de aplicação no ciclo anterior;
  orquestração de papel sem store, API/DI ou migration. Não está no site.

Não somar suítes de versões que se sobrepõem. Contagem de casos não equivale a
percentual de cobertura ou de segurança. Não foi recalculado progresso global.

## Acesso futuro dos professores

O fluxo definitivo usa a conta Google exata, pessoal ou institucional,
previamente autorizada pelo Administrador, com perfil definido e conta ativa.
Solicitar apenas os e-mails consentidos e o perfil de cada cenário; não pedir
senha Google. A autenticação deve ser feita pelo próprio titular no Google.
Não atribuir acesso por domínio, nem criar um quinto perfil.

A exceção das três contas operacionais fictícias termina em
2026-11-05T03:00:00Z, equivalente a 00h de 05/11 em Brasília, sem prorrogação.
Administrador permanece local. Contas e credenciais compartilhadas não foram
alteradas na limpeza. Tokens já emitidos conservam a validade curta configurada;
não existe alegação de revogação instantânea por uma flag.

## Pendências e próxima sequência

1. Raíssa atualiza #530 com a main, preserva reconciliação e resolve o check de
   Python na base correta, sem desabilitar análise; completa os critérios da UI.
2. Concluir os cenários Google com titulares, troca de conta, tablet, zoom e
   leitor de tela nas versões explicitamente identificadas.
3. Integrar #607/#613 em ambiente isolado antes da promoção.
4. Implementar store/transações/migrations/API do papel e integrar interface.
5. Executar as evidências de backup externo, renovação TLS e observabilidade.

Nenhuma credencial, e-mail de titular, nome de condutor ou resposta pessoal
integra este relatório público. Os resultados detalhados e manifests ficam em
canal restrito. A aprovação técnica desta documentação não fecha as issues de
homologação ou de produção institucional.
