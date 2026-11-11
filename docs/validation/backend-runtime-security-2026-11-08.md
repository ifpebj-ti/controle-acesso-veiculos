# Atualização verificada de segurança do backend — 08/11/2026

Rastreabilidade: #628, #626/#627 e #636/#599. Este registro distingue fonte,
artefato e estado observado; não representa nova release ou produção institucional.

## Identidade e escopo

| Item                           | Identidade verificada                                                     |
| ------------------------------ | ------------------------------------------------------------------------- |
| Main de referência             | `202a9133696109e317cd20e1a12e3d80ebed7a0a`                                |
| Backend anterior               | fonte `04d102b7beabad6faa2a4c6d450d307b09126d9f`                          |
| Backend instalado              | fonte `5fa21bb304a642ee5363c52adc0175824f5ed9b5`                          |
| Imagem Docker instalada        | `sha256:801e02b6d7835167e7d779c5a1daa967a0f7a9fbc7ed55f18745a607a12fa5a4` |
| Config digest do arquivo/Trivy | `sha256:06dde0d716825127fc8654d52d44c49a104b29ef47fae4cc404d8311cf949aa7` |
| SHA-256 do arquivo transferido | `4412616ab40e3de094f82f3dbccdc3ec772493b20120b3046b81d17893134691`        |
| Frontend preservado            | fonte `7dd02a6464ae150a3397acb43d0b2d5227f80b43`                          |
| Release estável publicada      | `v0.4.0`, preservada; não foi criada outra release                        |

Os quatro diretórios de produção API, Application, Domain e Infrastructure do
candidato são idênticos aos da main de referência. As árvores de testes podem
diferir. O candidato preserva o tratamento Google #599 e a janela sintética;
não inclui revisão de correções #607/#613 ou papel #611. Não substituir uma
imagem somente por um nome de tag ou por considerar que todo PR foi implantado.

Docker Engine e o scanner apresentaram identificadores de representação
diferentes. A associação foi comprovada pelo hash imutável do arquivo, digest
da configuração no `manifest.json`, tag e igualdade de todos os DiffIDs/layers.
O digest da configuração não foi apresentado como se fosse o ID do Engine.

## Acesso e preparação

- Renovada a autenticação oficial temporária da Oracle.
- Corrigido o comando que usava 443: os metadados SSH da sessão indicavam 22.
  A conexão estrita nessa porta funcionou; nenhum SSH público na VM foi aberto.
- Cliente exato temporário, sessão Bastion e chave existente; verificação de
  host mantida. Seguir os metadados autenticados, não executar comandos recebidos
  como texto não verificado nem confundir HTTPS da aplicação com SSH do Bastion.
- Inventário real confirmou fontes anteriores e containers saudáveis.
- União efetiva dos overlays Compose conferida contra as imagens em execução.
  Bind mounts, secrets e chaveiro persistente conferidos separadamente.
- Novo scan do mesmo arquivo com Trivy 0.76.1: **zero HIGH/CRITICAL**.
  O SBOM SPDX externo preparado para o mesmo artefato contém 134 pacotes.
  Esse resultado é do artefato e da base do scanner nesta execução, não uma
  certificação de ausência de vulnerabilidades em todo o sistema.

Referência de conexão:
[Oracle — port forwarding](https://docs.oracle.com/en-us/iaas/Content/Bastion/Tasks/connect-port-forwarding.htm).

## Backup e rollback antes da alteração

Dump PostgreSQL custom criado em diretório privado com permissões restritas.
O arquivo foi restaurado em banco temporário separado: **20 migrations e 14
tabelas**, com schema e migration count conferidos. O banco temporário foi
removido após a validação; o banco da aplicação não foi restaurado nem teve
schema/migrations alterados. Manifesto SHA-256 privado preserva a identidade.

A imagem anterior e o comando de rollback backend-only foram preservados.
Configuração renderizada, arquivos de segredos e dump não foram versionados.
O procedimento de falha prevê retorno à imagem anterior; esse fallback não
precisou ser executado e não é apresentado como exercício real de rollback.

**Limite:** backup e restauração no mesmo host são preparação de rollout.
Não comprovam backup externo, imutabilidade, PITR, RPO de uma hora ou RTO
institucional; #311/#312 e o exercício observado continuam separados.

## Alteração e guardas posteriores

Somente backend foi recriado por Compose com `--no-deps --no-build --pull never`.
Foram conferidos depois da troca:

- imagem, arquitetura AMD64, fonte e usuário 1654;
- APT/libapt `2.8.4ubuntu0.1` e runtimes ASP.NET/Core `10.0.14`;
- health do backend, sem aplicação automática de migrations;
- IDs dos containers frontend e PostgreSQL inalterados;
- ambiente completo, mounts, redes e hardening do backend preservados;
- Google, proxy, paths dos segredos e chaveiro persistente preservados;
- prazo da exceção sintética mantido em 12/11/2026 às 23h59 de Brasília,
  sem extensão implícita.

## Verificação HTTPS após a atualização

**111/111 verificações passaram** em 08/11/2026, concluídas às 22h45 de Brasília
(`2026-11-09T01:45:56Z`). Incluem quatro logins locais fictícios autorizados,
consultas e negações por perfil, relatórios e dois PDFs válidos, validação de
entradas/paginação, cookies Secure, CSRF, refresh, logout e recusa de refresh
após logout. `/auth/providers` confirmou Google habilitado; readiness respondeu.

O ensaio não criou nem excluiu registros operacionais. Login/refresh/logout e
exportação podem gerar sessões/auditoria esperadas. Não é novo login Google
com titular, teste de carga, navegação humana, tablet ou leitor de tela.

O frontend continuou o mesmo: não afirmar que tela cheia da main ou os novos
fluxos candidatos estão na hospedagem. Gestão de segredos definitiva,
observabilidade, TLS operado, backup externo e aceite institucional continuam
pendentes. O histórico da tentativa anterior em porta incorreta foi preservado
como evidência, com esta correção explícita do diagnóstico.
