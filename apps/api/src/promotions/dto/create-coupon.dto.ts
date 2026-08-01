import { DiscountType } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
export class CreateCouponDto {
  @IsString() storeId!: string;
  @IsString() @MaxLength(30) code!: string;
  @IsOptional() @IsString() @MaxLength(160) description?: string;
  @IsEnum(DiscountType) discountType!: DiscountType;
  @IsNumber() @Min(0) discountValue!: number;
  @IsOptional() @IsNumber() @Min(0) minimumOrder?: number;
  @IsOptional() @IsNumber() @Min(0) maximumDiscount?: number;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsOptional() @IsInt() @Min(1) usageLimit?: number;
  @IsOptional() @IsInt() @Min(1) usagePerCustomer?: number;
  @IsOptional() @IsBoolean() firstOrderOnly?: boolean;
  @IsOptional() @IsBoolean() combinable?: boolean;
}
