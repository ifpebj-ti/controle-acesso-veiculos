# Pré-cadastro veicular e sugestões — Issue #689

## Estado e cronologia

A prévia 58f181b continha somente nome/classificação, por escolha inicial de
Raíssa. O roteiro posterior de José em 12/11 confirmou o contrato ampliado de
condutores de veículos automotores, já incorporado em main 8b61ccd (#696 → #695
→ #700). A branch recebeu main por merge regular, preservando o histórico.
Os 704 testes e ensaios daquele protótipo continuam pertencendo ao 58f181b;
não comprovam os fluxos novos.

Este incremento usa exclusivamente o contrato de
[`campus-driver-registry-contract.md`](../../../docs/development/campus-driver-registry-contract.md).
Não altera backend, banco, migrations, autenticação, infraestrutura ou API.
Não há prova de implantação ou homologação pelo fato de o backend estar na main.

## Cadastro e gestão

- `/condutores-vinculados` fica no menu de Administrador e Transporte. Os demais
  perfis não iniciam consultas nessa tela; o servidor continua autorizando cada
  requisição. Pessoas cadastradas não recebem conta ou perfil de login.
- Nome, vínculo, nascimento confirmado, placa completa e tipo são enviados a
  `POST /campus-drivers`. Federal aparece como **Servidor federal**, preservando
  a chave `Federal`. Categoria de acesso continua independente (#688).
- A idade é decidida pelo servidor na data institucional; o cliente não calcula
  outro corte. A interface explica os 18 anos, a conferência do responsável e
  que maioridade não comprova CNH nem autoriza entrada. Não há CPF/CNH/foto/upload.
- Somente 409 com `errors.possibleDuplicate` exibe a confirmação adicional de
  homônimo. O responsável consulta o cadastro e confirma conscientemente outra
  pessoa; mudar os campos invalida esse consentimento. Outros conflitos não
  oferecem essa exceção. Nenhuma pessoa é mesclada por nome.
- Outro veículo usa `POST /campus-drivers/{personId}/vehicles`, mantendo a pessoa.
  Desativar usa o endpoint próprio e não exclui histórico/conta. Inativos não têm
  ações de associação ou reativação. Não há edição de nascimento/importação.
- Consulta usa somente query/page/pageSize/includeInactive. Total é de vínculos
  pessoa–veículo, não de pessoas distintas. Página inválida após redução do total
  é ajustada, preservando filtros. Não há filtro de vínculo inventado no GET.
- Respostas são validadas estritamente; listagem/criação não aceitam nascimento,
  documento ou propriedades desconhecidas. Falha de contrato não vira falha de rede.

## Escrita e resultado incerto

As três mutações têm guarda contra envio concorrente e `skipSessionRetry:true`.
Não existe retry automático. 400 mantém os campos e identifica a validação;
401/403/404/409/429 são tratados conforme o contrato. Somente o conflito de
possível homônimo permite a confirmação descrita acima.

Perda de resposta, CanceledError, AbortError, 5xx e resposta incompatível podem
ocorrer após envio: bloqueiam novas mutações e oferecem consulta somente por
leitura. Uma lista vazia/registro parecido não prova rollback ou o sucesso exato
quando há homônimos. A consulta não desbloqueia automaticamente o envio nem
anuncia confirmação. O contrato não oferece requestKey para este cadastro;
conferência responsável continua necessária antes de nova intenção. Nenhuma
chave/endpoint de reconciliação foi inventado.

Nascimento e campos de criação permanecem só na memória do formulário e saem ao
fechar, concluir ou encerrar/trocar sessão. O controlador não guarda nascimento
para reconciliação, não envia em GET/URL e não faz log do corpo da requisição.
Aviso de privacidade, finalidade/base legal e retenção ainda exigem revisão
institucional conforme o contrato/threat model já documentados pelo backend.

## Busca existente na entrada

O autocomplete existente foi adaptado para `/access-records/entry-suggestions`
(3–80 caracteres, até dez itens), sem criar outro controle ou remover a rota
legada de compatibilidade. Fontes CampusRegistration/SameDayVisit aparecem com
rótulos compreensíveis. Uma placa pode mostrar vários condutores.

Selecionar prepara pessoa/veículo e objetivo anterior editável; não cria acesso.
É necessário confirmar quem dirige agora e confirmar ou alterar o objetivo. A
associação anterior de evento é limpa. `hasOpenAccess` orienta conferir o acesso
existente e impede a submissão pela seleção, sem alterar a proteção do servidor.

A expiração diária da API invalida resultados/seleção, sem consulta automática.
A tela é remontada ao trocar usuário/perfil ou mudar o dia institucional,
limpando os campos. Timers e retorno da aba/janela tratam retomada após suspensão;
respostas atrasadas e cancelamentos de busca são descartados.

O relógio visual usa a configuração publicada America/Recife, com conversão por
Intl; não é uma janela móvel de 24 horas. Se a configuração institucional mudar,
este limite visual deverá receber a configuração canônica antes da promoção.
O backend sempre revalida estado/dia na submissão. Não há cache de dados pessoais
em localStorage/sessionStorage ou token novo no navegador.

## Validação e evidências

Testes de serviço, hook, componentes, página, navegação e entrada cobrem contrato,
perfis, homônimos, veículos, erros/incerteza, idade recusada pelo servidor simulado,
expiração, troca de conta e limpeza, seleção e objetivo. Esses testes não são
ensaio de banco/autorizações reais. Resultados finais são registrados no PR com SHA.

A prévia `http://localhost:5222/` (tablet: `http://192.168.1.82:5222/`) usa contexto
fictício e adaptador Axios controlado no harness fora do repositório. `/entrada`
exercita o formulário com o mesmo transporte fictício. Não autentica, não acessa
API/banco e não persiste dados; recarregar apaga a simulação. A antiga porta 5221
permanece sendo a prévia histórica de dois campos, não o incremento integrado.

Oito casos Brave 157.0.8103.79 passaram em 390×844, 768×1024, 1440×1000 e 720×500,
Claro/Escuro. Incluem cadastro, vínculo sem repetir pessoa, leitura/filtragem e
sem overflow. Mais sete cenários controlados passaram: idade recusada, homônimo,
resposta perdida, resposta inválida, negações, paginação/desativação e confirmação
da entrada. São ensaios de UI com transporte simulado, não API HTTPS real.

Também passaram quatro varreduras axe em 390/1440 px, Claro/Escuro, sem achados
sérios/críticos. Uma divergência entre rótulo visível e nome acessível de
“Vincular outro veículo” foi corrigida e a varredura foi repetida. Dois ensaios
automatizados em Brave com zoom nativo de 200% confirmaram viewport de 1424 para
712 CSS px, DPR de 1 para 2 e CSS zoom 1, teclado/seleção/foco/sem overflow.
Não constituem Narrador ou tablet físico.

Ainda faltam candidato HTTPS identificado, auditoria integrada, tablet físico,
Narrador e revisão institucional de privacidade. Dados fictícios, scripts, logs,
capturas e perfis de navegador ficam no TEMP, fora do Git. Manter draft/Refs #689.
