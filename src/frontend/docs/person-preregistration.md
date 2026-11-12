# Pré-cadastro de pessoas — preparação da #689

## Decisão confirmada por Raíssa em 12/11/2026

Primeira apresentação com **nome completo** e **classificação**: Aluno,
Terceirizado ou Federal. Veículo fica para outra etapa. Não acrescentar
documento, matrícula, contato, conta de usuário, senha ou presença/turnos.
Administrador e Setor de Transporte são os perfis solicitados; isso ainda requer
política real no servidor, não uma autorização inventada no frontend.

## Estado da entrega

Os componentes em `features/person-preregistration` são apresentação **provisória**,
baseada na main `1915d13`. Não foram montados em rota ou menu, não importam
Axios/serviços e não fazem chamadas HTTP ou persistência. Não existe API de
pré-cadastro nessa base. A tela exibe aviso explícito de prévia e a demonstração
usa somente dados fictícios fora do bundle de produção.

`PreregistrationDraft`, classificações, itens e filtros são modelos da interface,
não nomes de campos, enums ou DTOs aprovados do backend. `key` serve apenas à
renderização React e não propõe identificador público. A classificação não é
automaticamente a categoria de uma entrada. A #688 permanece separada.

O limite visual de 200 caracteres acompanha o tamanho atual de `Pessoa.Nome`
em `PessoaConfiguration`; não substitui validação/contrato HTTP. Nome igual não
identifica a mesma pessoa. Não há deduplicação local ou conta criada por nome.

## Composição da interface

- Cabeçalho e ação de novo pré-cadastro no padrão institucional existente.
- Formulário inline com foco inicial no nome, seleção obrigatória sem padrão
  implícito, validação acessível e retorno ao botão de abertura ao cancelar/concluir.
- Bloqueio de chamadas concorrentes ao callback; erro genérico junto à ação,
  preservando campos. Não há reenvio automático.
- Busca explícita por nome/classificação, limpar filtros e catálogo responsivo.
  Dados/resultados/status são fornecidos pelo componente que montar a tela.
  A interface não promete pesquisa parcial, paginação, total global ou leitura
  completa enquanto o contrato correspondente não existir.
- Estados de carregamento, vazio, erro recuperável de consulta e acesso negado
  podem ser exercitados por apresentação controlada; não são respostas reais.
- Componentes e tokens existentes mantêm Claro/Escuro, foco, toque e responsividade.

## Dependências para José e integração futura

1. Inspecionar/reutilizar `Pessoa` e definir o contrato de criação e consulta;
   não criar entidade paralela nem confundir pré-cadastro com contas `/users`.
2. Definir nomes canônicos dos campos/classificações, limites, formato de resposta,
   busca/paginação e política efetiva para Administrador e Transporte.
3. Resolver prevenção/tratamento de duplicidades sem exigir documento ou matrícula
   por inferência; registrar se algum identificador adicional realmente for necessário.
4. Definir como uma pessoa sem veículo será reutilizada depois. A busca recorrente
   #213/#214 consulta pares pessoa–veículo ativos: não permite presumir que uma
   pessoa isolada aparecerá nela. Não duplicar o autocomplete nem inventar vínculo.
5. Definir validação/erros de campo, 401/403/409/429 e resultado de envio incerto.
   Após perda de resposta de mutação, é necessário reconciliar por leitura conforme
   contrato antes de permitir novo envio. O callback provisório não implementa essa
   regra HTTP; não ligá-lo diretamente a um POST sem a camada de integração.
6. Atualizar OpenAPI, riscos/controles de privacidade e auditoria na issue/PR
   correspondente. Definir minimização, autorização, consulta e retenção antes
   da persistência institucional; não armazenar nomes no navegador.
7. Integrar serviço com validação estrita de respostas e controlador da feature;
   só então montar rota/menu com capacidades coerentes e testar candidato identificado.

Manter draft/Refs #689 enquanto faltarem contrato, integração e ensaios reais.
Não confundir teste de componente, cenário fictício, API real, tablet físico,
leitor de tela e homologação institucional. Não há merge ou deploy nesta preparação.

## Referências de interação

Foram adaptadas mensagens por campo, associação ao controle e foco no primeiro
erro das orientações [W3C WAI sobre notificações de formulários](https://www.w3.org/WAI/tutorials/forms/notifications/).
O padrão [GOV.UK Error message](https://design-system.service.gov.uk/components/error-message/)
orienta distinguir erro de preenchimento de indisponibilidade/permissão. Os
componentes, cores e composição usados são os do próprio projeto, sem copiar
identidade visual dessas referências. Isso não substitui ensaio com leitor de tela.

## Evidências locais de 12/11/2026

- Suíte frontend completa sequencial: 704 testes em 63 arquivos passaram;
  npm ci, lint, build, Prettier e diff check aprovados. Avisos já conhecidos
  de canvas/jsdom e tamanho do bundle foram preservados.
- 14 testes focados de comportamento: validação e foco, três classificações,
  bloqueio concorrente, preservação em falha, filtros, homônimos distintos,
  carregamento, vazio, erro, acesso negado e análise automatizada de acessibilidade.
- Prévia estática separada, com dados fictícios em memória e sem API: oito casos
  Brave 157.0.8103.50 em 390×844, 768×1024, 1440×1000 e 720×500, nos dois temas;
  seleção, simulação, filtros, cancelamento, foco e ausência de overflow passaram.
  Mais quatro estados foram conferidos: falha simulada do callback, carregamento,
  erro e acesso negado. Isso não representa respostas HTTP reais.
- Zoom nativo de 200% em janela fixa, Claro/Escuro: largura interna 1424→712,
  DPR 1→2 e CSS zoom 1. Sem overflow; abrir formulário por teclado, abrir seletor,
  fechar por Escape e cancelar com retorno de foco passaram.
- Axe no navegador em 390 e 1440 px, nos dois temas: nenhuma ocorrência séria ou
  crítica nos quatro casos. Não é ensaio de áudio/leitor de tela nem garantia de
  conformidade integral.
- Tablet físico, Narrador, autorização dos dois perfis e API integrada permanecem
  pendentes. O viewport de tablet não é evidência de um dispositivo físico.

Harness, scripts, capturas e logs da prévia ficam no TEMP do Windows, fora do
repositório. O servidor local somente serve arquivos estáticos por GET/HEAD;
não recebe cadastros nem publica dados. Nenhum dado digitado é persistido.
