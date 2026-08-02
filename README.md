# MenuCommerce v0.6.0

MenuCommerce é uma plataforma de cardápio online com catálogo, personalização de produtos, carrinho, checkout, pedidos, cupons, promoções e compartilhamento manual pelo WhatsApp.

A aplicação utiliza um monorepo TypeScript com Next.js no Frontend, NestJS na API, Prisma e PostgreSQL como persistência autoritativa.

## Estado da versão

A `v0.6.0` inclui o fluxo funcional completo desde a publicação do catálogo até a operação do pedido:

1. o cliente acessa o cardápio público;
2. personaliza produtos e monta o carrinho;
3. informa seus dados e escolhe entrega ou retirada;
4. aplica um cupom quando disponível;
5. a API consulta novamente produtos e opções e recalcula todos os valores;
6. o pedido é persistido no PostgreSQL;
7. o cliente acompanha o status usando número do pedido e telefone;
8. a equipe administra pedidos, promoções e WhatsApp;
9. o cliente pode abrir uma mensagem pronta no WhatsApp do estabelecimento.

## Funcionalidades atuais

### Catálogo e produtos

- Categorias e produtos por loja.
- Preço normal e promocional.
- Produtos em destaque.
- Imagens externas.
- Tempo de preparo.
- Pesquisa por nome e descrição.
- Grupos de opções simples ou múltiplas.
- Adicionais com impacto no preço.
- Desativação lógica de registros.

### Carrinho

- Carrinho lateral responsivo.
- Quantidade e observações por item.
- Validação de grupos obrigatórios.
- Limites mínimo e máximo de seleção.
- Mesclagem de itens com configuração idêntica.
- Persistência local no navegador.
- Subtotal em tempo real.

O subtotal exibido no navegador é apenas informativo. A API recalcula produtos, opções, descontos, entrega e total antes de criar o pedido.

### Checkout e pedidos

- Identificação do cliente.
- Entrega ou retirada.
- Endereço de entrega.
- Pedido persistido no PostgreSQL.
- Itens e valores congelados no momento da compra.
- Numeração diária do pedido.
- Histórico de status.
- Painel operacional em `/admin/pedidos`.
- Fluxos específicos para entrega e retirada.

### Cupons e promoções

- Cupom percentual.
- Cupom de valor fixo.
- Frete grátis.
- Período de validade.
- Valor mínimo do pedido.
- Desconto máximo.
- Limites globais e por cliente.
- Restrição de primeira compra.
- Validação e consumo dentro da transação do pedido.
- Painel administrativo em `/admin/promocoes`.

### WhatsApp

- Número configurável por loja.
- Ativação ou desativação da integração.
- Modelo de mensagem personalizável.
- Link oficial `wa.me`.
- Resumo persistido do pedido.
- Botão após a confirmação do checkout.
- Painel administrativo em `/admin/whatsapp`.

O MenuCommerce não armazena sessões pessoais do WhatsApp, não controla o WhatsApp Web e não envia mensagens automaticamente. O usuário confirma manualmente o envio.

## Segurança implementada

- Senhas protegidas com Argon2.
- Rotas administrativas protegidas por JWT.
- JWT inclui `companyId` para isolamento multiempresa.
- Expiração configurada por `JWT_EXPIRES_IN_SECONDS`.
- Pedidos e configurações administrativas limitados à empresa autenticada.
- Rastreamento público exige número do pedido e telefone.
- Respostas públicas não expõem dados pessoais desnecessários.
- Transições de status são validadas pelo Backend.
- Numeração concorrente usa bloqueio transacional do PostgreSQL.
- Cupons são revalidados e consumidos dentro da transação.
- Tokens administrativos expirados são removidos do navegador após resposta `401`.
- Valores recebidos do navegador nunca são tratados como fonte autoritativa.

## Stack

| Camada | Tecnologia |
|---|---|
| Monorepo | pnpm workspaces |
| Frontend | Next.js 15, React 19, TypeScript |
| API | NestJS 11, TypeScript |
| ORM | Prisma 6 |
| Banco principal | PostgreSQL 16 |
| Autenticação | JWT, Passport e Argon2 |
| Cache preparado | Redis 7 |
| Documento preparado | MongoDB 4.4.29 no ambiente local sem AVX |
| Infraestrutura | Docker Compose |
| Documentação da API | Swagger/OpenAPI |

### PostgreSQL, Redis e MongoDB

Na `v0.6.0`, o PostgreSQL é a fonte autoritativa dos dados da aplicação.

Redis e MongoDB estão provisionados na infraestrutura para evoluções futuras, mas o código atual não possui cliente MongoDB ou Redis ativo. Em computadores sem AVX, o ambiente local utiliza `mongo:4.4.29` por compatibilidade. Essa versão está fora de suporte e não deve ser exposta publicamente; em produção, utilize uma versão suportada em servidor compatível ou serviço gerenciado.

## Estrutura principal

```text
menu-commerce-v0.6.0/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   └── src/
│   └── web/
│       └── src/app/
├── docs/
├── docker-compose.yml
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

## Requisitos

- Node.js 20 ou superior.
- pnpm 10.13.1 ou compatível.
- Docker e Docker Compose.
- PostgreSQL 16 pelo Compose.
- Redis 7 pelo Compose.
- MongoDB 4.4.29 somente quando necessário no computador local sem AVX.

## Configuração

Copie o ambiente de exemplo:

```bash
cp .env.example .env
```

Variáveis essenciais:

```env
NODE_ENV=development
API_PORT=3001
WEB_PORT=3000
DATABASE_URL=postgresql://menu:menu@127.0.0.1:5432/menu_commerce?schema=public
JWT_SECRET=troque-por-uma-chave-grande-e-aleatoria
JWT_EXPIRES_IN_SECONDS=86400
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_STORE_SLUG=demo
COMPOSE_PROJECT_NAME=menu-commerce-v010
```

O arquivo `.env` não deve ser versionado.

## Infraestrutura Docker

Inicie os serviços:

```bash
sudo docker compose -p menu-commerce-v010 up -d postgres mongodb redis
```

Verifique:

```bash
sudo docker compose -p menu-commerce-v010 ps
```

Teste os serviços:

```bash
sudo docker exec menu-commerce-postgres \
  pg_isready -U menu -d menu_commerce

