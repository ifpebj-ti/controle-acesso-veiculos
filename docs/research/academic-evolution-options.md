# Possibilidades de evolução acadêmica

## Limite deste documento

Este repositório contém o **Projeto Integrador desenvolvido para as disciplinas atuais**. Ele não é, neste momento, um Trabalho de Conclusão de Curso (TCC), e este documento não altera seu escopo, cronograma ou critérios de avaliação.

Um eventual TCC deverá ser discutido posteriormente com professores e possível orientador. Tema, problema de pesquisa, método, autoria, uso do código, coleta de dados e necessidade de avaliação ética ou institucional ainda não foram definidos.

O conteúdo abaixo é apenas um mapa de possibilidades para apoiar essa conversa futura. Câmeras e inteligência artificial para reconhecimento assistido de placas fazem parte da evolução planejada do produto, mas continuam fora do MVP atual. Ainda será decidido com os professores se essa evolução também será objeto do TCC e qual será seu recorte científico.

## O que pertence a cada etapa

| Projeto Integrador atual | Possível trabalho futuro |
|---|---|
| Digitalizar e validar os fluxos veiculares priorizados | Formular uma pergunta de pesquisa original |
| Entregar software testável, seguro e documentado | Definir método científico e protocolo de avaliação |
| Atender às disciplinas e ao cliente dentro do escopo aprovado | Investigar uma evolução ou avaliar o sistema como estudo de caso |
| Usar dados fictícios ou formalmente autorizados | Obter todas as aprovações para experimentos e coleta de dados |
| Manter câmera, IA e cancela no roadmap futuro, fora do MVP | Definir com o orientador qual parte dessa evolução pode ser investigada no TCC |

O fato de o Projeto Integrador poder fornecer problema, conhecimento ou artefato para uma pesquisa futura não transforma automaticamente as entregas atuais em TCC. A forma de reutilização deve respeitar as regras do curso, a participação da equipe, a orientação acadêmica e a instituição.

## Perguntas para levar ao professor

Antes de escolher qualquer tema, a equipe deve confirmar:

1. O curso permite que um Projeto Integrador seja continuado ou utilizado como estudo de caso em TCC?
2. O TCC é individual ou em grupo, e como ficam autoria e contribuições já realizadas pela equipe?
3. O trabalho deve priorizar Engenharia de Software, visão computacional ou outra linha?
4. É esperado construir um novo artefato, avaliar o sistema existente ou realizar ambos?
5. Quais métodos de pesquisa são aceitos pelo curso?
6. Há exigência de projeto de pesquisa, cronograma, orientador e banca preliminar?
7. Testes com pessoas, dados operacionais ou imagens do campus exigem autorização institucional ou submissão ética?
8. Que evidência representa contribuição acadêmica suficiente, além da implementação do sistema?

As respostas devem ser registradas antes da definição do tema definitivo.

## Evolução futura do produto

Depois que o núcleo manual digital estiver seguro e validado, o produto poderá evoluir em etapas:

1. avaliar câmeras e reconhecimento de placas com datasets licenciados, sem integrar à operação;
2. testar captura em ambiente controlado, com autorizações e regras de retenção definidas;
3. integrar o reconhecedor em modo de observação, sem afetar decisões de acesso;
4. apresentar a placa sugerida para confirmação, correção ou rejeição pelo operador;
5. avaliar integrações físicas somente após nova análise institucional, técnica e de risco.

Essa sequência faz parte da visão futura do produto. Ela evita que o sistema dependa de uma tecnologia ainda não avaliada e permite aprender com segurança. Cronograma, equipamento, fornecedor, coleta de imagens e critérios de avanço ainda precisarão de issues e validações próprias.

## Possíveis caminhos de TCC, ainda não escolhidos

### Opção A — Engenharia de Software e evolução arquitetural

Investigar como uma arquitetura modular permite que um sistema de controle veicular evolua sem acoplar seu núcleo a dispositivos, fornecedores ou modelos de inteligência artificial.

Possíveis evidências: decisões arquiteturais, métricas de qualidade, testes de substituição do componente e avaliação de manutenibilidade.

### Opção B — Qualidade, segurança e operação

Avaliar como autenticação, autorização, auditoria, contingência e observabilidade influenciam a confiabilidade do fluxo digital em comparação com o processo em papel.

Possíveis evidências: tempo do processo, erros de registro, rastreabilidade, disponibilidade e testes dos fluxos críticos.

### Opção C — Reconhecimento assistido de placas

