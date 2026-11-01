# Revisão das entregas — 18 a 31 de outubro de 2026

## Fotografia e como interpretar

**Data:** 31/10/2026. **Main auditada:** `ad54c41`.
**Hospedagem conhecida:** `0.4.0`, com ajuste temporário de proxy.
**Rastreabilidade:** Issue #546; auditoria da Wiki na Issue #545.

Este registro explica entregas verificáveis das últimas duas semanas. Não é uma
ata de homologação, nova release ou autorização para usar dados reais. Raíssa
responde pelo frontend; backend, banco, infraestrutura e QA possuem evidências
próprias. Revisar o trabalho da dupla não transfere sua autoria.

## O que foi entregue e por que faz diferença

| Entrega e evidência                                                    | Explicação para quem está começando                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Placas: validação backend #455, busca por prefixo #467 e frontend #458 | A interface ajuda a preencher e o servidor rejeita formatos incompatíveis. Digitar números quaisquer não deve virar uma placa válida. Exceções e dados antigos continuam na #514                                                                    |
| Eventos: contato do responsável e estacionamento #457/#459             | A portaria recebe informação útil para atendimento sem criar outro formulário de acesso. O servidor ainda valida período, cota, situação e associação                                                                                               |
| Administrador único e métodos de autenticação #470/#472                | Há quatro perfis. Google confirma quem é o operador; o nosso banco decide seu cargo. O Administrador local gerencia contas. Não existe um quinto tipo chamado administrador mestre                                                                  |
| Relatórios backend #454, frontend #462 e evolução visual #487          | O Administrador consulta movimentação geral ou frota e exporta PDF mediante confirmação da senha. O servidor controla autorização, período, quantidade, autoria e auditoria. Conteúdo/layout representativo ainda exige homologação                 |
| OCI, WAF e correções de infraestrutura #439/#471/#478/#486             | A aplicação passou a ter ambiente de homologação com VM privada e entrada pela borda protegida. WAF é uma camada adicional; ele não substitui as permissões e validações da API                                                                     |
| Release 0.4.0 e distribuição #483/#488                                 | Backend e frontend têm imagens com a mesma versão. A VM baixa os artefatos revisados; não precisa compilar o sistema toda vez. A tag identifica a entrega e o digest identifica os bytes exatos                                                     |
| Segredos por arquivo #518                                              | A main reduz a exposição de segredos no ambiente dos contêineres. Para valer na hospedagem, é necessário promover imagem e configuração compatíveis, com rollback                                                                                   |
| Hostname, HTTPS encaminhado e callback #520/#524/#521                  | Corrigimos como os proxies entregam endereço e protocolo à API. Assim, ela consegue reconhecer HTTPS e operar cookies protegidos. O caminho de retorno Google também precisa ser encaminhado ao backend correto                                     |
| Preparação Google e contingência #533/#535                             | Existe cadastro OAuth e configuração opcional segura. Falha do Google não concede acesso nem transforma conta operacional em Administrador. Cadastro no console não significa login real concluído                                                  |
| Regressão de protocolo #538                                            | Testes exercitam o middleware real com provedor fictício para verificar challenge, PKCE, cookies e rejeições. Eles ajudam a impedir regressões, mas não comprovam todo o intercâmbio com o Google                                                   |
| Contrato administrativo #543                                           | A listagem devolvia método de autenticação como número e outras respostas usavam texto. O backend passou a responder Local/Google de forma consistente. Isso corrige a causa sem tornar o frontend permissivo a um contrato ambíguo                 |
| Modelagem de ameaças #541                                              | O modelo agora distingue HTTPS existente, renovação pendente, código Google e teste Google real. Riscos residuais e pontuações não foram reduzidos apenas por atualizar o texto                                                                     |
| Limpeza demonstrativa #531                                             | Foi retirado o provedor de demonstração sem uso. As telas reais continuam consumindo a API; testes automatizados mantêm suas fixtures fictícias                                                                                                     |
| Revisão de Raíssa no #530                                              | O candidato incorpora a main e passou em 91 testes focados, lint e build nesta revisão. Não houve mudança do código da feature nesse merge de sincronização. Interface autenticada, tablet, zoom real e leitor de tela ainda precisam de evidências |

As contas fictícias do professor foram preparadas nos quatro perfis, incluindo
um Administrador exclusivo para avaliação. Credenciais foram entregues em arquivo
privado, fora do Git. Na hospedagem, login administrativo, contas, auditoria e
dois relatórios/PDFs vazios foram verificados por HTTP. Verificar `%PDF-` e HTTP
200 não prova aparência correta, conteúdo representativo ou aprovação do usuário.
Após a avaliação, as contas temporárias devem ser desativadas.

## O que a auditoria atual acrescenta

A revisão da Wiki #545 inventaria as 21 páginas existentes, corrige 19 e preserva
a ata e o processo manual como registros históricos. Corrige, entre outros:

- deploy/OCI descritos como não iniciados apesar da homologação existente;
- 16 migrations em vez das **20** versionadas na main;
- temas descritos como inativos apesar do PR #436 incorporado;
- meta antiga de 70% em vez de **90% nos componentes e fluxos críticos**;
- afirmações antigas sobre relatórios e alteração de perfis;
- contagens históricas apresentadas como atuais e versões documentais divergentes.

