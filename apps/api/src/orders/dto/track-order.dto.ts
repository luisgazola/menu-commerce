import { IsString, MaxLength, MinLength } from 'class-validator';

export class TrackOrderDto {
  @IsString()
  @MinLength(6)
  @MaxLength(30)
  orderNumber!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(30)
  phone!: string;
}
