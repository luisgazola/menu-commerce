import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Restaurante Exemplo Ltda.' })
  @IsString()
  @MaxLength(160)
  legalName!: string;

  @ApiProperty({ example: 'Restaurante Exemplo' })
  @IsString()
  @MaxLength(120)
  tradeName!: string;

  @ApiPropertyOptional({ example: '12345678000199' })
  @IsOptional()
  @IsString()
  @Length(11, 14)
  documentNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;
}
