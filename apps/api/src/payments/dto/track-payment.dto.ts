import {
  IsString,
  MaxLength,
} from 'class-validator';

export class TrackPaymentDto {
  @IsString()
  @MaxLength(40)
  orderNumber!: string;

  @IsString()
  @MaxLength(30)
  phone!: string;
}
