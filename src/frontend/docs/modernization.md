# Modernização incremental da interface

## Briefing refinado

Modernizar o Controle de Acesso de Veículos como ferramenta operacional, não
como vitrine visual. Preservar identidade institucional, contratos, permissões e
segurança. Auditar código, fluxos, documentação e interfaces antes de mudar.
Separar fatos verificados, hipóteses e validações pendentes. Priorizar leitura
rápida, prevenção de erro, previsibilidade, teclado e toque confortável.

Evoluir uma issue por vez, com componentes pequenos, tokens semânticos e nenhuma
dependência visual nova sem justificativa. Manter dados importantes visíveis,
mensagens úteis e ações com consequência explícita. Validar conteúdo longo,
erros, estados de rede, foco, reflow e preservação de formulários. Não prometer
tempo real onde a consulta é manual. Não criar dados, permissões ou recursos
ausentes do contrato. Comparar antes/depois e medir bundle e testes.

Entregar cada incremento com evidências e limitações, em PR revisável. Não
confundir prévia de componentes com aplicação integrada nem aprovação técnica
com homologação institucional. Aguardar revisão humana antes da próxima issue.

## Diagnóstico de código — baseline 63c4c18

Esta é uma auditoria estática e uma avaliação local de componentes, não uma
homologação de todas as páginas com usuários reais. A main já incorporou tokens
(#408), divisão do bundle (#399) e correção de fluxo vertical do login (#411).
Não se aplica mais o diagnóstico histórico de bundle monolítico ou ausência de
tokens. Não é necessário criar issues duplicadas: #403–#407 cobrem a sequência.

| Área / evidência no código                                                           | Preservar                                                                            | Atenção / etapa                                                                              |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `components/ui/SelectField.tsx`                                                      | Radix, rótulos, teclado e retorno de foco condicional                                | Trigger dependia de classes da página; popup tinha fundo branco e seleção verde fixa. #403   |
| `components/ui/ConfirmationProvider.tsx`                                             | Opção segura inicial, Escape, contenção/retorno de foco e resolução única            | Superfície fixa clara; sem limite de altura; ordem visual mobile invertia ordem de Tab. #403 |
| `ContentState`, `StatusBadge`, `PageHeader`, `SectionHeader`                         | Papéis de alerta/status, títulos semânticos e estados textuais                       | Paletas paralelas, títulos ornamentais, espaçamento excessivo em estados. #403               |
| `pages/LoginPage.tsx`, `PasswordChangePage.tsx`                                      | Login aprovado, senha protegida, instruções, sessão restrita                         | Migração visual de superfícies em #404; não redesenhar login nesta etapa                     |
| `components/layout/AppLayout.tsx`, `routes/routeMetadata.ts`                         | Navegação por capacidade, menu responsivo, foco e skip link                          | Migrar superfícies sem mudar permissões. #404                                                |
| `pages/DashboardPage.tsx`, `NewAccessPage.tsx`                                       | Resumo e preenchimento recorrente, foco em campos condicionais                       | Hierarquia operacional, estilos locais e densidade. #405                                     |
| `pages/OpenAccessPage.tsx`, `HistoryPage.tsx`                                        | Saída explícita, consulta, filtros e correção auditada                               | Leitura rápida de placa/condutor/horário, conteúdo longo e cartões/tabelas. #405             |
| `pages/FleetPage.tsx`, `InstitutionalDriversPage.tsx`, `InstitutionalUsagesPage.tsx` | Fluxo institucional separado do geral                                                | Formulários e estilos repetidos. #406                                                        |
| `pages/EventsPage.tsx`, `AdminPage.tsx`                                              | Consulta por perfil, manutenção autorizada, auditoria e exibição única de credencial | Densidade e estados nas áreas de gestão. #406                                                |
| `pages/NotFoundPage.tsx`, estados de acesso negado                                   | Retorno seguro, sem operações inventadas                                             | Consistência com layout. #404                                                                |

Os serviços e schemas existentes validam respostas externas; a migração visual
não altera chamadas ou dados. Consulta de acessos abertos é atualizada
manualmente, não é um painel em tempo real. Selecionar cadastro anterior não
autoriza uma entrada. Somente Administração mantém eventos. Não há suporte
contratual para inventar lista de frota inativa ou funcionalidades concorrentes.

O README ainda contém limites históricos sobre integração de credenciais e
PostgreSQL. A Wiki também contém páginas preliminares. Usar código e contratos
atuais como evidência, reservando regularização documental ampla para tarefa
separada. Não mudar regras com base em texto histórico.

## Referências e adaptação

Pesquisa de páginas públicas dos produtos, não teste autenticado nem comparação
de desempenho. As decisões abaixo são propostas de design para este contexto:

- [Envoy Visitors](https://envoy.com/products/visitors) e
  [visitor log](https://envoy.help/en/articles/3444480-using-the-visitor-log):
  centralizar consulta e ações do registro; aqui, preservar entrada/saída manuais.
- [Sine](https://www.sine.co/features/): favorecer consulta e preenchimento de
  recorrentes; aqui, manter a validação e seleção explícita já implementadas.
- [Verkada Guest](https://www.verkada.com/workplace/guest-visitor-management-system/):
  registros e estados claros; não incorporar biometria, vigilância ou liberação.
- [Kisi](https://www.getkisi.com/products/visitor-management-system):
  clareza do histórico e separação de responsabilidades; não inventar convites,
  QR codes ou automação de acesso.

## Direção visual e princípios

Superfícies neutras; verde nas ações principais, não como preenchimento de toda
a interface. Tipografia sans-serif do sistema, sem download externo. Títulos
mais compactos, descrição próxima da ação, bordas legíveis, sombras discretas e
raios moderados. A mesma intenção usa o mesmo componente e estado.

Tokens `surface`, `text`, `border`, `primary`, `focus` e famílias de estado são
o contrato visual. Não duplicar hexadecimais nem compor contraste com opacidade.
Foco de 3 px com separação da superfície; controles de 48 px; estado desabilitado
com texto, superfície e borda próprios. Erro exige texto associado, não só borda.
Estados mantêm rótulos; ícones decorativos não substituem instruções.

Nenhum zoom ou escala global. Conteúdo longo quebra linha; diálogos baixos
rolam internamente. Ordem visual acompanha teclado. Não introduzir animação
decorativa. O carregamento preserva texto com movimento reduzido.

## Navegação preservada por perfil

`routes/routeMetadata.ts` continua sendo a fonte da organização visual, sem
substituir a autorização do servidor:

- Porteiro e Vigilante: operações (entrada, abertos, histórico, utilização
  institucional) e consultas de apoio (frota, motoristas, eventos).
- Transporte: supervisão (histórico, utilizações, eventos) e gestão de frota e
  motoristas. Eventos são somente consulta.
- Administrador: supervisão, consultas de apoio e administração técnica.
  Capacidades excepcionais existentes não viram novas ações nesta migração.
- Visão geral e troca de senha preservadas conforme as rotas existentes.

## Ordem, dependências e limites

1. **#403**: primitivas compartilhadas sobre os tokens já integrados.
2. **#404**: layout, navegação e superfícies de autenticação, após revisão de #403.
3. **#405**: telas operacionais; **#406**: supervisão/gestão, após #403/#404.
4. **#407**: Claro/Escuro/Sistema, somente após migrar superfícies de todas as telas.

Na #407, aplicar preferência antes da pintura por script same-origin compatível
com CSP, `color-scheme` e `matchMedia`. Persistir apenas preferência visual
versionada e validada. Falha de storage não pode impedir o uso. A continuidade
temporal de sessão existente não é alterada. Não gravar identidade ou segredo.

## Contrato das primitivas da #403

- `Button`: variantes `primary`, `secondary`, `neutral`, `danger`; padrão
  `type="button"`, envio de formulário exige `type="submit"`; desabilitação nativa.
- `TextField` e `TextArea`: base visual opt-in para as próximas migrações; o
  consumidor mantém label, descrição, erro, ref e integração de formulário.
  Não envolvem lógica de domínio. Nenhum formulário foi migrado em massa.
- `SelectField`: usa a mesma base de campo. Classes antigas dos consumidores
  permanecem temporariamente; CSS escopado da primitiva prevalece sobre cores,
  foco e tamanho mínimo. Novos consumidores devem passar apenas layout.
- Estados, badges e cabeçalhos consomem tokens. Cartões específicos de páginas
  não são migrados aqui. `Card` fornece a superfície usada por `ContentState`,
  sem impor landmarks. O diálogo consome `Button` e superfície semântica.
- Estilos não ativam tema escuro nem oferecem seletor; os tokens escuros são
  exercitados como contrato para a migração futura, não como tema completo.

## Aceite e riscos

Verificar contraste de texto 4,5:1 e foco/borda essencial 3:1 nas combinações
usadas; cálculo de tokens não substitui medição de renderização real. Preservar
testes de teclado, axe, seleção, foco condicional e prevenção de ações duplicadas.
Testar 320 px, 390×844, notebook, desktop, conteúdo longo e reflow/zoom 200%.
Registrar separadamente emulação, zoom real, tablet físico e Narrador.

Riscos: coexistência temporária com estilos locais; cores herdadas de páginas
ainda não migradas; teclado virtual; reflexos e iluminação; zoom real com
tecnologia assistiva; densidade e toque sob pressão operacional. Não alegar
redução de tempo/erros sem observação. Tema escuro não é melhor por definição
sob claridade. Avaliar dia/noite no tablet de homologação.

As hipóteses institucionais e autorização do piloto continuam nas #162/#388;
fluxo de recuperação administrativa na #220. Esta entrega não libera produção,
uso de dados reais nem substituição das planilhas.

## Evidências locais da primeira etapa

Capturas de uma galeria temporária isolada dos componentes, com dados fictícios
e **sem API**. A galeria foi removida antes da entrega; não existe rota de
demonstração ou desvio de autenticação no produto. As imagens não representam
redesign concluído de todas as páginas:

| Viewport  | Antes                                       | Depois                                      |
| --------- | ------------------------------------------- | ------------------------------------------- |
| 390×844   | [Antes](evidence/issue-403/before-390.png)  | [Depois](evidence/issue-403/after-390.png)  |
| 1440×1000 | [Antes](evidence/issue-403/before-1440.png) | [Depois](evidence/issue-403/after-1440.png) |

[Diálogo com conteúdo longo em 320×568](evidence/issue-403/after-dialog-320.png).

Edge real em modo headless, dirigido por CDP: seleção com setas/Enter, Tab,
contenção de foco, Escape e retorno ao acionador verificados em 320×568,
390×844, 768×1024, 1366×768, 1440×900, 1440×1000, 1920×1080 e 720×500.
Nenhum overflow horizontal observado na galeria; botão focado com 48 px e
outline sólido; conteúdo longo rolável e botão final alcançável em 320×568.
720×500 exercita espaço CSS reduzido equivalente ao reflow de uma janela
1440×1000 a 200%, **não comprova zoom real do navegador**.

Permanecem pendentes: inspeção humana integrada das páginas nos quatro perfis,
zoom real a 200%, Narrador e tablet físico em iluminação diurna/noturna.
O PR deve permanecer draft até concluir os critérios técnicos aplicáveis.

### Validação automatizada e custo

- 456 testes em 47 arquivos aprovados, contra 440 em 45 arquivos na baseline;
  16 testes novos, sem remover cobertura existente.
- Lint, build e verificação de whitespace aprovados. Contraste dos tokens
  testado em claro e escuro, incluindo superfícies elevadas e sutis.
- Uma execução sob concorrência com lint/build teve timeouts em testes
  existentes. A repetição sem esses processos concorrentes passou, sem aumentar
  timeout ou alterar testes para contornar a falha. A CI deve confirmar o SHA.
- JavaScript total de produção: 876.055 → 876.389 bytes; gzip agregado por
  arquivo com Node: 270.801 → 270.919 bytes.
- CSS: 63.043 → 65.127 bytes; gzip: 11.432 → 11.956 bytes.
- Maior chunk JS: 288,07 kB. Sem aviso de chunk acima de 500 kB e sem dependência
  adicionada. Valores totais não equivalem ao download inicial, pois as rotas
  continuam carregadas sob demanda.

## Segundo incremento — autenticação, layout e navegação

A Issue #404 migra somente a moldura da aplicação: login, estados de restauração,
troca de senha, restrição de primeiro acesso, acesso negado, página não encontrada,
sidebar, cabeçalho móvel e skip link. O desenho preserva logotipos e a ilustração
institucional do login, mas troca grandes superfícies verdes por superfícies
neutras e usa o verde na ação principal. Não há glassmorphism, gradiente ou
animação decorativa.

`routeMetadata.ts` e os serviços de autenticação não mudam. Os quatro perfis
continuam recebendo os mesmos grupos, rotas e capacidades. O menu móvel preserva
foco inicial no fechamento, contenção nos dois sentidos, Escape e retorno ao
acionador. A troca obrigatória continua ocultando toda navegação operacional e
mantém somente o fluxo de senha e a saída.

As superfícies do escopo consomem `background`, `surface`, `surface-subtle`,
`text`, `text-muted`, `border`, `primary`, `focus`, `warning` e `danger`. Login e
troca de senha usam `TextField` e `Button`; troca de senha, acesso negado e página
não encontrada reutilizam `Card`; restauração e validação de sessão compartilham
um `ContentState`. Nenhuma preferência de tema é exposta nesta etapa.

Validação isolada no Edge, com sessão fictícia em memória e sem API, cobre login,
restauração, troca normal, primeiro acesso, acesso negado e página não encontrada
em 390×844, 768×1024, 1366×768, 1440×1000, 320×568 e 720×500. Os 40 cenários não
apresentaram overflow horizontal, controle abaixo de 48 px, perda de `h1` ou botão
inalcançável; os quatro perfis mantiveram contenção e retorno de foco no menu.
720×500 é somente uma aproximação de reflow e não substitui zoom real. Tablet
físico e Narrador permanecem como validações humanas pendentes; nenhuma aprovação
institucional é declarada.

## Terceiro incremento — telas operacionais da portaria

A Issue #405 migra a visão geral, o registro de entrada, os acessos em aberto e
o histórico. A hierarquia prioriza placa, condutor, categoria, horário, tempo
transcorrido e situação. Formulários, filtros, resultados, estados e diálogos
passam a reutilizar `Button`, `Card`, `TextField`, `TextArea`, `SelectField`,
`ContentState`, `StatusBadge` e os tokens semânticos da fundação visual.

A busca de cadastro anterior, o vínculo opcional com eventos, a preservação do
formulário, o encerramento normal e excepcional, a correção auditada e a
paginação mantêm comportamento e contratos existentes. Cores continuam
acompanhadas de texto. Nenhum serviço, rota, capacidade, contrato de API ou
regra de autorização foi alterado; tema escuro permanece fora desta etapa.

No Edge real em modo headless, dirigido por CDP e com respostas fictícias
controladas, as quatro rotas foram verificadas em 390×844, 768×1024, 1366×768 e
1440×1000, sem overflow horizontal ou controle operacional abaixo de 44 px.
720×500 aproxima o espaço disponível no reflow de 200%, mas não comprova zoom
real. O diálogo de saída iniciou o foco em “Cancelar”, fechou com Escape e
devolveu o foco ao acionador. Tablet físico e zoom real permanecem pendentes.

Foram aprovados 471 testes em 48 arquivos, lint, build, Prettier e verificação
de whitespace. O JavaScript de produção passou de 873.940 para 866.076 bytes e
o CSS de 61.259 para 53.285 bytes; o maior chunk passou de 289.801 para 290.191
bytes. Nenhuma dependência foi adicionada. Os números são soma dos artefatos
minificados por tipo e não equivalem ao download inicial das rotas sob demanda.
