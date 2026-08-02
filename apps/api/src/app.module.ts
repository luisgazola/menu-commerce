import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { CatalogModule } from './catalog/catalog.module';
import { StoreModule } from './store/store.module';
import { OrdersModule } from './orders/orders.module';
import { PromotionsModule } from './promotions/promotions.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    DatabaseModule,
    AuthModule,
    CompanyModule,
    StoreModule,
    CatalogModule,
    OrdersModule,
    PromotionsModule,
    WhatsappModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
