# Git e GitHub — MenuCommerce v0.4.0

## Branch de desenvolvimento

```bash
git checkout develop
git pull origin develop
git checkout -b feature/cart-v0.4.0
```

## Commit

```bash
git add .
git commit -m "feat: implement shopping cart for v0.4.0"
git push -u origin feature/cart-v0.4.0
```

Abra o Pull Request:

```text
feature/cart-v0.4.0 → develop
```

## Release

Após validação e merge em `develop`:

```bash
git checkout main
git pull origin main
git merge --no-ff develop -m "release: MenuCommerce v0.4.0"
git push origin main
git tag -a v0.4.0 -m "MenuCommerce v0.4.0 - carrinho de compras"
git push origin v0.4.0
```
