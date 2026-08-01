import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma, RecordStatus, ServiceType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { PromotionsService } from '../promotions/promotions.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

const decimal = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService, private readonly promotions: PromotionsService) {}

  async create(dto: CreateOrderDto) {
    const store = await this.prisma.store.findFirst({ where: { slug: dto.storeSlug, status: RecordStatus.ACTIVE } });
    if (!store) throw new NotFoundException('Loja não encontrada.');
    if (!store.isOpen) throw new BadRequestException('A loja está fechada para novos pedidos.');
    if (dto.serviceType === 'DELIVERY' && !dto.address) throw new BadRequestException('Informe o endereço de entrega.');

    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, storeId: store.id, status: RecordStatus.ACTIVE },
      include: { optionGroups: { include: { items: { where: { status: RecordStatus.ACTIVE } } } } }
    });
    if (products.length !== productIds.length) throw new BadRequestException('Um ou mais produtos não estão disponíveis.');

    let subtotal = decimal(0);
    const normalized = dto.items.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId)!;
      const validOptions = product.optionGroups.flatMap((group) => group.items);
      const selected = item.optionItemIds.map((id) => validOptions.find((option) => option.id === id)).filter(Boolean) as typeof validOptions;
      if (selected.length !== item.optionItemIds.length) throw new BadRequestException(`Adicional inválido em ${product.name}.`);
      for (const group of product.optionGroups) {
        const count = selected.filter((option) => option.groupId === group.id).length;
        const minimum = group.required ? Math.max(1, group.minimumSelection) : group.minimumSelection;
        if (count < minimum || count > group.maximumSelection) throw new BadRequestException(`Seleção inválida em ${group.name}.`);
      }
      const basePrice = product.promotionalPrice ?? product.price;
      const optionsTotal = selected.reduce((sum, option) => sum.plus(option.additionalPrice), decimal(0));
      const unitPrice = decimal(basePrice).plus(optionsTotal);
      const totalPrice = unitPrice.mul(item.quantity);
      subtotal = subtotal.plus(totalPrice);
      return { item, product, selected, optionsTotal, unitPrice, totalPrice };
    });

    let deliveryFee = dto.serviceType === 'DELIVERY' ? decimal(5) : decimal(0);
    let discount = decimal(0);
    let couponId: string | undefined;
    let couponCode: string | undefined;
    if (dto.couponCode) {
      const result = await this.promotions.validateCoupon({ storeSlug: dto.storeSlug, code: dto.couponCode, customerPhone: dto.customer.phone, subtotal: subtotal.toNumber(), serviceType: dto.serviceType });
      discount = decimal(result.discount);
      couponId = result.couponId;
      couponCode = result.code;
      if (result.freeDelivery) deliveryFee = decimal(0);
    }
    const total = Prisma.Decimal.max(decimal(0), subtotal.plus(deliveryFee).minus(discount));
    const orderNumber = await this.nextOrderNumber();

    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({ data: dto.customer });
      const address = dto.address ? await tx.address.create({ data: { ...dto.address, customerId: customer.id } }) : null;
      const order = await tx.order.create({
        data: {
          storeId: store.id, customerId: customer.id, addressId: address?.id, orderNumber,
          serviceType: dto.serviceType as ServiceType, subtotal, deliveryFee, discount, couponCode, total, notes: dto.notes,
          items: { create: normalized.map(({ item, product, selected, optionsTotal, unitPrice, totalPrice }) => ({
            productId: product.id, productNameSnapshot: product.name, unitPrice, quantity: item.quantity,
            optionsTotal, totalPrice, notes: item.notes,
            options: selected.map((option) => ({ id: option.id, name: option.name, additionalPrice: option.additionalPrice.toString() }))
          })) },
          statusLog: { create: { status: OrderStatus.RECEIVED, note: 'Pedido criado pelo cardápio.' } }
        },
        include: { customer: true, address: true, items: true, statusLog: true }
      });
      if (couponId) await tx.couponUsage.create({ data: { couponId, orderId: order.id, customerPhone: customer.phone, discount } });
      return order;
    });
  }

  private async nextOrderNumber(): Promise<string> {
    const date = new Date();
    const prefix = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
    const count = await this.prisma.order.count({ where: { orderNumber: { startsWith: prefix } } });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  findPublic(orderNumber: string) {
    return this.prisma.order.findUnique({ where: { orderNumber }, include: { customer: true, address: true, items: true, statusLog: { orderBy: { createdAt: 'asc' } } } });
  }

  list(storeId?: string) {
    return this.prisma.order.findMany({ where: storeId ? { storeId } : undefined, orderBy: { createdAt: 'desc' }, include: { customer: true, items: true } });
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.orderStatusHistory.create({ data: { orderId: id, status: dto.status, note: dto.note } });
      return tx.order.update({ where: { id }, data: { status: dto.status }, include: { customer: true, items: true, statusLog: { orderBy: { createdAt: 'asc' } } } });
    });
  }
}
