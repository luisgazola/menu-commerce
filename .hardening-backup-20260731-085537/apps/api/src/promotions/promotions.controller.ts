import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { PromotionsService } from './promotions.service';
@ApiTags('coupons')
@Controller('coupons')
export class CouponsController { constructor(private readonly service: PromotionsService) {} @Post('validate') validate(@Body() dto: ValidateCouponDto) { return this.service.validateCoupon(dto); } }
@ApiTags('admin/promotions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminPromotionsController {
  constructor(private readonly service: PromotionsService) {}
  @Get('coupons') coupons(@Query('storeId') storeId?: string) { return this.service.listCoupons(storeId); }
  @Post('coupons') createCoupon(@Body() dto: CreateCouponDto) { return this.service.createCoupon(dto); }
  @Get('promotions') promotions(@Query('storeId') storeId?: string) { return this.service.listPromotions(storeId); }
  @Post('promotions') createPromotion(@Body() dto: CreatePromotionDto) { return this.service.createPromotion(dto); }
}
