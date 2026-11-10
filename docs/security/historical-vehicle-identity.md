# Identidade de veículos com histórico

Como contenção, o catálogo recusa alterações de placa ou identificação interna
quando o veículo já possui acesso ou utilização institucional, inclusive
encerrados. O endpoint retorna 409 com orientação; atualizações descritivas e
identidade de veículo ainda sem vínculos continuam permitidas.

A verificação ocorre na transação existente, depois do bloqueio da linha do
veículo. Uma recusa não altera o cadastro nem registra uma alteração bem-sucedida.
O objetivo é impedir que uma edição do catálogo reescreva a identificação
exibida no histórico, relatórios e PDFs que ainda consultam esse cadastro.

Esta contenção não representa um snapshot completo e não recupera valores
históricos já alterados. Também não congela nomes de pessoas, tipo do veículo
ou todos os atributos descritivos. A evolução deve armazenar o fato observado
por registro/utilização e definir correção auditada e backfill com origem
conhecida. Não se deve editar diretamente o banco para contornar o conflito.

Os testes usam dados sintéticos e vínculos encerrados de ambos os fluxos.
Implantação, verificação concorrente sob carga e reteste hospedado são etapas
separadas; não há migration nem alteração dos dados compartilhados neste PR.