Avaliar, em ambiente controlado, se uma sugestão de placa produzida por visão computacional pode apoiar o operador sem tomar automaticamente a decisão de acesso.

Possíveis evidências: reconhecimento exato, latência, taxa de rejeição, correção humana e variação por iluminação, ângulo, tipo de veículo e layout da placa.

### Opção D — Estudo de processo e experiência do usuário

Investigar o efeito da digitalização no trabalho da portaria e no Setor de Transporte, preservando o fluxo manual de contingência.

Possíveis evidências: tempo de atendimento, retrabalho, registros incompletos e percepção dos usuários, desde que o protocolo seja aprovado.

Essas opções podem ser combinadas somente se o recorte continuar viável. Construir o produto inteiro, treinar um modelo, instalar câmeras e avaliar usuários no mesmo TCC tende a produzir um escopo excessivo.

## Como escolher com segurança

Depois da conversa com o professor, cada opção pode ser comparada por:

- aderência à linha de pesquisa e às regras do curso;
- contribuição acadêmica esperada;
- acesso a orientação e conhecimento técnico;
- prazo disponível;
- equipamentos e dados permitidos;
- riscos de privacidade e segurança;
- possibilidade de produzir resultados mesmo sem implantação no campus;
- separação clara entre desenvolvimento do produto e experimento científico.

A alternativa escolhida deve resultar em problema, objetivo e método específicos. O tema não deve ser fechado apenas porque uma tecnologia parece interessante.

## Referência exploratória para reconhecimento de placas

Caso o professor considere a Opção C adequada, a primeira etapa recomendada é um estudo offline, separado do sistema operacional e sem imagens do campus.

Dois conjuntos acadêmicos brasileiros podem apoiar a revisão inicial:

- [RodoSol-ALPR](https://github.com/raysonlaroca/rodosol-alpr-dataset): imagens de pedágio, incluindo placas brasileiras antigas e Mercosul, com licença acadêmica e não comercial;
- [UFPR-ALPR](https://github.com/raysonlaroca/ufpr-alpr-dataset): base histórica de carros e motocicletas, também sujeita a licença acadêmica e não comercial.

Resultados nessas bases não comprovam desempenho na portaria. Câmera, ângulo, iluminação, velocidade e população de veículos mudam entre contextos. Uma pesquisa futura precisaria declarar essas limitações e evitar que imagens ou datasets restritos fossem versionados no repositório.

Se a pesquisa evoluir para um protótipo, a arquitetura mais prudente seria manter o reconhecedor como serviço experimental desacoplado. Ele enviaria placa sugerida, confiança e metadados técnicos; o operador poderia confirmar, corrigir ou rejeitar. Falha ou baixa confiança manteriam o fluxo manual. Isso é uma hipótese de arquitetura, não uma decisão do projeto atual.

## Privacidade e autorizações

Placa, pessoa, horário, imagem e histórico podem permitir identificar pessoas e rotinas. Por isso, qualquer pesquisa futura deve adotar uma interpretação conservadora da [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) e consultar os responsáveis competentes.

Nenhuma coleta local deve começar sem definição documentada de finalidade, necessidade, acesso, retenção, descarte e autorizações aplicáveis. Este documento não determina base legal, prazo de retenção nem necessidade de comitê de ética.

## Próximo passo real

O próximo passo acadêmico não é definir o TCC por conta própria. É preparar uma conversa com o professor usando as perguntas e opções acima. Enquanto o MVP atual é concluído e a evolução futura é planejada:

- o backlog do Projeto Integrador permanece focado no MVP aprovado, e câmera/IA ficam no roadmap futuro;
- a documentação futura fica identificada como exploratória;
- não são coletadas imagens nem adquiridos equipamentos;
- não é prometido tema, método ou resultado de TCC;
- decisões do produto continuam sendo validadas com equipe, cliente e professores.

Após essa conversa, este documento deve registrar a decisão acadêmica: continuar uma das opções, reformular o recorte ou desenvolver a evolução de câmera/IA sem vinculá-la ao TCC.

## Referências iniciais

- Peffers et al. [A Design Science Research Methodology for Information Systems Research](https://doi.org/10.2753/MIS0742-1222240302) — referência metodológica a avaliar com o orientador, não método já escolhido.
- Laroca et al. [On the Cross-dataset Generalization in License Plate Recognition](https://doi.org/10.5220/0010846800003124).
- Laroca et al. [A Robust Real-Time Automatic License Plate Recognition Based on the YOLO Detector](https://doi.org/10.1109/IJCNN.2018.8489629).
- NIST. [Artificial Intelligence Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework).
