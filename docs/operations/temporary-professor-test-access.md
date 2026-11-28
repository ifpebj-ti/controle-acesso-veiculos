# Acesso temporário dos professores na homologação

Rastreabilidade: #612. Exceção solicitada por José em 03/11/2026 para os ensaios
de perfis com contas fictícias. Estado: candidato, sem ativação implícita.

O Google continua obrigatório para operadores reais. A exceção usa somente
até três endereços exatos sob `example.test`, previamente existentes com senha,
perfil operacional ativo e credencial válida. Não muda perfil nem permissões.
Administrador local continua seguindo a regra existente.

## Ativação controlada

O host precisa declarar ambiente `Homologation`, `Testing` ou `Development`.
`Production` e nomes não reconhecidos recusam a exceção no startup. Na VM de
homologação, alterar `ASPNETCORE_ENVIRONMENT` exige revisar os efeitos de
configuração: cookies continuam Secure em Homologation e a UI de desenvolvimento
não é ativada por esse nome. Não mudar para Development no host público.

Configuração explícita, fora do repositório, sem senhas:

```text
Authentication__HomologationTestAccess__Enabled=true
Authentication__HomologationTestAccess__AllowedEmails__0=professor.porteiro@example.test
Authentication__HomologationTestAccess__AllowedEmails__1=professor.vigilante@example.test
Authentication__HomologationTestAccess__AllowedEmails__2=professor.transporte@example.test
Authentication__HomologationTestAccess__ExpiresAtUtc=<instante UTC escolhido>
```

Os nomes acima são exemplos. Usar somente os endereços fictícios reais do arquivo
privado, sem publicá-los como credenciais ou adicionar identidades reais à lista.
Prazo futuro máximo de sete dias, UTC com offset zero. Sem prazo ou lista válida,
a aplicação recusa a configuração. Um prazo já expirado desabilita a concessão,
preservando o funcionamento normal do restante da aplicação.

## Limites da expiração e segurança

Login e refresh continuam com hash, bloqueio por tentativas, sessão, CSRF e
auditoria normais. A sessão de teste recebe limite absoluto até o fim da janela;
não permite renovação depois dele. **Tokens de acesso já emitidos conservam sua
validade curta configurada** (padrão 15 minutos, admitindo clock skew existente).
Não prometer revogação instantânea por simplesmente desligar a flag.

Encerrar antecipadamente exige desabilitar a opção e revogar as famílias de
sessão das contas fictícias pelo procedimento administrativo autorizado. Não
alterar credenciais de usuários reais. Não ampliar JWT ou retirar limites do WAF.

O formulário atual se chama acesso administrativo. Durante o ensaio temporário,
os professores podem usar esse mesmo formulário com as contas selecionadas;
isso não lhes concede Administrador. Mensagens globais da interface e o contrato
de `/auth/providers` não são alterados silenciosamente por este incremento.

## Antes de entregar as contas

1. Compor a fonte com o callback #599 e as correções de infraestrutura hospedadas.
2. Validar build, testes de senha errada/bloqueio, escopo e expiração.
3. Preservar imagens/configuração anteriores e fazer rollout reversível, sem migration.
4. Conferir HTTPS, Google habilitado e cookies protegidos no host.
5. Autenticar cada conta fictícia e conferir seu perfil, negando `/users` aos
   três operadores e preservando Administrador. Não registrar tokens ou senhas.
6. Entregar credenciais por arquivo/canal privado, data limite e roteiro de teste.

Sem esse ensaio na hospedagem, dizer apenas “candidato preparado”. Não mudar a
política geral Google nem apresentar essa exceção como login operacional definitivo.
