# MenuCommerce v0.2.0

Cardápio online responsivo e painel administrativo construídos com TypeScript, Next.js, NestJS, PostgreSQL, Prisma, MongoDB e Redis.

## Funcionalidades desta versão
- Login administrativo JWT.
- Empresa e loja.
- Categorias.
- Produtos, preço promocional e imagens por URL.
- Grupos de opções e adicionais.
- Pesquisa pública.
- Cardápio responsivo.
- Painel administrativo inicial.
- Swagger.

## Instalação

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
- Cardápio: http://localhost:3000
- Administração: http://localhost:3000/admin
- API: http://localhost:3001/api/v1
- Swagger: http://localhost:3001/docs

Login local:
- E-mail: `admin@local.test`
- Senha: `Admin@123456`

## Endpoint público

```http
GET /api/v1/catalog/demo
GET /api/v1/catalog/demo?search=bacon
```

## Próxima versão
A versão 0.3.0 adicionará carrinho, quantidades, seleção real de adicionais, observações e persistência local.
