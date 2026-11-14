# Candidato integrado de homologação em 14/11/2026

## Fonte e implantação confirmadas

A main de referência é `6c435d41383e0fbf9d8425074ddc51e4ab6a76d4`.
A composição de ensaio `f7ee70136251631edf7fe29f1ec8f8496f37acd4` foi instalada
em [homologação](https://dat.ernandescosta.me/login), em 14/11 às 12h07 UTC.
Inclui explicitamente #668, #672, #702, #704 e #705 sobre essa main. A branch
`chore/issue-686-integration-20261114` serve para ensaio identificado. Os PRs
originais seguem com revisão e incorporação próprias.

| Serviço  | Imagem instalada                 | ID AMD64                                                                  |
| -------- | -------------------------------- | ------------------------------------------------------------------------- |
| Backend  | `cav/hml-backend:qa686-f7ee701`  | `sha256:88b53eded9ace87332dc9a8fc76d3b60c1ceaa211397617ea308c7ec122ac340` |
| Frontend | `cav/hml-frontend:qa686-f7ee701` | `sha256:80d162dba04707914c326deb246edba5f4b612704b879b6ff15497bde1423d51` |

A página entrega `/assets/index-DvRIV1l-.js`, cujo SHA-256 é
`e7560a713b53b5827fbc3dad54cc0b72cc919015e9d33ff6c45993e5c7ba2ff2`.
Página, módulo e readiness responderam 200 com certificado validado.
`GET /api/auth/providers` respondeu `googleEnabled=true`.

A release publicada segue `v0.4.0`. O draft `v0.5.0` acompanha a próxima
publicação. Essas imagens de candidato foram transferidas e verificadas por
hash para o ensaio. A publicação dos manifests GHCR versionados permanece na #686.

## Banco, segurança e recuperação

- Antes das migrations, o backup de 103020 bytes foi restaurado em banco
  temporário separado, com confirmação de 20 migrations e 13 tabelas de negócio.
  O backup foi preservado no servidor com acesso restrito.
- As duas migrations aditivas de pré-cadastro e seus índices foram revisadas e
  aplicadas. A hospedagem passou de 20 para 22 migrations.
- Backend, frontend e PostgreSQL ficaram saudáveis. O container do banco,
  configurações protegidas, Google e volumes foram conferidos durante a promoção.
- O rollback identifica as imagens e a configuração anteriores. O backup
  restaurado no mesmo host continua distinto da evidência de backup externo/PITR.
- As duas imagens AMD64 passaram no Trivy 0.76.1 com zero HIGH/CRITICAL e SBOM
  externo SPDX. A matriz de CI AMD64/ARM64 foi disparada separadamente para a
  fonte `f7ee701`, execução `43594096107`. Seu resultado deve ser conferido no SHA.
- A janela anterior de contas operacionais locais continuou expirada. O login
  administrativo local permanece disponível. Uma nova janela requer autorização
  e configuração próprias.
- O acesso Bastion temporário e a liberação de IP adicionados nesta tarefa foram
  removidos ao final da implantação.

A primeira transferência atingiu o limite escolhido de quatro minutos após
64 MiB. O prefixo transferido foi validado por SHA-256, a transferência foi
retomada e o arquivo completo foi verificado antes da importação das imagens.

## Testes executados e atribuição

| Escopo                | Resultado e fonte                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------- |
| Frontend completo     | 961 testes em 78 arquivos, fonte f7ee701, execução sequencial                             |
| Backend completo      | 521 testes, sendo 88 domínio, 141 aplicação e 292 integração, fonte f7ee701               |
| Serviços reais locais | 25 verificações de categorias/cadastro/Transporte com API e PostgreSQL descartável        |
| Reativação real local | 17 verificações de contrato, autorização, reset, revogação e auditoria com API/PostgreSQL |
| HTTPS hospedado       | 9 verificações de consulta e 15 de reativação, autenticadas com serviços TypeScript reais |
| Build e qualidade     | Lint/build frontend, build backend e scans das duas imagens AMD64 aprovados               |

As 25 verificações locais cobriram os três vínculos, idade mínima, confirmação,
placa inválida, possível duplicidade, veículo adicional, paginação, permissões,
sugestões com expiração/escopo, entrada/saída, relatórios e auditoria.
As 17 verificações de reativação cobriram senha antiga negada, token revogado,
credencial de uso único, troca obrigatória, no-store, estados de conflito e
negação aos perfis operacionais. A conta fictícia desse ensaio ficou inativa.

Os nove ensaios HTTPS verificaram autenticação administrativa, provedor Google,
catálogo de contas, catálogo de pré-cadastro, consulta de sugestões, doze contagens
com no máximo três requisições simultâneas, histórico, relatórios e auditoria.
As consultas preservaram os dados e as contas compartilhadas. Outros 15 ensaios
HTTPS exercitaram reativação Local/Google com contas fictícias dedicadas, senha
anterior negada, sessão revogada, credencial de uso único e troca obrigatória.
As contas desses ensaios ficaram inativas. A primeira execução do script
interrompeu no readback por usar um nome ausente da resposta de criação. O
script foi corrigido para o nome conhecido do próprio fixture e a execução
completa passou. A conta da primeira tentativa também permaneceu inativa.

Raíssa relatou sucesso em tablet físico/Narrador locais nos snapshots publicados
nos PRs. Esses relatos mantêm autoria e ambiente. As tarefas autenticadas da
nova interface HTTPS continuam pendentes. A ferramenta de controle do navegador
falhou na inicialização nesta revisão, inclusive após reinicialização do kernel.
Nenhuma nova observação visual foi atribuída a esses testes de serviço.

## Organização das branches e sequência

Foram usados merges regulares e pushes normais para organizar duas pilhas.

1. #668, fonte `f737bc7`, base main.
2. #672, fonte `7355da6`, base na branch do #668.
3. #702, fonte `2f208ba`, base main.
4. #704, fonte `c89d9ac`, base na branch do #702.
5. #705, fonte `320ff5b`, base na branch do #704.

As pilhas de reativação e operação são independentes. Cada PR depende de seus
critérios e checks atuais. A composição de ensaio permite validar antes da
incorporação. Os conflitos compartilhados foram resolvidos preservando
categorias/sugestões, ambas as rotas de condutores/auditoria e entradas do
changelog. Os arquivos resolvidos correspondem à composição local testada. No novo head
#705 passaram 85 testes em três arquivos, lint e build. No #672 atualizado
passaram 94 testes em cinco arquivos, lint e build. Essas suítes focadas têm
atribuição própria e incluem testes já exercitados na suíte da composição.

## Pendências e progresso

A matriz acadêmica mantém oito itens atendidos, sete parciais e dois pendentes,
11,5/17, aproximadamente 68% ±5 pontos. O lote de testes e a implantação
atualizam evidências de itens parciais. A métrica funcional provisória permanece
13/15 capacidades equivalentes, aproximadamente 87% ±8 pontos, conforme a
régua anterior. Ambas precisam de aceite do escopo e evidências restantes.

Prioridades atuais incluem a validação UI HTTPS dos cinco PRs, publicação e
promoção GHCR da próxima release, confirmação federada PDF #699, revisão de
correções #607/#613, persistência/API de papel #611 e os gates da Unidade 2.
Cobertura crítica/frontend, qualidade acadêmica, operação de observabilidade,
gestão protegida de containers, carga na nuvem e piloto continuam com critérios
pendentes. Backup externo, recuperação e renovação TLS seguem nos seus roteiros.
