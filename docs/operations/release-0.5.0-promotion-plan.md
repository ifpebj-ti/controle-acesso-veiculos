# Preparação e promoção da versão 0.5.0

Rastreabilidade #713/#686. Preparação em 17/11/2026, com main de referência
1801e0b. A composição final será conferida no head revisado do PR #754.

## Composição e publicação

A fonte de preparação contém Google, gestão de contas, reativação, pré-cadastro,
navegação do Transporte, contrato status=all, backend de papel e as correções
incorporadas desde 0.4.0. O changelog datado deve conter somente o lote escolhido.
Os PRs #751/#752, as dependências #738/#739 e a correção de testes #757
estão incorporados e integram o changelog da versão. O provider OCI #742
continua separado, conforme sua prontidão. Conferir o lote escolhido no
fechamento da versão, preservando revisão técnica e aceite institucional.

O merge da branch de preparação nomeada chore/issue-713-release-v0.5.0 aciona
o workflow existente, que confere a fonte incorporada, cria a tag imutável e
dispara a publicação condicionada aos gates. Registrar SHA final, versão,
digests dos manifests e imagens por arquitetura, resultados do scanner e SBOMs
externos. Atualizar as referências de instalação depois da publicação verificada.

## Transição de banco

A última hospedagem identificada usa frontend 67ad6b8 e backend f7ee701, com
22 migrations. A main acrescenta 20261114132630_AddPaperReconciliation.
Sua operação Up cria incidentes_contingencia e reconciliacoes_contingencia,
com índices, referências e restrições de integridade. A inspeção da migration
não encontrou remoção de tabelas ou alteração de colunas existentes no Up.
A operação Down remove as duas tabelas e pode perder a evidência transcrita.

Antes da mudança persistente, obter backup protegido do PostgreSQL e do key ring,
conferir restauração em destino isolado e identificar o estado aplicado real.
Gerar e revisar o SQL com os artefatos da tag final. Aplicar pelo caminho
administrativo já previsto no runbook, uma única vez. Conferir as migrations e
as restrições no destino antes de iniciar a API que consulta essas tabelas.
A suíte com PostgreSQL descartável valida o schema de 23 migrations, mas o
exercício de recuperação e a verificação da VM pertencem à promoção.

## Configuração e verificações da aplicação

Usar o Compose de produção e os arquivos protegidos existentes, preservando
Google OIDC, callback HTTPS, cookies, proxy, WAF, key ring e limites de teste
realmente vigentes. Conferir a identidade das imagens e o horário da promoção.

Executar os seguintes cenários na versão instalada.

- HTTPS confiável, readiness e frontend respondendo pelo hostname.
- Provedor Google habilitado, login com titular autorizado e recarga normal.
- Acesso administrativo local, sessão, renovação e logout.
- Contas e permissões exclusivas do Administrador, com negação para Transporte.
- Consulta de pré-cadastro, eventos e relatórios conforme os PRs incorporados.
- Todos com status=all incluindo cancelados, quando #751 fizer parte da versão.
- Datas compartilhadas e demais filtros por relatório, se #752 estiver incorporado.
- Redirects, headers, recursos estáticos ausentes e cache previstos na #725.

Registrar os resultados com fonte, horário, perfil e códigos sanitizados.
Identidades, senhas, cookies e parâmetros OAuth ficam nos canais protegidos.
A UI de papel #712 e a confirmação PDF Google #699 conservam suas pendências.

## Recuperação e cadência

Manter as imagens e configurações anteriores identificadas e disponíveis.
Em regressão, decidir pela recuperação da aplicação ou pela restauração do
conjunto consistente, considerando transcrições criadas após a migração.
Reverter uma imagem com as tabelas aditivas presentes exige conferir o
comportamento da versão anterior. Evitar execução do Down como rotina de
rollback, pois ele elimina as tabelas da contingência.

A publicação de 0.5.0 permite entregar correções compatíveis seguintes em
0.5.1, 0.5.2 e assim por diante. Cada lote deve registrar changelog, fonte,
imagens e resultado da promoção. A preparação desta versão segue a
[cadência de releases](release-cadence.md) e o
[runbook de implantação](versioned-container-deployment.md).
