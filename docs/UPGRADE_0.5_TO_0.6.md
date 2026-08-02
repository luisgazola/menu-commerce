# Atualização da v0.5.0 para v0.6.0

Este procedimento atualiza o MenuCommerce da `v0.5.0` para a `v0.6.0`, preservando dados, migrations, hardening de pedidos e promoções e adicionando a integração segura com WhatsApp.

## 1. Pré-requisitos

Antes de iniciar, confirme:

```bash
cd ~/Projetos/menu_commerce/menu-commerce-v0.1.0

git switch main
git pull --ff-only origin main
node -p "require('./package.json').version"
git tag --list v0.5.0
git status
```

Esperado:

```text
0.5.0
v0.5.0
nothing to commit, working tree clean
```

## 2. Backup do PostgreSQL

Com PostgreSQL ativo:

```bash
cd ~/Projetos/menu_commerce/menu-commerce-v0.5.0

sudo docker compose -p menu-commerce-v010 \
  up -d postgres redis mongodb
```

Crie os backups:

```bash
sudo docker compose -p menu-commerce-v010 \
  exec -T postgres \
  pg_dump -U menu -d menu_commerce \
  > ../backup_v0.5.0.sql

sudo docker compose -p menu-commerce-v010 \
  exec -T postgres \
  pg_dump -U menu -d menu_commerce -Fc \
  > ../backup_v0.5.0.dump
```

Valide:

```bash
head -n 10 ../backup_v0.5.0.sql

sudo docker exec -i menu-commerce-postgres \
  pg_restore -l \
  < ../backup_v0.5.0.dump |
  head -n 25
```

Gere hashes:

```bash
sha256sum \
  ../backup_v0.5.0.sql \
  ../backup_v0.5.0.dump \
  > ../backup_v0.5.0-SHA256SUMS.txt
```

## 3. Backup do Git

Use caminhos absolutos para evitar que `git -C` grave o bundle dentro do repositório.

```bash
ROOT="$HOME/Projetos/menu_commerce"
REPO="$ROOT/menu-commerce-v0.1.0"
BACKUP_DIR="$ROOT/backups-git/v0.5.0"

mkdir -p "$BACKUP_DIR"
```

Bundle:

```bash
git -C "$REPO" bundle create \
  "$BACKUP_DIR/menu-commerce-git-backup-v0.5.0.bundle" \
  --all

git bundle verify \
  "$BACKUP_DIR/menu-commerce-git-backup-v0.5.0.bundle"
```

Mirror do GitHub:

```bash
REMOTE_URL="$(git -C "$REPO" remote get-url origin)"

rm -rf "$BACKUP_DIR/menu-commerce-v0.5.0-github-mirror.git"

git clone --mirror \
  "$REMOTE_URL" \
  "$BACKUP_DIR/menu-commerce-v0.5.0-github-mirror.git"

git -C "$BACKUP_DIR/menu-commerce-v0.5.0-github-mirror.git" \
  fsck --full
```

Compacte e gere hashes:

```bash
cd "$BACKUP_DIR"

tar -czf menu-commerce-v0.5.0-git-backup.tar.gz \
  menu-commerce-git-backup-v0.5.0.bundle \
  menu-commerce-v0.5.0-github-mirror.git

sha256sum \
  menu-commerce-git-backup-v0.5.0.bundle \
  menu-commerce-v0.5.0-git-backup.tar.gz \
  > menu-commerce-v0.5.0-git-backup-SHA256SUMS.txt

sha256sum -c \
  menu-commerce-v0.5.0-git-backup-SHA256SUMS.txt
```

## 4. Validar os pacotes da v0.6.0

```bash
cd ~/Projetos/menu_commerce

sha256sum -c menu-commerce-v0.6.0-SHA256SUMS.txt
unzip -t menu-commerce-v0.6.0.zip
tar -tzf menu-commerce-v0.6.0.tar.gz >/dev/null
```

## 5. Extrair a versão

```bash
cd ~/Projetos/menu_commerce

if [ -d menu-commerce-v0.6.0 ]; then
  mv menu-commerce-v0.6.0 \
    "menu-commerce-v0.6.0.anterior.$(date +%Y%m%d-%H%M%S)"
fi

unzip menu-commerce-v0.6.0.zip
cd menu-commerce-v0.6.0
```

Confirme:

```bash
node -p "require('./package.json').version"
node -p "require('./apps/api/package.json').version"
node -p "require('./apps/web/package.json').version"
```

## 6. Preservar ambiente, lockfile e migrations

```bash
cp ../menu-commerce-v0.5.0/.env .env
cp ../menu-commerce-v0.5.0/pnpm-lock.yaml .
cp ../menu-commerce-v0.5.0/pnpm-workspace.yaml .

mkdir -p apps/api/prisma/migrations
cp -a \
  ../menu-commerce-v0.5.0/apps/api/prisma/migrations/. \
  apps/api/prisma/migrations/

ln -sfn ../../.env apps/api/.env
```

Confira o histórico:

```bash
find apps/api/prisma/migrations \
  -maxdepth 2 \
  -type f \
  -print
```

A migration de promoções da `v0.5.0` precisa estar presente.

## 7. Padronizar o Docker Compose

Use PostgreSQL 16, Redis 7 e MongoDB 4.4.29 em computadores sem AVX.

