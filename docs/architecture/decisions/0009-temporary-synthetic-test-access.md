# ADR 0009 — Acesso temporário de contas fictícias na homologação

- Data: 03/11/2026. Rastreabilidade: #612.
- Estado: exceção de teste autorizada por José; implementação candidata.
- A política definitiva de operadores reais continua Google pré-autorizado.

## Contexto

José pediu que professores testem os perfis com as contas fictícias já existentes,
sem depender de três identidades Google. A API hospedada recusou os três logins
locais operacionais e aceitou Administrador, conforme a política atual. Não há
evidência de senha incorreta nesses três casos: o bloqueio de método ocorre antes
da verificação da senha. Mostrar o formulário não altera essa autorização.

## Decisão e fronteira

Adicionar concessão opcional e desabilitada por padrão, limitada a três contas
exatas do domínio reservado `example.test`, perfis operacionais existentes e prazo
UTC futuro de até sete dias. Ativação somente em ambientes explicitamente
Homologation/Testing/Development. Production recusa essa configuração.

A validação usa o endereço da conta encontrada, o perfil atual e o relógio do
servidor. Uma identidade Google continua sem senha local. Contas inativas, perfil
inativo, bloqueio por tentativas e senha inválida não são contornados. A lista
configurada é copiada para estrutura imutável. Não existe wildcard, novo endpoint,
perfil adicional, concessão por domínio institucional ou bypass de auditoria.

O limite absoluto da sessão de teste não ultrapassa o prazo. Renovação após esse
limite é recusada pelo mecanismo existente. JWTs já emitidos conservam a validade
curta configurada: desativar uma flag não equivale a revogá-los instantaneamente.
Encerramento antecipado envolve revogar sessões e respeitar essa janela residual.

## Riscos e condições de ativação

É uma exceção intencional de autenticação para ensaio, não uma forma operacional
definitiva de login. Endereços e credenciais de teste devem ser enviados somente
por canal privado; o endereço do site pode ser divulgado sem senha.

Alterar o nome de ambiente do host exige revisar configuração efetiva. Em
Homologation, cookies permanecem Secure e o bloco de desenvolvimento não é
ativado. O nome não comprova isolamento de infraestrutura ou ausência de dados
reais por si só. A equipe deve confirmar que está operando a VM de testes correta.

Usar configuração separada, imagem identificada, rollback e testes HTTPS dos
quatro perfis antes da divulgação. Preservar o callback #599. Não desabilitar
Google, WAF, limites de login ou a autorização dos endpoints para viabilizar o
ensaio. Falhas de autenticação não devem expor se uma conta está na lista.

## Verificação e retirada

Testes cobrem lista exata, domínio reservado, ambiente, limites de configuração,
prazo, perfil, senha errada, bloqueio e proibição de endpoints administrativos para
os operadores. O ensaio hospedado deve confirmar o contrato e os cookies no
ambiente efetivo; teste unitário não substitui essa evidência.

No fim, desabilitar a opção, revogar famílias de teste quando necessário e
preservar auditoria. A configuração vencida deixa de conceder login sem impedir
o startup normal da aplicação. O [runbook](../../operations/temporary-professor-test-access.md)
descreve os limites e a ativação. Não publicar dados reais de titulares neste ADR.
