# Frontend

Frontend do sistema Controle de Acesso de Veículos do IFPE – Campus Belo Jardim.

## Protótipo navegável

A versão atual inclui um protótipo local para validação de fluxo com o cliente. Ele usa somente dados fictícios mantidos em memória e identifica explicitamente o modo demonstração.

Fluxo sugerido para a apresentação:

1. acessar `/login` e escolher o perfil de demonstração;
2. comparar a navegação de Transporte, Porteiro, Vigilante e Administrador;
3. como Porteiro ou Vigilante, simular uma entrada em `/acessos/novo`;
4. consultar `/acessos/abertos` e simular a saída;
5. como Transporte, explorar a visão geral, o histórico, a frota e os eventos.

O protótipo não autentica, não aplica autorização real, não chama a API e não representa homologação para produção. A seleção de perfil serve somente para validar arquitetura de informação e responsabilidades.

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

O protótipo atual ainda não realiza chamadas aos endpoints de negócio. Não
inclua tokens, senhas ou credenciais em variáveis expostas ao frontend.

## Estrutura de diretórios

```text
src/
├── components/
│   ├── layout/       # Layouts compartilhados.
│   └── ui/           # Componentes visuais reutilizáveis.
├── demo/             # Estado e dados exclusivamente demonstrativos.
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

- autenticação e autorização reais;
- gerenciamento ou persistência de tokens;
- chamadas de endpoints de negócio;
- persistência dos dados demonstrativos;
- integração com PostgreSQL;
- garantia de segurança baseada na seleção de perfil;
- homologação do cliente ou prontidão para produção.

## Validação

Na pasta `src/frontend`:

```powershell
npm run lint
npm run build
```
