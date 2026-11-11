# Cadência de releases e promoção da homologação

## Política — Issue #681

Atualizar `Unreleased` no PR que entrega a mudança. Durante o piloto, revisar
semanalmente o conjunto pronto e publicar incrementos pequenos e coerentes.
Correções de segurança prontas têm prioridade; não devem aguardar uma grande
versão. Uma data não dispensa testes, revisão e compatibilidade.

Usar `MAJOR.MINOR.PATCH`, mantendo o zero inicial durante o desenvolvimento:
`0.4.1` corrige comportamento compatível; `0.5.0` acrescenta funcionalidade;
`0.5.1` e `0.5.2` entregam correções seguintes. Não é necessário saltar para
`5.0.0`. O lote desde `0.4.0` contém novas funcionalidades, por isso `0.5.0` é a
versão proposta, ainda não publicada. Revisar o escopo no commit liberado.

Tags publicadas são imutáveis. Não apontar `0.4.0` para código novo nem
sobrescrever imagens versionadas. A versão descreve o escopo, não o esforço.

## Responsabilidades

José coordena backend, changelog e promoção; Raíssa confere o frontend e os
fluxos afetados. A equipe revisa os gates e José incorpora os PRs. Agentes não
fazem merge por conta própria. A avaliação pelos professores não declara
produção institucional.

## Publicação

1. Conferir a main, os PRs incorporados e o diff desde a última tag. Comparar
   também com a hospedagem: substituir um candidato pela main não pode retirar
   silenciosamente um fluxo já disponível. PR aberto não entra implicitamente
   em uma release estável.
2. Concluir revisão, testes pertinentes, build, lint, análise estática e gates
   das arquiteturas publicadas. Conferir advisories antes da promoção; um scan
   antigo não certifica a imagem hoje.
3. Escolher a versão, mover o lote realmente entregue de Unreleased para uma
   seção datada e atualizar referências de instalação da release estável.
   Preservar entradas históricas.
4. Criar `vX.Y.Z` no SHA revisado. Conferir o resultado final da CI de publicação
   antes de anunciar imagens. O workflow atual aceita versões numéricas
   completas; não presumir suporte a tags `-rc.1`.
5. Conferir as duas imagens GHCR, sua fonte, digests, arquiteturas, scanner e
   SBOM externo. Publicar a release com notas e limites reais. Não reintroduzir
   atestações OCI sem decisão específica.

Os nomes são `ghcr.io/ifpebj-ti/controle-acesso-veiculos-backend:X.Y.Z` e
`ghcr.io/ifpebj-ti/controle-acesso-veiculos-frontend:X.Y.Z`. `X.Y.Z` é um exemplo;
substituí-lo somente por uma versão efetivamente publicada e conferida.

## Promoção à VM

1. Identificar versão/digests anteriores, configuração efetiva e rollback.
   Fazer backup e conferir recuperação antes de alterações persistentes.
2. Seguir o [runbook de implantação](versioned-container-deployment.md), com
   Compose de produção sem build e a mesma versão nos dois serviços. Preservar
   Google, cookies, proxy HTTPS, WAF, key ring, dados e prazos de contas de teste.
3. Baixar imagens publicadas e promover a configuração revisada. Conferir
   migrations e compatibilidade antes de iniciar o lote.
4. Verificar HTTPS, readiness, versão instalada, autorização, acesso
   administrativo, sessão/refresh/logout e fluxos afetados. O titular faz o
   login Google; não solicitar sua senha. Registrar evidências sanitizadas.
5. Se houver regressão, executar o rollback preparado e registrar o resultado.
   Reverter imagem não reverte necessariamente schema ou dados; migrations
   exigem plano próprio. Publicar outra versão, sem mover tags.

Release não atualiza a VM automaticamente. Registrar separadamente versão
publicada e instalada, horário, fontes, digests, testes e limitações. Depois do
merge, sincronizar a Wiki em tarefa separada baseada na main atualizada.

## Situação verificada em 11/11/2026

A release estável continua `0.4.0`. A hospedagem identificada usa frontend
`7dd02a6` e backend `812b71e`, após a promoção isolada #677, diferentes da tag. A main
`812b71e` não contém a interface Google de #474 nem toda a gestão candidata de
contas: substituir o frontend hospedado por ela seria regressão.

Os PRs #675 e #676 já estão incorporados à main `3481afa`, incluindo runtime
10.0.15 e atualização APT com tentativas limitadas e falha explícita. Publicar
uma release ainda exige gates no SHA liberado e composição frontend/backend
aprovada.
A promoção de runtime foi verificada na #677 e permanece separada da release
conjunta: [evidência](../validation/backend-runtime-rollout-2026-11-11.md).
A proposta 0.5.0 está somente em draft na #686, sem tag publicada. A conclusão
dos fluxos candidatos não foi presumida para publicar uma release antecipada.

Referência: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
