# Regras de negócio da versão 0.1.0

- RN001: e-mails administrativos são únicos e normalizados em letras minúsculas.
- RN002: usuários inativos não podem autenticar-se.
- RN003: senhas nunca são persistidas em texto puro.
- RN004: somente usuários autenticados podem consultar dados administrativos.
- RN005: somente `ADMIN` pode cadastrar ou alterar dados empresariais nesta versão.
- RN006: CNPJ ou CPF empresarial deve ser único quando informado.
- RN007: exclusões futuras deverão ser lógicas quando houver histórico relacionado.
- RN008: segredos, senhas e tokens não podem aparecer em logs.
- RN009: o PostgreSQL é a fonte oficial dos dados cadastrais.
- RN010: credenciais e chaves devem ser fornecidas por variáveis de ambiente.
