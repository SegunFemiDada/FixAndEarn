import { IsBoolean } from 'class-validator';

export class RespondLockedPriceDto {
  @IsBoolean()
  accept!: boolean;
}
