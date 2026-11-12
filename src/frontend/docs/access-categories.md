# Categorias de acesso veicular — preparação da Issue #688

## Estado e dependência

Este frontend prepara as opções **Aluno**, **Terceirizado** e **Federal**,
acrescentadas ao final do catálogo compartilhado. As nove opções anteriores,
sua ordem e a seleção inicial Visitante são preservadas. Não há novo campo de
vínculo, cadastro de pessoas ou autorização automática.

Na base `1915d13`, o backend aceita somente as nove categorias anteriores em
`AccessCategoryNames`. Portanto esta preparação **não está integrada**: registrar,
corrigir ou filtrar uma categoria nova pode ser recusado pela API antiga; a
consulta das contagens também pode ficar indisponível. Não incorporar/implantar
este frontend isoladamente antes de um candidato backend compatível. Manter
Refs #688 e draft enquanto faltar a validação integrada.

O suporte solicitado ao backend deve manter os nomes exatos Aluno, Terceirizado e
Federal, o catálogo anterior, normalização e rejeição de valores desconhecidos.
José deve conferir persistência, filtros, correções, contrato/OpenAPI, relatórios
e resumo diário. A preparação não cria endpoints nem muda DTOs, autorização ou
regras de entrada. Se o contrato publicado divergir, revisar a integração antes
de promovê-la; não presumir que este documento substitui o contrato real.

## Consumidores

- Registro geral, correção existente, seletor do histórico e faixa horizontal
  utilizam `generalAccessCategories`; não há um catálogo visual paralelo.
- A faixa reutiliza rolagem, setas, Home/End, foco e descrições acessíveis.
  Federal passa a ser o último item. Nenhuma mudança de CSS é necessária.
- As contagens continuam vindo de `totalCount` validado: passam de nove para
  doze leituras `pageSize=1`, em quatro lotes de até três. Trocar só a categoria
  ou página continua reaproveitando os totais. Falha continua sendo
  indisponibilidade, sem fabricar zero.
- Relatórios usam categoria textual e filtro parcial; o resumo diário apresenta
  as distribuições da API. Esses consumidores não possuem a lista fechada de
  nove opções e não precisam de outro catálogo ou valores fabricados. Validar
  itens reais das novas categorias no candidato integrado.
- A #689 (pré-cadastro) e o futuro controle pedestre não pertencem a esta mudança.

## Validação e limites

Os testes com serviços simulados verificam seleção e envio explícitos, sucesso,
preservação do formulário em rejeição, filtragem por teclado, contagens e limite
de concorrência. O schema de correção continua recusando categoria desconhecida.
Esses testes não provam aceitação pelo backend nem autorização institucional.

No candidato composto, conferir registro de cada nova categoria, consulta,
correção conforme o fluxo vigente, totais, paginação, vazio/erro, relatórios e
distribuições sem reclassificar registros antigos. Registrar SHA de cada serviço.
Conferir também seleção/rolagem em 390 px, tablet e 1440 px, teclado, leitor de
tela, temas e reflow/zoom de 200%, com atribuição de cada evidência. Ensaios de
outras issues não são automaticamente novas evidências deste candidato.

### Ensaios locais executados em 11/11/2026

- Suíte frontend completa sequencial: 711 testes em 62 arquivos passaram.
  `npm ci`, ESLint, build, Prettier dos arquivos alterados e diff check passaram.
  Avisos conhecidos de canvas/jsdom e tamanho do bundle foram preservados.
- 136 testes focados em seis arquivos passaram, com serviços simulados. Incluem
  os três caminhos de envio/sucesso e de rejeição/preservação, filtragem por
  teclado, catálogo da correção e quatro lotes de contagens.
- Componentes reais da faixa e filtros renderizados em cenário fictício isolado,
  sem API nem login: oito casos Brave 157.0.8103.50, em 390×844, 768×1024,
  1440×1000 e 720×500, nos temas Claro/Escuro. Seleção, Home/End, foco, opção
  selecionada visível e ausência de overflow horizontal foram conferidos.
- Zoom nativo de 200% em janela Brave de tamanho fixo, nos dois temas: largura
  interna 1424→712, DPR 1→2 e CSS zoom 1; sem overflow, navegação da faixa por
  teclado e foco no seletor preservados. A automação da escolha no menu aberto
  nesse zoom foi inconclusiva e não integra o resultado aprovado; confirmar
  manualmente antes do aceite final, sem inferir defeito pela automação.
- Tablet físico, leitor de tela e integração autenticada com backend compatível
  não foram executados neste ciclo. O viewport 768×1024 não é tablet físico.

Scripts, logs e capturas desses ensaios são temporários e ficam fora do
repositório; o código de demonstração não integra a aplicação de produção.
