# Atualização da v0.4.0 para v0.5.0

```bash
git checkout develop
git pull origin develop
git checkout -b feature/promotions-v0.5.0
pnpm install
pnpm api:prisma:generate
pnpm api:prisma:migrate
pnpm api:seed
pnpm build
pnpm dev
```

A migração adiciona `Coupon`, `CouponUsage`, `Promotion` e os campos `discount` e `couponCode` em `Order`.
