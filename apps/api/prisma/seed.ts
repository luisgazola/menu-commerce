import {
  DiscountType,
  PaymentProvider,
  PrismaClient,
  ProductOptionType,
  UserRole,
} from '@prisma/client';

import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@local.test';
const ADMIN_PASSWORD = 'Admin@123456';
const STORE_SLUG = 'demo';

async function main(): Promise<void> {
  const passwordHash = await argon2.hash(
    ADMIN_PASSWORD,
  );

  /*
   * Empresa de demonstração
   */
  const company = await prisma.company.upsert({
    where: {
      documentNumber: '12345678000199',
    },

    update: {
      legalName: 'MenuCommerce Demonstração Ltda.',
      tradeName: 'MenuCommerce Demo',
      whatsapp: '5512999999999',
      email: 'contato@menucommerce.local',
    },

    create: {
      legalName: 'MenuCommerce Demonstração Ltda.',
      tradeName: 'MenuCommerce Demo',
      documentNumber: '12345678000199',
      whatsapp: '5512999999999',
      email: 'contato@menucommerce.local',
    },
  });

  /*
   * Administrador local
   */
  const admin = await prisma.user.upsert({
    where: {
      email: ADMIN_EMAIL,
    },

    update: {
      companyId: company.id,
      name: 'Administrador Local',
      passwordHash,
      role: UserRole.ADMIN,
    },

    create: {
      companyId: company.id,
      name: 'Administrador Local',
      email: ADMIN_EMAIL,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  /*
   * Loja de demonstração
   *
   * whatsappEnabled pertence à Store, não à Company.
   */
  const store = await prisma.store.upsert({
    where: {
      slug: STORE_SLUG,
    },

    update: {
      companyId: company.id,
      name: 'MenuCommerce Demo',
      description:
        'Hambúrgueres artesanais e acompanhamentos.',
      whatsapp: '5512999999999',
      whatsappEnabled: true,
      bannerUrl:
        'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1600&q=80',
    },

    create: {
      companyId: company.id,
      name: 'MenuCommerce Demo',
      slug: STORE_SLUG,
      description:
        'Hambúrgueres artesanais e acompanhamentos.',
      whatsapp: '5512999999999',
      whatsappEnabled: true,
      bannerUrl:
        'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1600&q=80',
    },
  });

  /*
   * Configuração de pagamentos da v0.7.0
   *
   * Somente o provedor MOCK está operacional nesta versão.
   * Nenhuma chave privada ou webhook secret é armazenado pelo seed.
   */
  const paymentConfig =
    await prisma.paymentGatewayConfig.upsert({
      where: {
        storeId: store.id,
      },

      update: {
        provider: PaymentProvider.MOCK,
        enabled: true,
        sandbox: true,
        publicKey: null,
        pixEnabled: true,
        creditCardEnabled: true,
        debitCardEnabled: false,
        cashEnabled: true,
        cardOnDeliveryEnabled: true,
      },

      create: {
        storeId: store.id,
        provider: PaymentProvider.MOCK,
        enabled: true,
        sandbox: true,
        publicKey: null,
        pixEnabled: true,
        creditCardEnabled: true,
        debitCardEnabled: false,
        cashEnabled: true,
        cardOnDeliveryEnabled: true,
      },
    });

  /*
   * Categorias
   */
  const burgers = await prisma.category.upsert({
    where: {
      storeId_slug: {
        storeId: store.id,
        slug: 'hamburgueres',
      },
    },

    update: {
      name: 'Hambúrgueres',
      displayOrder: 1,
    },

    create: {
      storeId: store.id,
      name: 'Hambúrgueres',
      slug: 'hamburgueres',
      displayOrder: 1,
    },
  });

  const drinks = await prisma.category.upsert({
    where: {
      storeId_slug: {
        storeId: store.id,
        slug: 'bebidas',
      },
    },

    update: {
      name: 'Bebidas',
      displayOrder: 2,
    },

    create: {
      storeId: store.id,
      name: 'Bebidas',
      slug: 'bebidas',
      displayOrder: 2,
    },
  });

  /*
   * Produto principal
   */
  const burger = await prisma.product.upsert({
    where: {
      storeId_slug: {
        storeId: store.id,
        slug: 'x-bacon-artesanal',
      },
    },

    update: {
      categoryId: burgers.id,
      name: 'X-Bacon Artesanal',
      description:
        'Pão brioche, carne artesanal, queijo, bacon crocante e molho da casa.',
      price: 29.9,
      promotionalPrice: 25.9,
      featured: true,
      preparationTime: 25,
      imageUrl:
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
    },

    create: {
      storeId: store.id,
      categoryId: burgers.id,
      name: 'X-Bacon Artesanal',
      slug: 'x-bacon-artesanal',
      description:
        'Pão brioche, carne artesanal, queijo, bacon crocante e molho da casa.',
      price: 29.9,
      promotionalPrice: 25.9,
      featured: true,
      preparationTime: 25,
      imageUrl:
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
    },
  });

  /*
   * Grupo de adicionais
   */
  const existingGroup =
    await prisma.productOptionGroup.findFirst({
      where: {
        productId: burger.id,
        name: 'Adicionais',
      },

      select: {
        id: true,
      },
    });

  if (!existingGroup) {
    await prisma.productOptionGroup.create({
      data: {
        productId: burger.id,
        name: 'Adicionais',
        type: ProductOptionType.MULTIPLE,
        maximumSelection: 3,

        items: {
          create: [
            {
              name: 'Bacon extra',
              additionalPrice: 4,
              displayOrder: 1,
            },
            {
              name: 'Queijo extra',
              additionalPrice: 3,
              displayOrder: 2,
            },
            {
              name: 'Ovo',
              additionalPrice: 2.5,
              displayOrder: 3,
            },
          ],
        },
      },
    });
  }

  /*
   * Bebida
   */
  await prisma.product.upsert({
    where: {
      storeId_slug: {
        storeId: store.id,
        slug: 'refrigerante-lata',
      },
    },

    update: {
      categoryId: drinks.id,
      name: 'Refrigerante lata',
      description:
        '350 ml, escolha o sabor no atendimento.',
      price: 6,
      imageUrl:
        'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?auto=format&fit=crop&w=900&q=80',
    },

    create: {
      storeId: store.id,
      categoryId: drinks.id,
      name: 'Refrigerante lata',
      slug: 'refrigerante-lata',
      description:
        '350 ml, escolha o sabor no atendimento.',
      price: 6,
      imageUrl:
        'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?auto=format&fit=crop&w=900&q=80',
    },
  });

  /*
   * Cupons
   */
  const now = new Date();

  const endsAt = new Date(
    now.getTime() +
      90 * 24 * 60 * 60 * 1000,
  );

  await prisma.coupon.upsert({
    where: {
      storeId_code: {
        storeId: store.id,
        code: 'BEMVINDO10',
      },
    },

    update: {
      description:
        '10% na primeira compra, limitado a R$ 15,00.',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      minimumOrder: 20,
      maximumDiscount: 15,
      startsAt: now,
      endsAt,
      usagePerCustomer: 1,
      firstOrderOnly: true,
    },

    create: {
      storeId: store.id,
      code: 'BEMVINDO10',
      description:
        '10% na primeira compra, limitado a R$ 15,00.',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      minimumOrder: 20,
      maximumDiscount: 15,
      startsAt: now,
      endsAt,
      usagePerCustomer: 1,
      firstOrderOnly: true,
    },
  });

  await prisma.coupon.upsert({
    where: {
      storeId_code: {
        storeId: store.id,
        code: 'FRETEGRATIS',
      },
    },

    update: {
      description:
        'Frete grátis em pedidos acima de R$ 40,00.',
      discountType: DiscountType.FREE_DELIVERY,
      discountValue: 0,
      minimumOrder: 40,
      maximumDiscount: null,
      startsAt: now,
      endsAt,
      usagePerCustomer: 3,
      firstOrderOnly: false,
    },

    create: {
      storeId: store.id,
      code: 'FRETEGRATIS',
      description:
        'Frete grátis em pedidos acima de R$ 40,00.',
      discountType: DiscountType.FREE_DELIVERY,
      discountValue: 0,
      minimumOrder: 40,
      startsAt: now,
      endsAt,
      usagePerCustomer: 3,
      firstOrderOnly: false,
    },
  });

  console.log({
    status: 'Seed concluído com sucesso.',
    version: '0.7.0',
    companyId: company.id,
    storeId: store.id,
    paymentConfigId: paymentConfig.id,
    adminId: admin.id,
    login: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    paymentProvider: paymentConfig.provider,
  });
}

main()
  .catch((error: unknown) => {
    console.error('Falha ao executar o seed:');
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
