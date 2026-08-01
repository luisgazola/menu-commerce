import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { PromotionsService } from './promotions.service';

@ApiTags('coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly service: PromotionsService) {}

  @Post('validate')
  validate(@Body() dto: ValidateCouponDto) {
    return this.service.validateCoupon(dto);
  }
}

@ApiTags('admin/promotions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminPromotionsController {
  constructor(private readonly service: PromotionsService) {}

  @Get('coupons')
  coupons(
    @Req() request: Request & { user: JwtPayload },
    @Query('storeId') storeId?: string
  ) {
    return this.service.listCoupons(request.user, storeId);
  }

  @Post('coupons')
  createCoupon(
    @Req() request: Request & { user: JwtPayload },
    @Body() dto: CreateCouponDto
  ) {
    return this.service.createCoupon(request.user, dto);
  }

  @Get('promotions')
  promotions(
    @Req() request: Request & { user: JwtPayload },
    @Query('storeId') storeId?: string
  ) {
    return this.service.listPromotions(request.user, storeId);
  }

  @Post('promotions')
  createPromotion(
    @Req() request: Request & { user: JwtPayload },
    @Body() dto: CreatePromotionDto
  ) {
    return this.service.createPromotion(request.user, dto);
  }
}
