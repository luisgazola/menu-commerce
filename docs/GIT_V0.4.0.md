# Git e GitHub — v0.4.1

```bash
git status
git add .
git commit -m "feat: implement checkout and order workflow for v0.4.1"
git push -u origin feature/orders-v0.4.1
```

Após o Pull Request para `develop` e os testes:

```bash
git checkout main
git pull origin main
git merge --no-ff develop -m "release: MenuCommerce v0.4.1"
git push origin main
git tag -a v0.4.1 -m "MenuCommerce v0.4.1 - checkout e pedidos"
git push origin v0.4.1
```
