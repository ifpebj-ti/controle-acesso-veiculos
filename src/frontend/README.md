# Frontend

Frontend do sistema Controle de Acesso de Veículos do IFPE – Campus Belo Jardim.

## Protótipo navegável

A versão atual inclui um protótipo local para validação de fluxo com o cliente. Ele usa somente dados fictícios mantidos em memória e identifica explicitamente o modo demonstração.

Fluxo sugerido para a apresentação:

1. acessar `/login` e escolher o perfil de demonstração;
2. comparar a navegação de Transporte, Porteiro, Vigilante e Administrador;
3. como Porteiro ou Vigilante, registrar uma entrada fictícia em `/acessos/novo`;
4. conferir o alerta de permanência em `/acessos/abertos` e registrar a saída;
5. como Transporte, explorar o histórico, a frota e os eventos;
6. como Administrador, filtrar o histórico por período, revisar a demonstração de
   retenção e gerenciar separadamente pessoas autorizadas e contas fictícias em
   `/administracao`.

No fluxo proposto, Porteiro e Vigilante possuem a mesma navegação operacional.
O Setor de Transporte mantém frota e eventos, enquanto o Administrador consulta o
histórico e gerencia pessoas autorizadas, contas e permissões sem registrar
entradas ou saídas.

O formulário de entrada possui abas separadas para Servidor, Terceirizado,
Cadastrado, Visitante e Moto táxi. As três primeiras recuperam nome e placa dos
cadastros mantidos pelo Administrador e exigem somente conferência. Visitante
exige documento, destino e previsão; o motivo “Levar ou buscar estudante” sugere
dez minutos. Moto táxi usa um fluxo rápido de embarque ou desembarque, também com
uma previsão demonstrativa de dez minutos. O atraso gera alerta, mas nenhum prazo
encerra o acesso automaticamente. A placa da frota institucional continua sendo
recuperada de cadastro prévio.

A notificação de descarte após cinco anos é uma hipótese visual solicitada para a
homologação. Ela não exclui dados, não possui endpoint no backend e não substitui
a aprovação institucional de finalidade, retenção, bloqueios e descarte descrita
em `../../docs/operations/data-retention-and-continuity.md`.

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