A checagem de evidências encontrou **368 testes backend aprovados** no artefato
da execução [41217458021](https://github.com/ifpebj-ti/controle-acesso-veiculos/actions/runs/41217458021),
SHA `a82c75e`: 78 Domain, 90 Application e 200 integração. A execução local completa
da main `ad54c41` aprovou **572 testes frontend em 54 arquivos**. Números não
podem ser somados a casos dos drafts e não representam percentual de cobertura.
A consulta autenticada ao Dependabot de 31/10 retornou zero alertas abertos;
isso não equivale a ausência de vulnerabilidades.
Na mesma data, a API de Code Scanning também retornou zero alertas abertos.
Essa consulta não mede os indicadores Maintainability/Reliability do portal.

## Progresso: três medidas diferentes

### Marco da Unidade 1

Os dez itens consolidados da [matriz da Unidade 1](unit-1-readiness.md) estão
documentados como atendidos ou ampliados: **10/10, ou 100% nessa matriz**.
Isso não é nota atribuída pelos professores nem liberação institucional. A
incerteza restante é a avaliação externa da suficiência das evidências.

### Marco da Unidade 2

A [matriz da Unidade 2](unit-2-readiness.md) conserva **8 atendidos, 6 parciais e
3 pendentes** entre 17 itens: `(8 + 6 × 0,5) / 17 = 64,7%`, com incerteza de
aproximadamente ±5 pontos percentuais. A documentação ficou mais coerente;
os critérios operacionais que faltavam continuam faltando e não geram pontos
por terem sido descritos novamente.

### MVP ampliado para o próximo piloto

Para esta estimativa de engenharia, o recorte é de 12 grupos de resultado,
com peso igual: 1 para integrado com evidência técnica, 0,5 para parcial e 0 para
não iniciado. Não substitui a matriz acadêmica nem mede segurança absoluta.

| Grupo                                                                | Estado para o cálculo |
| -------------------------------------------------------------------- | --------------------- |
| Entrada e saída geral                                                | 1                     |
| Acessos abertos e histórico                                          | 1                     |
| Correção descritiva e encerramento excepcional auditados             | 1                     |
| Catálogos de frota e motoristas                                      | 1                     |
| Saída e retorno institucional                                        | 1                     |
| Eventos com contato e estacionamento                                 | 1                     |
| Resumo e agregados operacionais                                      | 1                     |
| Administração local de contas e consulta de auditoria                | 1                     |
| Fundação de segurança, imagens versionadas e homologação técnica     | 1                     |
| Google real, login e administração separados na interface final      | 0,5                   |
| Interface de alteração auditada de perfis                            | 0,5                   |
| Homologação observada dos quatro perfis e relatórios representativos | 0,5                   |

Resultado: **10,5/12 = 87,5%**, arredondável para **cerca de 88% ±5 pontos**.
O núcleo anterior está funcional; este recorte inclui requisitos adicionais e
validação do próximo piloto. Mudança de recorte pode reduzir uma estimativa
sem significar regressão no código. Não comparar diretamente com estimativas
antigas sem denominador conhecido.

Não atribuímos percentual à produção institucional: faltam backup externo
exercitado, operação monitorada, renovação TLS, governança e aceites. Ela continua
**não liberada**. A aplicação pode ser avaliada com dados fictícios na homologação.

## Próxima sequência

1. Raíssa conclui a referência do login no #474 e coordena o #494 empilhado;
   concluir também as evidências reais que faltam no #530. Não misturar os PRs.
2. Revisar os candidatos pelos respectivos SHAs; liberar merge somente quando
   os critérios obrigatórios de cada issue estiverem atendidos.
3. Validar Google real em candidato controlado, com conta consentida e
   pré-autorizada, HTTPS, negação, sessão e logout; sem divulgar segredo OAuth.
4. Preparar nova release com backend/frontend compatíveis. Fazer backup e
   promover imagem, segredos, proxy e conjunto de rollback; não mover a tag 0.4.0.
5. Observar professor e operadores nos quatro perfis, registrar problemas,
   separar falha técnica de preferência visual e homologar relatórios.
6. Concluir as entregas operacionais da Unidade 2: TLS #509, cobertura #499,
   qualidade no portal, observabilidade #500, gestão restrita #501 e k6 #502.
7. Provisionar backup protegido e comprovar recuperação #311/#312, revisar
   retenção/contingência #30/#100 e somente então avaliar uso institucional.

## Pesquisa e decisões práticas

A [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)
e o [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html) apoiam PKCE e proteção
contra reutilização no OAuth. A ação útil é terminar a validação do fluxo existente,
sem trocar a arquitetura por outra biblioteca sem necessidade.

O [guia da CISA](https://www.cisa.gov/sites/default/files/publications/CISA_MS-ISAC_Ransomware%20Guide_S508C.pdf)
reforça backup protegido e testes de restauração. O próximo avanço verificável é
restaurar uma cópia externa, não apenas adicionar outra configuração de backup.

A [W3C](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)
orienta manter o foco visível. Isso sustenta testar a operação real dos formulários
com teclado, zoom e tablet, além do axe automatizado. O [ZAP baseline](https://www.zaproxy.org/docs/docker/baseline-scan/)
é passivo e não substitui teste de autorização nem revisão de fluxo autenticado.

As recomendações já têm issues correspondentes; não foi criado backlog duplicado,
introduzido fornecedor ou iniciado teste de carga/ataque no ambiente compartilhado.