sudo docker exec menu-commerce-mongodb \
  mongo \
  --username menu \
  --password menu \
  --authenticationDatabase admin \
  --quiet \
  --eval 'db.adminCommand({ ping: 1 })'

sudo docker exec menu-commerce-redis redis-cli ping
```

Nunca execute `docker compose down -v` em um ambiente com dados que precisam ser preservados.

## Instalação

```bash
pnpm install
pnpm api:prisma:generate
```

Aplique as migrations já versionadas:

```bash
cd apps/api
pnpm exec prisma validate
pnpm exec prisma migrate deploy
cd ../..
```

Execute o seed de demonstração:

```bash
pnpm api:seed
```

Compile:

```bash
pnpm build
```

Inicie em desenvolvimento:

```bash
pnpm dev
```

## Criação segura de novas migrations

Durante o desenvolvimento de uma alteração de schema, não aplique uma migration nova sem revisar seu SQL.

```bash
cd apps/api
pnpm exec prisma migrate dev \
  --create-only \
  --name nome_da_migration
```

Revise `prisma/migrations/<data>_nome_da_migration/migration.sql`, confirme que não há operações destrutivas inesperadas e aplique:

```bash
pnpm exec prisma migrate deploy
```

Nunca aceite reset do banco quando houver dados que precisam ser preservados.

## Acessos locais

| Recurso | Endereço |
|---|---|
| Cardápio | `http://localhost:3000` |
| Administração | `http://localhost:3000/admin` |
| Pedidos | `http://localhost:3000/admin/pedidos` |
| Promoções | `http://localhost:3000/admin/promocoes` |
| WhatsApp | `http://localhost:3000/admin/whatsapp` |
| API | `http://localhost:3001/api/v1` |
| Swagger | `http://localhost:3001/docs` |

Login local do seed:

```text
E-mail: admin@local.test
Senha: Admin@123456
```

Essas credenciais são somente para desenvolvimento local.

## Endpoints principais

### Públicos

```http
GET  /api/v1/health
GET  /api/v1/catalog/:storeSlug
POST /api/v1/auth/login
POST /api/v1/orders
POST /api/v1/orders/track
POST /api/v1/coupons/validate
POST /api/v1/whatsapp/orders/message
```

O endpoint seguro do WhatsApp recebe:

```json
{
  "orderNumber": "20260802-0001",
  "phone": "12999999999"
}
```

### Administrativos

```http
GET   /api/v1/auth/me
GET   /api/v1/admin/orders
PATCH /api/v1/admin/orders/:id/status
GET   /api/v1/admin/coupons
POST  /api/v1/admin/coupons
GET   /api/v1/admin/promotions
POST  /api/v1/admin/promotions
GET   /api/v1/admin/stores/:storeId/whatsapp
PATCH /api/v1/admin/stores/:storeId/whatsapp
```

Consulte o Swagger para a relação completa.

## Variáveis do modelo de WhatsApp

| Variável | Conteúdo |
|---|---|
| `{{orderNumber}}` | Número do pedido |
| `{{customerName}}` | Nome do cliente |
| `{{serviceType}}` | Entrega ou retirada |
| `{{items}}` | Produtos, quantidades e adicionais |
| `{{subtotal}}` | Subtotal do pedido |
| `{{deliveryFee}}` | Taxa de entrega |
| `{{discount}}` | Desconto aplicado |
| `{{total}}` | Valor final |
| `{{address}}` | Endereço de entrega ou indicação de retirada |
| `{{notes}}` | Observações do pedido |

Deixe o campo de modelo vazio para utilizar o modelo padrão da aplicação.

## Validação mínima antes de commit ou release

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

Também teste manualmente:

- login administrativo;
- catálogo e personalização;
- criação de pedido;
- rastreamento com telefone correto e incorreto;
- transições de status;
- cupons válidos e inválidos;
- geração do link do WhatsApp;
- expiração ou remoção do token administrativo.

## Backups

Antes de migrations e releases, crie:

- backup SQL do PostgreSQL;
- backup customizado com `pg_dump -Fc`;
- arquivo SHA-256 dos backups;
- Git bundle com todas as referências;
- clone mirror do repositório remoto.

Os comandos completos estão em `docs/UPGRADE_0.5_TO_0.6.md` e `docs/GIT_V0.6.0.md`.

## Documentação

- `docs/SCOPE_V0.6.0.md` — escopo funcional.
- `docs/HARDENING_V0.6.0.md` — segurança e correções.
- `docs/UPGRADE_0.5_TO_0.6.md` — atualização e migration.
- `docs/GIT_V0.6.0.md` — branches, Pull Requests, tag e release.
- `docs/RELEASE_CHECKLIST_V0.6.0.md` — validação final.

## Convenções

- Versionamento Semântico.
- Changelog no formato Keep a Changelog.
- Conventional Commits.
- Branches `feature/*`, `fix/*`, `hotfix/*` e `release/*`.
- Pull Request de feature para `develop`.
- Pull Request de release para `main`.
- Tags anotadas no formato `vMAJOR.MINOR.PATCH`.
- Migrations sempre versionadas e revisadas antes da aplicação.
