# Pré-cadastro veicular e sugestões de retorno — candidato #690

## Decisão e escopo

José autorizou em 12/11/2026 os campos e o fluxo ligados à #689. Federal significa
**servidor federal**, preservando a chave canônica `Federal`; outros vínculos são
`Aluno` e `Terceirizado`. Não é criação de conta Google/local, matrícula no campus,
cadastro de pedestre ou autorização de motorista da frota institucional.

O backend reutiliza `Pessoa`, `Veiculo` e `PessoaVeiculo`. Acrescenta à pessoa
nascimento, estado do pré-cadastro, responsável e instante da conferência; os
campos novos são opcionais para dados antigos e o estado inicial é falso. Não
transformar automaticamente todo visitante histórico em pessoa vinculada.

## Campos e maioridade

Nome completo, vínculo, nascimento confirmado, placa completa e tipo do veículo
são obrigatórios. Não exigir CPF, CNH, foto, e-mail, telefone ou consulta externa.
O responsável confere a informação com a pessoa/documento apropriado e confirma
`birthDateConfirmed`; isso é uma declaração auditável do responsável, não uma
verificação documental automática. Não registrar cópia do documento neste recorte.

O pré-cadastro **como condutor de veículo automotor** exige 18 anos completos no
dia de `Institution:TimeZoneId` (atualmente America/Recife). Data futura, ausente
ou insuficiente é rejeitada antes de persistir. O corte por aniversário trata
29/02 como 01/03 em ano não bissexto; é a regra técnica conservadora testada, não
uma declaração de interpretação jurídica para todos os casos.

Um aluno menor pode entrar como passageiro. O sistema não está proibindo sua
presença no campus. Maioridade **não comprova habilitação**, posse do veículo ou
autorização de entrada; não verificar CNH automaticamente não autoriza ignorar
uma irregularidade conhecida. A portaria continua conferindo a pessoa real.

## Contrato novo, ainda não implantado

### `POST /campus-drivers`

Somente Transporte e Administrador:

```json
{
  "name": "Pessoa Fictícia",
  "affiliation": "Federal",
  "birthDate": "1990-01-01",
  "birthDateConfirmed": true,
  "plate": "ABC1D23",
  "vehicleType": "Automóvel",
  "confirmPossibleDuplicate": false
}
```

201 devolve `personId`, `vehicleId`, `name`, `affiliation`, `plate`, `vehicleType`,
`active` e `verifiedAtUtc`. Não devolve nascimento/documento. 400 identifica o
campo inválido; 409 indica possível duplicidade, veículo incompatível ou conflito
concorrente. Ausência de sessão é 401; perfil sem permissão é 403.

Nome e nascimento coincidentes não são identidade comprovada: o servidor não
mescla pessoas por esses campos. Diante de possível duplicidade, consultar a
pessoa existente. Somente após conferência consciente, o responsável pode
confirmar que se trata de homônimo por `confirmPossibleDuplicate=true`.
O vínculo adicional deve usar o ID existente, não repetir o cadastro da pessoa.

Uma placa pode estar ligada a mais de um condutor. Veículo particular existente
é reutilizado se estiver ativo e seu tipo for compatível; não sobrescrever o
veículo nem alterar a frota institucional. Cadastro, vínculo e auditoria são
transacionais. A auditoria não guarda nascimento, documento ou corpo da requisição.

### Gestão do cadastro

- `GET /campus-drivers?query=...&page=1&pageSize=25&includeInactive=false`:
  consulta paginada por nome/placa, máximo 100 por página, resposta no-store.
  Cada linha representa um vínculo pessoa–veículo; totalCount é de vínculos.
- `POST /campus-drivers/{personId}/vehicles`: corpo `plate`/`vehicleType`, 201.
  Acrescenta veículo à mesma pessoa, sem criar outra identidade.
