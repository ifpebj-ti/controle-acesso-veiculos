# Instruções do repositório para agentes

## Escopo e precedência

- Estas regras se aplicam a todo o repositório.
- Ao trabalhar em `src/frontend`, leia também `src/frontend/AGENTS.md`; as regras mais específicas desse arquivo prevalecem nesse diretório.
- Antes de alterar código, consulte `.github/instructions/repository.instructions.md`, `.github/instructions/security.instructions.md` e as instruções específicas da área. Para backend, consulte também `.github/instructions/backend.instructions.md`.
- Consulte o `README.md`, a documentação relevante em `docs/` e a Wiki antes de propor mudanças de comportamento, arquitetura ou fluxo.
- Confirme o estado atual nas issues, PRs, checks, branch e código. Trate documentos históricos como contexto, não como prova de implementação atual.

## Contexto e responsabilidades

- O projeto é um MVP real de controle de acesso de veículos do IFPE Campus Belo Jardim, organizado como monorepo e monólito modular com Clean Architecture adaptada.
- Raíssa atua no frontend, UX, IHC e acessibilidade. José Ernandes atua no backend e banco de dados. DevOps, infraestrutura e QA são responsabilidades compartilhadas.
- Eurico é o principal contato do setor de Transporte. Regras ainda não validadas com ele, porteiros ou vigilantes devem ser registradas como hipóteses.
- Não apresente protótipos, mocks ou dados de demonstração como funcionalidades integradas ou prontas para produção.

## Fluxo de trabalho no GitHub

1. Inspecione `git status`, a branch atual, alterações locais e o estado remoto antes de editar. Preserve trabalho existente que não pertença à tarefa.
2. Toda implementação deve partir de uma issue. Issues e discussões são escritas em português, com contexto, escopo, critérios de aceite, dependências e itens fora de escopo.
3. Use uma branch por issue, a partir da `main` atualizada. Padrões: `feature/issue-N-descricao`, `fix/issue-N-descricao`, `docs/issue-N-descricao`, `chore/issue-N-descricao`.
4. Faça commits pequenos e coerentes em inglês, seguindo Conventional Commits. Inclua `Refs #N` no corpo. Faça stage direcionado; não use `git add .`.
5. Título e descrição do PR são em inglês. Vincule a issue, descreva escopo, validações, riscos e dependências. Use `Closes #N` apenas quando todos os critérios estiverem atendidos; caso contrário, use `Refs #N` e mantenha o PR como draft.
6. Comentários de revisão e acompanhamento podem ser em português. Depois de editar conteúdo no GitHub, confirme o texto publicado e sua codificação.
7. Não faça push, merge, rebase, force-push ou exclusão de branch sem autorização compatível com a solicitação atual. Nunca faça merge por conta própria.
8. Após o merge, sincronize a Wiki em uma tarefa separada baseada na `main` já atualizada e relacione a alteração ao PR incorporado.

## Limites técnicos e segurança

- Mantenha a mudança dentro do escopo da issue. Expansões relevantes devem virar proposta ou nova issue.
- Mudanças de frontend não devem alterar silenciosamente backend, infraestrutura, contrato de API ou regras de negócio. Registre a dependência e coordene com o responsável.
- Inspecione contratos reais antes de integrar. Controle visual de rotas ou menus não substitui autorização no servidor.
- Não versione segredos, credenciais, documentos reais ou dados pessoais. Dados de demonstração devem ser claramente fictícios.
- Não armazene JWT ou credenciais no navegador sem decisão arquitetural e análise de risco aprovadas. Consulte `docs/security/secure-development-guide.md` e `docs/security/threat-model.md`.
- Classifique afirmações importantes como confirmadas, implementadas, hipóteses, pendências ou fora de escopo. Não invente aprovações, resultados de testes ou percentuais.

## Qualidade e entrega

- Siga `.editorconfig` e as convenções já adotadas no código.
- Valide proporcionalmente ao risco: testes relevantes, lint, build, `git diff --check` e checks de CI disponíveis. Não remova testes para obter aprovação.
- Antes do PR, revise o diff completo e confirme que não há arquivos estranhos, segredos ou mudanças não relacionadas.
- No encerramento, informe o que mudou, por quê, arquivos principais, validações executadas, riscos, dependências e próximos passos. Qualquer estimativa percentual deve trazer critério, evidência e incerteza.

## Referências principais

- `docs/development/commit-conventions.md`
- `docs/security/secure-development-guide.md`
- `docs/security/threat-model.md`
- `src/frontend/README.md`
- Wiki: <https://github.com/ifpebj-ti/controle-acesso-veiculos/wiki>
