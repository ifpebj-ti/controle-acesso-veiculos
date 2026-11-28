# Notas revisáveis das releases

Cada preparação cria X.Y.Z.md com o padrão Technical MVP release e um marcador
REVIEW_REQUIRED. O responsável revisa os destaques, substitui os limites
provisórios e remove o marcador antes da incorporação. A CI recusa a proposta
se o conteúdo continuar provisório. Não adicionar dados pessoais ou segredos.

Estrutura obrigatória: `## Technical MVP release`, `### Highlights` e
`### Known limits`, com bullets reais nas duas seções. Não repetir Container
images ou Validation and supply chain: essas seções são geradas depois, com a
fonte e os manifests publicados. O changelog completo permanece vinculado.

A prévia identifica publicação pendente. Somente depois dos gates e da
conferência de ambos os manifests entram os digests e o resultado da publicação.
Tag semântica e sha-COMMIT precisam resolver ao mesmo digest, com AMD64/ARM64.
Uma release já publicada não é sobrescrita. A release 0.5.0 anterior a este
ajuste mantém suas notas e imagens imutáveis; não foi criada uma falsa revisão
retroativa de seu arquivo fonte.

Confira o [ciclo completo](../operations/release-automation.md). Este diretório
não declara implantação na VM ou aceite institucional.
