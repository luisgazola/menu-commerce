# MenuCommerce v0.1.0

Fundação do cardápio online: monorepo TypeScript, API NestJS, interface Next.js, PostgreSQL, MongoDB, Redis, autenticação administrativa e cadastro inicial da empresa.

## Entregas desta versão

- Monorepo com pnpm workspaces.
- API REST versionada em `/api/v1`.
- Swagger em `/docs`.
- Autenticação administrativa com JWT.
- Senhas protegidas com Argon2.
- Perfis `ADMIN`, `MANAGER` e `OPERATOR`.
- Cadastro e consulta da empresa.
- PostgreSQL como fonte transacional.
- MongoDB preparado para auditoria e históricos futuros.
- Redis preparado para cache, filas e idempotência futura.
- Next.js com tela inicial e formulário de login.
- Docker Compose para os serviços de infraestrutura.
- Seed do primeiro administrador.

## Pré-requisitos

- Node.js 22 ou superior.
- pnpm 10 ou superior.
- Docker com Docker Compose.

## Inicialização

```bash
cp .env.example .env
pnpm install
pnpm db:up
pnpm api:prisma:generate
pnpm api:prisma:migrate
pnpm api:seed
pnpm dev
```

Acessos:

- Web: http://localhost:3000
- API: http://localhost:3001/api/v1
- Swagger: http://localhost:3001/docs

Credenciais iniciais definidas no `.env`:

```text
admin@local.test
Admin@123456
```

Troque a senha imediatamente em ambientes reais.

## Limites da v0.1.0

Esta versão ainda não possui catálogo, produtos, carrinho, pedidos, cupons ou integração de pagamentos. Esses recursos começam nas versões seguintes.
# menu-commerce
