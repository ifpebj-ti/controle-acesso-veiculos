# Tela cheia opcional — Issue #620

## Local e elemento alvo

O controle fica junto ao seletor de aparência, na área de ajustes do menu
autenticado. No mobile, é acessado ao abrir o menu; na troca obrigatória de senha,
fica no cabeçalho junto aos ajustes existentes. Não integra o formulário de
entrada de veículos, não aparece no login e não é requisito para operar.

Na revisão da #622, a solicitante pediu também um ícone sempre acessível fora do
menu. Um atalho de 48×48 CSS px fica no canto inferior direito de todas as páginas
autenticadas, respeitando as áreas seguras do dispositivo. O nome acessível alterna
entre “Ativar tela cheia” e “Desativar tela cheia”; o título do botão também informa
a ação. Menu, atalho e convite usam a mesma instância do controlador, sem chamadas
concorrentes. Não há controle adicional no login.

Há espaço reservado no fim do conteúdo para as últimas ações não ficarem atrás do
atalho. Durante um diálogo/menu móvel ou mensagem flutuante visível, o atalho é
recolhido temporariamente e volta ao fechar essa camada; não sobrepõe a mensagem ou
intercepta o foco do diálogo. Camadas ocultas pelo breakpoint não o bloqueiam.
Falhas de tela cheia aparecem uma única vez no atalho, ou no controle do menu
móvel aberto, mantendo o retorno legível sem depender de abrir o menu.

O alvo é `document.documentElement` (o elemento `html`). Isso inclui a navegação,
o conteúdo, as mensagens e portais anexados ao `body`, como seletores e diálogos.
Colocar somente o `main` ou a raiz React em tela cheia poderia deixar portais
externos fora do elemento apresentado. Não foi necessário mudar destinos de
portais nem acrescentar regras de altura/overflow ao layout.

Um controlador pertence ao layout autenticado. Os controles desktop e do menu
móvel compartilham o estado; fechar o menu ou navegar não refaz a solicitação nem
remonta o formulário por causa da tela cheia. A navegação normal conserva seu
comportamento anterior: isto não acrescenta persistência de rascunhos entre rotas.

## Comportamento e foco

- Entrar exige clique/toque ou ativação por teclado no botão. A chamada nativa
  ocorre diretamente nessa ação, sem espera prévia que perca a ativação do usuário.
- Só há controle quando `document.fullscreenEnabled`, `requestFullscreen` e
  `exitFullscreen` estão disponíveis. Sem suporte/permissão, a aplicação continua
  no modo normal, sem bloquear a operação nem emular tela cheia com CSS.
- `fullscreenElement` e `fullscreenchange` determinam o estado. Resolver uma
  Promise sem entrar não produz uma indicação falsa de sucesso. Saída nativa e
  mudanças externas também sincronizam o botão.
- Durante a transição, a ação tem `aria-busy`/`aria-disabled` e uma trava síncrona
  impede pedidos concorrentes. O botão permanece focável para não perder o foco
  por desabilitação física. Não há foco forçado ao receber `fullscreenchange`.
- Rejeição ou exceção síncrona gera mensagem acessível genérica; conteúdo técnico
  não é registrado nem exposto. Tentativa nova depende de ação explícita.
- Não há interceptação de Escape pela feature, keyboard lock ou atalho global.
  O menu pode ser recolhido com Escape sem cancelar o comportamento nativo do
  navegador. Diálogos preservam seus comportamentos existentes.
- Ao desmontar a área autenticada, tenta sair apenas de uma sessão de tela cheia
  iniciada pelo próprio controle. Entrada concluída depois da desmontagem também
  é tratada. Essa limpeza é melhor esforço, com rejeição capturada; a saída nativa
  continua sendo a alternativa. Não é controle de autorização ou modo quiosque.

Não há ativação ao autenticar, navegar ou restaurar preferência. Não há storage
da opção de tela cheia, nova dependência, permissão de câmera/microfone, SDK,
alteração de API, cabeçalho, infraestrutura, sessão ou perfil. A tela cheia via
API é diferente do F11 do navegador; não se tenta controlar o F11.

## Compatibilidade e zoom

O código não altera viewport meta, escala, zoom nem gestos. A MDN registra que
alguns navegadores móveis podem restringir pinch-to-zoom quando estão em tela
cheia. Isso precisa ser verificado no dispositivo real: zoom desktop aprovado
não comprova o comportamento do Android/iPad. Se houver limitação nativa, sair
para a visualização normal continua disponível. Não contornar a política do
navegador nem reduzir cabeçalhos de segurança para habilitar a função.

