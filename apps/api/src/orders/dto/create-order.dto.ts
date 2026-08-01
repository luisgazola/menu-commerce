import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEmail, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

enum ServiceTypeDto { DELIVERY = 'DELIVERY', PICKUP = 'PICKUP' }

class CustomerDto {
  @IsString() @MaxLength(100) name!: string;
  @IsString() @MaxLength(30) phone!: string;
  @IsOptional() @IsEmail() email?: string;
}

class AddressDto {
  @IsString() postalCode!: string;
  @IsString() street!: string;
  @IsString() number!: string;
  @IsOptional() @IsString() complement?: string;
  @IsString() district!: string;
  @IsString() city!: string;
  @IsString() state!: string;
  @IsOptional() @IsString() reference?: string;
}

class OrderItemDto {
  @IsString() productId!: string;
  @IsInt() @Min(1) quantity!: number;
  @IsOptional() @IsString() @MaxLength(240) notes?: string;
  @IsArray() optionItemIds!: string[];
}

export class CreateOrderDto {
  @IsString() storeSlug!: string;
  @ValidateNested() @Type(() => CustomerDto) customer!: CustomerDto;
  @IsEnum(ServiceTypeDto) serviceType!: ServiceTypeDto;
  @IsOptional() @ValidateNested() @Type(() => AddressDto) address?: AddressDto;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => OrderItemDto) items!: OrderItemDto[];
  @IsOptional() @IsString() @MaxLength(30) couponCode?: string;
  @IsOptional() @IsString() @MaxLength(300) notes?: string;
}
