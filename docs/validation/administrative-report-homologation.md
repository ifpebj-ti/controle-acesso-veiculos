# Homologação dos relatórios administrativos

Rastreabilidade: Issue #443; definição #272; backend #441/PR #454;
frontend #442/PR #462; apresentação #480. O PDF em paisagem pertence à #496.

## Estado e limite desta evidência

Em 29/10/2026, este roteiro foi preparado a partir da `main` em `4567e73`.
Ele descreve o comportamento implementado e os resultados esperados para a
homologação. Não registra aceite institucional nem uma nova execução integrada.

A suíte frontend dessa base foi executada na tarefa #440: 572 testes passaram
em 54 arquivos, incluindo os testes existentes de relatórios. Esses testes usam
respostas simuladas; não comprovam a geração de PDF pela API em execução.
Na preparação deste roteiro, não havia API local nas portas usuais e o Docker
Desktop estava desligado. A validação integrada permanece pendente.

Validações manuais relatadas anteriormente devem conservar seu contexto original.
Antes de aproveitá-las para encerrar esta issue, vincular a evidência ao cenário,
à versão testada, ao dispositivo e às limitações. Não reinterpretar teste em
viewport como tablet físico, emulação como zoom real ou axe como leitor de tela.

## Preparação

1. Identificar o SHA das imagens/versão efetivamente implantada. Uma release
   anterior não contém automaticamente as mudanças atuais da `main`.
2. Usar ambiente isolado com API e banco preparados pelo responsável; esta
   homologação não autoriza mudança de infraestrutura, migrations ou contratos.
3. Usar uma conta fictícia de Administrador local e contas fictícias dos três
   perfis operacionais para verificar a negação de acesso.
4. Preparar, pelos fluxos reais, movimentações gerais e utilizações da frota em
   mais de uma página, além de um período vazio. Incluir identificação interna
   sem placa quando permitida pelo contrato, sem inventar correspondência.
5. Combinar a sessão com um representante adequado do Administrador. Registrar
   participantes pelo perfil, ambiente, navegador, dispositivo e data.
6. Manter senha, cookies e tokens fora das evidências. Não salvar HAR bruto nem
   capturar corpos/cabeçalhos de autenticação. PDFs devem conter somente dados
   fictícios, ficar fora do Git e seguir descarte autorizado após a conferência.
7. Ensaiar bloqueios e limite de tentativas somente no ambiente autorizado.
   Não provocar bloqueio de conta institucional nem desativar controles.

## Cenários e resultados esperados

Cada linha começa **Pendente**. Preencher depois da execução com Aceito, Ajustar,
Rejeitado ou Pendente, referência da evidência e limitação observada.

| Cenário                 | Resultado esperado                                                                                                                                  | Resultado observado |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Acesso do Administrador | A página `/relatorios` apresenta Movimentações gerais e Frota institucional.                                                                        | Pendente            |
| Outros três perfis      | Menu e acesso direto não oferecem relatórios; a API também bloqueia a operação. Verificar ambas as camadas.                                         | Pendente            |
| Dois relatórios         | Os dados conferem com os registros fictícios preparados, com responsáveis de entrada/saída ou saída/retorno vindos do servidor.                     | Pendente            |
| Placa ausente           | A identificação interna aparece como identificação do veículo, nunca rotulada como placa.                                                           | Pendente            |
| Período                 | Intervalo inclusivo de 1 a 31 dias é aceito; data invertida ou 32 dias recebe orientação e preserva os campos.                                      | Pendente            |
| Filtros                 | Pesquisa parcial por placa/condutor; categoria nas movimentações e identificação interna na frota. Limpar filtros restaura os padrões.              | Pendente            |
| Situação                | Somente os valores públicos de cada relatório são enviados e apresentados.                                                                          | Pendente            |
| Paginação               | Trocar a página mantém período e filtros aplicados; quantidade e página conferem com a resposta.                                                    | Pendente            |
| Período vazio           | Estado vazio claro, sem registros, totais ou tendências inventados; a API pode gerar PDF vazio válido.                                              | Pendente            |
| Rede indisponível       | Mensagem compreensível, filtros preservados e nova consulta explícita. Não enviar uma mutação novamente ao recarregar.                              | Pendente            |
| Exportação correta      | Uma confirmação gera exatamente um POST e um PDF válido. Conferir assinatura PDF e abertura em leitor, além de tipo e nome do arquivo.              | Pendente            |
| Senha no formulário     | É exigida a senha administrativa atual em cada tentativa. O campo fica vazio imediatamente após o envio, também em falha.                           | Pendente            |
| Senha incorreta         | `403` com `report_export_reauthentication_failed` anuncia falha da confirmação, mantém sessão e filtros e não repete o POST nem faz refresh/logout. | Pendente            |
| Sessão inválida         | `401` orienta nova entrada e não baixa arquivo nem repete a exportação.                                                                             | Pendente            |
| Acesso negado           | `403` sem o código de confirmação apresenta a barreira de acesso correspondente, sem falso sucesso.                                                 | Pendente            |
| Excesso de tentativas   | `429` tem mensagem própria, preserva filtros e não dispara nova exportação automaticamente.                                                         | Pendente            |
| Arquivo incompatível    | JSON/HTML ou resposta sem Blob/PDF não produz download apresentado como sucesso. Usar teste controlado, sem alterar contrato real.                  | Pendente            |
| Falha após envio        | A mensagem não afirma que uma operação incerta falhou definitivamente. Não repetir o POST para produzir evidência.                                  | Pendente            |
| Autoria no PDF          | Conferir período, fuso, horário de geração, Administrador exportador e operadores dos registros; tudo vem da API.                                   | Pendente            |
| Minimização no PDF      | RG/CPF e segredos estão ausentes do contrato atual. Não confundir a futura proposta de documento mascarado com a versão vigente.                    | Pendente            |
| Teclado e foco          | Ordem previsível, foco visível, diálogo contido, Escape e retorno ao acionador; erro e sucesso percebidos sem rolagem manual ao topo.               | Pendente            |
| Leitor de tela          | Rótulos, cabeçalhos, identificação do tipo de relatório, erros e mensagens de estado são anunciados sem repetição confusa.                          | Pendente            |
| Responsividade e temas  | Conferir 390×844, tablet físico e 1440×1000, conteúdo longo, Claro/Escuro e zoom real de 200%, sem cortes nem overflow horizontal.                  | Pendente            |

