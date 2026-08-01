import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn = Number(config.get<string>('JWT_EXPIRES_IN_SECONDS', '86400'));
        if (!Number.isInteger(expiresIn) || expiresIn <= 0) {
          throw new Error('JWT_EXPIRES_IN_SECONDS deve ser um número inteiro positivo.');
        }
        return {
          secret: config.getOrThrow<string>('JWT_SECRET'),
          signOptions: { expiresIn }
        };
      }
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtModule]
})
export class AuthModule {}
