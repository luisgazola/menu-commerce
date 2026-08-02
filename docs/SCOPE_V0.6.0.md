# Escopo — MenuCommerce v0.6.0

## Objetivo
Integrar o fluxo de pedidos ao WhatsApp do estabelecimento sem armazenar sessões pessoais ou automatizar o WhatsApp Web.

## Entregas
- Número configurável por loja.
- Ativação ou desativação da integração.
- Modelo de mensagem personalizável com variáveis.
- Geração do link oficial `wa.me`.
- Resumo de produtos, adicionais, valores, entrega e observações.
- Botão após a confirmação do pedido.
- Endpoint público que gera a mensagem usando dados persistidos no servidor.
- Painel administrativo em `/admin/whatsapp`.

## Regras
- O número é normalizado para apenas dígitos.
- O pedido precisa existir antes da mensagem ser gerada.
- Valores vêm do pedido gravado, nunca do navegador.
- A versão não envia mensagens automaticamente; abre a conversa para confirmação do usuário.
