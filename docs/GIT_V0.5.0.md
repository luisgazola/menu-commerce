# Git — MenuCommerce v0.5.0

```bash
git add .
git commit -m "feat: implement coupons and promotions for v0.5.0"
git push -u origin feature/promotions-v0.5.0
```

Após o Pull Request para `develop` e os testes:

```bash
git checkout main
git pull origin main
git merge --no-ff develop -m "release: MenuCommerce v0.5.0"
git push origin main
git tag -a v0.5.0 -m "MenuCommerce v0.5.0 - cupons e promoções"
git push origin v0.5.0
```
