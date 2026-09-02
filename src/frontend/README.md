# Frontend

Frontend do sistema Controle de Acesso de Veículos do IFPE – Campus Belo Jardim.

## Estado atual

A versão atual integra autenticação real e sessão em memória ao endpoint
`POST /auth/login`. As telas de negócio continuam sendo um protótipo para
validação de fluxo: usam somente dados fictícios mantidos em memória e são
identificadas explicitamente como demonstração.

Fluxo sugerido para validação local:

1. iniciar a API e acessar `/login` com uma conta individual local;
2. confirmar que e-mail e perfil exibidos vieram da resposta da API;
3. como Porteiro ou Vigilante, registrar uma entrada fictícia em `/acessos/novo`;
4. conferir o alerta de permanência em `/acessos/abertos` e registrar a saída;
5. como Transporte, explorar o histórico, a frota e os eventos;
6. como Administrador, filtrar o histórico por período, revisar a demonstração de
   retenção e gerenciar contas fictícias em `/administracao`.

Porteiro e Vigilante possuem a mesma navegação operacional. O Setor de Transporte
mantém frota e eventos. O Administrador gerencia contas, frota e eventos e possui
o acesso operacional excepcional permitido pelo backend, embora entrada e saída
continuem ocultas de seu menu rotineiro.

O formulário de entrada adapta os campos ao contexto: visitante exige conferência
de documento; o motivo “Levar ou buscar estudante” sugere dez minutos e gera um
alerta quando a saída não é registrada; veículos institucionais recuperam a placa
do catálogo e exigem somente conferência. Nenhum prazo encerra o acesso
automaticamente.

A notificação de descarte após cinco anos é uma hipótese visual solicitada para a
homologação. Ela não exclui dados, não possui endpoint no backend e não substitui
a aprovação institucional de finalidade, retenção, bloqueios e descarte descrita
em `../../docs/operations/data-retention-and-continuity.md`.

O login autentica e as rotas são filtradas pela identidade devolvida pela API.
Isso não transforma a interface em controle de autorização: o backend continua
validando cada operação. As telas de negócio ainda não chamam seus endpoints e
não representam homologação para produção.

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
- ESLint.

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

Somente a autenticação realiza chamada de negócio nesta etapa. Não inclua tokens,
senhas ou credenciais em variáveis expostas ao frontend.

## Estrutura de diretórios

```text
src/
├── components/
│   ├── layout/       # Layouts compartilhados.
│   └── ui/           # Componentes visuais reutilizáveis.
├── demo/             # Estado e dados exclusivamente demonstrativos.
├── features/
│   └── authentication/ # Formulário, service, sessão e tipos de autenticação.
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

## Fora do escopo do protótipo

- refresh token ou persistência de sessão;
- logout, revogação ou renovação no servidor;
- recuperação e redefinição de senha;
- chamadas aos endpoints operacionais e administrativos;
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
