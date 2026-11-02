# Substituições transitivas de dependências

## minimatch no ambiente de desenvolvimento

**Rastreabilidade:** Issue #558; revisão em 01/11/2026.<br>
**Motivo:** [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)
descreve amplificação de padrões e consumo excessivo de recursos em versões
anteriores à 11.0.1. O lockfile da main registra 10.2.6 como dependência de
desenvolvimento da cadeia de lint.

São usados overrides restritos a `@eslint/config-array`,
`@typescript-eslint/typescript-estree` e `eslint`, fixando `minimatch` em 11.0.3.
Não há override global nem inclusão dessa biblioteca no código do produto.
Node 24 atende aos engines publicados da substituição.

A resolução acrescenta `@isaacs/nonrecursive-glob-match` como dependência
transitiva de desenvolvimento do minimatch corrigido, com licença BlueOak-1.0.0.
Não é uma nova biblioteca usada pela interface ou pelo backend. A validação
compara também o conjunto de arquivos analisados pelo ESLint, para detectar uma
redução silenciosa de escopo ao trocar o mecanismo de padrões.

Na consulta ao registro npm, mesmo os consumidores mais recentes ainda
declaravam intervalos da major 10. Portanto, essa substituição atravessa o
intervalo originalmente suportado: não é uma atualização patch transparente.
Ela é temporária e requer revisão humana, instalação limpa, lint de todo o
frontend, build, suíte de comportamento e validação da árvore resolvida.
Essas verificações reduzem a incerteza, mas não provam equivalência para todo
padrão glob possível.

O alerta diz respeito à cadeia de ferramentas. Não há evidência, nesta análise,
de que um usuário HTTP do MVP consiga fornecer padrões ao lint ou de exploração
na hospedagem. Isso não justifica esconder o alerta nem ignorar dependências de
desenvolvimento na análise de segurança.

## Verificação e remoção

1. Instalar com `npm ci`, sem reconstruir o lockfile manualmente.
2. Conferir `npm ls minimatch --all` e a auditoria completa, separando resultado
   de produção e desenvolvimento.
3. Executar lint, build e a suíte frontend sem alterar limiares ou expectativas.
4. Após merge, conferir o alerta no GitHub; auditoria local não fecha alertas
   automaticamente nem representa ausência total de vulnerabilidades.
5. Remover cada override quando seu consumidor resolver uma versão corrigida
   nativamente. Repetir a validação e registrar a mudança em issue própria.

O PR #557 trata separadamente `follow-redirects`; esta mudança não deve
incorporar, sobrescrever ou fechar esse alerta por conveniência. Ao integrar
ambos os PRs, sincronizar o lockfile normalmente e conferir a árvore final.
