# Changelog

## [0.5.0] - 2026-07-29

### Adicionado

- Cupons percentuais, fixos e de frete grátis.
- Validade, pedido mínimo, desconto máximo e limites de uso.
- Restrição de primeira compra.
- Registro transacional do uso do cupom.
- Painel administrativo de cupons e estrutura de promoções.
- Desconto e código do cupom registrados no pedido.

## [0.4.0] - 2026-07-29

### Adicionado
- Carrinho lateral responsivo no cardápio público.
- Seleção funcional de opções simples e múltiplas.
- Validação de opções obrigatórias, quantidade mínima e máxima.
- Adicionais incorporados ao valor unitário.
- Quantidade e observações por item.
- Incremento, decremento e remoção de itens do carrinho.
- Subtotal e quantidade total em tempo real.
- Persistência do carrinho em `localStorage`.
- Mesclagem de produtos com configuração idêntica.
- Botão flutuante de acesso rápido ao carrinho.
- Utilitários TypeScript isolados para cálculos do carrinho.

### Alterado
- Versões do monorepo, API, Swagger e interface para 0.4.0.
- Botões de produtos agora abrem a personalização e adicionam itens ao carrinho.

### Segurança e regra de negócio
- A interface deixa explícito que o subtotal local não substitui a validação futura no servidor.
- Nenhum dado de pagamento ou informação sensível é armazenado no carrinho local.

## [0.2.0] - 2026-07-29

### Adicionado
- Cadastro, edição, listagem e desativação lógica de categorias.
- Cadastro, edição, listagem e desativação lógica de produtos.
- Preço normal e promocional usando Decimal no PostgreSQL.
- Imagens externas de produtos, logotipo e banner da loja.
- Grupos de opções e itens adicionais por produto.
- Endpoint público de cardápio com pesquisa por nome e descrição.
- Cardápio responsivo para celular, tablet e desktop.
- Painel administrativo inicial para categorias e produtos.
- Loja de demonstração e catálogo de exemplo no seed.

## [0.1.0] - 2026-07-29
- Fundação do monorepo, autenticação, empresa e infraestrutura.
