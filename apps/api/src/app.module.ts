import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { HealthController } from './health.controller';

import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { DatabaseModule } from './database/database.module';
import { CatalogModule } from './catalog/catalog.module';
import { StoreModule } from './store/store.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    DatabaseModule,
    AuthModule,
    CompanyModule,
    StoreModule,
    CatalogModule,
  ],
  controllers: [
    AppController,
    HealthController,
  ],
})
export class AppModule {}
