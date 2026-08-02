# Git e GitHub — MenuCommerce v0.6.0

Este documento define o fluxo de branches, commits, Pull Requests, merges, tag, GitHub Release, artefatos e backups da `v0.6.0`.

## Convenções adotadas

- Branch principal estável: `main`.
- Branch de integração: `develop`.
- Funcionalidades: `feature/<descricao>-v<versao>`.
- Correções: `fix/<descricao>`.
- Correções urgentes de produção: `hotfix/v<versao>`.
- Preparação de release: `release/v<versao>`.
- Commits no padrão Conventional Commits.
- Pull Request de feature para `develop`.
- Pull Request de release para `main`.
- Tag anotada somente depois do merge em `main`.
- GitHub Release baseada na tag publicada.

## 1. Pré-requisitos

```bash
REPO="$HOME/Projetos/menu_commerce/menu-commerce-v0.1.0"
cd "$REPO"

git switch main
git pull --ff-only origin main

git status
node -p "require('./package.json').version"
git tag --list v0.5.0
```

Esperado:

```text
0.5.0
v0.5.0
nothing to commit, working tree clean
```

## 2. Backup Git antes da feature

```bash
ROOT="$HOME/Projetos/menu_commerce"
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

Mirror remoto:

```bash
REMOTE_URL="$(git -C "$REPO" remote get-url origin)"

rm -rf "$BACKUP_DIR/menu-commerce-v0.5.0-github-mirror.git"

git clone --mirror \
  "$REMOTE_URL" \
  "$BACKUP_DIR/menu-commerce-v0.5.0-github-mirror.git"

git -C "$BACKUP_DIR/menu-commerce-v0.5.0-github-mirror.git" \
  fsck --full
```

Compactação:

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

## 3. Sincronizar develop

```bash
cd "$REPO"

git switch develop
git pull --ff-only origin develop
```

Se `main` ainda não estiver contida em `develop`:

```bash
if ! git merge-base --is-ancestor main develop; then
  git merge --no-ff main \
    -m "merge: synchronize v0.5.0 release into develop"
  git push origin develop
fi
```

## 4. Criar a feature

```bash
git switch -c feature/whatsapp-v0.6.0
```

## 5. Copiar a versão operacional

```bash
rsync -a --delete \
  --exclude='.git/' \
  --exclude='.env' \
  --exclude='apps/api/.env' \
  --exclude='.hardening-backup-*' \
  --exclude='node_modules/' \
  --exclude='apps/*/node_modules/' \
  --exclude='apps/api/dist/' \
  --exclude='apps/web/.next/' \
  ../menu-commerce-v0.6.0/ ./
```

Confira:

```bash
git status --short
git diff --stat
git diff --check
```

## 6. Validar antes do commit

Crie temporariamente o ambiente local:

```bash
cp ../menu-commerce-v0.6.0/.env .env
ln -sfn ../../.env apps/api/.env
```

Valide:

```bash
pnpm install
pnpm api:prisma:generate

cd apps/api
pnpm exec prisma validate
pnpm exec prisma migrate status
cd ../..

pnpm build
git diff --check
```

Remova apenas o ambiente temporário do repositório de trabalho:

```bash
rm -f .env apps/api/.env
```

Garanta que não há artefatos:

```bash
git status --short |
  grep -E \
  'node_modules|/dist/|/\.next/|(^|/)\.env$|hardening-backup' ||
  echo 'Nenhum artefato local será versionado.'
```

## 7. Commit da feature

```bash
git add -A

git diff --cached --stat
git diff --cached --check
```

Confirme que `.env` não entrou:

```bash
git diff --cached --name-only |
  grep -E '(^|/)\.env$' ||
  echo 'Nenhum arquivo .env será enviado.'
```

Commit recomendado:

```bash
git commit -m \
  "feat(whatsapp): implement secure order sharing for v0.6.0"
```

Envie:

```bash
git push -u origin feature/whatsapp-v0.6.0
```

## 8. Pull Request: feature para develop

Configuração:

```text
Base: develop
Compare: feature/whatsapp-v0.6.0
```

Título:

```text
feat: implement secure WhatsApp order sharing for MenuCommerce v0.6.0
```

Descrição sugerida:

```markdown
## MenuCommerce v0.6.0 — Integração segura com WhatsApp

