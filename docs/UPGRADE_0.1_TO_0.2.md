# Atualização da versão 0.1.0 para 0.2.0

Faça backup do banco antes de atualizar um ambiente que contenha dados importantes.

```bash
git checkout develop
git pull
cp .env.example .env # somente em instalação nova
pnpm install
pnpm api:prisma:generate
pnpm api:prisma:migrate
pnpm api:seed
pnpm dev
```

A migração cria as tabelas de lojas, categorias, produtos, grupos de opções e itens adicionais. O seed adiciona uma loja de demonstração sem remover os usuários existentes.
