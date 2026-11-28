# Preparação do candidato Google — 02/11/2026

**Rastreabilidade:** #448, #311 e #576. **Main de referência:** `0e7be77`.<br>
**Hospedagem observada:** frontend/backend `0.4.0`, PostgreSQL `16-alpine`.

## Evidências confirmadas

| Verificação                    | Resultado                                                             |
| ------------------------------ | --------------------------------------------------------------------- |
| VM e Bastion                   | RUNNING e ACTIVE pela API OCI                                         |
| Saúde dos três contêineres     | healthy na inspeção SSH                                               |
| API pública                    | readiness 200; `googleEnabled=false`                                  |
| Configuração em uso            | preservada, com ambiente restrito em modo 0600                        |
| Candidato                      | diretório separado; quatro segredos com proprietário root e modo 0600 |
| Rollback de configuração       | cópias restritas de ambiente, Compose e ajuste de proxy               |
| Modelo Compose candidato       | `config --quiet` passou com versão fictícia apenas no processo        |
| Versão persistida do candidato | vazia intencionalmente; nenhuma imagem escolhida ou ativada           |

Os três segredos já usados pelo runtime foram preservados, sem rotação
incidental; o segredo OAuth foi transmitido pelo canal SSH autenticado e ficou
fora do repositório. Nenhum valor, endereço de titular ou identificador de nuvem
compõe esta evidência pública. A montagem de chaves persistentes continua sendo
um requisito da promoção, não algo comprovado por validar o YAML.

## Snapshot e restauração isolada

Em **02/11/2026 às 13:52 UTC**, foi gerado um dump lógico custom do banco de
homologação em diretório restrito da VM, com arquivo em modo 0600. A estrutura
foi conferida com `pg_restore --list`; tamanho e SHA-256 ficaram no manifesto
restrito, sem publicar o dump.

O dump foi restaurado com falha explícita e transação única em banco temporário
de nome aleatório. Foram confirmadas as tabelas essenciais de pessoas, acessos
e auditoria, **20 migrations** e **13 tabelas da aplicação**. O banco temporário
foi removido ao final. O banco em uso não foi substituído, e não houve promoção
de imagem ou aplicação de migrations no banco operacional.

O intervalo medido de geração/verificação/restauração local foi de cerca de
1 segundo. **Isso não é o RTO institucional**: não inclui perda da VM, acesso a
backup externo, recuperação de chaves, provisionamento ou aceite dos usuários.
O exercício ocorreu no mesmo host e mecanismo PostgreSQL.

Esse snapshot é uma salvaguarda pontual para o ensaio da homologação. Não
implementa armazenamento externo, retenção gerenciada, criptografia de objeto
com chave institucional, agendamento, alertas ou restauração após perda total
do host. A #311 permanece aberta. A cópia do ambiente de rollback contém
configuração sensível e deve permanecer restrita; não é artefato para o GitHub.

## Ordem pendente para o Google real

1. Sincronizar e revisar os candidatos #474/#494 com a main que contém #570;
   registrar os SHAs e os checks correspondentes.
2. Construir/obter imagens compatíveis, identificadas e verificadas; selecionar
   a versão do candidato sem sobrescrever a 0.4.0.
3. Conferir persistência das chaves, callback, cliente OAuth efetivo, saúde,
   acesso Administrador e conjunto completo de rollback; combinar a janela
   para não surpreender os testes locais legados do professor.
4. Ativar o backend candidato compatível e confirmar o provedor habilitado.
5. Pré-autorizar pela API as identidades consentidas, conferindo método Google.
   Não criar contas locais por engano nem atribuir acesso pelo domínio.
6. Observar sucesso autorizado, negação de identidade sem autorização local,
   perfil, renovação, logout e acesso administrativo de contingência.

Até essa execução, cliente cadastrado, segredo preparado, testes offline e
snapshot restaurado não comprovam login Google real ou homologação institucional.

## Fontes

- [Configuração e ensaio OIDC](../operations/google-oidc-setup.md).
- [Implantação versionada e rollback](../operations/versioned-container-deployment.md).
- [Retenção e continuidade](../operations/data-retention-and-continuity.md).
- [Backup OCI ainda sujeito a homologação](../../infrastructure/oci/backup/README.md).
