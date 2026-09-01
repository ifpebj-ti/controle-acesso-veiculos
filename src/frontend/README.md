
# Frontend

Frontend do sistema Controle de Acesso de Veículos do IFPE – Campus Belo Jardim.

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
npm install
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

Não inclua tokens, senhas ou credenciais em variáveis expostas ao frontend.

## Estrutura de diretórios

```text
src/
├── components/
│   ├── layout/       # Layouts compartilhados.
│   └── ui/           # Componentes visuais reutilizáveis.
├── pages/            # Componentes associados às páginas.
├── routes/           # Configuração central das rotas.
├── services/         # Cliente HTTP e integrações externas.
├── hooks/            # Hooks reutilizáveis.
├── types/            # Tipos compartilhados.
├── utils/            # Funções utilitárias puras.
├── App.tsx           # Composição principal.
├── main.tsx          # Ponto de entrada do React.
└── index.css         # Estilos globais e importação do Tailwind.
```

## Convenções

- Use TypeScript em todo código novo.
- Use Tailwind CSS 4 para estilização.
- Evite CSS manual quando as classes utilitárias forem suficientes.
- Mantenha componentes com uma responsabilidade clara.
- Não coloque regras de negócio em componentes visuais.
- Não faça chamadas HTTP diretamente em componentes de apresentação.
- Centralize chamadas HTTP em `services/`.
- Use PascalCase para componentes React.
- Use branches específicas para cada alteração.
- Não adicione bibliotecas sem justificar sua necessidade.

## Fora do escopo desta etapa

- autenticação;
- autorização;
- gerenciamento de tokens;
- telas funcionais do MVP;
- chamadas reais de endpoints;
- gerenciamento global de estado;
- testes automatizados;
- integração com PostgreSQL.

## Validação

Na pasta `src/frontend`:

```powershell
npm run lint
npm run build
```
