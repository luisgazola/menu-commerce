import { Module } from '@nestjs/common';
import { PromotionsModule } from '../promotions/promotions.module';
import { AdminOrdersController, OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
@Module({ imports: [PromotionsModule], controllers: [OrdersController, AdminOrdersController], providers: [OrdersService] })
export class OrdersModule {}
