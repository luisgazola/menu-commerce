# Escopo da versão 0.1.0

## Objetivo

Estabelecer uma fundação executável, segura e evolutiva para o MenuCommerce.

## Incluído

1. Estrutura monorepo.
2. API NestJS.
3. Interface Next.js.
4. PostgreSQL e Prisma ORM.
5. MongoDB e Redis provisionados.
6. Autenticação administrativa JWT.
7. Cadastro básico da empresa.
8. Seed do administrador.
9. Swagger.
10. Docker Compose.

## Não incluído

- Produtos e categorias.
- Carrinho.
- Checkout.
- Pedidos.
- Cupons e promoções.
- Estoque.
- Pagamentos.
- WhatsApp.
- Tributação por produto.
- Relatórios.

## Critérios de aceite

- A infraestrutura sobe pelo Docker Compose.
- A migração cria as tabelas no PostgreSQL.
- O seed cadastra o administrador.
- O administrador consegue autenticar-se.
- Uma rota protegida rejeita tokens ausentes ou inválidos.
- O administrador consegue cadastrar e consultar a empresa.
- A documentação Swagger é carregada.
- A interface web comunica-se com a API.
