# ADR 0009 — Gestão protegida dos contêineres da homologação

- Estado: proposto
- Data: 2026-10-26
- Issue: #501
- Dependência de segurança: #516

## Contexto

A Unidade 2 solicita uma plataforma simples para consultar contêineres, logs e
estado da stack. A VM da homologação não possui IP público e a administração
ocorre pelo OCI Bastion. Publicar uma console ou a API do Docker criaria um novo
caminho administrativo de alto impacto.

Controlar o Docker equivale, na prática, a controlar o host: um usuário pode
criar um contêiner com o sistema de arquivos da VM montado. Portanto, WAF,
senha forte e TLS não transformam uma console Docker em recurso de baixo risco.
O acesso ao socket deve permanecer restrito a uma ferramenta única e a pessoas
responsáveis pela infraestrutura.

Foram consideradas três alternativas:

1. **Dockge:** é focado em Compose e leve, porém exige socket e diretório de
   stacks gravável. A superfície inclui editor e terminal; o histórico recente
   também exige confirmação de versão corrigida para vulnerabilidades de escrita
   fora do diretório de stacks. Não é a escolha inicial.
2. **Docker CLI por SSH/Bastion:** reduz componentes persistentes e é a
   contingência preferida, mas não atende bem à evidência acadêmica de uma
   plataforma visual e exige maior conhecimento operacional.
3. **Portainer CE LTS:** possui interface, contas individuais e controle de
   propriedade dos recursos. Ainda exige acesso poderoso ao Docker e não oferece
   o RBAC detalhado da edição Business.

## Decisão proposta

Adotar **Portainer Community Edition LTS**, inicialmente limitada aos
desenvolvedores responsáveis pela infraestrutura, nas seguintes condições:

- versão LTS e digest multi-arquitetura imutável registrados antes do deploy;
- porta `9443` vinculada somente a `127.0.0.1` na VM;
- nenhum ingresso no NSG, Load Balancer, WAF, Caddy ou DNS público;
- acesso apenas por encaminhamento temporário do OCI Bastion;
- conta individual por mantenedor, sem usuário compartilhado ou token de API;
- telemetria anônima e verificação automática de atualização desabilitadas;
- sem porta Edge Agent `8000`, sem webhook e sem integração com registry;
- volume próprio somente para a configuração do Portainer;
- socket Docker montado apenas no Portainer, nunca exposto por TCP;
- stacks continuam definidas e promovidas pelo Git/Compose versionado. A console
  não passa a ser fonte de verdade nem autorização para editar manifests;
- atualização, rollback e backup seguem um runbook revisado.

O primeiro deploy não concede acesso a operadores comuns. Contas não
administrativas e controles por recurso só podem ser habilitados depois que a
Issue #516 retirar segredos de longa duração do ambiente inspecionável dos
contêineres e um teste confirmar a separação pretendida.

## Controles obrigatórios antes do aceite

1. confirmar compatibilidade da versão LTS com Docker e arquitetura da VM;
2. registrar o digest OCI da imagem, SBOM e resultado do scanner;
3. comprovar por `ss` e regras OCI que `9443` não possui ingresso público;
4. testar Bastion, conta individual, encerramento da sessão e bloqueio;
5. comprovar que um usuário não autorizado não vê a stack;
6. revisar o que a interface revela em variáveis, mounts, logs e inspect;
7. medir CPU, memória, disco e tamanho do volume antes/depois;
8. testar reinício de um serviço permitido e negar recursos fora do escopo;
9. testar backup e restauração do volume de configuração;
10. remover a ferramenta e voltar ao Docker CLI sem afetar a aplicação.

## Consequências

### Benefícios

- oferece evidência visual de saúde, estado e logs;
- evita uma porta administrativa pública;
- mantém identidade do Bastion e identidade da console como camadas separadas;
- não desloca releases e configurações para uma interface manual.

### Riscos residuais

- comprometimento do Portainer ou de uma conta administrativa pode controlar o
  Docker e, por consequência, a VM;
- Portainer CE não possui o RBAC operacional detalhado da edição Business;
- informações exibidas pelo Docker podem incluir configuração sensível até a
  conclusão da Issue #516;
- o volume do Portainer passa a exigir backup, atualização e restauração;
- a console aumenta consumo e manutenção de uma VM acadêmica pequena.

Esses riscos impedem publicar a console e justificam manter CLI via Bastion como
contingência. Se a separação por recurso não for comprovada, a alternativa deve
ser reavaliada em vez de ampliar permissões.

## Referências

- [Docker Engine security](https://docs.docker.com/engine/security/)
- [Protect the Docker daemon socket](https://docs.docker.com/engine/security/protect-access/)
- [Portainer CE on Docker Standalone](https://docs.portainer.io/start/install-ce/server/docker)
- [Portainer access control](https://docs.portainer.io/advanced/access-control)
- [Portainer requirements](https://docs.portainer.io/start/requirements-and-prerequisites)
- [Dockge repository](https://github.com/louislam/dockge)
