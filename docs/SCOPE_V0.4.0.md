# MenuCommerce v0.4.1 — Pedidos e Checkout

## Entregas

- Identificação do cliente por nome, telefone e e-mail opcional.
- Seleção entre retirada no local e entrega.
- Cadastro do endereço de entrega.
- Validação integral do carrinho na API.
- Recálculo de produtos e adicionais no PostgreSQL.
- Criação transacional de cliente, endereço, pedido, itens e histórico.
- Número diário de pedido no formato `AAAAMMDD-0001`.
- Consulta pública e acompanhamento do pedido.
- Painel administrativo para operação e alteração de status.
- Histórico de transições do pedido.

## Estados

`RECEIVED`, `CONFIRMED`, `PREPARING`, `READY`, `OUT_FOR_DELIVERY`, `DELIVERED` e `CANCELLED`.

## Limites deliberados

Pagamento, cupom, promoção, cálculo geográfico de frete e WhatsApp permanecem para versões posteriores. A taxa de entrega de demonstração é R$ 5,00 e deverá tornar-se configurável.
