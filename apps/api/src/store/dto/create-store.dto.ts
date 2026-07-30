import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
export class CreateStoreDto {
  @ApiProperty() @IsString() companyId!: string;
  @ApiProperty({ example: 'MenuCommerce Demo' }) @IsString() @MaxLength(100) name!: string;
  @ApiProperty({ example: 'demo' }) @IsString() @MaxLength(80) slug!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_tld: false }) logoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_tld: false }) bannerUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() whatsapp?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isOpen?: boolean;
}