Os volumes devem possuir nomes explícitos e estáveis para que todas as versões reutilizem os mesmos dados:

```yaml
volumes:
  postgres_data:
    name: menu-commerce-v010_postgres_data
  mongodb44_data:
    name: menu-commerce-v010_mongodb44_data
  redis_data:
    name: menu-commerce-v010_redis_data
```

Valide:

```bash
sudo docker compose -p menu-commerce-v010 config
sudo docker compose -p menu-commerce-v010 up -d postgres mongodb redis
sudo docker compose -p menu-commerce-v010 ps
```

Não execute `docker compose down -v`.

## 8. Aplicar o hardening da v0.6.0

O hardening deve preservar:

- rastreamento por número e telefone;
- isolamento por empresa;
- transições de status;
- numeração concorrente;
- cupons transacionais;
- endpoint seguro do WhatsApp;
- expiração numérica do JWT.

Após aplicar o patch, mova `.hardening-backup-*` para fora do projeto ou mantenha o padrão no `.gitignore`.

Verifique:

```bash
grep -RInE \
  "@Post\\('track'\\)|@Get\\(':orderNumber'\\)|findPublic" \
  apps/api/src/orders

grep -RInE \
  "whatsapp/orders/message|whatsapp/orders/:orderNumber|requireCompany" \
  apps/api/src/whatsapp

grep -RInE \
  "pg_advisory_xact_lock|validateCouponInTransaction|companyId" \
  apps/api/src
```

## 9. Corrigir a execução do advisory lock

O PostgreSQL retorna `void` em `pg_advisory_xact_lock`. O Prisma não deve tentar desserializar esse retorno.

Em `apps/api/src/orders/orders.service.ts`, use:

```ts
await tx.$executeRaw`
  SELECT pg_advisory_xact_lock(
    hashtextextended(${prefix}, 0)
  )
`;
```

Não use `$queryRaw` nessa instrução.

## 10. Instalar e gerar o Prisma Client

```bash
pnpm install
pnpm ignored-builds
pnpm api:prisma:generate
```

Valide o schema existente:

```bash
cd apps/api
pnpm exec prisma validate
pnpm exec prisma migrate status
```

## 11. Criar a migration sem aplicá-la automaticamente

Crie somente o SQL:

```bash
pnpm exec prisma migrate dev \
  --create-only \
  --name whatsapp_v0_6_0
```

Localize:

```bash
MIGRATION_DIR="$(
  find prisma/migrations \
    -maxdepth 1 \
    -type d \
    -name '*whatsapp_v0_6_0' |
  sort |
  tail -n 1
)"

echo "$MIGRATION_DIR"
```

## 12. Revisar a migration

```bash
sed -n '1,300p' \
  "$MIGRATION_DIR/migration.sql"
```

A migration deve adicionar ao modelo `Store` somente:

- `whatsappEnabled`;
- `whatsappMessageTemplate`.

Procure operações destrutivas:

```bash
grep -nEi \
  'DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM' \
  "$MIGRATION_DIR/migration.sql" ||
  echo 'Nenhuma operação destrutiva encontrada.'
```

Se o Prisma solicitar reset do banco, interrompa e investigue. Não aceite o reset.

## 13. Aplicar a migration revisada

```bash
pnpm exec prisma migrate deploy
pnpm exec prisma migrate status
```

Esperado:

```text
Database schema is up to date
```

Volte à raiz:

```bash
cd ../..
```

## 14. Executar seed e build

```bash
pnpm api:seed
pnpm build
```

O seed deve gravar `whatsappEnabled` em `Store`, não em `Company`.

## 15. Testar a aplicação

```bash
pnpm dev
```

Teste:

```bash
curl -i http://localhost:3001/api/v1/health
curl -i http://localhost:3001/api/v1/catalog/demo
```

Valide no navegador:

- `/`;
- `/admin`;
- `/admin/pedidos`;
- `/admin/promocoes`;
- `/admin/whatsapp`;
- `/docs` na API.

## 16. Testar autenticação administrativa

Limpe tokens antigos no Console do navegador:

```js
localStorage.removeItem('menu-commerce-token');
window.location.href = '/admin';
```

Faça login novamente. As páginas administrativas devem remover o token e redirecionar ao login quando a API retornar `401`.

## 17. Testar pedidos e WhatsApp

Crie um pedido e confirme:

- número único;
- total recalculado;
- rastreamento com telefone correto;
- `404` com telefone incorreto;
- transições válidas de status;
- cupom aplicado de forma transacional;
- geração segura do link `wa.me`.

Endpoint:

```http
POST /api/v1/whatsapp/orders/message
```

Corpo:

```json
{
  "orderNumber": "20260802-0001",
  "phone": "12999999999"
}
```

O endpoint antigo baseado somente no número não deve existir.

## 18. Rollback

A migration da `v0.6.0` é aditiva. Em rollback de código, as colunas podem permanecer sem impedir a execução da `v0.5.0`.

Para restauração integral:

1. pare a aplicação;
2. restaure o código da tag `v0.5.0`;
3. recrie o banco a partir de `backup_v0.5.0.dump` somente quando necessário;
4. valide migrations, catálogo, pedidos e promoções.

Nunca restaure sobre o banco ativo sem confirmar o destino e possuir um backup atual.
