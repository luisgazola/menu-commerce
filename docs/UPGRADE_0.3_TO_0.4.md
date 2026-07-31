# Atualização da v0.3.0 para v0.4.1

```bash
git checkout develop
git pull origin develop
git checkout -b feature/orders-v0.4.1

pnpm install
pnpm api:prisma:generate
pnpm api:prisma:migrate
pnpm api:seed
pnpm build
pnpm dev
```

A migração adiciona clientes, endereços, pedidos, itens e histórico de status.
