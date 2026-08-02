# Hardening — MenuCommerce v0.6.0

Este documento registra as proteções aplicadas à integração com WhatsApp e as correções preservadas das versões anteriores.

## Pedidos

- Rastreamento público por número do pedido e telefone.
- Respostas públicas sem dados pessoais desnecessários.
- Isolamento administrativo por `companyId`.
- Transições de status validadas pelo Backend.
- Fluxos separados para entrega e retirada.
- Pedidos entregues ou cancelados não retornam ao fluxo.
- Número do pedido gerado dentro da transação.
- Bloqueio concorrente com `pg_advisory_xact_lock`.
- Execução do bloqueio com `$executeRaw`, pois a função PostgreSQL retorna `void`.

## Promoções

- Cupom revalidado durante a criação do pedido.
- Limites globais e por cliente verificados dentro da transação.
- Registro em `CouponUsage` criado somente quando o pedido é confirmado.
- Desconto e frete recalculados pelo servidor.

## Autenticação

- JWT inclui `sub`, `email`, `role` e `companyId`.
- Expiração configurada por `JWT_EXPIRES_IN_SECONDS`.
- Páginas administrativas removem tokens expirados após `401`.
- Usuário é redirecionado ao login quando a sessão não é mais válida.

## WhatsApp

- O endpoint inseguro `GET /whatsapp/orders/:orderNumber` foi removido.
- O endpoint atual é `POST /api/v1/whatsapp/orders/message`.
- A requisição exige número do pedido e telefone usado no checkout.
- Quando os dados não coincidem, a API retorna `404` genérico.
- Configuração de WhatsApp é restrita à empresa autenticada.
- O telefone do estabelecimento é normalizado para dígitos.
- A mensagem utiliza valores persistidos no pedido.
- O sistema não armazena sessão pessoal do WhatsApp.
- O sistema não automatiza o WhatsApp Web.
- O envio depende de confirmação manual do usuário.

## Modelo de mensagem

Variáveis permitidas:

- `{{orderNumber}}`;
- `{{customerName}}`;
- `{{serviceType}}`;
- `{{items}}`;
- `{{subtotal}}`;
- `{{deliveryFee}}`;
- `{{discount}}`;
- `{{total}}`;
- `{{address}}`;
- `{{notes}}`.

Variáveis desconhecidas não devem executar código nem acessar propriedades arbitrárias. A substituição deve ocorrer somente sobre a lista permitida.

## Seed

`whatsappEnabled` e `whatsappMessageTemplate` pertencem ao modelo `Store`. O seed não deve tentar gravá-los em `Company`.

## Banco de dados

A migration `whatsapp_v0_6_0` é aditiva e deve adicionar somente:

- `Store.whatsappEnabled`;
- `Store.whatsappMessageTemplate`.

O fluxo obrigatório é:

1. criar com `--create-only`;
2. revisar o SQL;
3. procurar operações destrutivas;
4. aplicar com `migrate deploy`;
5. validar com `migrate status`.

## Infraestrutura local

- PostgreSQL 16 é a fonte autoritativa.
- Redis 7 está provisionado para evoluções futuras.
- MongoDB 4.4.29 é usado somente por compatibilidade local em CPU sem AVX.
- MongoDB 4.4 está fora de suporte e não deve ser exposto à internet.
- Os serviços devem publicar portas apenas em `127.0.0.1` no ambiente local.
- Os volumes precisam possuir nomes explícitos para serem reutilizados entre versões.
- Nunca executar `docker compose down -v` sem intenção explícita de apagar dados.

## Verificações mínimas

```bash
grep -RInE \
  "@Post\\('track'\\)|@Get\\(':orderNumber'\\)|findPublic" \
  apps/api/src/orders

grep -RInE \
  "whatsapp/orders/message|whatsapp/orders/:orderNumber|requireCompany" \
  apps/api/src/whatsapp

grep -RInE \
  "pg_advisory_xact_lock|\\$executeRaw|validateCouponInTransaction|companyId" \
  apps/api/src
```

Além das buscas estáticas, devem ser testados:

- telefone correto e incorreto no rastreamento;
- telefone correto e incorreto na geração do WhatsApp;
- acesso de uma empresa aos dados de outra;
- token expirado;
- pedidos simultâneos;
- transições inválidas;
- cupom no limite global e por cliente.