### Resumo

Implementa o compartilhamento manual de pedidos pelo WhatsApp por meio do link oficial `wa.me`, preservando o hardening de pedidos, autenticação e promoções.

### Funcionalidades

- Número de WhatsApp configurável por loja
- Ativação ou desativação da integração
- Modelo de mensagem personalizável
- Variáveis para pedido, cliente, itens, totais, endereço e observações
- Geração do link oficial `wa.me`
- Botão após a confirmação do pedido
- Painel administrativo em `/admin/whatsapp`

### Segurança

- Geração da mensagem exige número do pedido e telefone do checkout
- Dados pessoais não podem ser consultados somente pelo número do pedido
- Configurações administrativas são isoladas por empresa
- O sistema não armazena sessão pessoal do WhatsApp
- O sistema não envia mensagens automaticamente
- Tokens administrativos expirados são removidos após resposta `401`

### Hardening preservado

- JWT com `companyId`
- Rastreamento seguro
- Transições de status validadas
- Numeração concorrente protegida
- Cupons validados e consumidos dentro da transação
- Valores recalculados pelo Backend

### Banco de dados

Migration aditiva `whatsapp_v0_6_0`:

- `Store.whatsappEnabled`
- `Store.whatsappMessageTemplate`

### Correções

- Seed ajustado para gravar `whatsappEnabled` em `Store`
- Advisory lock executado com `$executeRaw`
- Documentação atualizada para o fluxo real da v0.6.0

### Validação

- [x] Prisma Client gerado
- [x] Schema validado
- [x] Migration revisada
- [x] Migration aplicada
- [x] Build da API aprovado
- [x] Build do Frontend aprovado
- [x] Login e rotas administrativas testados
- [x] Pedido e rastreamento testados
- [x] Cupons testados
- [x] Link `wa.me` testado
- [x] Telefone incorreto retorna `404`
```

Comentário de aprovação:

```text
Revisão concluída. A migration é aditiva, o build foi aprovado e as proteções de pedidos, promoções e WhatsApp foram preservadas. Aprovado para merge em develop.
```

Mensagem do merge commit:

```text
merge: integrate secure WhatsApp order sharing for v0.6.0
```

## 9. Atualizar develop após o merge

```bash
git switch develop
git pull --ff-only origin develop

node -p "require('./package.json').version"
```

Esperado:

```text
0.6.0
```

## 10. Criar a release branch

```bash
git switch -c release/v0.6.0
```

Valide novamente:

```bash
pnpm install
pnpm api:prisma:generate
pnpm build
git status
```

Envie:

```bash
git push -u origin release/v0.6.0
```

## 11. Pull Request: release para main

Configuração:

```text
Base: main
Compare: release/v0.6.0
```

Título:

```text
release: MenuCommerce v0.6.0 — integração segura com WhatsApp
```

Descrição sugerida:

```markdown
## Release MenuCommerce v0.6.0

### Visão geral

A versão 0.6.0 integra o fluxo de pedidos ao WhatsApp do estabelecimento por meio do link oficial `wa.me`, sem automação de sessão e sem envio automático.

### Destaques

- Configuração de WhatsApp por loja
- Modelo de mensagem personalizável
- Resumo persistido do pedido
- Botão após o checkout
- Painel administrativo de WhatsApp
- Rastreamento protegido por telefone
- Cupons e promoções preservados

### Segurança

- Endpoint público seguro via `POST /api/v1/whatsapp/orders/message`
- Dados pessoais protegidos por número do pedido e telefone
- Isolamento administrativo por empresa
- JWT com `companyId`
- Transições de status validadas
- Numeração concorrente protegida
- Advisory lock executado com `$executeRaw`

### Banco de dados

Migration aditiva `whatsapp_v0_6_0`:

- `Store.whatsappEnabled`
- `Store.whatsappMessageTemplate`

### Checklist

- [x] Backup PostgreSQL da v0.5.0
- [x] Git bundle e mirror da v0.5.0
- [x] Hashes validados
- [x] Migration revisada e aplicada
- [x] Seed executado
- [x] API e Frontend compilados
- [x] Pedido, rastreamento, promoções e WhatsApp testados
- [x] Documentação atualizada

