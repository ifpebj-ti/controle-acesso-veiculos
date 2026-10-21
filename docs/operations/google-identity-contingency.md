# Contingência de identidade Google

## Estado e objetivo

Este procedimento define a resposta planejada quando o Google OpenID Connect
estiver indisponível ou quando o cliente OAuth da aplicação apresentar falha.
Ele não declara o acesso de emergência pronto para produção: a governança do
Administrador mestre e as contas `LocalEmergency` ainda dependem da Issue
#449 e de homologação institucional.

O objetivo é preservar a operação essencial sem transformar uma indisponibilidade
externa em motivo para remover controles, compartilhar credenciais ou conceder
perfis automaticamente.

## Pré-requisitos antes da implantação real

- duas contas pessoais e distintas de Administrador mestre com método
  `LocalEmergency`, sob custódias institucionais separadas;
- senhas longas e únicas guardadas no cofre institucional, nunca no Git, em
  planilhas, mensagens ou documentação;
- teste periódico de acesso, auditoria, revogação de sessão e rotação;
- responsáveis primário e substituto formalmente designados;
- procedimento manual de controle de veículos disponível caso a própria
  aplicação também esteja indisponível;
- relógios dos servidores sincronizados e trilha de auditoria preservada.

Sem esses pré-requisitos, a contingência aplicável é o processo manual do
campus. Não se deve habilitar conta genérica, reutilizar senha cotidiana,
desativar autorização ou criar usuário diretamente no banco.

## Detecção e classificação

1. Confirme que a API, o banco e a rede local estão saudáveis.
2. Compare o erro com o estado público do Google e teste o fluxo em dispositivo
   controlado, sem registrar tokens, códigos ou capturas com dados pessoais.
3. Classifique o incidente:
   - falha do Google ou conectividade externa;
   - configuração expirada ou inválida do cliente OAuth;
   - falha interna da aplicação;
   - suspeita de comprometimento.
4. Abra um registro de incidente com início, responsável, impacto e decisão de
   ativação. Não copie credenciais nem respostas OIDC completas.

## Ativação controlada

1. O responsável pelo fluxo confirma a necessidade e uma segunda pessoa
   autorizada revisa a ativação.
2. Um custodiante utiliza sua própria conta `LocalEmergency`; contas não podem
   ser compartilhadas.
3. A autenticação local de emergência continua sujeita a bloqueio, rate limit,
   sessão protegida, menor privilégio e auditoria.
4. O operador registra somente as atividades essenciais enquanto durar a
   contingência.
5. Se nenhuma conta de emergência válida estiver disponível, use o formulário
   manual de contingência. Não altere o banco nem contorne a API.

## Retorno ao serviço normal

1. Valide o login Google com uma conta de teste pré-autorizada em HTTPS.
2. Encerre todas as sessões locais de emergência usadas no incidente.
3. Faça rotação das credenciais utilizadas e atualize o cofre institucional.
4. Confira a trilha de auditoria e reconcilie no sistema os registros manuais,
   preservando o papel como evidência conforme a política institucional.
5. Registre término, duração, causa, ações, divergências e responsáveis.
6. Se houver suspeita de comprometimento, preserve evidências e siga o processo
   de resposta a incidentes antes de restaurar o acesso comum.

## Ensaio e evidências

O ensaio deve ocorrer em homologação, nunca diretamente em produção, e comprovar:

- Google indisponível não autoriza conta desconhecida;
- cada conta de emergência identifica individualmente seu operador;
- o último Administrador mestre ativo não pode ser removido;
- sessões são revogadas depois da contingência;
- ações e mudanças de privilégio mantêm ator, alvo, motivo e horário;
- a reconciliação não duplica nem apaga registros;
- nenhuma senha, token ou código aparece nos artefatos do teste.

As evidências devem registrar apenas data, cenário, resultado, responsáveis e
referências a logs sanitizados. Segredos e dados pessoais não são evidência de
teste e não devem ser anexados.

## Responsabilidades

- **Eurico ou responsável designado pelo fluxo:** confirma impacto operacional
  e acompanha a reconciliação.
- **Equipe do curso de Engenharia de Software:** diagnostica a aplicação,
  preserva evidências técnicas e executa a recuperação autorizada.
- **Orientadores e responsáveis pelo repositório do IFPE:** governam acesso a
  segredos, revisão de mudanças e resposta a comprometimento.
- **Custodiantes das contas de emergência:** usam apenas a própria conta,
  protegem a credencial e comunicam imediatamente qualquer suspeita.

## Referências relacionadas

- [ADR 0005 — Google OIDC e acesso de emergência](../architecture/decisions/0005-google-oidc-and-emergency-access.md)
- [Autenticação e autorização](../security/authentication.md)
- [Retenção, backup, recuperação e contingência](data-retention-and-continuity.md)
- [Modelo de registro de contingência](contingency-record-template.md)
- Issues #448 e #449
