# Requisitos da versão 0.1.0

## Requisitos funcionais

- RF001: autenticar administrador com e-mail e senha.
- RF002: emitir token JWT válido após autenticação.
- RF003: consultar o perfil do usuário autenticado.
- RF004: cadastrar dados básicos da empresa.
- RF005: consultar dados básicos da empresa.
- RF006: documentar endpoints com Swagger.
- RF007: criar administrador inicial por seed.

## Requisitos não funcionais

- RNF001: utilizar TypeScript com modo estrito.
- RNF002: utilizar HTTPS em produção.
- RNF003: proteger senhas com Argon2.
- RNF004: validar entradas na API.
- RNF005: usar transações para operações críticas futuras.
- RNF006: manter separação entre controllers, services e persistência.
- RNF007: oferecer execução local por Docker Compose.
- RNF008: não expor segredos no repositório.
- RNF009: responder erros em formato consistente.
- RNF010: permitir evolução para múltiplas empresas e unidades.
