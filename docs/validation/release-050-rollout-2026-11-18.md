# Publicação e promoção 0.5.0 — 18/11/2026

## Identidade confirmada

A release [v0.5.0](https://github.com/ifpebj-ti/controle-acesso-veiculos/releases/tag/v0.5.0)
foi publicada em 18/11 às 01h24 BRT. A fonte imutável é
`eaccd721fb3a6d09d27726152f3a73586c53988c`, após a incorporação #754.
A main documental de referência é `8089eb4`, após #742/#759.

A execução [44234320324](https://github.com/ifpebj-ti/controle-acesso-veiculos/actions/runs/44234320324)
concluiu com sucesso: quatro builds/scans, smoke integrado com baseline ZAP,
publicações por arquitetura, manifests e release. Os manifests contêm Linux
AMD64 e ARM64. A VM executa AMD64.

| Serviço  | Digest do manifest publicado e usado na implantação                       |
| -------- | ------------------------------------------------------------------------- |
| Backend  | `sha256:1534ee794f47772299d85f396257f9e7043ba0151678fdb72fbb1a4397abb2f8` |
| Frontend | `sha256:805b4585ef3568f9b797ece0cf784b6db0500da4e11812498752609758e973c8` |

```bash
docker pull ghcr.io/ifpebj-ti/controle-acesso-veiculos-backend:0.5.0
docker pull ghcr.io/ifpebj-ti/controle-acesso-veiculos-frontend:0.5.0
```

A assinatura da proveniência GitHub foi verificada para ambos os digests,
repositório, workflow `ci-containers.yml`, tag e SHA esperados. Quatro SBOMs
SPDX-2.3 foram lidos: 132 pacotes por arquitetura no backend e 23 no frontend.
Passar os gates não significa ausência universal de vulnerabilidades.

## Preparação e recuperação

Antes da alteração, a hospedagem usava frontend `67ad6b8`, backend `f7ee701` e
22 migrations. Configuração efetiva e imagens anteriores foram preservadas
para rollback. O backup protegido foi restaurado em banco separado, mantendo
as contagens e 22 migrations. O chaveiro criptografado também foi arquivado.
Isso é recuperação local ensaiada; não encerra backup externo ou PITR.

O SQL 22→23 foi gerado diretamente da tag, revisado e aplicado duas vezes
somente no banco restaurado. O resultado foi 23 migrations e duas novas tabelas
para contingência, sem duplicação. O SQL é transacional e aditivo.

## Promoção executada

Às 01h28 BRT, frontend e backend foram promovidos por Compose, sem build na VM,
usando os manifests publicados fixados por digest. Antes do SQL definitivo, o
backend foi parado e um novo backup foi criado. A migration foi aplicada e os
dois serviços voltaram saudáveis. PostgreSQL, seu container, volumes e dados
foram preservados, assim como Google, segredos e montagens do chaveiro.
As contagens de negócio permaneceram iguais antes e depois da promoção.

O arquivo Nginx antigo montado sobre a imagem foi retirado da composição;
a configuração canônica publicada passou a valer. A exceção local fictícia
já expirada foi desabilitada explicitamente, sem reabrir janela ou alterar
contas reais/compartilhadas. O acesso administrativo temporário do Bastion foi
encerrado e o CIDR acrescentado para esta tarefa foi removido.

Rollback de aplicação usa a configuração e as imagens anteriores preservadas.
A migration aditiva não deve ser revertida automaticamente: retornar imagens
não autoriza apagar tabelas ou restaurar um backup sobre gravações posteriores.
O rollback não precisou ser executado nesta promoção.

## Verificações posteriores

- 46/46 verificações HTTPS da API passaram, sem gravações de negócio: readiness,
  provedor, negação anônima, Administrador local, consultas, pré-cadastro,
  incidentes/importações de papel, filtros inválidos, CSRF, refresh e logout.
- Google permanece habilitado; autenticação real com titular após esta promoção
  ainda não foi observada por esta tarefa. Descoberta do provedor não comprova login.
- A verificação HTTP do frontend passou: redirect relativo `/api/`, uma política
  DENY, HTML revalidável, bundle com cache imutável e recurso ausente com 404.
  O mesmo roteiro falhava nesses itens antes da troca.
- Frontend público: `/assets/index-B66Y0A-1.js`, SHA-256
  `d0bd32c78395ed5de4d556b2fac0e88afa5f67182ea5244234e26e23e08e347d`.
- Não houve novo tablet, Narrador, zoom nativo, teste de carga ou piloto observado.
  Evidências humanas anteriores conservam suas fontes e autores.

## Limitações e próximos passos

Os rótulos internos das imagens ainda herdam metadados das bases: backend
sem revision e version 24.04; frontend com revision da base e version
1.30.6-alpine-slim. A fonte desta promoção foi comprovada pela proveniência
assinada e pelos digests, não por esses rótulos. Os rótulos dos containers na
composição operacional identificam a aplicação; não alteram a imagem publicada.
A correção permanente das imagens está na #761, para próxima versão, sem mover
0.5.0. As notas públicas foram resumidas no padrão da release anterior, com os
comandos de ambos os serviços e link para o changelog completo.

Interface de papel #712, revisão #607/#613 e confirmação PDF Google #699
permanecem pendentes. A promoção não declara produção institucional, conclusão
integral do relatório externo, backup externo, monitoramento operado, renovação
TLS ou carga OCI. A régua acadêmica permanece em 17 critérios, com as evidências
operacionais próprias. Rastreabilidade: #686/#760; nenhuma incorporação de PR
foi executada pelo agente.

## Auditoria npm adicional ? mesma continuidade

A main 8089eb4 foi auditada independentemente ap?s o relato do #613: 12
achados HIGH e zero CRITICAL, derivados de um ?nico advisory de picomatch
4.0.7 na cadeia de ferramentas. `npm audit --omit=dev` retornou zero achados.
O frontend final usa Nginx e arquivos dist, sem Node/node_modules. Isso delimita
a exposi??o; n?o elimina o risco do build ou do desenvolvimento.

O [advisory oficial](https://github.com/advisories/GHSA-fc5q-39xc-vjpf)
indicava vers?es afetadas at? 4.0.7 e nenhuma vers?o corrigida publicada na
consulta. A #765 acompanha o tratamento e a revis?o de superf?cies de globs.
N?o foi executado audit fix --force, downgrade, fork n?o revisado ou bypass de
gate. O scanner de imagem e o audit de ferramentas possuem escopos distintos.
