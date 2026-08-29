# Guia de desenvolvimento seguro

## Objetivo

Definir práticas mínimas para mudanças no Controle de Acesso de Veículos. O guia
se aplica a frontend, backend, banco, testes, containers, CI/CD, documentação e
operação. Ele complementa as instruções obrigatórias em `.github/instructions`.

**Rastreabilidade:** Issue #26

## Referências

- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [NIST Secure Software Development Framework](https://csrc.nist.gov/pubs/sp/800/218/final)
- [Microsoft Threat Modeling Tool](https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool)
- [Docker build security](https://docs.docker.com/build/building/secrets/)

Essas referências orientam controles técnicos; requisitos institucionais do IFPE
devem ser validados pelos responsáveis competentes.

## Fluxo obrigatório de mudança

1. Vincular a mudança a uma Issue com escopo e risco.
2. Trabalhar em branch própria.
3. Identificar dados, atores e fronteiras afetadas.
4. Implementar o menor escopo seguro.
5. Adicionar testes positivos, negativos e de autorização quando aplicável.
6. Auditar diff, dependências, migrations, logs e documentação.
7. Exigir CI e revisão antes do merge.
8. Atualizar a modelagem de ameaças quando o desenho mudar.

## Segredos e configuração

- nunca versionar `.env`, senha, token, chave ou connection string real;
- usar valores obviamente fictícios em exemplos;
- fornecer segredos por configuração do ambiente ou serviço apropriado;
- não usar `ARG` ou `ENV` de Docker para incorporar segredo no build;
- não imprimir configuração completa em logs;
- rotacionar imediatamente qualquer segredo exposto e analisar o histórico;
- separar credenciais de aplicação, migration e administração em produção.

Consulte o
[OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html).

## Dados pessoais e privacidade

- coletar somente dados com finalidade registrada;
- manter documento opcional até validação institucional;
- não usar dados pessoais reais em testes, seeds, screenshots ou Issues;
- mascarar dados em logs e evidências;
- restringir exportação e consulta por autorização e finalidade;
- não definir prazo de retenção sem validação institucional;
- evitar replicar dados pessoais em múltiplas tabelas ou artefatos.

## Backend e API

### Validação

- tratar todo dado HTTP como não confiável;
- validar tipo, formato, tamanho, faixa e relação entre campos;
- manter invariantes centrais no Domain;
- usar DTOs na borda da API quando existirem casos de uso;
- não confiar exclusivamente na validação do frontend;
- usar listas permitidas para enums, ordenação e filtros;
- limitar paginação, payload e tempo de execução.

Referência:
[OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html).

### Erros

- não retornar stack trace, SQL, caminho local ou configuração em produção;
- padronizar erros de validação, autenticação, autorização e conflito;
- registrar detalhe técnico com correlation ID, não na resposta pública;
- não revelar se conta, documento ou registro sensível existe sem necessidade.

Referência:
[OWASP Error Handling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html).

### Autenticação e autorização

- contas devem ser individuais;
- senha deve ser armazenada somente com hash adequado e parâmetros revisados;
- negar por padrão e autorizar por política/caso de uso;
- validar permissão no servidor e no recurso solicitado;
- usuário inativo não pode autenticar ou manter sessão válida;
- proteger operações administrativas e auditoria separadamente;
- não implementar algoritmo criptográfico próprio;
- não registrar senha, token ou header de autorização.

As decisões atuais de token, hash, bloqueio e políticas estão em [Autenticação e autorização](authentication.md). Refresh token, revogação, recuperação e matriz final de perfis permanecem na Issue #29.

Referências:

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

## Banco e Entity Framework Core

- usar queries parametrizadas e LINQ; nunca concatenar entrada em SQL;
- manter mapeamentos e constraints na Infrastructure;
- aplicar menor privilégio ao usuário da aplicação;
- não expor PostgreSQL publicamente em produção;
- revisar índices, exclusões e cascatas;
- usar transação para mudanças que precisam ser atômicas;
- não usar `EnsureCreated` em ambiente baseado em migrations;
- não aplicar migrations automaticamente no startup;
- nunca editar migration já aplicada em banco compartilhado;
- testar banco limpo, upgrade, downgrade e novo upgrade;
- exigir backup antes de migration de risco.

## Auditoria e logs

Auditoria de negócio deve registrar quem, quando, qual entidade, qual registro e
a mudança necessária à rastreabilidade. Logs técnicos devem explicar a saúde da
aplicação. Um não substitui o outro.

- usar horário UTC e correlation ID;
- não registrar senha, token, connection string ou documento completo;
- proteger auditoria contra alteração indevida;
- definir comportamento quando a auditoria falhar;
- evitar log injection e dados fornecidos pelo usuário sem normalização;
- restringir acesso e retenção dos logs.

Estado implementado nas Issues #49 e #51: toda resposta possui correlation ID;
logs HTTP registram apenas método, template de rota, status e duração; exceções
inesperadas geram resposta `ProblemDetails` sem mensagem interna ou stack trace.
O middleware registra somente o tipo da exceção, nunca o objeto ou sua mensagem.
Entrada, saída e o fluxo de uso institucional geram auditoria de negócio na mesma
transação, com falha fechada e sem duplicar dados pessoais ou itinerário. Auditoria
dos demais casos de uso, proteção por privilégios separados e observabilidade
externa continuam pendentes.

Referência:
[OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html).

## Frontend

- não considerar ocultação de botão como autorização;
- não embutir segredo no bundle;
- evitar conteúdo HTML não confiável;
- não persistir dado pessoal ou token sem decisão explícita;
- tratar mensagens de erro sem expor detalhes internos;
- usar dependências bloqueadas e auditar atualizações;
- manter proteção contra clickjacking, MIME sniffing e políticas de conteúdo no
  servidor/proxy quando a implantação for definida.

## Containers

- usar build em múltiplos estágios;
- copiar somente artefatos necessários;
- executar como usuário não privilegiado;
- manter `.dockerignore`;
- não incluir segredos em camada, argumento ou imagem;
- fixar e atualizar imagens de forma controlada;
- reduzir pacotes, capabilities e superfícies desnecessárias;
- separar liveness e readiness;
- analisar vulnerabilidades na CI;
- não publicar PostgreSQL em produção sem necessidade e controle de rede.

O hardening é rastreado pela Issue #25.

## Dependências e cadeia de suprimentos

- manter lockfiles quando suportados;
- usar instalação determinística na CI;
- habilitar atualização automatizada por ecossistema;
- executar auditoria de vulnerabilidades;
- revisar dependência nova quanto a manutenção, licença e necessidade;
- limitar permissões de workflows;
- usar versões controladas de Actions e imagens;
- não executar código de origem não confiável com segredo disponível.

## Testes de segurança

Cada controle deve possuir teste proporcional ao risco:

- entrada inválida e limites;
- autenticação válida, inválida, bloqueada e inativa;
- autorização permitida e negada por perfil/recurso;
- ausência de segredo/dado pessoal em resposta e log;
- constraints e transações no PostgreSQL real;
- migrations e recuperação;
- indisponibilidade de dependências;
- build e execução dos containers;
- auditoria de ações e tentativas relevantes.

Provider EF InMemory não substitui testes de integração PostgreSQL.

## Pull Request seguro

Antes de aprovar:

- [ ] Issue e ameaça relacionadas;
- [ ] nenhuma credencial ou dado pessoal real;
- [ ] validação no servidor;
- [ ] autorização por recurso/operação;
- [ ] erros sem detalhes internos;
- [ ] logs e auditoria revisados;
- [ ] dependências justificadas e auditadas;
- [ ] migrations e rollback testados;
- [ ] testes negativos incluídos;
- [ ] CI aprovada;
- [ ] README, Wiki e modelo de ameaças atualizados quando aplicável.

## Vulnerabilidade ou incidente

1. Não publicar detalhes exploráveis em Issue pública antes da contenção.
2. Preservar evidências e identificar versões afetadas.
3. Revogar/rotacionar segredos quando houver possibilidade de exposição.
4. Conter o componente afetado.
5. Corrigir em branch restrita quando necessário.
6. Validar regressão e dependências relacionadas.
7. Comunicar responsáveis institucionais.
8. Registrar causa, impacto, recuperação e prevenção.

## Pendências rastreadas

- #25 — hardening de CI/CD e containers;
- #29 — autenticação e autorização;
- #30 — retenção, backup, recuperação e contingência;
- #31 — validação, erros, logs e auditoria da API.
