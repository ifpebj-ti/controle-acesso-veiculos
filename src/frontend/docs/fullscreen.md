# Tela cheia opcional — Issue #620

## Local e elemento alvo

O controle fica junto ao seletor de aparência, na área de ajustes do menu
autenticado. No mobile, é acessado ao abrir o menu; na troca obrigatória de senha,
fica no cabeçalho junto aos ajustes existentes. Não integra o formulário de
entrada de veículos, não aparece no login e não é requisito para operar.

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
