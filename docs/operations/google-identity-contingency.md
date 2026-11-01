# Contingência de identidade Google

## Estado e objetivo

Este roteiro acompanha a decisão vigente da Issue #449 e do ADR 0005:
existem quatro perfis. Porteiro, Vigilante e Setor de Transporte usam Google;
Administrador usa autenticação Local. Não existe método `LocalEmergency`
implementado nem um perfil separado de Administrador mestre.

A indisponibilidade do Google não cria uma autorização alternativa para os
operadores. O acesso administrativo local permanece sujeito às permissões
reais da API; não deve ser usado como conta compartilhada de portaria.
Este documento organiza a resposta proposta, sem declarar ensaio ou aceite
institucional. A reconciliação segura de registros após contingência segue
pendente na Issue #100.

## Preparação

- Identificar responsáveis primário e substituto pela operação e pela manutenção,
  conforme a governança institucional, sem criar credenciais genéricas.
- Conferir acesso de um Administrador local autorizado antes de habilitar Google.
  A quantidade e a custódia das contas devem seguir a decisão institucional;
  o runbook não concede novos perfis.
- Guardar credenciais administrativas no canal protegido aprovado, fora do Git,
  de planilhas, mensagens e evidências. Nunca solicitar a senha Google.
- Disponibilizar o formulário manual e orientar os responsáveis pelo fluxo
  sobre guarda, autoria, horários e identificação dos registros.
- Manter relógios sincronizados, auditoria preservada e contatos operacionais
  atualizados em local restrito.

## Detecção e classificação

1. Verifique readiness da API, banco e conectividade pelo canal autorizado.
2. Confira o estado do provedor e o início do login em dispositivo controlado.
   Não copie códigos OIDC, tokens, cookies ou payloads de autenticação.
3. Distinga falha do Google/rede, configuração do cliente, indisponibilidade da
   aplicação e suspeita de comprometimento. Conta desconhecida negada não é,
   por si só, indisponibilidade do provedor.
4. Registre início, impacto, responsável e decisão operacional com evidências
   sanitizadas. Use o processo de incidentes se houver suspeita de ataque.

## Continuidade durante a falha

1. Eurico ou responsável designado pelo fluxo orienta a continuidade manual
   conforme o procedimento institucional aplicável.
2. O Administrador pode acessar sua própria conta local para diagnóstico e
   administração já autorizados. Permanecem bloqueio, limitação de tentativas,
   sessão protegida e auditoria; o backend continua decidindo cada permissão.
3. Não converta contas operacionais para Local, promova pessoas a Administrador,
   crie senhas de emergência nem compartilhe conta para contornar a falha.
4. Não desative Google, HTTPS, autorização ou WAF como solução operacional.
   Correções técnicas de configuração exigem rastreabilidade e rollback.
5. Sessões já existentes seguem as regras normais de validade e revogação.
   Não prometa que todos permanecerão conectados nem amplie prazos sem decisão.
6. Se a aplicação também estiver indisponível, preserve o registro manual;
   não grave diretamente no banco e não apresente o papel como dado sincronizado.

## Retorno ao serviço normal

1. Valide o login de uma conta Google pré-autorizada em HTTPS e o acesso
   administrativo local, distinguindo teste técnico de aceite do representante.
2. Confira autoria, restrições de perfil, renovação e encerramento de sessão.
3. Encerre sessões administrativas usadas no diagnóstico conforme o procedimento
   de segurança. Credencial exposta ou suspeita exige resposta a incidente e
   rotação autorizada; uma falha comum de rede não comprova comprometimento.
4. Inventarie os registros em papel e preserve os originais conforme a política
   institucional. Identifique período, responsável e possíveis duplicidades.
5. A Issue #100 deve definir e validar a reconciliação antes de seu uso. Não
   insira registros retroativos pelo fluxo comum se ele não representa horários,
   origem e autoria reais. Não declare sincronização automática existente.
6. Registre término, causa, duração, divergências e ações de acompanhamento.

## Ensaio e evidências

O ensaio deve ocorrer em homologação autorizada, com dados fictícios, verificando:

- conta Google desconhecida continua negada;
- Administrador local conserva somente suas capacidades autorizadas;
- não há conversão de método, novo perfil ou compartilhamento de conta;
- sessão expirada/revogada permanece bloqueada;
- operador recebe orientação e continuidade manual é rastreável;
- retorno ao Google preserva vínculo, perfil e auditoria;
- reconciliação não é declarada pronta enquanto a Issue #100 estiver pendente;
- segredos e dados pessoais não aparecem nas evidências.

Registre versão, data, cenário, resultado, limitações e responsável pelo perfil.
Não marque um ensaio executado nem aprovação institucional com base somente
neste roteiro. Pendências operacionais permanecem nas Issues #30, #100 e #162.

## Responsabilidades

- **Eurico ou responsável designado pelo fluxo:** orienta a continuidade manual,
  confirma impacto e acompanha a futura reconciliação.
- **Equipe do curso de Engenharia de Software:** diagnostica, preserva evidências
  técnicas e executa a recuperação autorizada.
- **Orientadores e responsáveis pelo repositório do IFPE:** governam acesso a
  segredos, revisão de mudanças e resposta a comprometimento.
- **Administrador autorizado:** usa somente sua própria conta e as permissões
  efetivas, protege a credencial e comunica suspeitas de exposição.

## Referências relacionadas

- [ADR 0005 — Google OIDC e acesso administrativo](../architecture/decisions/0005-google-oidc-and-emergency-access.md)
- [Autenticação e autorização](../security/authentication.md)
- [Retenção, backup, recuperação e contingência](data-retention-and-continuity.md)
- [Modelo de registro de contingência](contingency-record-template.md)
- Issues #448, #449 e #534; reconciliação #100 e homologação #162.
