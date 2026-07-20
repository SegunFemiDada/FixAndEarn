//path: apps/api/src/modules/wallet/dto/verify-withdrawal-pin.dto.ts
import { IsString, MinLength } from "class-validator";

export class VerifyWithdrawalPinDto {
  @IsString()
  @MinLength(4)
  pin!: string;
}