### Rollback

A migration é aditiva. O código pode retornar temporariamente à tag `v0.5.0`. Para restauração integral, utilize os backups PostgreSQL e Git criados antes da atualização.
```

Comentário final:

```text
Release validada. Build, migration, autenticação, pedidos, promoções, rastreamento seguro e integração manual com WhatsApp foram aprovados. Pronta para merge na main e criação da tag v0.6.0.
```

Mensagem do merge:

```text
release: MenuCommerce v0.6.0
```

## 12. Atualizar main e criar a tag

Depois do merge:

```bash
git switch main
git pull --ff-only origin main

node -p "require('./package.json').version"
```

Confira se a tag ainda não existe:

```bash
git tag --list v0.6.0
```

Crie a tag anotada:

```bash
git tag -a v0.6.0 \
  -m "MenuCommerce v0.6.0 - integração segura com WhatsApp"

git push origin v0.6.0
```

Valide:

```bash
git show --stat v0.6.0

git ls-remote --tags origin |
  grep 'refs/tags/v0.6.0'
```

## 13. Gerar artefatos a partir da tag

```bash
mkdir -p ../release-assets/v0.6.0

git archive \
  --format=zip \
  --prefix=menu-commerce-v0.6.0/ \
  --output=../release-assets/v0.6.0/menu-commerce-v0.6.0.zip \
  v0.6.0

git archive \
  --format=tar \
  --prefix=menu-commerce-v0.6.0/ \
  v0.6.0 |
gzip -9 \
  > ../release-assets/v0.6.0/menu-commerce-v0.6.0.tar.gz
```

Hashes:

```bash
cd ../release-assets/v0.6.0

sha256sum \
  menu-commerce-v0.6.0.zip \
  menu-commerce-v0.6.0.tar.gz \
  > menu-commerce-v0.6.0-SHA256SUMS.txt

sha256sum -c menu-commerce-v0.6.0-SHA256SUMS.txt
unzip -t menu-commerce-v0.6.0.zip
tar -tzf menu-commerce-v0.6.0.tar.gz >/dev/null
```

## 14. GitHub Release

Tag:

```text
v0.6.0
```

Título:

```text
MenuCommerce v0.6.0 — Integração segura com WhatsApp
```

Descrição sugerida:

```markdown
# MenuCommerce v0.6.0 — Integração segura com WhatsApp

A versão 0.6.0 permite compartilhar pedidos pelo WhatsApp do estabelecimento usando o link oficial `wa.me`.

## Novidades

- WhatsApp configurável por loja
- Modelo de mensagem personalizável
- Resumo de produtos, adicionais, entrega, desconto e total
- Botão após a confirmação do pedido
- Painel em `/admin/whatsapp`

## Segurança

- Número do pedido e telefone são exigidos
- Dados pessoais não são expostos somente pelo número
- Configurações são isoladas por empresa
- O sistema não armazena sessão do WhatsApp
- O envio permanece manual
- Hardening de pedidos e promoções preservado

## Banco de dados

Migration aditiva `whatsapp_v0_6_0`:

- `Store.whatsappEnabled`
- `Store.whatsappMessageTemplate`

## Correções

- Seed corrigido
- Advisory lock executado com `$executeRaw`
- Sessões administrativas expiradas tratadas corretamente
- Documentação consolidada

## Atualização

Consulte:

- `docs/UPGRADE_0.5_TO_0.6.md`
- `docs/HARDENING_V0.6.0.md`
- `docs/RELEASE_CHECKLIST_V0.6.0.md`

## SHA-256

Consulte o arquivo `menu-commerce-v0.6.0-SHA256SUMS.txt` anexado à release.
```

Anexe:

- `menu-commerce-v0.6.0.zip`;
- `menu-commerce-v0.6.0.tar.gz`;
- `menu-commerce-v0.6.0-SHA256SUMS.txt`.

## 15. Sincronizar develop após a release

```bash
cd "$REPO"

git switch develop
git pull --ff-only origin develop

git merge --no-ff main \
  -m "merge: synchronize v0.6.0 release into develop"

git push origin develop
```

## 16. Backup pós-release

Crie um novo bundle e mirror identificados como `v0.6.0`, valide-os e registre hashes SHA-256.
