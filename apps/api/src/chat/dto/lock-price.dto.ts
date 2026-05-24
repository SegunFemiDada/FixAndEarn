//path: apps/api/src/chat/dto/lock-price.dto.ts
import { IsInt, Min } from 'class-validator';

export class LockPriceDto {
  @IsInt()
  @Min(1)
  lockedPriceMilliFec!: number;
}
