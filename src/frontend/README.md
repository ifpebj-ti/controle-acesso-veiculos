# Frontend

Frontend do sistema Controle de Acesso de Veículos do IFPE – Campus Belo Jardim.

## Estado atual

A versão atual integra autenticação e sessão em memória ao endpoint
`POST /auth/login`. O fluxo geral de veículos também consome a API para registrar
entrada, listar acessos em aberto, registrar saída e consultar o histórico. O
catálogo de frota também lista, cria, edita e desativa veículos institucionais
pela API. As áreas de visão geral, eventos e administração ainda contêm dados
locais de demonstração e não devem ser tratadas como operação real.

Fluxo sugerido para validação local:

1. iniciar a API e acessar `/login` com uma conta individual local;
2. confirmar que e-mail e perfil exibidos vieram da resposta da API;
3. como Porteiro ou Vigilante, registrar uma entrada de homologação em `/acessos/novo`;
4. localizar o veículo em `/acessos/abertos` e registrar a saída;
5. como Transporte, consultar e manter o catálogo ativo da frota e explorar os
   eventos demonstrativos;
6. como Administrador, filtrar o histórico e gerenciar contas fictícias em
   `/administracao`.

Porteiro e Vigilante possuem a mesma navegação operacional. O Setor de Transporte
mantém frota e eventos. O Administrador gerencia contas, frota e eventos e possui
o acesso operacional excepcional permitido pelo backend, embora entrada e saída
continuem ocultas de seu menu rotineiro.

O formulário integrado segue o fluxo geral documentado: nome do condutor,
placa, objetivo e categoria são obrigatórios; tipo do veículo e observação são
opcionais. Categoria e objetivo permanecem distintos. Documento não é exigido
por decisão apenas visual, e horário, autorização e duplicidade continuam sob
responsabilidade da API.

Saída, retorno, quilometragem e motorista de veículos institucionais pertencem ao
fluxo próprio da frota. Previsão de permanência, alertas baseados em prazo e
descarte por período não são apresentados enquanto seus contratos e políticas
institucionais permanecerem pendentes.

O catálogo integrado usa `GET`, `POST`, `PUT` e `DELETE` em
`/institutional-vehicles`. Porteiro e Vigilante apenas consultam; Setor de
Transporte e Administrador podem criar, editar e desativar. A lista da API contém
somente veículos ativos. Embora o backend possua uma operação de reativação, o
frontend não oferece essa ação enquanto não existir contrato para consultar os
veículos inativos. A desativação preserva viagens e histórico no servidor.

O login autentica e as rotas são filtradas pela identidade devolvida pela API.
Isso não transforma a interface em controle de autorização: o backend continua
validando cada operação. Falhas de validação, rede, conflito e acesso negado são
apresentadas sem produzir confirmação falsa. A integração não representa
homologação para produção.

## Sessão e segurança

A estratégia implementada na Issue #117 mantém o access token somente na memória
do processo JavaScript:

- o token é anexado pelo cliente Axios centralizado e nunca aparece em URL;
- `localStorage` e `sessionStorage` não são usados, pois prolongariam a exposição
  do token em caso de XSS;
- atualizar ou fechar a página encerra a sessão e exige novo login;
- a expiração informada por `expiresAtUtc` encerra a sessão localmente;
- uma resposta 401 em requisição autenticada limpa a sessão;
- resposta 403 e tentativa de abrir uma rota incompatível apresentam acesso
  negado sem revelar dados;
- logout limpa token, identidade e temporizador locais.

O backend usa resposta 401 genérica para credencial incorreta, conta inativa e
bloqueio temporário. O frontend preserva essa indistinguibilidade para não ajudar
na enumeração de contas. Não existem refresh token ou logout no servidor.

Alternativas avaliadas:

- `localStorage`: rejeitado para este incremento por persistir o JWT e ampliar a
  janela de exposição a XSS;
- `sessionStorage`: rejeitado pelo mesmo motivo, embora limitado à aba;
- cookie `HttpOnly`, `Secure` e `SameSite`: opção preferível para uma sessão
  persistente futura, mas exige contrato de backend, proteção contra CSRF,
  encerramento e rotação próprios;
- refresh token: não implementado porque a API não possui esse contrato.

## Tecnologias

- React;
- TypeScript;
- Vite;
- Tailwind CSS 4;
- React Router;
- Axios;
- ESLint;
- Vitest e Testing Library;
- axe-core para auditoria automatizada de acessibilidade.