Valores públicos de situação:

- movimentações: `Aberto`, `Encerrado`, `Pendente`;
- frota: `EmUso`, `Concluido`, `PendenteRetorno`, `Corrigido`.

O contrato atual usa datas, sem filtro de horas, e permite exportar no máximo
1.000 registros. Não adicionar parâmetros nem reduzir silenciosamente o período.
O Administrador usa autenticação local; o relatório não depende de reautenticação
Google. Nenhum perfil é concedido ou alterado pelo frontend.

## Registro de execução

Para cada sessão, registrar:

- versão/SHA realmente executado, ambiente, data, navegador e dispositivo;
- cenários executados e resultado observado, incluindo os não executados;
- conclusão sem ajuda, com ajuda ou não concluída, dúvidas e interrupções;
- evidência sanitizada, problema encontrado e issue de acompanhamento;
- decisão do representante: Aceito, Ajustar, Rejeitado ou Pendente;
- responsável pela decisão e limites do aceite, sem expor dados desnecessários.

Contagens de requisições podem ser registradas sem copiar payload, senha ou
cabeçalhos. Um teste automatizado que simula `429` deve ser identificado como
simulação, separado de uma resposta observada no ambiente real.

## Atualização separada da Wiki

A sincronização deverá usar a `main` que contém os PRs incorporados e referenciar
esta issue e os commits documentados. Publicar somente fatos implementados;
manter homologação pendente até haver registro observado.

| Página                  | Conteúdo a atualizar/conferir                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manual de Uso           | Acesso administrativo, dois relatórios, filtros, 31 dias, paginação, vazio e exportação com senha atual.                                                            |
| Segurança e Privacidade | Senha por tentativa, ausência de armazenamento, autoria, minimização e diferença entre 401, 403 de confirmação e 429.                                               |
| Arquitetura             | Separação entre apresentação/feature e geração de PDF no backend, sem novo contrato.                                                                                |
| Estratégia de Testes    | Distinguir testes de contrato, interface simulada, execução integrada e aceite institucional.                                                                       |
| Regras de Negócio       | Perfil exclusivo, limites reais, autoria do servidor e identificação interna separada da placa.                                                                     |
| Status do Projeto       | Implementações incorporadas; homologação #443 e novo PDF #496 ainda pendentes. Retirar referências históricas à descoberta #272 como se ainda faltasse implementar. |

O novo layout A4 paisagem, símbolo institucional e eventual documento mascarado
seguem na #496, sob responsabilidade do backend. Não bloquear ou declarar
concluída essa evolução ao documentar o relatório atual.

## Fontes verificáveis

- [Contrato atual](../development/administrative-report-contract.md).
- [Regras de segurança](../security/authentication.md).
- [Guia seguro](../security/secure-development-guide.md).
- [Página integrada](../../src/frontend/src/pages/ReportsPage.tsx).
- [Feature e serviços](../../src/frontend/src/features/administrative-reports/).
- [Testes da página](../../src/frontend/src/pages/ReportsPage.test.tsx).
- [Testes do serviço](../../src/frontend/src/features/administrative-reports/services/administrativeReportsService.test.ts).
- [Issue #443](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/443).
- [Issue #496](https://github.com/ifpebj-ti/controle-acesso-veiculos/issues/496).
