//path: apps/api/src/modules/disputes/dto/open-dispute.dto.ts
import { IsOptional, IsString, MaxLength } from "class-validator";

export class OpenDisputeDto {
  @IsString()
  @MaxLength(1000)
  reason!: string;

  @IsOptional()
  evidence?: any; // JSON
}