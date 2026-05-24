//path: apps/api/src/chat/dto/list-moderation-flags.dto.ts
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

export class ListModerationFlagsDto {
  @IsOptional()
  @IsIn(["PHONE_NUMBER", "WHATSAPP", "OFF_PLATFORM_PAYMENT", "ADVERTISEMENT", "OTHER"])
  type?: "PHONE_NUMBER" | "WHATSAPP" | "OFF_PLATFORM_PAYMENT" | "ADVERTISEMENT" | "OTHER";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number = 50;
}
