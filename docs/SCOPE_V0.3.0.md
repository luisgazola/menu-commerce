# Escopo — MenuCommerce v0.4.1

## Objetivo

Transformar o catálogo da v0.2.0 em uma experiência real de montagem de pedido no navegador.

## Requisitos funcionais atendidos

- RF-CART-001: adicionar produto ao carrinho.
- RF-CART-002: selecionar opções simples e múltiplas.
- RF-CART-003: validar opções obrigatórias.
- RF-CART-004: impedir seleção acima do limite do grupo.
- RF-CART-005: informar quantidade.
- RF-CART-006: incluir observação por item.
- RF-CART-007: alterar quantidade no carrinho.
- RF-CART-008: remover item.
- RF-CART-009: calcular subtotal.
- RF-CART-010: persistir carrinho no navegador.
- RF-CART-011: restaurar carrinho após recarregar a página.
- RF-CART-012: juntar itens com produto, opções e observação idênticos.

## Requisitos não funcionais

- Interface responsiva.
- Cálculos monetários locais normalizados como números para apresentação.
- Componentes sem dependências adicionais.
- Estado persistido somente no navegador.
- Nenhuma credencial ou dado de pagamento salvo no `localStorage`.
- Preparação para validação autoritativa do servidor na v0.4.1.

## Fora do escopo

- Cadastro do cliente.
- Endereço e cálculo de entrega.
- Criação de pedido no PostgreSQL.
- Cupom e promoção aplicados ao carrinho.
- Pagamentos.
- Integração com WhatsApp.
