import { DiscountType, PromotionScope } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
export class CreatePromotionDto {
  @IsString() storeId!: string;
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(PromotionScope) scope!: PromotionScope;
  @IsOptional() @IsString() targetId?: string;
  @IsEnum(DiscountType) discountType!: DiscountType;
  @IsNumber() @Min(0) discountValue!: number;
  @IsOptional() @IsInt() @Min(1) minimumQuantity?: number;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsOptional() @IsInt() priority?: number;
  @IsOptional() @IsBoolean() combinable?: boolean;
}
