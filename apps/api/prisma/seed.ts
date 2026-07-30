import { PrismaClient, ProductOptionType, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
const prisma = new PrismaClient();
async function main(): Promise<void> {
  const company = await prisma.company.upsert({ where: { documentNumber: '12345678000199' }, update: {}, create: { legalName: 'MenuCommerce Demonstração Ltda.', tradeName: 'MenuCommerce Demo', documentNumber: '12345678000199', whatsapp: '5512999999999', email: 'contato@menucommerce.local' } });
  await prisma.user.upsert({ where: { email: 'admin@local.test' }, update: { companyId: company.id }, create: { companyId: company.id, name: 'Administrador Local', email: 'admin@local.test', passwordHash: await argon2.hash('Admin@123456'), role: UserRole.ADMIN } });
  const store = await prisma.store.upsert({ where: { slug: 'demo' }, update: {}, create: { companyId: company.id, name: 'MenuCommerce Demo', slug: 'demo', description: 'Hambúrgueres artesanais e acompanhamentos.', whatsapp: '5512999999999', bannerUrl: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1600&q=80' } });
  const burgers = await prisma.category.upsert({ where: { storeId_slug: { storeId: store.id, slug: 'hamburgueres' } }, update: {}, create: { storeId: store.id, name: 'Hambúrgueres', slug: 'hamburgueres', displayOrder: 1 } });
  const drinks = await prisma.category.upsert({ where: { storeId_slug: { storeId: store.id, slug: 'bebidas' } }, update: {}, create: { storeId: store.id, name: 'Bebidas', slug: 'bebidas', displayOrder: 2 } });
  const burger = await prisma.product.upsert({ where: { storeId_slug: { storeId: store.id, slug: 'x-bacon-artesanal' } }, update: {}, create: { storeId: store.id, categoryId: burgers.id, name: 'X-Bacon Artesanal', slug: 'x-bacon-artesanal', description: 'Pão brioche, carne artesanal, queijo, bacon crocante e molho da casa.', price: 29.9, promotionalPrice: 25.9, featured: true, preparationTime: 25, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80' } });
  const existingGroup = await prisma.productOptionGroup.findFirst({ where: { productId: burger.id, name: 'Adicionais' } });
  if (!existingGroup) {
    await prisma.productOptionGroup.create({ data: { productId: burger.id, name: 'Adicionais', type: ProductOptionType.MULTIPLE, maximumSelection: 3, items: { create: [{ name: 'Bacon extra', additionalPrice: 4, displayOrder: 1 }, { name: 'Queijo extra', additionalPrice: 3, displayOrder: 2 }, { name: 'Ovo', additionalPrice: 2.5, displayOrder: 3 }] } } });
  }
  await prisma.product.upsert({ where: { storeId_slug: { storeId: store.id, slug: 'refrigerante-lata' } }, update: {}, create: { storeId: store.id, categoryId: drinks.id, name: 'Refrigerante lata', slug: 'refrigerante-lata', description: '350 ml, escolha o sabor no atendimento.', price: 6, imageUrl: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?auto=format&fit=crop&w=900&q=80' } });
  console.log({ companyId: company.id, storeId: store.id, login: 'admin@local.test', password: 'Admin@123456' });
}
main().finally(() => prisma.$disconnect());
