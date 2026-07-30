# Fluxo Git — versão 0.2.0

```bash
git checkout develop
git pull origin develop
git checkout -b feature/catalog-v0.2.0

git add .
git commit -m "feat: implement catalog module for v0.2.0"
git push -u origin feature/catalog-v0.2.0
```

Após revisar e mesclar o Pull Request em `develop`:

```bash
git checkout develop
git pull origin develop
pnpm install
pnpm build

git checkout main
git pull origin main
git merge --no-ff develop -m "release: MenuCommerce v0.2.0"
git tag -a v0.2.0 -m "MenuCommerce v0.2.0 - catálogo e produtos"
git push origin main
git push origin v0.2.0
```
