# Categorias de acesso veicular — preparação da Issue #688

## Estado e dependência

Este frontend prepara as opções **Aluno**, **Terceirizado** e **Federal**,
acrescentadas ao final do catálogo compartilhado. As nove opções anteriores,
sua ordem e a seleção inicial Visitante são preservadas. Não há novo campo de
vínculo, cadastro de pessoas ou autorização automática.

A base atual é a main `8b61ccd`, que incorporou #696/5313f18. O backend já
aceita as doze categorias no código; isso não comprova implantação. O frontend
foi sincronizado por merge regular, preservando a preparação anterior. A
validação integrada depende de composição e URL identificadas com a API nova.
Manter Refs #688/draft enquanto faltarem os critérios de integração e revisão.

Federal significa **Servidor federal**. Seletores, faixa, detalhes, acessos
abertos, relatórios e legenda de distribuição usam esse rótulo, mantendo `Federal`
como valor e chave de contagem. Nenhuma regra de vínculo/autorização é inferida.
No filtro textual dos relatórios, somente o rótulo completo “Servidor federal”
é traduzido para Federal; termos parciais continuam parciais e não são ampliados.

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

### Histórico: ensaios locais executados em 11/11/2026 (7d8c62e)

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

### Atualização de 12/11/2026 sobre main 8b61ccd

Passaram 721 testes completos sequenciais em 62 arquivos e 246 testes focados
em 13 arquivos, além de lint, build, Prettier e diff check. Foram incluídas
regressões de apresentação/consulta das novas categorias nos relatórios e resumo
diário. Os testes usam transporte simulado; não são ensaio da API hospedada.

A faixa/filtros passaram novamente em oito casos locais Brave 157.0.8103.79,
390×844, 768×1024, 1440×1000 e 720×500, Claro/Escuro: rótulo Servidor federal,
seleção por teclado, Home/End, foco, visibilidade e ausência de overflow. As
evidências nativas/físicas anteriores mantêm seus snapshots/autores; não foram
automaticamente repetidas ou atribuídas a esta atualização.
