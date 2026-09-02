# Instruções para frontend, UX e acessibilidade

## Escopo

- Este arquivo complementa o `AGENTS.md` da raiz para todo trabalho em `src/frontend`.
- A responsabilidade principal de Raíssa é frontend, UX, IHC e acessibilidade. Não altere backend, infraestrutura ou contratos de API silenciosamente para viabilizar uma tela.
- Antes de implementar, consulte `src/frontend/README.md`, os contratos reais disponíveis, a documentação de segurança e as páginas relevantes da Wiki.

## Arquitetura e código

- Use React, TypeScript e a estrutura existente do projeto. Preserve a separação entre domínio/feature, apresentação, serviços, hooks e utilitários.
- Componentes visuais não devem concentrar regras de negócio nem chamadas HTTP. Coloque integração e estado no limite apropriado da feature.
- Evite componentes e arquivos extensos com responsabilidades diferentes. Extraia unidades coesas e reutilizáveis, sem criar abstrações prematuras.
- Reutilize componentes e tokens existentes antes de introduzir variantes. Novas dependências exigem justificativa e avaliação de manutenção, segurança e tamanho.
- Valide respostas externas e represente explicitamente estados de carregamento, vazio, sucesso, erro, indisponibilidade e acesso negado.
- Não invente endpoints, campos ou permissões. Quando o contrato não existir, use uma interface claramente provisória, dados fictícios e registre a dependência.
- A interface pode orientar por perfil, mas autorização efetiva pertence ao servidor. Não persista JWT em `localStorage` ou `sessionStorage` sem decisão arquitetural aprovada.

## UX, IHC e identidade visual

- Priorize os fluxos rápidos e repetitivos da portaria: leitura clara, baixa carga cognitiva, prevenção de erro, confirmação de ações e retorno imediato do sistema.
- Diferencie visualmente informação confirmada, alerta, atraso, sucesso e ação destrutiva sem depender somente de cor.
- Preserve a identidade institucional do IFPE e adapte referências visuais ao contexto do produto; não copie concorrentes ou inspirações literalmente.
- Para novos fluxos relevantes, pesquise padrões atuais e concorrentes, registre as fontes e explique o que foi adaptado ao contexto local.
- Não trate preferência visual como regra de negócio. Textos e comportamentos ainda não validados com o cliente devem ser identificados como hipóteses.

## Acessibilidade e responsividade

- Use HTML semântico, nomes acessíveis, rótulos associados, ordem de foco previsível e operação completa por teclado.
- Garanta foco visível, contraste suficiente, mensagens de erro compreensíveis e alvos de interação adequados.
- Não use apenas placeholder como rótulo e não comunique estado apenas por cor, ícone ou animação.
- Verifique no mínimo uma largura móvel próxima de 390 px e uma largura desktop próxima de 1440 px, incluindo zoom e conteúdo longo.
- Respeite preferências de redução de movimento quando houver animação não essencial.

## Regras funcionais conhecidas

- Porteiro e vigilante compartilham o fluxo operacional normal de entradas e saídas. O setor de Transporte acompanha a operação. O administrador gerencia contas e permissões e consulta históricos; operações excepcionais dependem de regra confirmada.
- Servidores, terceirizados e veículos institucionais podem estar previamente cadastrados. A interface deve favorecer seleção e conferência, evitando redigitação desnecessária.
- Visitantes exigem identificação e finalidade conforme regra validada. Pessoa, vínculo, motivo, veículo e serviço de transporte são conceitos distintos.
- A saída é registrada manualmente. Tempo esperado pode gerar alerta, mas não deve encerrar automaticamente um acesso. O exemplo de dez minutos continua sendo hipótese até validação formal.
- Fluxos de mototáxi devem permanecer distinguíveis dos demais acessos conforme solicitação do cliente, sem pressupor campos ou políticas ainda não documentados.

## Validação e apresentação

- Execute, conforme o escopo: `npm ci`, testes focados ou `npm test`, lint, build e `git diff --check`. Registre justificativa para qualquer validação não executada.
- Teste interação por teclado, estados relevantes e apresentação em mobile e desktop. Confirme também os checks do PR e a validação de imagem/contêiner quando aplicável.
- Ao entregar, separe claramente interface demonstrativa, integração real e pendências do backend.
- Informe estimativas justificadas do frontend para MVP, demonstração e produção quando solicitado; não use percentuais como fatos sem critérios verificáveis.

## Referências

- `../../AGENTS.md`
- `README.md`
- `../../docs/security/secure-development-guide.md`
- `../../docs/security/threat-model.md`
- Wiki: <https://github.com/ifpebj-ti/controle-acesso-veiculos/wiki>