## Testes e acessibilidade

A suíte usa Vitest com JSDOM e Testing Library. Os testes consultam elementos por
papel e nome acessível e cobrem autenticação, restrição visual por perfil,
movimentações gerais, estados de carregamento, vazio, falha e acesso negado.

As auditorias com axe-core abrangem login, layout autenticado, registro de
entrada, acessos em aberto e histórico. Violações classificadas como sérias ou
críticas fazem os testes falharem. O menu móvel também possui testes de abertura,
fechamento por `Escape`, contenção do foco por teclado e devolução do foco ao
botão que abriu o diálogo.

Na pasta `src/frontend`, execute:

```powershell
npm test
```

A CI executa instalação bloqueada, lint, testes e build em toda alteração do
frontend. Os testes são determinísticos, usam somente dados fictícios e não
dependem da API ou de acesso à rede.

A auditoria automatizada não comprova conformidade completa com a WCAG nem
substitui testes com usuários. O JSDOM não calcula layout e contraste como um
navegador real; por isso, as regras `color-contrast` e `link-in-text-block` são
desativadas apenas nessa auditoria e continuam exigindo revisão manual em
aproximadamente 390 px e 1440 px. Essa limitação é documentada pelo
[axe-core](https://github.com/dequelabs/axe-core/tree/develop/doc/examples/jest_react),
e o gerenciamento do foco do menu segue o
[padrão de diálogo modal do W3C](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

## Executar localmente

Na pasta `src/frontend`:

```powershell
npm ci
npm run dev
```

## Variáveis de ambiente

Por padrão, o cliente usa o caminho de mesma origem `/api`. Durante o
desenvolvimento, o Vite encaminha esse caminho para a API local em
`http://127.0.0.1:5118` e remove o prefixo `/api` antes de a requisição chegar
ao backend.

Crie um arquivo `.env.local` somente quando precisar substituir a URL usada pelo
cliente:

```env
VITE_API_BASE_URL=/api
```

Se a variável não estiver definida, o cliente HTTP utilizará:

```text
/api
```

No ambiente Docker, o Nginx aplica o mesmo contrato e encaminha `/api/*` para o
container backend. Essa estratégia evita expor uma segunda origem ao navegador e
dispensa uma política CORS ampla no MVP.

Autenticação, movimentações gerais e catálogo institucional utilizam o cliente HTTP centralizado. Não
inclua tokens, senhas ou credenciais em variáveis expostas ao frontend.

## Estrutura de diretórios

```text
src/
├── components/
│   ├── layout/       # Layouts compartilhados.
│   └── ui/           # Componentes visuais reutilizáveis.
├── demo/             # Estado e dados exclusivamente demonstrativos.
├── features/
│   ├── access-records/ # Contratos, validação e serviços do fluxo geral.
│   ├── authentication/ # Formulário, service, sessão e tipos de autenticação.
│   └── institutional-vehicles/ # Contratos, formulário e serviços da frota.
├── pages/            # Componentes associados às páginas.
├── routes/           # Configuração central das rotas.
├── services/         # Cliente HTTP e integrações externas.
├── hooks/            # Hooks reutilizáveis.
├── types/            # Tipos compartilhados.
├── utils/            # Funções utilitárias puras.
├── App.tsx           # Composição principal.
├── main.tsx          # Ponto de entrada do React.
└── index.css         # Tokens, estilos globais e Tailwind.
```

## Convenções

- Use TypeScript em todo código novo.
- Use Tailwind CSS 4 para estilização.
- Mantenha componentes com uma responsabilidade clara.
- Não coloque regras de negócio em componentes visuais.
- Não faça chamadas HTTP diretamente em componentes de apresentação.
- Centralize futuras chamadas HTTP em `services/`.
- Use PascalCase para componentes React.
- Use branches específicas para cada alteração.
- Não adicione bibliotecas sem justificar sua necessidade.

## Limites atuais

- refresh token ou persistência de sessão;
- logout, revogação ou renovação no servidor;
- recuperação e redefinição de senha;
- integração de motoristas, utilizações institucionais, eventos e administração;
- integração da visão geral ao resumo operacional da API;
- persistência dos dados demonstrativos;
- integração com PostgreSQL;
- garantia de autorização baseada somente na interface;
- homologação do cliente ou prontidão para produção.

## Validação

Na pasta `src/frontend`:

```powershell
npm run lint
npm run build
npm test
```
