# MenuCommerce v0.5.0 — Cupons e Promoções

## Escopo

- Cupons percentuais, de valor fixo e frete grátis.
- Pedido mínimo e desconto máximo.
- Período de validade.
- Limite total e limite por cliente.
- Cupom exclusivo para primeira compra.
- Validação pública antes do checkout.
- Revalidação obrigatória durante a criação do pedido.
- Registro do uso do cupom e desconto no pedido.
- Painel administrativo de cupons.
- Estrutura inicial para promoções por loja, categoria ou produto.

## Regras principais

1. O desconto é sempre recalculado pela API.
2. Cupons expirados, inativos ou fora do período são rejeitados.
3. O total nunca pode ficar negativo.
4. Frete grátis só produz efeito em pedidos para entrega.
5. O uso é registrado na mesma transação que cria o pedido.
6. Um pedido não pode registrar o mesmo uso de cupom duas vezes.
