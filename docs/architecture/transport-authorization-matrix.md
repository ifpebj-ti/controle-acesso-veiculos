# Permissões do Transporte — candidato #693

## Decisão de 12/11/2026

José autorizou o Setor de Transporte nas funções de negócio do Administrador.
A concessão de acesso e o gerenciamento de contas continuam sob responsabilidade
do Administrador, incluindo perfis, credenciais, desativação e reativação.
A política `ManageUsers` protege todas essas operações no servidor.

## Matriz da API candidata

| Função                                                          | Porteiro e Vigilante       | Transporte           | Administrador |
| --------------------------------------------------------------- | -------------------------- | -------------------- | ------------- |
| Registrar entrada, saída e encerramento excepcional justificado | Sim                        | Sim                  | Sim           |
| Consultar acessos e resumo operacional                          | Sim                        | Sim                  | Sim           |
| Correção descritiva vigente com auditoria                       | Sim                        | Sim                  | Sim           |
| Consultar catálogos da frota, motoristas e eventos              | Sim                        | Sim                  | Sim           |
| Manter frota, motoristas, eventos e pré-cadastros               | Não                        | Sim                  | Sim           |
| Consultar utilizações e relatórios administrativos              | Conforme fluxo operacional | Sim                  | Sim           |
| Consultar trilha de auditoria                                   | Não                        | Sim                  | Sim           |
| Criar ou gerenciar contas, perfis e credenciais                 | Não                        | Não                  | Sim           |
| Exportar PDF com confirmação de senha local válida              | Não                        | Conta local elegível | Sim           |
| Exportar PDF pela conta Google                                  | Não                        | Pendente #699        | Não se aplica |

O pré-cadastro depende do #695. O fluxo novo de proposta e revisão de correção
continua nos candidatos #607/#613. A matriz descreve permissões da API desta
composição e exige integração dos controles de navegação e ações do frontend.

## Confirmação da exportação

A API mantém confirmação de senha local válida e auditoria da exportação.
A habilitação de uma política de papel não substitui essa confirmação.
O vínculo Google remove a senha local conforme a política existente.
A conta Transporte Google pode consultar relatórios e fica impedida de confirmar
exportação com a senha antiga. A #699 acompanha a confirmação federada.

## Evidência e integração

Testes usam contas fictícias e PostgreSQL descartável. Exercitam operações de
Transporte, negação de gestão de contas e credenciais, confirmação inválida de
PDF e uso de senha anterior após vínculo Google. A suíte conjunta com cadastro
é registrada no PR com seu SHA e resultado.

A promoção exige coordenar o frontend com a API candidata e conferir os fluxos
com os quatro perfis. A hospedagem mantém a composição identificada no runbook
até a implantação de uma versão revisada.
