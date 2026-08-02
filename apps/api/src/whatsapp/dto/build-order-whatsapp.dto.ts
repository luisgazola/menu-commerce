import { IsString, MaxLength, MinLength } from 'class-validator';

export class BuildOrderWhatsappDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  orderNumber!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(30)
  phone!: string;
}
