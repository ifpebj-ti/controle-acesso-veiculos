# Validação de texto nas fronteiras da aplicação

O registro de entrada geral recusa NUL em nome do condutor, objetivo, campos
de documento, tipo do veículo, marca, modelo, cor e observação antes de chamar
o store. Placa e categoria mantêm os validadores de formato e catálogo. A
consulta de auditoria recusa NUL no filtro `entity` antes de consultar o banco.
O endpoint retorna validação HTTP 400 com o campo correspondente.

O caractere não é removido silenciosamente: substituir texto inválido poderia
mudar o dado informado sem o usuário perceber. Unicode, acentos, tabulação e
quebras de linha legítimas em observações continuam aceitos, dentro dos limites
de tamanho existentes. O valor rejeitado não precisa aparecer em logs ou erros.

Os auxiliares de validação de campos obrigatórios/opcionais de acesso também
protegem os pontos que já os reutilizam, mas isso não significa cobertura
universal de todos os endpoints. Demais buscas, cadastros e justificativas
específicas precisam de inventário e testes próprios; não se adicionou uma
inspeção global do corpo JSON nem buffering de senhas em arquivos temporários.

As regressões de aplicação verificam recusa antes do store e preservação de
observação multilinha. As verificações HTTP usam banco descartável e conferem
que a entrada recusada não foi criada. Entrega, implantação e reteste continuam
sendo estados distintos.

Referência: [OWASP — Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html).