- `POST /campus-drivers/{personId}/deactivate`: 204. Retira o pré-cadastro das
  sugestões, sem apagar pessoa, usuário, veículo, auditoria ou histórico.
  Não desativa uma eventual conta de login da pessoa.

As três operações também são exclusivas de Transporte/Administrador.
A alteração de dados de nascimento, reativação e importação em massa não têm
endpoint neste recorte: exigem política e auditoria próprias.

### `GET /access-records/entry-suggestions?query=ABC`

Operadores autorizados, busca de 3 a 80 caracteres, no máximo dez itens:

- `CampusRegistration`: vínculo previamente conferido, ativo e adulto, sem
  depender de visita anterior. Pode sugerir pessoas em dias seguintes.
- `SameDayVisit`: pessoa/veículo de acesso registrado **pelo próprio operador no
  dia institucional atual**, com expiração na próxima meia-noite local. Não é
  janela móvel de 24 horas, cache de navegador ou compartilhamento entre contas.

Itens devolvem IDs, placa, nome, tipo do veículo, fonte, vínculo quando existente,
objetivo anterior do próprio operador naquele dia, aviso de acesso já aberto e
expiração da sugestão diária. Não expõem nascimento, CPF, documento, telefone,
e-mail ou autorização de evento. Banco e histórico continuam preservados após a
expiração; apenas a conveniência de reutilização diária deixa de aparecer.

A busca recorrente antiga `/entry-candidates` permanece por compatibilidade;
a interface nova deve usar `/entry-suggestions`. Cadastros conferidos e depois
desativados são excluídos também da busca antiga e da seleção por IDs. A data
de início de novos vínculos passa a usar o dia institucional, não o dia UTC.

## Fluxo esperado na interface de Raíssa

1. Digitar placa/nome e exibir a fonte da sugestão e pessoas possíveis.
2. Confirmar **quem está dirigindo agora**; placa igual não comprova condutor.
3. Mostrar o objetivo anterior como sugestão editável: confirmar ou trocar.
4. Registrar nova entrada com confirmação explícita e horário novo. Não copiar
   evento anterior, criar movimento ao selecionar item ou autorizar cancela.
5. Se já houver acesso aberto, orientar sua conferência; o servidor mantém a
   proteção contra duplicação de acesso aberto.
6. Limpar formulário/resultados ao sair, trocar conta ou ultrapassar o dia local;
   descartar respostas antigas de buscas concorrentes. Sem dados pessoais em
   localStorage/sessionStorage. O backend reavalia estado ao confirmar.

Categoria de acesso continua independente do vínculo. A #688 amplia seu
catálogo, mas não obriga uma nova pergunta Sim/Não nem libera entrada por perfil.

## Migração, proteção e limites

Migrations aditivas, restrição de completude do cadastro ativo e índice para
busca diária. Não aplicar automaticamente na hospedagem. Testes usam banco
PostgreSQL descartável com migrations reais. Uma falha na gravação da auditoria
foi injetada e a transação preservou o banco sem pessoa/veículo órfãos.

API e contratos candidatos não significam tela integrada, deploy ou novo aceite
institucional. Antes de dados reais, atualizar aviso de privacidade e revisar
finalidade, base legal e retenção do nascimento com o responsável institucional;
a retenção do histórico operacional não define automaticamente a retenção de
todos os campos do cadastro. Dados pessoais não entram em logs/artefatos.

Referências: [CTB](https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm),
[princípio da necessidade](https://www2.cnmp.mp.br/portal/transparencia/lei-geral-de-protecao-de-dados-pessoais-lgpd/a-lgpd/fundamentos-e-principios),
[ANPD — dados de crianças/adolescentes](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes),
[Envoy — visitantes recorrentes](https://envoy.help/en/articles/5670344-returning-visitors)
e [Verkada — controle veicular](https://www.verkada.com/solutions/vehicle-access-control/).
As referências de produto inspiram pré-preenchimento e conferência, não comprovam
os controles deste projeto nem justificam biometria/abertura automática.
