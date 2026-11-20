# Responsividade operacional móvel — Issue #762

## Escopo e fonte

Recorte baseado na main `fccc58b490c4849ef554f879d05afc15f3ed8056`, com patch
funcional `3fd8bcad897b8c9a9a0edf71929ac51346b9677c`. Abrange Visão geral,
Histórico de acessos e Registro de entrada. A revisão do login pertence à #768;
os pedidos de correção da #610/#613 também permanecem separados.

As capturas enviadas por Raíssa em 18/11/2026 motivaram a issue. O dispositivo,
navegador, zoom e bundle usados nessas capturas ainda precisam ser identificados;
pixels de uma captura não equivalem à largura CSS. Não se atribui reprodução
independente ao ambiente hospedado.

## Alterações

- A saudação/data/relógio da Visão geral rola normalmente abaixo de 1280 px,
  alinhando a fixação ao ponto em que o layout deixa de usar o cabeçalho móvel.
  A apresentação fixa do desktop permanece. Título, relógio, padding e gap usam
  proporções menores no celular, preservando textos e foco visível.
- Os três campos nativos de data mantêm tipo, valor, limites, rótulos e handlers.
  Seus contêineres podem encolher e têm limites explícitos de largura; o período
  do histórico usa uma coluna com mínimo zero no celular. Não há calendário
  customizado, remoção de aparência nativa ou bloqueio do zoom.
- Abaixo de 640 px, apenas o cabeçalho do cartão de autorização de evento usa
  duas colunas para ícone/conteúdo e uma linha própria para a ação. O marcador
  semântico da ação em SectionPanel não modifica os demais painéis.
- Não se altera sessão, autorização, contrato, consultas, filtros, vínculo de
  evento ou regra de submissão. Nenhuma dependência foi acrescentada à aplicação.

## Reprodução e ensaios locais

A prévia reutiliza as páginas, o layout e os componentes reais da branch. Sessão
e respostas são fixtures explicitamente fictícias, sem login nem API real. Seus
arquivos e evidências permanecem fora do Git.

Em 390×844, tanto Brave quanto WebKit emulado reproduziram, antes do patch:

- saudação com `position: sticky`, permanecendo sobre a região do resumo após a
  rolagem;
- descrição de evento comprimida em aproximadamente 49 px de largura.

Após o patch, a saudação saiu da área visível com a rolagem e a descrição passou
a aproximadamente 228 px de largura no mesmo cenário.

O estouro de data das capturas **não foi reproduzido** nesses navegadores locais.
As mudanças de contenção são preventivas; sua correção no dispositivo original
exige confirmação física. WebKit do Playwright no Windows não comprova Safari
ou controles nativos do iOS em um aparelho real.

Ensaios automatizados executados com o patch funcional:

- 84 cenários: Brave e WebKit, Claro/Escuro, três páginas e dimensões
  320×844, 360×844, 390×844, 412×844, 768×1024, 1024×768 e 1440×1000.
  Sem overflow horizontal; datas contidas; saudação no fluxo normal abaixo de
  1280 px; ação de evento abaixo de um conteúdo legível no celular.
- Filtros de condutor/período preservados, vazio e recuperação, abertura e
  fechamento do vínculo de evento preservando campos, uma submissão simulada por
  intenção; zero chamadas reais de API.
- A primeira execução do roteiro de interação usava `button` para um controle
  que já possui papel `radio`. O roteiro foi corrigido; não se mudou a semântica
  do produto nem se enfraqueceu uma asserção para passar.
- Zoom **nativo** do Brave a 200%, em janela física constante: largura CSS
  1424→712, DPR 1→2 e CSS zoom=1. Seis cenários (três páginas × dois temas)
  sem overflow, com teclado e preservação de campos/filtros. Não é apenas uma
  janela estreita nem prova de gesto de zoom em aparelho físico.
- 114 testes focados das três páginas, ESLint, build e formatação/diff check
  aprovados. Resultados da suíte completa e CI devem ser consultados no PR do
  head efetivamente publicado; não reutilizar checks de outra fonte.

## Pendências e roteiro físico

Conferir no celular original e, como regressão, em tablet físico:

1. Confirmar o banner da prévia e registrar aparelho, navegador, orientação,
   tamanho/zoom e snapshot. Usar exclusivamente dados fictícios.
2. Na Visão geral, rolar até o resumo; a saudação não deve encobrir o formulário.
   Abrir Data do resumo e conferir alinhamento, seletor nativo e Atualizar resumo.
3. No Histórico, conferir Data inicial/final, aplicar e limpar filtros, leitura
   dos resultados e ausência de corte nas bordas.
4. No Registro de entrada, conferir título/descrição/ação de evento; preencher
   campos fictícios, abrir/fechar as opções e verificar preservação. Com teclado
   virtual aberto, alcançar os controles por rolagem normal.
5. Repetir em retrato/paisagem e Claro/Escuro; conferir foco/teclado e leitor de
   tela quando disponíveis. Resultados antigos da #613 não homologam esta UI.

Enquanto faltarem esses critérios, manter draft/Refs #762. Não há implantação,
teste físico, validação HTTPS ou homologação institucional atribuídos ao agente.

## Referências técnicas

- [MDN: input date](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/date):
  apresentação nativa depende do navegador/sistema; preservar seu contrato.
- [MDN: min-width](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/min-width):
  mínimos intrínsecos podem impedir a contenção por largura.
