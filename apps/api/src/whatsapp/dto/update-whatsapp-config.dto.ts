import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateWhatsappConfigDto {
  @IsOptional() @IsString() @MaxLength(20) whatsapp?: string;
  @IsOptional() @IsBoolean() whatsappEnabled?: boolean;
  @IsOptional() @IsString() @MaxLength(2000) whatsappMessageTemplate?: string;
}
