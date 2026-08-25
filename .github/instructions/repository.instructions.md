# Diretrizes do repositório

## Escopo e mudanças

- Trabalhe somente no escopo da issue atual.
- Não altere arquivos não relacionados sem justificar previamente.
- Faça mudanças pequenas, revisáveis e testáveis.
- Não refatore áreas não relacionadas à tarefa.
- Não remova arquivos, testes, workflows ou regras de segurança sem aprovação explícita.

## Git e Pull Requests

- Não faça commit diretamente na branch `main`.
- Trabalhe em branch vinculada à issue.
- Use commits pequenos e com uma responsabilidade clara.
- Não faça push, merge, rebase ou force push sem solicitação explícita.
- Todo Pull Request deve referenciar a issue relacionada.
- Todo Pull Request deve apresentar testes e validações executadas.

## Qualidade

- Mantenha arquivos formatados conforme `.editorconfig`.
- Execute as validações relevantes antes de concluir uma tarefa.
- Não reduza cobertura ou remova testes para fazer a pipeline passar.
- Informe arquivos alterados, dependências adicionadas e comandos executados.

## Segurança

- Nunca crie, exponha, altere ou versione segredos.
- Nunca inclua senhas, tokens, chaves privadas, connection strings reais ou credenciais em código, documentação, logs ou exemplos.
- Não use dados pessoais reais em testes, seeds ou exemplos.
- Utilize arquivos de exemplo sem valores sensíveis.
- Mantenha arquivos `.env` fora do Git.