# Hardening da v0.5.0

A v0.5.0 mantém cupons e promoções e incorpora as correções de segurança da v0.4.1:

- rastreamento por número do pedido e telefone;
- respostas públicas sem cliente ou endereço;
- JWT com `companyId`;
- isolamento de pedidos, cupons e promoções por empresa;
- transições de status validadas;
- numeração de pedidos protegida por advisory lock;
- telefone normalizado;
- validação e registro de uso do cupom dentro da transação;
- limites de cupom protegidos contra concorrência.

Não há alteração adicional do schema além da migration `promotions_v0_5_0`.
