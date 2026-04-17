//path: apps/api/src/admin/finance/dto/review-withdrawal.dto.ts
import { IsOptional, IsString, MaxLength } from "class-validator";

export class ReviewWithdrawalDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
