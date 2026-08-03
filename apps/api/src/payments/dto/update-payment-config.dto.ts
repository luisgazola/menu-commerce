import {
  PaymentProvider,
} from '@prisma/client';

import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdatePaymentConfigDto {
  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

  @IsBoolean()
  enabled!: boolean;

  @IsBoolean()
  sandbox!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  publicKey?: string;

  @IsBoolean()
  pixEnabled!: boolean;

  @IsBoolean()
  creditCardEnabled!: boolean;

  @IsBoolean()
  debitCardEnabled!: boolean;

  @IsBoolean()
  cashEnabled!: boolean;

  @IsBoolean()
  cardOnDeliveryEnabled!: boolean;
}
