# Atualização da v0.2.0 para v0.3.0

A v0.3.0 não altera o modelo Prisma. A atualização é concentrada no front-end, documentação e versionamento.

```bash
git checkout develop
git pull origin develop
git checkout -b feature/cart-v0.3.0
```

Substitua os arquivos atualizados e execute:

```bash
pnpm install
pnpm build
pnpm dev
```

Para limpar o carrinho durante testes, execute no console do navegador:

```javascript
localStorage.removeItem('menucommerce.cart.v0.3.0');
location.reload();
```
