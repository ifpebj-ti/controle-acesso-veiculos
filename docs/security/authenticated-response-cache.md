# Cache HTTP de respostas autenticadas

A API define `Cache-Control: no-store` nas respostas de usuários autenticados
e nas respostas a requisições que enviam `Authorization`, inclusive quando a
credencial é recusada. A decisão é aplicada no início da resposta, após o
resultado da autenticação, sem depender de cada endpoint repetir o header.

As rotas de sessão e entrega de credenciais temporárias mantêm suas proteções
específicas. O diagnóstico público anônimo não recebe essa política por este
middleware; o cache de assets estáticos é responsabilidade separada da borda.
`Vary` não substitui a proibição de armazenamento e não é necessário para
autorizar cache de uma resposta explicitamente marcada como `no-store`.

O header orienta caches HTTP conformes. Ele não apaga dados previamente
armazenados, não controla uma captura de tela ou cliente malicioso e não
substitui autorização, logout ou proteção do tablet compartilhado.

Referência: [RFC 9111, seção 5.2.2.5](https://www.rfc-editor.org/rfc/rfc9111.html#section-5.2.2.5).
