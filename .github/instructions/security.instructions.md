# Diretrizes de segurança

Consulte também a modelagem de ameaças e o guia de desenvolvimento seguro em
`docs/security/`. Mudanças que alterem atores, dados, fronteiras de confiança ou
controles devem atualizar esses documentos na mesma Issue ou em Issue vinculada.

## Segredos e configuração

- Nunca versionar arquivos `.env` com valores reais.
- Nunca registrar senha, token, secret, chave privada ou connection string completa.
- Usar `.env.example` apenas com valores de exemplo não sensíveis.
- Em produção, utilizar GitHub Secrets, Docker Secrets ou serviço de segredos apropriado.
- Não usar credenciais padrão em ambientes expostos.

## Banco de dados

- O usuário da aplicação deve possuir somente os privilégios necessários.
- O usuário de migrations e o usuário de execução da aplicação poderão ser separados futuramente.
- Não executar operações destrutivas sem revisão explícita.
- Revisar migrations antes de aplicá-las.
- Não utilizar dados pessoais reais em seeds ou testes.

## Aplicação

- Validar entradas no backend.
- Não confiar na validação do frontend como controle de segurança.
- Não expor stack traces em respostas de produção.
- Não adicionar autenticação, autorização ou tokens fora do escopo de uma issue específica.
- Criar health checks sem expor configuração interna, segredos ou detalhes da infraestrutura.
