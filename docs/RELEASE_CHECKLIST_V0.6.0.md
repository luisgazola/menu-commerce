# Checklist de Release — MenuCommerce v0.6.0

## Código e versionamento

- [ ] `package.json` da raiz está em `0.6.0`.
- [ ] `apps/api/package.json` está em `0.6.0`.
- [ ] `apps/web/package.json` está em `0.6.0`.
- [ ] Health check retorna `0.6.0`.
- [ ] Swagger informa `0.6.0`.
- [ ] `CHANGELOG.md` possui data real da release.
- [ ] README e documentos não contêm funcionalidades futuras já implementadas.

## Infraestrutura e backups

- [ ] PostgreSQL está saudável.
- [ ] Redis responde `PONG`.
- [ ] MongoDB 4.4.29 responde `ping` no ambiente local sem AVX.
- [ ] Backup SQL da v0.5.0 criado.
- [ ] Backup customizado da v0.5.0 criado.
- [ ] `pg_restore -l` validou o backup customizado.
- [ ] Hashes SHA-256 dos backups foram registrados.
- [ ] Git bundle validado.
- [ ] Mirror do GitHub validado com `git fsck --full`.

## Prisma e banco

- [ ] Histórico completo de migrations está presente.
- [ ] `prisma validate` foi aprovado.
- [ ] Migration `whatsapp_v0_6_0` foi criada com `--create-only`.
- [ ] SQL da migration foi revisado.
- [ ] Nenhuma operação destrutiva inesperada foi encontrada.
- [ ] Migration foi aplicada com `migrate deploy`.
- [ ] `migrate status` informa banco atualizado.
- [ ] Seed foi executado sem tentar gravar campos de loja em empresa.

## Build e qualidade

- [ ] `pnpm install` foi concluído.
- [ ] Prisma Client foi gerado.
- [ ] Build da API foi aprovado.
- [ ] Build do Frontend foi aprovado.
- [ ] `git diff --check` não encontrou problemas.
- [ ] `.env`, `node_modules`, `dist`, `.next` e backups locais não estão preparados para commit.

## Pedidos

- [ ] Pedido por retirada foi criado.
- [ ] Pedido por entrega foi criado.
- [ ] Dois pedidos simultâneos receberam números diferentes.
- [ ] Advisory lock usa `$executeRaw`.
- [ ] Rastreamento funciona com telefone correto.
- [ ] Rastreamento retorna `404` com telefone incorreto.
- [ ] Dados pessoais não são expostos na resposta pública.
- [ ] Transições inválidas foram recusadas.
- [ ] Fluxos de entrega e retirada foram respeitados.

## Promoções

- [ ] Cupom percentual foi testado.
- [ ] Cupom fixo foi testado.
- [ ] Frete grátis foi testado.
- [ ] Validade e pedido mínimo foram testados.
- [ ] Limite global foi testado.
- [ ] Limite por cliente foi testado.
- [ ] Primeira compra foi testada.
- [ ] Uso do cupom somente foi registrado após criação do pedido.

## Autenticação e administração

- [ ] Login administrativo funciona.
- [ ] `/auth/me` retorna usuário e `companyId`.
- [ ] Pedidos são limitados à empresa autenticada.
- [ ] Promoções são limitadas à empresa autenticada.
- [ ] WhatsApp é limitado à empresa autenticada.
- [ ] Token expirado é removido do navegador.
- [ ] Resposta `401` redireciona ao login.

## WhatsApp

- [ ] Número com DDI e DDD foi salvo.
- [ ] Integração pode ser habilitada e desabilitada.
- [ ] Modelo padrão funciona quando o campo está vazio.
- [ ] Variáveis personalizadas são substituídas.
- [ ] Link `wa.me` contém telefone e mensagem codificados.
- [ ] Endpoint exige número do pedido e telefone.
- [ ] Telefone incorreto retorna `404`.
- [ ] Endpoint antigo baseado somente no número não existe.
- [ ] Nenhuma sessão do WhatsApp é armazenada.
- [ ] Nenhuma mensagem é enviada automaticamente.

## Git e GitHub

- [ ] Feature foi enviada para `feature/whatsapp-v0.6.0`.
- [ ] Pull Request de feature foi aberto contra `develop`.
- [ ] Revisão e checks foram aprovados.
- [ ] Feature foi mesclada em `develop`.
- [ ] `release/v0.6.0` foi criada a partir de `develop`.
- [ ] Pull Request de release foi aberto contra `main`.
- [ ] Release foi mesclada em `main`.
- [ ] Tag anotada `v0.6.0` foi criada e enviada.
- [ ] ZIP e TAR.GZ foram gerados a partir da tag.
- [ ] Hashes SHA-256 dos artefatos foram validados.
- [ ] GitHub Release foi publicada com os três anexos.
- [ ] `develop` foi sincronizada com `main` após a release.
- [ ] Backup Git pós-release foi criado.
