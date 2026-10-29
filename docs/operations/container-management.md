# Operação protegida da plataforma de contêineres

## Estado

Este runbook descreve a implantação **proposta**, ainda não executada, da Issue
#501. A decisão e os riscos estão no
[ADR 0009](../architecture/decisions/0009-protected-container-management.md).
Não copie comandos genéricos da internet para a VM: a versão e o digest devem
ser revisados no PR de implantação.

## Arquitetura de acesso

```text
mantenedor individual
        |
        | sessão OCI Bastion temporária (máximo 30 min)
        v
VM privada: 127.0.0.1:9443
        |
        v
Portainer CE LTS ---- /var/run/docker.sock
```

Não existe caminho por DNS, Load Balancer, WAF, Caddy, IP público ou porta TCP
do Docker. O TLS interno do painel protege o salto local, mas a barreira de rede
é o túnel temporário e autenticado do Bastion.

## Checklist anterior à implantação

- [ ] ADR aprovado pelos responsáveis de infraestrutura e segurança;
- [x] Issue #516 concluída pelo PR #518: segredos de longa duração não aparecem
      no ambiente inspecionável dos contêineres e a rotação foi ensaiada;
- [ ] versão LTS, digest, arquiteturas, SBOM e scanner registrados;
- [ ] volume e memória disponíveis medidos;
- [ ] regra OCI confirma ausência de ingresso para `9443`, `9000` e `8000`;
- [ ] procedimento de Bastion testado por duas identidades individuais;
- [ ] senha inicial forte entregue fora de issue, chat e logs;
- [ ] backup e remoção ensaiados primeiro em ambiente descartável.

## Princípios de instalação

A implantação deve usar Compose separado da aplicação, com:

- imagem fixada simultaneamente por versão LTS e digest;
- `127.0.0.1:9443:9443` como único bind;
- volume nomeado exclusivo para `/data`;
- socket Docker montado sem publicação TCP;
- `security_opt: no-new-privileges:true` quando compatível;
- limite explícito de CPU e memória compatível com a medição;
- rotação de logs e health check;
- nenhuma montagem do repositório, `.env`, certificados ou diretórios de backup;
- nenhuma porta de agente, túnel Edge ou atualização automática.

O arquivo final só deve ser criado depois da confirmação do digest e da versão
compatível; `latest` não é aceito.

## Acesso e validação

1. crie uma sessão Bastion com duração mínima necessária;
2. encaminhe uma porta local para `127.0.0.1:9443` da VM;
3. acesse somente a URL local do túnel;
4. autentique com sua conta individual e encerre a sessão ao terminar;
5. confirme que a conta enxerga somente os recursos previstos;
6. consulte estado e logs sem abrir console interativo no contêiner;
7. para reinício autorizado, registre motivo, horário, serviço e resultado;
8. confirme `/health/ready` e o frontend após a ação.

Nunca cole segredos, execute shell pela interface, edite o Compose, altere tag ou
remova volume durante operação comum. Mudanças persistentes continuam por issue,
PR, release e procedimento versionado.

## Atualização e rollback

1. revise release notes e vulnerabilidades da nova versão;
2. confirme digest para `linux/amd64` e `linux/arm64` quando aplicável;
3. faça backup cifrado da configuração sem publicá-lo;
4. atualize a referência imutável no PR e valide o Compose;
5. aplique em janela autorizada e confirme contas, recursos e logs;
6. em falha, restaure a imagem anterior pelo digest e o volume compatível;
7. se o volume tiver migration incompatível, restaure o backup anterior;
8. registre duração, consumo e qualquer exposição observada.

## Remoção de emergência

Se houver suspeita de comprometimento:

1. remova imediatamente a sessão Bastion ativa;
2. pare o Portainer pelo host, sem remover a stack da aplicação;
3. preserve logs e o volume conforme o procedimento de incidente;
4. rotacione credenciais e tokens que poderiam ter sido observados;
5. confirme integridade das imagens, Compose, volumes e serviços;
6. opere temporariamente pelo CLI via Bastion;
7. só restaure a console após análise e correção.

Controlar o socket Docker equivale a acesso administrativo ao host. Uma
interface amigável não reduz esse privilégio e nunca deve ser liberada a
Porteiro, Vigilante, Transporte ou Administrador funcional da aplicação.