## Convite opcional — Issue #622

Na Visão geral, depois da autenticação e fora da troca obrigatória de senha, um
convite discreto oferece “Entrar em tela cheia” e “Agora não”. Usa o mesmo
controlador do menu e o mesmo alvo `document.documentElement`; não altera HTTP,
sessão, autorização, formulários ou a Fullscreen API existente. Não usa modal,
timer para ativar tela cheia, ativação automática ou bloqueio de Escape/zoom.

O convite não recebe foco ao aparecer. “Agora não” mostra uma orientação
temporária no próprio contexto: “Use o ícone no canto inferior direito ou o menu
lateral, abaixo de Aparência.” A região tem anúncio educado e funciona
com o menu móvel recolhido, sem abri-lo automaticamente. Aceitar também devolve
foco ao contexto após a transição quando a pessoa continua na ação; não captura
foco de outro campo. Após aceitar/dispensar, o foco vai ao título estável da página,
sem rolar a orientação para fora da tela. O aviso some após 12 segundos, com
contagem reiniciada depois de hover/foco no aviso ou retorno de uma aba em segundo
plano. Não remove um elemento focado nem temporiza o convite ou mensagens de erro.
A orientação pode ser reencontrada no controle permanente do menu. Essa alteração
foi solicitada na revisão local da #622; substitui a orientação persistente inicial.
Rejeição preserva a visualização normal, apresenta a mensagem
do controlador e permite somente nova tentativa explícita.

Avisos de sessão, menu/diálogos e alertas críticos têm prioridade. O convite é
adiado se um diálogo/alerta já existe; se a pessoa começa a editar, navega para
outra página ou abre o menu depois da apresentação, o convite é encerrado sem
reaparecer durante o trabalho. Não aparece no cadastro de entrada, no login ou
durante a troca obrigatória de senha. A orientação não é uma confirmação de que
o navegador aceitou entrar; somente `fullscreenElement` confirma o estado.

O ciclo de vida usa uma única marca não sensível `handled` no `sessionStorage`,
na chave `ifpe.vehicle-access.fullscreen-invitation.v1`. Isso registra somente que
o convite já foi apresentado naquela aba: nunca ID, e-mail, perfil, token,
credencial, formulário ou preferência de tela cheia. Recarga e navegação não
repetem o convite. Uma nova aba tem seu próprio armazenamento (o navegador pode
copiar a marca ao duplicar uma aba). Não há sincronização de preferências entre
abas. Se não é possível ler ou gravar a marca, o convite não é exibido; o controle
manual continua disponível.

Um observador de apresentação acompanha o estado público do contexto de sessão
sem modificar o provedor de autenticação. Restauração preserva a marca; logout,
ausência de sessão ou nova tentativa de login a limpam. Uma troca direta de conta
também reinicia a apresentação, usando apenas a identidade já disponível em
memória, sem persistir essa identidade. Encerrar a aba encerra a marca. A dispensa
não interfere no prazo, renovação ou revogação da sessão.

Testes de DOM simulam API nativa e ciclo de sessão; não comprovam o modo físico
do monitor/tablet ou uma leitura humana. Ensaios novos da #622 devem registrar seu
próprio snapshot e ambiente. Resultados físicos anteriores da #620 não homologam
este convite. Manter draft/Refs #622 enquanto os critérios novos estiverem pendentes.

## Validação e limites

Os testes jsdom simulam API/eventos: ausência/desabilitação, entrada/saída,
rejeição, chamadas concorrentes, foco, estado real, desmontagem e preservação de
formulário/portais/navegação. Esses testes não comprovam tela cheia nativa.

O ensaio em navegador deve registrar fonte, browser/SO, elemento real em
`fullscreenElement`, eventos reais, entrada explícita, saída pelo botão/Escape,
menu, portal de seletor/diálogo, rolagem, foco e rascunho preservado. Se respostas
da API forem fictícias, registrar isso separadamente: a Fullscreen API pode ser
real mesmo quando os dados de negócio são controlados.

Verificar também largura próxima de 390 px, 768 px, 1440 px, Claro/Escuro,
redução de movimento e zoom de 200%. Emulação de viewport/toque não equivale a
tablet físico ou suporte real à API móvel. Narrador/aceite institucional só devem
ser registrados quando executados; evidências antigas do login não homologam
este controle. O PR fica draft/Refs #620 enquanto houver critérios pendentes.

## Referências consultadas

- [MDN — Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)
- [MDN — requestFullscreen](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen)
- [MDN — guia e limitações de zoom móvel](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API/Guide)
