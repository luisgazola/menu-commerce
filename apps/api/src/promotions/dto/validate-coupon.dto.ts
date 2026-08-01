import { IsNumber, IsString, Min } from 'class-validator';
export class ValidateCouponDto {
  @IsString() storeSlug!: string;
  @IsString() code!: string;
  @IsString() customerPhone!: string;
  @IsNumber() @Min(0) subtotal!: number;
  @IsString() serviceType!: 'DELIVERY' | 'PICKUP';
}
