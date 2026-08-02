# Changelog

Todas as mudanças relevantes do MenuCommerce são registradas neste arquivo.

O formato segue **Keep a Changelog** e o projeto adota **Versionamento Semântico (SemVer)**.

## [0.6.0] - 2026-08-02

### Adicionado

- Configuração de WhatsApp por loja, com ativação ou desativação da integração.
- Número do estabelecimento normalizado com DDI e DDD.
- Modelo de mensagem personalizável com as variáveis:
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
- Geração de link oficial `wa.me` usando dados persistidos e recalculados pelo Backend.
- Botão para abrir a mensagem do pedido no WhatsApp após o checkout.
- Painel administrativo em `/admin/whatsapp`.
- Campos `Store.whatsappEnabled` e `Store.whatsappMessageTemplate`.
- Migration aditiva `whatsapp_v0_6_0`.
- Documento de hardening da integração com WhatsApp.
- Infraestrutura Docker padronizada para PostgreSQL, Redis e MongoDB 4.4.29 em computadores sem AVX.

### Alterado

- O endpoint público de WhatsApp passou a usar `POST /api/v1/whatsapp/orders/message`.
- A geração da mensagem exige o número do pedido e o telefone informado no checkout.
- As configurações administrativas de WhatsApp passaram a respeitar a empresa do usuário autenticado.
- A tela de pedidos administrativos passou a remover tokens inválidos e redirecionar ao login em respostas `401 Unauthorized`.
- A ajuda do modelo de mensagem passou a explicar o significado de cada variável disponível.
- O `.env.example` passou a usar `JWT_EXPIRES_IN_SECONDS`.
- O fluxo de migration passou a exigir criação com `--create-only`, revisão do SQL e aplicação com `migrate deploy`.

### Corrigido

- Corrigida a criação do número sequencial do pedido para usar bloqueio transacional no PostgreSQL.
- Corrigida a execução de `pg_advisory_xact_lock` para usar `$executeRaw`, evitando erro de desserialização do tipo PostgreSQL `void` pelo Prisma.
- Corrigido o seed que tentava gravar `whatsappEnabled` no modelo `Company`; o campo pertence ao modelo `Store`.
- Corrigida a reutilização de token expirado nas páginas administrativas.
- Corrigidas instruções defasadas sobre checkout, pedidos, promoções e WhatsApp.

### Segurança

- Removida a consulta de pedido de WhatsApp baseada somente em número previsível.
- Dados do cliente e endereço não são retornados sem validação do telefone.
- Pedidos, promoções e configurações de WhatsApp são isolados por empresa.
- Permanece o rastreamento seguro por número do pedido e telefone.
- Permanece a validação das transições de status.
- Permanece a validação e o consumo de cupons dentro da transação.
- Permanece a geração concorrente segura de números de pedido.
- O sistema não armazena sessão pessoal do WhatsApp e não envia mensagens automaticamente.

## [0.5.0] - 2026-08-01

### Adicionado

- Cupons percentuais, de valor fixo e de frete grátis.
- Datas de início e término.
- Valor mínimo do pedido.
- Limite máximo de desconto.
- Limites globais e por cliente.
- Cupom exclusivo para primeira compra.
- Validação pública antes do checkout.
- Revalidação autoritativa durante a criação do pedido.
- Registro transacional em `CouponUsage`.
- Painel administrativo de cupons e estrutura inicial de promoções.
- Campos `Order.discount` e `Order.couponCode`.
- Entidades `Coupon`, `CouponUsage` e `Promotion`.
- Enums `DiscountType` e `PromotionScope`.

### Segurança

- Limites de cupom verificados dentro da transação.
- Valores e descontos recalculados pela API.
- Preservado o isolamento administrativo por empresa.

## [0.4.1] - 2026-08-01

### Corrigido

- Rastreamento público passou a exigir número do pedido e telefone.
- Respostas públicas deixaram de expor dados pessoais e endereço completo.
- Listagem e atualização administrativas passaram a validar a empresa autenticada.
- Transições inválidas de status passaram a ser rejeitadas.
- Pedidos entregues ou cancelados passaram a encerrar o fluxo.
- Retirada e entrega passaram a possuir sequências de status próprias.
- JWT passou a incluir `companyId` e expiração numérica validada.
- Numeração de pedidos passou a usar bloqueio transacional do PostgreSQL.

## [0.4.0] - 2026-07-31

### Adicionado

- Checkout com identificação do cliente.
- Atendimento por entrega ou retirada.
- Cadastro de endereço de entrega.
- Pedidos persistidos no PostgreSQL.
- Itens, opções e valores congelados no momento do pedido.
- Histórico de status.
- Numeração diária de pedidos.
- Acompanhamento público do pedido.
- Painel operacional em `/admin/pedidos`.
- Recálculo autoritativo de produtos, opções e totais pela API.
- Entidades `Customer`, `Address`, `Order`, `OrderItem` e `OrderStatusHistory`.
- Enums `ServiceType` e `OrderStatus`.

## [0.3.0] - 2026-07-30

### Adicionado

- Carrinho lateral responsivo.
- Seleção de opções simples e múltiplas.
- Validação de grupos obrigatórios e limites de seleção.
- Adicionais incorporados ao preço unitário.
- Quantidade e observações por item.
- Incremento, decremento e remoção de itens.
- Subtotal e quantidade total em tempo real.
- Persistência em `localStorage`.
- Mesclagem de itens com configuração idêntica.
- Botão flutuante de acesso ao carrinho.

## [0.2.0] - 2026-07-30

### Adicionado

- Cadastro, edição, listagem e desativação lógica de categorias.
- Cadastro, edição, listagem e desativação lógica de produtos.
- Preço normal e promocional com `Decimal` no PostgreSQL.
- Imagens externas de produtos, logotipo e banner.
- Grupos de opções e itens adicionais.
- Endpoint público de catálogo com pesquisa.
- Cardápio responsivo.
- Painel administrativo inicial do catálogo.
- Loja e catálogo de demonstração no seed.

## [0.1.0] - 2026-07-30

### Adicionado

- Monorepo com pnpm workspaces.
- API NestJS.
- Frontend Next.js.
- PostgreSQL com Prisma.
- Autenticação JWT.
- Empresa, usuário administrador e loja.
- Docker Compose para serviços de infraestrutura.
- Health check e documentação Swagger.
