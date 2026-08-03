import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { OrderStatus,
  Prisma,
  RecordStatus,
  ServiceType,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
} from '@prisma/client';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../database/prisma.service';
import { PromotionsService } from '../promotions/promotions.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { TrackOrderDto } from './dto/track-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

const decimal = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);
const digitsOnly = (value: string) => value.replace(/\D/g, '');

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  RECEIVED: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
  READY: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED: [],
  CANCELLED: []
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly promotions: PromotionsService
  ) {}

  async create(dto: CreateOrderDto) {
    const store = await this.prisma.store.findFirst({
      where: { slug: dto.storeSlug, status: RecordStatus.ACTIVE }
    });
    if (!store) throw new NotFoundException('Loja não encontrada.');
    if (!store.isOpen) throw new BadRequestException('A loja está fechada para novos pedidos.');
    if (dto.serviceType === 'DELIVERY' && !dto.address) {
      throw new BadRequestException('Informe o endereço de entrega.');
    }

    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, storeId: store.id, status: RecordStatus.ACTIVE },
      include: {
        optionGroups: {
          include: { items: { where: { status: RecordStatus.ACTIVE } } }
        }
      }
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException('Um ou mais produtos não estão disponíveis.');
    }

    let subtotal = decimal(0);
    const normalized = dto.items.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId)!;
      const validOptions = product.optionGroups.flatMap((group) => group.items);
      const uniqueOptionIds = [...new Set(item.optionItemIds)];
      const selected = uniqueOptionIds
        .map((id) => validOptions.find((option) => option.id === id))
        .filter(Boolean) as typeof validOptions;

      if (selected.length !== uniqueOptionIds.length) {
        throw new BadRequestException(`Adicional inválido em ${product.name}.`);
      }

      for (const group of product.optionGroups) {
        const count = selected.filter((option) => option.groupId === group.id).length;
        const minimum = group.required
          ? Math.max(1, group.minimumSelection)
          : group.minimumSelection;
        if (count < minimum || count > group.maximumSelection) {
          throw new BadRequestException(`Seleção inválida em ${group.name}.`);
        }
      }

      const basePrice = product.promotionalPrice ?? product.price;
      const optionsTotal = selected.reduce(
        (sum, option) => sum.plus(option.additionalPrice),
        decimal(0)
      );
      const unitPrice = decimal(basePrice).plus(optionsTotal);
      const totalPrice = unitPrice.mul(item.quantity);
      subtotal = subtotal.plus(totalPrice);
      return { item, product, selected, optionsTotal, unitPrice, totalPrice };
    });

    const customerPhone = digitsOnly(dto.customer.phone);


    const paymentMethod =
      (dto.paymentMethod ??
        PaymentMethod.CASH) as PaymentMethod;

    const paymentConfig =
      await this.prisma.paymentGatewayConfig.findUnique({
        where: {
          storeId: store.id,
        },
      });

    const paymentEnabled: Record<
      PaymentMethod,
      boolean
    > = {
      [PaymentMethod.PIX]:
        Boolean(paymentConfig?.enabled) &&
        Boolean(paymentConfig?.pixEnabled),

      [PaymentMethod.CREDIT_CARD]:
        Boolean(paymentConfig?.enabled) &&
        Boolean(paymentConfig?.creditCardEnabled),

      [PaymentMethod.DEBIT_CARD]:
        Boolean(paymentConfig?.enabled) &&
        Boolean(paymentConfig?.debitCardEnabled),

      [PaymentMethod.CASH]:
        paymentConfig?.cashEnabled ?? true,

      [PaymentMethod.CARD_ON_DELIVERY]:
        paymentConfig?.cardOnDeliveryEnabled ?? true,
    };

    if (!paymentEnabled[paymentMethod]) {
      throw new BadRequestException(
        'Forma de pagamento indisponível para esta loja.',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let deliveryFee = dto.serviceType === 'DELIVERY' ? decimal(5) : decimal(0);
      let discount = decimal(0);
      let couponId: string | undefined;
      let couponCode: string | undefined;

      if (dto.couponCode) {
        const coupon = await this.promotions.validateCouponInTransaction(tx, {
          storeSlug: dto.storeSlug,
          code: dto.couponCode,
          customerPhone,
          subtotal: subtotal.toNumber(),
          serviceType: dto.serviceType
        });
        discount = decimal(coupon.discount);
        couponId = coupon.couponId;
        couponCode = coupon.code;
        if (coupon.freeDelivery) deliveryFee = decimal(0);
      }

      const total = Prisma.Decimal.max(
        decimal(0),
        subtotal.plus(deliveryFee).minus(discount)
      );
      const orderNumber = await this.nextOrderNumber(tx);

      const customer = await tx.customer.create({
        data: {
          name: dto.customer.name.trim(),
          phone: customerPhone,
          email: dto.customer.email?.trim().toLowerCase()
        }
      });
      const address = dto.address
        ? await tx.address.create({
            data: {
              ...dto.address,
              state: dto.address.state.trim().toUpperCase(),
              customerId: customer.id
            }
          })
        : null;

      const order = await tx.order.create({
        data: {
          storeId: store.id,
          customerId: customer.id,
          addressId: address?.id,
          orderNumber,
          serviceType: dto.serviceType as ServiceType,
          subtotal,
          deliveryFee,
          discount,
          couponCode,
          total,
          notes: dto.notes,
          items: {
            create: normalized.map(
              ({ item, product, selected, optionsTotal, unitPrice, totalPrice }) => ({
                productId: product.id,
                productNameSnapshot: product.name,
                unitPrice,
                quantity: item.quantity,
                optionsTotal,
                totalPrice,
                notes: item.notes,
                options: selected.map((option) => ({
                  id: option.id,
                  name: option.name,
                  additionalPrice: option.additionalPrice.toString()
                }))
              })
            )
          },
          statusLog: {
            create: { status: OrderStatus.RECEIVED, note: 'Pedido criado pelo cardápio.' }
          },
          payments: {
            create: {
              provider: PaymentProvider.MOCK,
              method: paymentMethod,
              status:
                paymentMethod === PaymentMethod.CASH ||
                paymentMethod === PaymentMethod.CARD_ON_DELIVERY
                  ? PaymentStatus.PENDING
                  : PaymentStatus.PROCESSING,
              amount: total,
            },
          }
        }
      });

      if (couponId) {
        await tx.couponUsage.create({
          data: {
            couponId,
            orderId: order.id,
            customerPhone,
            discount
          }
        });
      }

      return order;
    });

    return {
      orderNumber: result.orderNumber,
      status: result.status,
      serviceType: result.serviceType,
      subtotal: result.subtotal,
      deliveryFee: result.deliveryFee,
      discount: result.discount,
      couponCode: result.couponCode,
      total: result.total,
      createdAt: result.createdAt
    };
  }

  private async nextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
    const date = new Date();
    const prefix =
      `${date.getFullYear()}` +
      `${String(date.getMonth() + 1).padStart(2, '0')}` +
      `${String(date.getDate()).padStart(2, '0')}`;

    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${prefix}, 0))`;

    const count = await tx.order.count({
      where: { orderNumber: { startsWith: `${prefix}-` } }
    });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  async track(dto: TrackOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber: dto.orderNumber.trim() },
      include: {
        customer: true,
        items: true,
        statusLog: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!order || digitsOnly(order.customer.phone) !== digitsOnly(dto.phone)) {
      throw new NotFoundException('Pedido não encontrado.');
    }

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      serviceType: order.serviceType,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      discount: order.discount,
      couponCode: order.couponCode,
      total: order.total,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        productNameSnapshot: item.productNameSnapshot,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        options: item.options
      })),
      statusLog: order.statusLog.map((log) => ({
        id: log.id,
        status: log.status,
        note: log.note,
        createdAt: log.createdAt
      }))
    };
  }

  async list(user: JwtPayload, storeId?: string) {
    const companyId = this.requireCompany(user);

    if (storeId) {
      const store = await this.prisma.store.findFirst({ where: { id: storeId, companyId } });
      if (!store) throw new NotFoundException('Loja não encontrada.');
    }

    return this.prisma.order.findMany({
      where: {
        store: { companyId },
        ...(storeId ? { storeId } : {})
      },
      orderBy: { createdAt: 'desc' },
      include: { customer: true, items: true }
    });
  }

  async updateStatus(user: JwtPayload, id: string, dto: UpdateOrderStatusDto) {
    const companyId = this.requireCompany(user);



    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id, store: { companyId } }
      });
      if (!order) throw new NotFoundException('Pedido não encontrado.');
      if (order.status === dto.status) {
        throw new BadRequestException('O pedido já está nesse status.');
      }

      const validTargets = allowedTransitions[order.status];
      if (!validTargets.includes(dto.status)) {
        throw new BadRequestException(
          `Transição inválida: ${order.status} → ${dto.status}.`
        );
      }
      if (
        order.serviceType === ServiceType.PICKUP &&
        dto.status === OrderStatus.OUT_FOR_DELIVERY
      ) {
        throw new BadRequestException(
          'Pedidos para retirada não podem sair para entrega.'
        );
      }
      if (
        order.serviceType === ServiceType.DELIVERY &&
        order.status === OrderStatus.READY &&
        dto.status === OrderStatus.DELIVERED
      ) {
        throw new BadRequestException(
          'Pedidos para entrega devem passar por OUT_FOR_DELIVERY.'
        );
      }

      await tx.orderStatusHistory.create({
        data: { orderId: id, status: dto.status, note: dto.note }
      });
      return tx.order.update({
        where: { id },
        data: { status: dto.status },
        include: {
          customer: true,
          items: true,
          statusLog: { orderBy: { createdAt: 'asc' } }
        }
      });
    });
  }

  private requireCompany(user: JwtPayload): string {
    if (!user.companyId) {
      throw new ForbiddenException('Usuário sem empresa vinculada.');
    }
    return user.companyId;
  }
}
