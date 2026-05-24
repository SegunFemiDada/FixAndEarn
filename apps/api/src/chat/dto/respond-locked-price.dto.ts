//path: apps/api/src/chat/dto/respond-locked-price.dto.ts
import { IsBoolean } from "class-validator";

export class RespondLockedPriceDto {
  @IsBoolean()
  accept!: boolean;
}
