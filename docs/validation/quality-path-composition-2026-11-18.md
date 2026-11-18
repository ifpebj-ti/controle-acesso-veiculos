# Composição explícita de caminhos das fixtures — 18/11/2026

Rastreabilidade: #771. Base main `a4ffcc5`.

## Mudança e limite

Sete chamadas nas fixtures DataProtectionConfigurationTests e
RuntimeSecretFileConfigurationTests passam de Path.Combine para Path.Join.
Os componentes são controlados pelos testes. A intenção é concatenar os
componentes sem descartar a raiz anterior se um componente for absoluto.
Isso não valida entrada não confiável nem comprova um ataque em produção.

As entradas negativas, asserts, isolamento e limpeza foram preservados.
Cancelamento e os dois catches de fronteira da aplicação não foram alterados.
Nenhum finding foi suprimido ou dispensado para melhorar o indicador.

## Validação

- Build Release do projeto de integração com warnings como erros: aprovado,
  zero warnings e zero erros.
- As duas classes executadas sequencialmente pelo runner xUnit v3: 15 testes
  aprovados, zero falhas e zero skips.
- dotnet format whitespace com verify-no-changes nos dois arquivos: aprovado.
- Revisão do diff e git diff --check: aprovados.

A execução foi no Windows. O caso de link simbólico contém um retorno antecipado
nessa plataforma; seu resultado não comprova o ramo Linux, que depende da CI.
A consulta anterior de Code Quality na main a4ffcc5 retornou nove notes abertas,
sete de caminhos e duas de catch. Só a análise posterior da main incorporada
poderá confirmar o efeito remoto. Nenhum novo rating foi declarado.

Referências: [Path.Join](https://learn.microsoft.com/en-us/dotnet/api/system.io.path.join?view=net-10.0)
e [catch de exceções gerais](https://codeql.github.com/codeql-query-help/csharp/cs-catch-of-all-exceptions/).
