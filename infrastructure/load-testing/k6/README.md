# Baseline de carga com k6

Este diretório contém um ensaio **somente leitura**, limitado e reproduzível para
a homologação. Ele consulta acessos abertos e o resumo diário com uma conta
fictícia dedicada. Não cria, corrige nem exclui registros.

O script oferece três perfis deliberadamente pequenos:

| Perfil    | Usuários virtuais máximos | Duração aproximada |
| --------- | ------------------------: | -----------------: |
| `low`     |                         1 |         1 min 15 s |
| `medium`  |                         3 |         2 min 30 s |
| `intense` |                         5 |              3 min |

Esses números são uma hipótese inicial segura, não representam o pico real do
campus nem um SLA. Cada iteração executa duas leituras e aguarda entre 2 e 3
segundos. O perfil mais intenso se aproxima intencionalmente do limite global
padrão de 300 requisições por minuto por usuário, mas não o desabilita.

Não execute contra a homologação sem janela e alvo aprovados. Consulte o
[procedimento operacional](../../../docs/operations/load-testing.md) antes de
usar o invocador.

```powershell
.\infrastructure\load-testing\k6\Invoke-Baseline.ps1 `
  -ApiBaseUrl 'https://HOST_DE_HOMOLOGACAO/api' `
  -Profile low `
  -ApprovedRemoteTarget
```

A senha é solicitada de modo protegido. O invocador realiza um único login,
repassa apenas o token temporário ao contêiner e remove as variáveis ao final. O
arquivo `artifacts/k6/summary.json` é local e ignorado pelo Git; revise e
sanitize qualquer evidência antes de publicá-la.

A imagem oficial `grafana/k6:2.3.0` está fixada pelo digest multi-arquitetura
`sha256:2dd4756ec6e14e62778916e1eb850108e4b499304c02df56760fa0bdb0fba0b8`.
A CI executa apenas `k6 inspect --include-system-env-vars` com valores fictícios:
ela valida a sintaxe e a configuração do script sem enviar carga ou acessar a
homologação. A opção explícita é necessária porque o comando `inspect`, por
segurança, não expõe variáveis do ambiente ao script por padrão.
