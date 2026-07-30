# MenuCommerce v0.3.0

Cardápio online responsivo com catálogo, personalização de produtos e carrinho local, construído com TypeScript, Next.js, NestJS, PostgreSQL, Prisma, MongoDB e Redis.

## Funcionalidades desta versão

- Todos os recursos das versões 0.1.0 e 0.2.0.
- Carrinho lateral responsivo.
- Quantidade por item.
- Seleção de opções simples e múltiplas.
- Validação de grupos obrigatórios e limites de seleção.
- Adicionais com impacto no preço.
- Observações por item com limite de 240 caracteres.
- Junção automática de itens com a mesma configuração.
- Remoção e alteração de quantidades.
- Subtotal calculado no navegador.
- Persistência em `localStorage`.
- Botão flutuante com quantidade e subtotal.

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

## Limite arquitetural da v0.3.0

O carrinho é local e serve à experiência de montagem do pedido. A v0.4.0 enviará os itens ao servidor, que deverá consultar novamente os produtos e recalcular todos os valores antes de criar o pedido. O back-end nunca deverá confiar em preços recebidos do navegador.

## Próxima versão

A versão 0.4.0 adicionará identificação do cliente, endereço, entrega ou retirada, criação do pedido e painel operacional de pedidos.
