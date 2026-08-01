import { Module } from '@nestjs/common';
import { AdminPromotionsController, CouponsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
@Module({ controllers: [CouponsController, AdminPromotionsController], providers: [PromotionsService], exports: [PromotionsService] })
export class PromotionsModule {}
