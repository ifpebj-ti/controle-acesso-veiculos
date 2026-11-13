# Transporte — funções de negócio (Issue #703)

Base: main 8b61ccd, com #700 incorporado. Esta interface acompanha a matriz em
[`transport-authorization-matrix.md`](../../../docs/architecture/transport-authorization-matrix.md).
Não muda autorização, backend, API, contas ou infraestrutura.

## Recorte

- Transporte vê registro/saída, operações da frota, eventos, históricos,
  catálogos, relatórios e auditoria. As ações reutilizam os componentes e
  serviços existentes. O servidor continua decidindo cada requisição.
- Auditoria tem rota própria `/auditoria`, com o painel existente, sem carregar
  o catálogo administrativo de usuários. Administrador também pode usá-la.
- `/administracao`, criação/desativação de contas, mudança de perfil e
  credenciais continuam exclusivas do Administrador. Não há novo perfil.
- Relatórios permitem consulta para Transporte. Exportação fica indisponível
  nesse acesso, com explicação junto à ação. Não se solicita senha Google.

## Limite concreto da exportação

A resposta atual de login contém id, email, profileName e requiresPasswordChange;
não fornece o authenticationMethod canônico da própria sessão. A tela não deve
inferi-lo pelo perfil, domínio, conta administrada ou `/auth/providers`.
Por isso não oferece confirmação local para Transporte enquanto não existir uma
forma compatível de descobrir/confirmar o método. A #699 acompanha a confirmação
federada. O fluxo local já existente do Administrador foi preservado.

Essa restrição visual temporária não remove a capacidade autorizada pelo servidor.
Uma evolução deve usar o contrato real para cada método e validar integração.
Nenhum token, senha Google, SDK ou storage de credencial foi acrescentado.

## Evidências e pendências

Testes de comportamento cobrem navegação, capacidade operacional, eventos,
frota, consulta de relatórios sem POST de exportação, negação de contas e auditoria
sem consultar usuários. Resultados finais pertencem ao SHA publicado no PR.
Testes simulados não comprovam autorização ou integração com API hospedada.

Ainda faltam candidato HTTPS identificado, validação autenticada das funções de
negócio e ensaios específicos de tablet físico/Narrador. Evidências antigas de
login não são atribuídas a esta tela. Manter draft/Refs #703 até o aceite integrado.

Uma composição local de ReportsPage/AuditPage com contexto fictício e adaptador
Axios controlado passou 16 casos automatizados em Brave 157.0.8103.79:
390×844, 768×1024, 1440×1000 e 720×500, Claro/Escuro, sem overflow; exportação
inativa sem formulário de senha nem POST e auditoria sem chamada ao catálogo de
usuários. As capturas foram inspecionadas separadamente. Não é API HTTPS real,
leitor de tela ou tablet físico. Teclado/foco/menu são cobertos
pelos testes de comportamento pertinentes; esses limites permanecem no PR.
Harness, logs e capturas ficam somente no TEMP, fora do Git.

Dois ensaios posteriores em Brave com zoom nativo de 200%, Claro/Escuro,
confirmaram tamanho de janela preservado, viewport de 1424 para 712 CSS px,
DPR de 1 para 2, CSS zoom 1, seletor operável por teclado e retorno de foco após
Escape, sem overflow. São execuções automatizadas locais, sem API real.
