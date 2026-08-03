import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PaymentProvider,
  PaymentStatus,
  RecordStatus,
} from '@prisma/client';

import {
  JwtPayload,
} from '../auth/jwt-payload.interface';

import {
  PrismaService,
} from '../database/prisma.service';

import {
  RefundPaymentDto,
} from './dto/refund-payment.dto';

import {
  TrackPaymentDto,
} from './dto/track-payment.dto';

import {
  UpdatePaymentConfigDto,
} from './dto/update-payment-config.dto';

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async publicMethods(storeSlug: string) {
    const store = await this.prisma.store.findFirst({
      where: {
        slug: storeSlug,
        status: RecordStatus.ACTIVE,
      },

      include: {
        paymentConfig: true,
      },
    });

    if (!store) {
      throw new NotFoundException(
        'Loja não encontrada.',
      );
    }

    const config = store.paymentConfig;

    return {
      pix:
        Boolean(config?.enabled) &&
        Boolean(config?.pixEnabled),

      creditCard:
        Boolean(config?.enabled) &&
        Boolean(config?.creditCardEnabled),

      debitCard:
        Boolean(config?.enabled) &&
        Boolean(config?.debitCardEnabled),

      cash:
        config?.cashEnabled ?? true,

      cardOnDelivery:
        config?.cardOnDeliveryEnabled ?? true,
    };
  }

  async trackOrder(dto: TrackPaymentDto) {
    const orderNumber = dto.orderNumber.trim();
    const suppliedPhone = digitsOnly(dto.phone);

    const order = await this.prisma.order.findUnique({
      where: {
        orderNumber,
      },

      include: {
        customer: true,

        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    const storedPhone = order
      ? digitsOnly(order.customer.phone)
      : '';

    if (
      !order ||
      !suppliedPhone ||
      storedPhone !== suppliedPhone
    ) {
      throw new NotFoundException(
        'Pagamento não encontrado.',
      );
    }

    const payment = order.payments[0];

    if (!payment) {
      throw new NotFoundException(
        'Pagamento não encontrado.',
      );
    }

    return {
      orderNumber: order.orderNumber,

      payment: {
        id: payment.id,
        provider: payment.provider,
        method: payment.method,
        status: payment.status,
        amount: payment.amount,
        pixCode: payment.pixCode,
        pixQrCodeUrl: payment.pixQrCodeUrl,
        approvedAt: payment.approvedAt,
        refundedAt: payment.refundedAt,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
    };
  }

  async getConfig(
    user: JwtPayload,
    storeId: string,
  ) {
    await this.requireStore(user, storeId);

    return this.prisma.paymentGatewayConfig.findUnique({
      where: {
        storeId,
      },
    });
  }

  async updateConfig(
    user: JwtPayload,
    storeId: string,
    dto: UpdatePaymentConfigDto,
  ) {
    await this.requireStore(user, storeId);

    if (dto.provider !== PaymentProvider.MOCK) {
      throw new BadRequestException(
        'Somente o provedor MOCK está disponível na v0.7.0.',
      );
    }

    return this.prisma.paymentGatewayConfig.upsert({
      where: {
        storeId,
      },

      create: {
        storeId,
        provider: PaymentProvider.MOCK,
        enabled: dto.enabled,
        sandbox: true,
        publicKey: dto.publicKey,
        pixEnabled: dto.pixEnabled,
        creditCardEnabled:
          dto.creditCardEnabled,
        debitCardEnabled:
          dto.debitCardEnabled,
        cashEnabled: dto.cashEnabled,
        cardOnDeliveryEnabled:
          dto.cardOnDeliveryEnabled,
      },

      update: {
        provider: PaymentProvider.MOCK,
        enabled: dto.enabled,
        sandbox: true,
        publicKey: dto.publicKey,
        pixEnabled: dto.pixEnabled,
        creditCardEnabled:
          dto.creditCardEnabled,
        debitCardEnabled:
          dto.debitCardEnabled,
        cashEnabled: dto.cashEnabled,
        cardOnDeliveryEnabled:
          dto.cardOnDeliveryEnabled,
      },
    });
  }

  async mockApprove(
    user: JwtPayload,
    paymentId: string,
  ) {
    const companyId = this.requireCompany(user);

    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,

        order: {
          store: {
            companyId,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(
        'Pagamento não encontrado.',
      );
    }

    if (payment.provider !== PaymentProvider.MOCK) {
      throw new BadRequestException(
        'Aprovação simulada disponível apenas para pagamentos MOCK.',
      );
    }

    const approvableStatuses: PaymentStatus[] = [
      PaymentStatus.PENDING,
      PaymentStatus.PROCESSING,
    ];

    if (!approvableStatuses.includes(payment.status)) {
      throw new BadRequestException(
        'O pagamento não pode ser aprovado no status atual.',
      );
    }

    return this.prisma.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        status: PaymentStatus.APPROVED,
        approvedAt: new Date(),

        providerTransactionId:
          payment.providerTransactionId ??
          `mock_${Date.now()}_${payment.id}`,
      },
    });
  }

  async refund(
    user: JwtPayload,
    paymentId: string,
    dto: RefundPaymentDto,
  ) {
    const companyId = this.requireCompany(user);

    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,

        order: {
          store: {
            companyId,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(
        'Pagamento não encontrado.',
      );
    }

    if (payment.status !== PaymentStatus.APPROVED) {
      throw new BadRequestException(
        'Somente pagamentos aprovados podem ser reembolsados.',
      );
    }

    return this.prisma.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        status: PaymentStatus.REFUNDED,
        refundedAt: new Date(),

        failureReason:
          dto.reason?.trim() || null,
      },
    });
  }

  private async requireStore(
    user: JwtPayload,
    storeId: string,
  ) {
    const companyId = this.requireCompany(user);

    const store = await this.prisma.store.findFirst({
      where: {
        id: storeId,
        companyId,
      },

      select: {
        id: true,
      },
    });

    if (!store) {
      throw new NotFoundException(
        'Loja não encontrada.',
      );
    }

    return store;
  }

  private requireCompany(
    user: JwtPayload,
  ): string {
    if (!user.companyId) {
      throw new ForbiddenException(
        'Usuário sem empresa vinculada.',
      );
    }

    return user.companyId;
  }
}
