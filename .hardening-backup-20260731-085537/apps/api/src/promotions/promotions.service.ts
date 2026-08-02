import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DiscountType, Prisma, RecordStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
const dec = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);
@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}
  async validateCoupon(dto: ValidateCouponDto) {
    const store = await this.prisma.store.findUnique({ where: { slug: dto.storeSlug } });
    if (!store) throw new NotFoundException('Loja não encontrada.');
    const now = new Date();
    const coupon = await this.prisma.coupon.findFirst({ where: { storeId: store.id, code: dto.code.trim().toUpperCase(), status: RecordStatus.ACTIVE, startsAt: { lte: now }, endsAt: { gte: now } }, include: { usages: true } });
    if (!coupon) throw new BadRequestException('Cupom inválido ou fora da validade.');
    const subtotal = dec(dto.subtotal);
    if (subtotal.lt(coupon.minimumOrder)) throw new BadRequestException(`Pedido mínimo de R$ ${coupon.minimumOrder.toFixed(2)} para este cupom.`);
    if (coupon.usageLimit && coupon.usages.length >= coupon.usageLimit) throw new BadRequestException('Este cupom atingiu o limite total de usos.');
    const phoneUses = coupon.usages.filter((u) => u.customerPhone === dto.customerPhone).length;
    if (coupon.usagePerCustomer && phoneUses >= coupon.usagePerCustomer) throw new BadRequestException('Limite de uso deste cupom por cliente atingido.');
    if (coupon.firstOrderOnly) {
      const previous = await this.prisma.order.count({ where: { storeId: store.id, customer: { phone: dto.customerPhone } } });
      if (previous > 0) throw new BadRequestException('Cupom válido somente para a primeira compra.');
    }
    let discount = dec(0); let freeDelivery = false;
    if (coupon.discountType === DiscountType.PERCENTAGE) discount = subtotal.mul(coupon.discountValue).div(100);
    if (coupon.discountType === DiscountType.FIXED) discount = dec(coupon.discountValue);
    if (coupon.discountType === DiscountType.FREE_DELIVERY) freeDelivery = dto.serviceType === 'DELIVERY';
    if (coupon.maximumDiscount && discount.gt(coupon.maximumDiscount)) discount = dec(coupon.maximumDiscount);
    if (discount.gt(subtotal)) discount = subtotal;
    return { couponId: coupon.id, code: coupon.code, discount: discount.toFixed(2), freeDelivery, description: coupon.description };
  }
  listCoupons(storeId?: string) { return this.prisma.coupon.findMany({ where: storeId ? { storeId } : undefined, orderBy: { createdAt: 'desc' } }); }
  createCoupon(dto: CreateCouponDto) { return this.prisma.coupon.create({ data: { ...dto, code: dto.code.trim().toUpperCase(), startsAt: new Date(dto.startsAt), endsAt: new Date(dto.endsAt) } }); }
  listPromotions(storeId?: string) { return this.prisma.promotion.findMany({ where: storeId ? { storeId } : undefined, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }] }); }
  createPromotion(dto: CreatePromotionDto) { return this.prisma.promotion.create({ data: { ...dto, startsAt: new Date(dto.startsAt), endsAt: new Date(dto.endsAt) } }); }
}
