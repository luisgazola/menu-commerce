import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { DiscountType, Prisma, RecordStatus } from '@prisma/client';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../database/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);
const digitsOnly = (value: string) => value.replace(/\D/g, '');

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  validateCoupon(dto: ValidateCouponDto) {
    return this.prisma.$transaction((tx) =>
      this.validateCouponWithClient(tx, dto, false)
    );
  }

  validateCouponInTransaction(
    tx: Prisma.TransactionClient,
    dto: ValidateCouponDto
  ) {
    return this.validateCouponWithClient(tx, dto, true);
  }

  private async validateCouponWithClient(
    tx: Prisma.TransactionClient,
    dto: ValidateCouponDto,
    lockUsage: boolean
  ) {
    const store = await tx.store.findFirst({
      where: { slug: dto.storeSlug, status: RecordStatus.ACTIVE }
    });
    if (!store) throw new NotFoundException('Loja não encontrada.');

    const code = dto.code.trim().toUpperCase();
    const phone = digitsOnly(dto.customerPhone);
    const now = new Date();
    const coupon = await tx.coupon.findFirst({
      where: {
        storeId: store.id,
        code,
        status: RecordStatus.ACTIVE,
        startsAt: { lte: now },
        endsAt: { gte: now }
      }
    });
    if (!coupon) {
      throw new BadRequestException('Cupom inválido ou fora da validade.');
    }

    if (lockUsage) {
      const lockKey = `coupon:${coupon.id}`;
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`;
    }

    const subtotal = dec(dto.subtotal);
    if (subtotal.lt(coupon.minimumOrder)) {
      throw new BadRequestException(
        `Pedido mínimo de R$ ${coupon.minimumOrder.toFixed(2)} para este cupom.`
      );
    }

    if (coupon.usageLimit) {
      const totalUses = await tx.couponUsage.count({ where: { couponId: coupon.id } });
      if (totalUses >= coupon.usageLimit) {
        throw new BadRequestException('Este cupom atingiu o limite total de usos.');
      }
    }

    if (coupon.usagePerCustomer) {
      const phoneUses = await tx.couponUsage.count({
        where: { couponId: coupon.id, customerPhone: phone }
      });
      if (phoneUses >= coupon.usagePerCustomer) {
        throw new BadRequestException('Limite de uso deste cupom por cliente atingido.');
      }
    }

    if (coupon.firstOrderOnly) {
      const previous = await tx.order.count({
        where: { storeId: store.id, customer: { phone } }
      });
      if (previous > 0) {
        throw new BadRequestException('Cupom válido somente para a primeira compra.');
      }
    }

    let discount = dec(0);
    let freeDelivery = false;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discount = subtotal.mul(coupon.discountValue).div(100);
    }
    if (coupon.discountType === DiscountType.FIXED) {
      discount = dec(coupon.discountValue);
    }
    if (coupon.discountType === DiscountType.FREE_DELIVERY) {
      freeDelivery = dto.serviceType === 'DELIVERY';
    }
    if (coupon.maximumDiscount && discount.gt(coupon.maximumDiscount)) {
      discount = dec(coupon.maximumDiscount);
    }
    if (discount.gt(subtotal)) discount = subtotal;

    return {
      couponId: coupon.id,
      code: coupon.code,
      discount: discount.toFixed(2),
      freeDelivery,
      description: coupon.description
    };
  }

  async listCoupons(user: JwtPayload, storeId?: string) {
    const companyId = this.requireCompany(user);
    await this.validateOptionalStore(companyId, storeId);
    return this.prisma.coupon.findMany({
      where: {
        store: { companyId },
        ...(storeId ? { storeId } : {})
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createCoupon(user: JwtPayload, dto: CreateCouponDto) {
    const companyId = this.requireCompany(user);
    await this.requireStore(companyId, dto.storeId);
    this.validatePeriod(dto.startsAt, dto.endsAt);
    if (dto.discountType === DiscountType.PERCENTAGE && dto.discountValue > 100) {
      throw new BadRequestException('O desconto percentual não pode superar 100%.');
    }
    return this.prisma.coupon.create({
      data: {
        ...dto,
        code: dto.code.trim().toUpperCase(),
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt)
      }
    });
  }

  async listPromotions(user: JwtPayload, storeId?: string) {
    const companyId = this.requireCompany(user);
    await this.validateOptionalStore(companyId, storeId);
    return this.prisma.promotion.findMany({
      where: {
        store: { companyId },
        ...(storeId ? { storeId } : {})
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
    });
  }

  async createPromotion(user: JwtPayload, dto: CreatePromotionDto) {
    const companyId = this.requireCompany(user);
    await this.requireStore(companyId, dto.storeId);
    this.validatePeriod(dto.startsAt, dto.endsAt);
    if (dto.discountType === DiscountType.PERCENTAGE && dto.discountValue > 100) {
      throw new BadRequestException('O desconto percentual não pode superar 100%.');
    }
    return this.prisma.promotion.create({
      data: {
        ...dto,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt)
      }
    });
  }

  private validatePeriod(startsAt: string, endsAt: string) {
    if (new Date(startsAt) >= new Date(endsAt)) {
      throw new BadRequestException('A data final deve ser posterior à data inicial.');
    }
  }

  private async validateOptionalStore(companyId: string, storeId?: string) {
    if (storeId) await this.requireStore(companyId, storeId);
  }

  private async requireStore(companyId: string, storeId: string) {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, companyId }
    });
    if (!store) throw new NotFoundException('Loja não encontrada.');
    return store;
  }

  private requireCompany(user: JwtPayload): string {
    if (!user.companyId) {
      throw new ForbiddenException('Usuário sem empresa vinculada.');
    }
    return user.companyId;
  }
}
