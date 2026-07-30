import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductOptionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateOptionGroupDto {
  @ApiProperty({ example: 'Escolha o ponto da carne' }) @IsString() @MaxLength(100) name!: string;
  @ApiPropertyOptional({ enum: ProductOptionType }) @IsOptional() @IsEnum(ProductOptionType) type?: ProductOptionType;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() required?: boolean;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) minimumSelection?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) maximumSelection?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) displayOrder?: number;
}
