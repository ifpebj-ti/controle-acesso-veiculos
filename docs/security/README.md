# Segurança do projeto

Esta pasta contém a fonte versionada dos documentos de segurança do projeto.

- [Autenticação e autorização](authentication.md)
- [Modelagem de ameaças](threat-model.md)
- [Modelo visual para OWASP Threat Dragon](controle-acesso-veiculos-threat-model.json)
- [Guia de desenvolvimento seguro](secure-development-guide.md)
- [Análise dinâmica com OWASP ZAP](dynamic-application-security-testing.md)
- [Contingência de identidade Google](../operations/google-identity-contingency.md)
- [Amostra histórica do baseline passivo do ZAP](evidence/zap-baseline-2026-09-16/README.md)
- [ADR 0001 — ciclo de vida seguro de sessões](../architecture/decisions/0001-secure-session-lifecycle.md)
- [ADR 0002 — retenção de dados e backup protegido na OCI](../architecture/decisions/0002-data-retention-and-oci-backup.md)
- [ADR 0003 — key ring persistente e protegido](../architecture/decisions/0003-protected-data-protection-key-ring.md)
- [ADR 0004 — topologia segura e econômica da homologação na OCI](../architecture/decisions/0004-oci-homologation-topology.md)
- [ADR 0005 — Google OIDC com autorização local e acesso de emergência](../architecture/decisions/0005-google-oidc-and-emergency-access.md)
- [ADR 0006 — borda de homologação protegida pelo OCI WAF](../architecture/decisions/0006-oci-waf-protected-homologation-edge.md)

A Wiki apresenta cópias de leitura e contexto acadêmico, mas mudanças nestes
documentos devem passar por Issue, branch, revisão e Pull Request.

Documentos relacionados:

- `.github/instructions/security.instructions.md` — regras obrigatórias para
  alterações assistidas no repositório;
- página `Segurança e Privacidade` da Wiki — decisões, dados e pendências do
  Projeto Integrador;
- Issue #26 — criação e validação inicial destes documentos.

## Abrir e apresentar o modelo visual

O arquivo `controle-acesso-veiculos-threat-model.json` usa o formato nativo 2.x
do OWASP Threat Dragon. Para revisá-lo sem enviar dados do projeto a um serviço
externo:

1. instale a versão desktop 2.x publicada pelo projeto OWASP;
2. abra uma sessão local;
3. importe o arquivo JSON desta pasta;
4. abra o diagrama **Fluxo principal e cadeia de entrega**;
5. selecione cada elemento para consultar ameaças, estado e mitigação;
6. use **Report** para gerar o PDF que será apresentado ou anexado à evidência
   acadêmica.

Antes da apresentação, confira se o relatório contém:

- 1 ator, 6 processos, 4 depósitos, 10 fluxos e 5 fronteiras;
- as ameaças `TM-01` a `TM-27` sem duplicidade;
- distinção entre controles mitigados e riscos ainda abertos;
- homologação técnica OCI como implantada com origem privada, Load Balancer e WAF,
  sem confundi-la com produção; DNS e certificado confiável, backup externo,
  observabilidade operada e homologação institucional continuam pendentes.

Não inclua credenciais, endereços internos, dados pessoais, capturas de produção
ou segredos no modelo ou no PDF exportado.
